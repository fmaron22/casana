# ADR-0003 · Frontend, móvil (iOS/Android) y estructura del monorepo

- **Estado:** Aceptado
- **Fecha:** 2026-07-21
- **Decisores:** Equipo Casana
- **Relacionado:** [ADR-0001](./ADR-0001-stack-y-arquitectura.md), [ADR-0002](./ADR-0002-facturacion-stripe.md)

---

## Contexto

Casana necesita: **landing page web** (marketing/conversión, SEO), **apps web** (patrón, back
office) y **apps móviles nativas iOS/Android** (sobre todo para el trabajador, que usa el celular, y
también para el patrón). Todo debe mantenerse en **TypeScript** y **compartir** la lógica de negocio
ya construida (`@casana/imss-calc`, `@casana/billing`).

---

## Decisión

### 1. API-first

El backend NestJS expone una **API REST versionada** (`/v1`) que es el **único** punto de acceso para
**todos** los clientes (web y móvil). Nada de lógica de negocio en los clientes: consumen la API a
través de un SDK tipado (`@casana/api-client`). Esto garantiza que web y móvil se comporten igual y
que la lógica viva una sola vez.

### 2. Web — Next.js

| Superficie | Proyecto | Notas |
|---|---|---|
| **Landing page** | `apps/landing` | Next.js estático/SSR, optimizado para SEO y conversión. Marca del manual. |
| **App Patrón (web)** | `apps/web-patron` | Registro de trabajadores, pagos, comprobantes. |
| **Back office / Ops** | `apps/backoffice` | Solo web. Conciliación, tesorería, **configuración de tarifas**. |

### 3. Móvil — React Native con **Expo**

- **`apps/mobile`** (Expo + React Native, TypeScript) para **iOS y Android** desde una sola base.
- **Por qué Expo:** TS compartido, OTA updates, build/entrega a las tiendas gestionada (EAS),
  acceso a cámara (biometría por foto y OCR de ID en onboarding). Encaja con "debe ser simple".
- App **role-aware**: flujos de **trabajador** (mobile-first: ver pagos, expediente, comprobantes) y
  de **patrón** (registrar, pagar). Se puede separar en dos binarios más adelante si conviene a las
  tiendas; se decide en su momento.

### 4. Qué se comparte (y qué no)

- **Sí se comparte (libs):** lógica de negocio (`imss-calc`, `billing`), **tipos/DTOs + validación
  Zod** (`domain-types`), **SDK del API** (`api-client`), **design tokens** de marca (`ui-tokens`).
- **No se comparte 1:1:** los componentes de UI (web = DOM/Next.js, móvil = RN). Comparten **tokens**
  (colores, tipografía, espaciados del manual), no los componentes. *(Opción futura: Tamagui/Solito
  para UI unificada si el ahorro lo amerita; hoy se evita por complejidad.)*

### 5. Tarifas configurables en runtime (respuesta a "a debe ser configurable")

La tarifa **no se recompila**; se edita desde el back office:

- **Comisión** (`@casana/billing` `PARAMS_BILLING`): los parámetros se persisten en una **tabla de
  configuración versionada** (`billing_config`, con `vigenteDesde`). El back office edita; el
  `StripeService` lee la versión vigente al momento del cargo. Mismo patrón "config versionada +
  golden tests" que la calculadora IMSS.
- **Cuota mensual**: el importe vive en el **Price de Stripe** (fuente de verdad para la
  suscripción). El back office crea/actualiza el Price; alta/baja de trabajador solo cambia la
  `quantity`. Un cambio de precio genera un nuevo Price (Stripe no muta importes), preservando
  histórico.

### 6. Monorepo — estructura objetivo

```
casana/
├─ apps/
│  ├─ api/            NestJS · monolito modular (dominios = módulos)
│  ├─ landing/        Next.js · landing page (web)
│  ├─ web-patron/     Next.js · app patrón (web)
│  ├─ backoffice/     Next.js · consola de operación (web)
│  ├─ mobile/         Expo/React Native · iOS + Android
│  └─ calculadora/    (actual) · su motor migra a libs/imss-calc
├─ libs/
│  ├─ imss-calc/      motor de cálculo IMSS (config versionada)
│  ├─ billing/        motor de tarifas (config versionada)  ✅ hecho
│  ├─ domain-types/   DTOs + esquemas Zod (cliente ↔ servidor)
│  ├─ api-client/     SDK tipado del API (web + móvil)
│  └─ ui-tokens/      design tokens del manual de marca (web + RN)
├─ infra/             Terraform (GCP)
└─ docs/              CONCEPTO, ADRs, investigación
```

### 7. Orquestación — Nx

Nx orquesta build/test/lint y grafo de dependencias (afectados) sobre npm workspaces. Regla de
frontera: un módulo/lib no importa las entrañas de otro (se refuerza con las reglas de dependencias
de Nx). *El bootstrap del primer `apps/api` se hace con el workspace; Nx se inicializa sobre el
workspace existente (`nx init`) conforme se agregan apps.*

---

## Consecuencias

**Positivas**
- Un backend, muchos clientes: web y móvil consistentes por construcción (API-first + SDK tipado).
- Reutilización real de la lógica cara (IMSS, tarifas) en todos lados.
- Expo baja el costo de iOS/Android para equipo pequeño; cámara lista para biometría/OCR.

**Costos / cuidados**
- Mantener el SDK (`api-client`) y los DTOs (`domain-types`) sincronizados con la API (se mitiga
  generando el cliente desde el OpenAPI de NestJS).
- UI duplicada web/móvil (aceptado; se comparten tokens, no componentes).
- Publicación en tiendas (revisión de Apple/Google) añade fricción de release: se gestiona con EAS.

---

## Alcance de esta entrega (B)

Bootstrap ejecutable de **`apps/api`** (NestJS) con el **módulo `billing` de Stripe vivo**,
compilando y arrancando, health check y webhook. Las apps web/móvil y las libs restantes se
andamian en PRs siguientes por fase (roadmap del concepto).
