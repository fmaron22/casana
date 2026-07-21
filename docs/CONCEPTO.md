# Casana — Documento de Conceptualización

> **Estado:** Borrador v0.1 · **Fecha:** 2026-07-21 · **Autor:** Equipo Casana
> Este documento es la fuente de verdad conceptual del proyecto. Todo lo aquí escrito es
> iterable. Las secciones marcadas con ⚠️ **REQUIERE VALIDACIÓN LEGAL/REGULATORIA** no deben
> tratarse como decisiones cerradas hasta contar con opinión de un despacho especializado.

---

## 1. Visión en una frase

**Casana formaliza el empleo del hogar en México en tres toques: da de alta al trabajador ante
el IMSS, paga sus obligaciones sociales y le transfiere su salario — automáticamente, cargando
a la tarjeta del patrón.**

El principio rector de producto es **simplicidad radical**: si no es tan fácil como pagar una
suscripción de streaming, no se usará.

---

## 2. Problema y contexto

- Desde 2019 (piloto) y de forma **obligatoria** en años recientes, toda persona que emplea
  trabajadores del hogar debe inscribirlos en el régimen especial del IMSS
  (**Personas Trabajadoras del Hogar — PTH**).
- El IMSS ofrece un portal donde, a partir del **NSS/CURP/RFC** del trabajador, se calculan
  días/horas trabajadas y se genera la **declaración** y **línea de captura** mensual.
- La fricción real hoy:
  1. Muchos patrones no saben que es obligatorio, o no saben cómo hacerlo.
  2. El trabajador frecuentemente **no tiene NSS** ni cuenta bancaria.
  3. Pagar en efectivo el salario implica ir al cajero/banco: inseguro e incómodo.
  4. El cálculo y la captura mensual son un trámite recurrente que la gente abandona.

Casana absorbe toda esa fricción y la convierte en un servicio de suscripción.

---

## 3. Actores y plataformas

| Actor | Plataforma | En MVP paga | Qué hace |
|---|---|---|---|
| **Patrón** (empleador) | App/Web Patrón | ✅ Sí | Registra trabajadores, autoriza cargos, ve comprobantes |
| **Trabajador del hogar** | App/Web Trabajador | ❌ No (inicial) | Recibe salario, consulta expediente y comprobantes IMSS |
| **Back office / Ops** | Consola interna | — | Conciliación, tesorería, soporte, configuración |

> Cobramos **solo al patrón** en el arranque. El trabajador es beneficiario, no cliente pagador.

---

## 4. Modelo de negocio

### Fuentes de ingreso
1. **Cuota mensual por trabajador registrado** (suscripción SaaS).
2. **Comisión por transferencia** de dispersión del salario (fee por operación).
3. Futuro: servicios premium (contratos, expediente extendido, marketplace/comunidad).

### Flujo de dinero (concepto)
```
Patrón ──[POS / cargo a TDC-TDD]──▶ Cuenta concentradora (STP)
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                      ▼
           Pago de obligaciones     Dispersión salario     Cuota Casana
           (línea de captura IMSS)   al trabajador (STP)    (ingreso propio)
```

### ⚠️ REQUIERE VALIDACIÓN LEGAL/REGULATORIA — figura para mover dinero de terceros
Cobrar a un patrón y pagar desde una **cuenta concentradora** obligaciones a un tercero (IMSS)
y salario a otro tercero (trabajador) es el punto jurídico más delicado del proyecto. Opciones a
evaluar con despacho + posiblemente CNBV/Banxico:
- **Agregador de pagos / gestor de cobranza** apoyado en un socio regulado (STP, un banco, o una
  IFPE — Institución de Fondos de Pago Electrónico bajo Ley Fintech).
- **Mandato / comisión mercantil**: el patrón otorga mandato a Casana para pagar por su cuenta.
- Operar bajo el paraguas de una **IFPE existente (BaaS)** en vez de constituir una propia al inicio.
- Reglas de **prevención de lavado (PLD)**, contratos de adhesión y CONDUSEF.
> **Decisión bloqueante para el MVP financiero.** Ver §12 Decisiones abiertas.

---

## 5. Alcance por fases (MVP → escala)

### Fase 0 — Fundaciones (semanas)
- Repos, infraestructura, CI/CD, bases de datos replicables (OLTP + réplica de lectura/BI).
- Diseño de identidad de producto y flujos de onboarding.
- Cerrar la figura legal-financiera (§4) — **bloqueante**.

### Fase 1 — MVP "Alta + Cálculo"
- Onboarding de patrón (ID + tarjeta).
- Onboarding de trabajador (ID + NSS + foto biométrica + cuenta bancaria).
- **Calculadora IMSS** (pre-cálculo de obligaciones) con módulo de configuración de variables.
- Repositorio de documentos (líneas de captura y comprobantes).
- Back office básico: usuarios, trabajadores, método de pago.

