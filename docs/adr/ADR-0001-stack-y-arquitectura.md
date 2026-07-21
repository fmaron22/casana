# ADR-0001 · Stack tecnológico y postura de arquitectura

- **Estado:** Aceptado
- **Fecha:** 2026-07-21
- **Decisores:** Equipo Casana
- **Relacionado:** [`docs/CONCEPTO.md`](../CONCEPTO.md) §10, [`docs/IMSS-CALCULO-Y-LINEA-DE-CAPTURA.md`](../IMSS-CALCULO-Y-LINEA-DE-CAPTURA.md)

---

## Contexto

Casana es una plataforma fintech/regtech de dos lados (patrón / trabajador del hogar) que debe:
integrar IMSS (cálculo + línea de captura), pagos (POS/tarjeta), tesorería (STP + Wunish),
dispersión de salario, expediente documental y conciliación. Requisitos rectores del concepto:
**simplicidad radical**, bases de datos **replicables** (OLTP + BI), trazabilidad total del dinero
y **PLD/seguridad** de datos sensibles (ID, biometría, cuentas).

Restricciones ya decididas por el negocio:
- **Lenguaje:** TypeScript en todo el stack.
- **Nube:** Google Cloud (GCP).
- **Postura:** empezar como **monolito modular** y desprender microservicios cuando la escala lo exija.

---

## Decisión

### 1. Postura de arquitectura — Monolito modular evolutivo

Construimos un **monolito modular** en el que cada dominio del §10 del concepto es un **módulo con
frontera dura** (su propio esquema de BD, sus propios servicios; nada de acceso cruzado a tablas de
otro módulo — solo a través de interfaces). Esto:

- Cumple "debe ser simple": **un despliegue, una base transaccional**, sin la carga operativa de N
  servicios (infra, redes, observabilidad distribuida, sagas) mientras el producto aún se valida.
- **Preserva el camino a microservicios**: como los módulos ya no comparten tablas ni estado, se
  "desprenden" a servicios independientes cuando un dominio lo justifique (p. ej. `imss-gateway` o
  `treasury` por escalamiento o aislamiento de riesgo), sin reescribir el dominio.
- Regla de oro: **la frontera lógica existe desde el día 1; la frontera física (de proceso) llega
  cuando duele no tenerla.**

Candidatos naturales a desprenderse primero (por riesgo/carga): `imss-gateway` (RPA/integración
externa inestable), `treasury`/`payments` (aislamiento y cumplimiento), `bi-etl` (analítico).

### 2. Backend — NestJS (TypeScript)

- **NestJS** por ser orientado a objetos, modular y con **inyección de dependencias** de fábrica:
  encaja con "sistema orientado a objetos" y hace que cada módulo del concepto sea, literalmente, un
  `Module` de Nest con sus `Provider`/`Service`/`Controller`.
- ORM: **Prisma** (tipado, migraciones claras) o **TypeORM** (más OOP/decoradores). → **Prisma** por
  DX y seguridad de tipos; un esquema Prisma por módulo/bounded context.
- Validación: **Zod** / `class-validator` en los bordes (DTOs), compartida con el front.

### 3. Frontend — React + Next.js (TypeScript)

Tres superficies, mismo monorepo y design system (tokens del manual de marca ya extraídos en la
calculadora):
- **App Patrón** (cliente pagador) · **App Trabajador** · **Back office / Ops**.
- **Next.js** (App Router) por SSR/rendimiento y despliegue simple en Cloud Run/Firebase Hosting.
- La **calculadora IMSS** ya construida (`apps/calculadora`) se integra como componente/feature.

### 4. Monorepo — Nx

- **Nx** para orquestar apps (NestJS + Next.js) y librerías compartidas (`@casana/imss-calc`,
  `@casana/ui`, `@casana/domain-types`), con builds afectados y generadores. El motor de cálculo
  actual (`engine.mjs`) se promueve a la librería `@casana/imss-calc`.

### 5. Datos

| Necesidad | Elección GCP | Notas |
|---|---|---|
| OLTP transaccional | **Cloud SQL for PostgreSQL** (o AlloyDB si se requiere HTAP) | Un esquema por módulo (bounded context). Réplicas de lectura para escalar lecturas. |
| Analítica / BI / reporteo | **BigQuery** | Fortaleza de GCP. Alimentado por CDC. |
| Replicación OLTP→BI | **Datastream** (CDC) + **dbt** | Separación OLTP/OLAP del concepto, sin ETL manual. |
| Documentos (líneas de captura, comprobantes, expediente, biometría) | **Cloud Storage** | Cifrado con CMEK (KMS). |
| Eventos asíncronos (conciliación, dispersión, notificaciones) | **Pub/Sub** | Base para sagas/idempotencia cuando se desprendan servicios. |

**Principio de dinero:** todo lo transaccional es **idempotente** y con **bitácora/event log**
(trazabilidad total). Conciliación se apoya en eventos Pub/Sub + tabla de conciliación.

### 6. Plataforma / operación (GCP)

- **Cómputo:** **Cloud Run** (contenedores serverless; escala a cero; ideal para el monolito y para
  los primeros servicios desprendidos). GKE Autopilot solo si más adelante se requiere.
- **IaC:** **Terraform** (todo reproducible/replicable, requisito del concepto).
- **CI/CD:** **GitHub Actions** (el repo vive en GitHub) con **Workload Identity Federation** a GCP
  (sin llaves estáticas). Deploy a Cloud Run.
- **Secretos:** **Secret Manager**. **Cifrado:** **Cloud KMS/CMEK** para datos sensibles.
- **Observabilidad:** **Cloud Logging/Monitoring/Trace** vía **OpenTelemetry**.
- **AuthN/AuthZ:** **Identity Platform** (Firebase Auth) para usuarios finales + RBAC propio en el
  módulo `identity`. MFA para back office.
- **OCR de identificaciones:** **Document AI** (extracción de datos del INE en onboarding).

### 7. Integraciones externas (fuera de GCP)

- **Pagos/POS y tokenización de tarjeta: Stripe.** Cobro a la TDC/TDD del patrón; **no almacenamos
  PAN** — se tokeniza con Stripe (Payment Methods / Setup Intents para cargos recurrentes de la cuota
  mensual), manteniendo a Casana en **alcance PCI-DSS mínimo (SAQ-A)** vía Stripe Elements/Checkout.
- **STP** (concentradora/SPEI/CLABE) y **Wunish** (tesorería) para la **dispersión** del salario al
  trabajador y el pago de obligaciones. División de responsabilidades: **Stripe cobra**, **STP dispersa**.
- **IMSS:** `imss-gateway` con **adaptadores intercambiables** (API de terceros | RPA | SUA-SIPARE),
  según ADR futuro tras resolver D2.

---

## Consecuencias

**Positivas**
- Un solo lenguaje (TS) de front a back → menos fricción para equipo pequeño; tipos y validación
  compartidos end-to-end.
- Arranque simple (un deploy, una BD) sin cerrar la puerta a microservicios.
- GCP aporta BI (BigQuery) y OCR (Document AI) de primera sin integraciones extra.
- Fronteras de módulo desde el día 1 = extracción a servicios de bajo costo.

**Negativas / costos**
- NestJS/Node es menos "por defecto" en fintech que Java; se mitiga con disciplina de tipos, tests y
  librerías maduras.
- Un monolito mal disciplinado puede erosionar fronteras → se blinda con reglas de dependencias de
  Nx (un módulo no importa las entrañas de otro) y un esquema de BD por módulo.

**Riesgos — resueltos por el negocio (2026-07-21)**
- ✅ **Residencia de datos:** el negocio determina que **no es requisito** alojar los datos en México.
  GCP queda confirmado; se elige región por latencia/costo (p. ej. `us-central1`) sin restricción de
  localización. (Reevaluar solo si un regulador lo exigiera más adelante.)
- ✅ **PCI-DSS:** se usa **Stripe** con tokenización del lado del cliente (Elements/Checkout), por lo
  que Casana **no toca el PAN** y se mantiene en alcance mínimo (**SAQ-A**).

---

## Estructura de repositorio (objetivo)

```
casana/
├─ apps/
│  ├─ api/                 # Monolito modular NestJS (módulos = dominios del §10)
│  ├─ web-patron/          # Next.js
│  ├─ web-trabajador/      # Next.js
│  ├─ backoffice/          # Next.js
│  └─ calculadora/         # (ya existe) → su motor migra a libs/imss-calc
├─ libs/
│  ├─ imss-calc/           # Motor de cálculo (desde apps/calculadora/engine.mjs)
│  ├─ ui/                  # Design system (tokens del manual de marca)
│  └─ domain-types/        # Tipos/DTOs/Zod compartidos
├─ infra/                  # Terraform (GCP)
├─ docs/                   # CONCEPTO, ADRs, investigación IMSS
└─ nx.json / package.json
```

### Módulos del monolito (MVP primero)
Fase 1 (MVP "Alta + Cálculo"): `identity`, `onboarding`, `imss-calc`, `documents`, `backoffice`.
Fase 2 (MVP "Pagos"): `payments`, `treasury`, `imss-gateway`, `reconciliation`.
Después: `worker-file`, `notifications`, `bi-etl`.

---

## Próximo paso propuesto

Andamiaje (scaffolding) del monorepo Nx con `apps/api` (NestJS) + una app Next.js, la librería
`@casana/imss-calc` (migrando el motor actual) y Terraform base para GCP. Sería el **ADR-0002**
(convenciones de código, migraciones y entornos) o directamente la primera PR de estructura.