### Fase 2 — MVP "Pagos"
- POS / cargo a tarjeta del patrón.
- Cuenta concentradora STP + dispersión de salario al trabajador.
- Pago de obligaciones IMSS (captura automatizada o asistida — ver §7).
- **Módulo de conciliación** (trabajadores ↔ declaraciones ↔ líneas de captura ↔ pagos).
- Tesorería con automatizaciones (**Wunish**).

### Fase 3 — Expediente y legal
- Emisión de cuentas STP para trabajadores sin banco.
- Generación y **firma de contratos** / solicitud de empleo.
- Expediente completo (CURP, comprobante de domicilio, referencias).

### Fase 4 — Comunidad / Marketplace
- Base de datos de trabajadores del hogar disponibles (horas/días/fijo).
- Evaluaciones, reputación y recomendaciones.

---

## 6. Onboarding — el reto central

> El onboarding **debe ser trivial** o el producto muere. Meta: patrón operativo en < 5 min.

### 6.1 Patrón
- Captura de **documento de identidad (INE)** → OCR/extracción automática de datos.
- Alta manual como fallback.
- Alta de **TDC/TDD** (tokenización con el proveedor de pagos).
- Con eso ya puede arrancar.

### 6.2 Trabajador
Obligatorio:
- **Documento de identidad** (OCR).
- **NSS** (ver §6.3 si no lo tiene).
- **Biometría = fotografía** (practicidad, va al expediente).
- **Cuenta bancaria** (obligatoria; o emitir cuenta STP en Fase 3).

Opcional (expediente): CURP, comprobante de domicilio, referencias, otros.

Datos laborales (los captura el patrón):
- Lugar de trabajo, días que trabajará, **salario diario**, puesto, jornada (horas), fecha de inicio.

### 6.3 ⚠️ Reto: trabajadores sin Número de Seguridad Social
- Investigar el flujo de **asignación de NSS** vía IMSS (con CURP se puede tramitar NSS en el
  portal del IMSS / ventanilla digital).
- Casana debe **asistir/automatizar** ese trámite como parte del onboarding.
- Documentar el camino "sin NSS → con NSS" como un sub-flujo de primera clase.

---

## 7. Integración con el IMSS (calculadora + captura)

**Estrategia en dos frentes:**

1. **Replicar la calculadora** de obligaciones del IMSS internamente (pre-cálculo), con un
   **módulo de configuración de variables** (estilo config de variables de *Wontime*) para
   ajustar cuando cambien las regulaciones: SBC, factor de integración, topes, cuotas
   obrero-patronales, salario mínimo, UMA, etc.
   ⚠️ Todos los parámetros deben validarse contra la normativa vigente y quedar versionados.

2. **Captura de la declaración real:**
   - **Ideal:** que el IMSS exponga **API/servicio web** para PTH → integración directa.
   - **Fallback:** si no hay API, diseñar un **flujo de automatización (RPA/headless)** sobre el
     portal web actual del IMSS para generar la declaración y descargar la línea de captura.
   - En ambos casos: **descargar líneas de captura y comprobantes de pago**, subirlos a la
     plataforma y construir un **repositorio documental** por patrón/trabajador/mes.

> **Tarea de investigación inmediata:** confirmar si existe API pública/privada del IMSS para el
> régimen PTH, y bajo qué términos. Si no, mapear el portal actual (campos, sesión, captcha).

---

## 8. Pagos y tesorería

### Componentes
- **POS / cobro a tarjeta:** cargo automático a TDC/TDD del patrón (proveedor de adquirencia).
- **STP:** cuenta(s) concentradora(s), SPEI para dispersión y emisión de CLABEs.
- **Wunish:** capa de **tesorería con automatizaciones** (reglas de barrido, conciliación,
  disparo de dispersiones).
- **Emisión de cuentas STP** para trabajadores sin banco (Fase 3).

### Regla de oro operativa
El dinero **no debe quedarse atorado**: cargo del patrón → cae en concentradora → se separa en
(obligaciones IMSS + salario trabajador + cuota Casana) → se dispersa. Todo con trazabilidad y
conciliación automática. Un descuadre en la base es el peor escenario → **módulo de conciliación
es crítico, no opcional**.

---

## 9. Back office / Consola de operación

Debe permitir ver y operar:
- **Usuarios (patrones)** y **trabajadores** que cada uno tiene registrados.
- **Método de pago** elegido por cada patrón.
- **Configuración de pagos** (calendario, montos, cuotas).
- **Cuenta concentradora / tesorería** (Wunish) con automatizaciones.
- **Administración de obligaciones:** vista cruzada **Trabajadores × Patrones × Declaraciones ×
  Líneas de captura × Pagos**.
- **Módulo de conciliación** (detección y resolución de descuadres).
- **Configuración de la calculadora** (variables regulatorias versionadas).
- Repositorio documental (líneas de captura, comprobantes, expedientes, contratos).

---

## 10. Arquitectura de desarrollo

**Sistema web orientado a objetos, basado en microservicios**, desde el inicio.

### Servicios propuestos (dominio)
| Servicio | Responsabilidad |
|---|---|
| `identity` | AuthN/AuthZ, patrones, trabajadores, roles, sesiones |
| `onboarding` | Flujos de alta, OCR de ID, biometría (foto), captura de datos |
| `worker-file` (expediente) | Documentos, CURP, domicilio, referencias, contratos |
| `imss-calc` | Calculadora de obligaciones + configuración de variables versionada |
| `imss-gateway` | Integración/automatización con IMSS, declaraciones, líneas de captura |
| `payments` | POS/cargo a tarjeta, tokenización, cuota mensual |
| `treasury` | STP, concentradora, dispersión, integración Wunish |
| `reconciliation` | Conciliación trabajadores↔declaraciones↔líneas↔pagos |
| `documents` | Repositorio documental (líneas de captura, comprobantes) |
| `notifications` | Correo/SMS/push, recordatorios de pago |
| `backoffice` | Consola de operación interna |
| `bi-etl` | Réplicas y pipelines para reporteo/BI |

### Principios técnicos
- **Bases de datos replicables** desde el día 1: OLTP transaccional + **réplicas de lectura** y
  **almacén analítico** para reporteo/BI (separación OLTP/OLAP).
- **Idempotencia** y trazabilidad total en todo lo que toca dinero (event sourcing / bitácora).
- Contratos de API versionados entre servicios; mensajería asíncrona para pagos/conciliación.
- **PLD/seguridad**: cifrado de datos sensibles (ID, biometría, cuentas), auditoría, control de
  acceso mínimo.

> El stack concreto (lenguaje, orquestación, nube) se define en el ADR-0001 tras cerrar §12.

---

## 11. Marketing y posicionamiento

Dos mensajes centrales al patrón:

1. **Comodidad y seguridad:** "Ya no vayas al cajero. Casana carga a tu tarjeta y le paga a quien
   trabaja en tu casa — sin efectivo, sin filas, sin riesgo."
2. **Empatía y obligación:** proteger a quien es parte de tu casa. El alta al IMSS es **obligatoria**
   y da **trabajo digno con prestaciones reales** (salud, incapacidades, guarderías, ahorro para el
   retiro, etc.) para el trabajador y su familia.

Palancas adicionales:
- Explicar **todo lo que ofrece el seguro social** más allá de lo médico.
- Apalancar las **campañas del IMSS** que animan a trabajadores del hogar a exigir su registro
  (demanda desde ambos lados).

---

## 12. Decisiones abiertas (bloqueantes / prioritarias)

| # | Decisión | Prioridad | Impacto |
|---|---|---|---|
| D1 | ⚠️ Figura legal para cobrar y pagar obligaciones/salario desde concentradora (§4) | 🔴 Bloqueante | Define todo el modelo financiero |
| D2 | ¿Existe API del IMSS para PTH? Si no, viabilidad de RPA sobre el portal (§7) | 🔴 Alta | Define el core técnico |
| D3 | Proveedor de POS/adquirencia y de emisión STP; alcance de Wunish (§8) | 🔴 Alta | Define integraciones |
| D4 | Flujo oficial para asignar NSS a trabajadores que no lo tienen (§6.3) | 🟠 Alta | Onboarding |
| D5 | Marco legal del contrato de trabajo del hogar y solicitud de empleo (§ Fase 3) | 🟡 Media | Producto legal |
| D6 | Stack tecnológico y nube (ADR-0001) | 🟡 Media | Arranque de build |
| D7 | Estructura de precios: cuota mensual + fee por transferencia (§4) | 🟡 Media | Unit economics |

---

## 13. Próximos pasos sugeridos

1. **Investigación regulatoria** (D1, D2, D4): confirmar figura fintech y disponibilidad de API IMSS.
2. **ADR-0001**: elegir stack y definir el esqueleto de microservicios.
3. **Prototipo de onboarding** (patrón + trabajador) para validar la "simplicidad radical".
4. **Prototipo de calculadora IMSS** con módulo de configuración de variables.
5. Mapa de integraciones (STP, POS, Wunish) y diagrama de flujo de dinero definitivo.

---

*Documento vivo. Actualizar versión y fecha en cada cambio relevante.*
