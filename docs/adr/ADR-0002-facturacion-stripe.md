# ADR-0002 · Facturación con Stripe (cuota mensual + comisión)

- **Estado:** Aceptado
- **Fecha:** 2026-07-21
- **Decisores:** Equipo Casana
- **Relacionado:** [ADR-0001](./ADR-0001-stack-y-arquitectura.md), [`docs/CONCEPTO.md`](../CONCEPTO.md) §4

---

## Contexto

Casana cobra al patrón **dos conceptos** (el trabajador no paga en el arranque):

1. **Cuota mensual por trabajador registrado** — ingreso recurrente tipo suscripción.
2. **Comisión por transferencia** — fee por cada evento de dispersión (pago de salario + obligaciones).

Además, Stripe es **solo el riel de cobro** (tarjeta del patrón). La **dispersión** al trabajador y
el pago de obligaciones al IMSS salen por **STP** (ver ADR-0001 §7: *Stripe cobra, STP dispersa*).

---

## Decisión

### A. Mapa a objetos de Stripe

| Concepto de negocio | Objeto Stripe | Notas |
|---|---|---|
| Patrón | **Customer** | 1:1. Guarda `stripeCustomerId` en el módulo `identity`. |
| Tarjeta del patrón | **PaymentMethod** (tokenizado con Elements/Checkout) | `off_session` para cobros recurrentes y automáticos. Casana **no toca el PAN** (PCI SAQ-A). |
| **Cuota mensual por trabajador** | **Subscription** con **quantity = trabajadores activos** | Un Product "Cuota mensual Casana", un Price recurrente mensual *por unidad*. Alta de trabajador ⇒ `quantity++` (con prorrateo); baja ⇒ `quantity--`. |
| **Comisión por transferencia** | **PaymentIntent** por evento de dispersión | El cargo cobra **salario + obligaciones + comisión** en una sola operación `off_session`. |
| Reintentos / cobranza de la cuota | **Invoices + Dunning** de Stripe | Stripe reintenta y notifica pagos fallidos de la suscripción. |
| Confirmación asíncrona | **Webhooks** (idempotentes) | Fuente de verdad del estado de pago, no la respuesta síncrona. |

> **Por qué Subscription para la cuota y PaymentIntent para la comisión:** la suscripción aprovecha
> prorrateo, reintentos y cobranza automática de Stripe. La dispersión es **sensible al tiempo** (día
> de pago) y de monto variable, por lo que se cobra por evento con un PaymentIntent, no dentro de la
> factura mensual.

### B. Flujo de la dispersión (cobro por evento)

```
1. Se calcula: salario_neto + obligaciones_IMSS (imss-calc) + comisión_Casana
2. PaymentIntent (off_session, confirm) al Customer → cobra el TOTAL a la tarjeta
3. Webhook payment_intent.succeeded → los fondos caen en la cuenta de Casana
4. treasury/STP dispersa: salario → trabajador, obligaciones → IMSS (línea de captura)
5. La comisión permanece como ingreso de Casana
```

> ⚠️ **Los fondos de salario y obligaciones son de terceros (pass-through).** El *movimiento* de ese
> dinero es el punto legal-financiero sensible (D1, lo ve el negocio/despacho). Aquí solo se define
> el **flujo técnico**; Stripe únicamente **cobra**.

### C. Detalle fiscal — IVA (importante)

- Los **servicios de Casana** (cuota mensual **y** comisión) causan **IVA 16%**.
- El **dinero de terceros** (salario del trabajador, obligaciones IMSS) **NO** causa IVA — es
  pass-through, no ingreso de Casana.
- Por lo tanto, en la dispersión:
  - `salario + obligaciones` → se cobran **sin IVA**.
  - `comisión` → se cobra **con IVA 16%**.
- La suscripción mensual se cobra **con IVA 16%** (se modela con Stripe Tax o un Tax Rate fijo).

Esta separación vive en el **motor de tarifas** (`libs/billing`) para que el cálculo sea explícito,
versionado y auditable (mismo patrón que `imss-calc`).

### D. Robustez (obligatorio en todo lo que toca dinero)

- **Idempotencia:** `Idempotency-Key` en toda creación (PaymentIntent, Subscription). Handlers de
  webhook idempotentes (deduplicar por `event.id`).
- **Webhooks como verdad:** el estado del pago se actualiza por webhook, con verificación de firma
  (`STRIPE_WEBHOOK_SECRET`).
- **Trazabilidad:** cada objeto Stripe se mapea a la entidad de dominio (patrón, trabajador,
  periodo, dispersión) y queda en la bitácora para conciliación (`reconciliation`).
- **Secretos:** `STRIPE_SECRET_KEY` en Secret Manager (nunca en el repo).

---

## Parámetros de tarifa (configuración versionada — valores TBD por negocio)

En `libs/billing` (`PARAMS_BILLING`), todos ⚠️ **pendientes de definir por el negocio**:

- `cuotaMensualPorTrabajador` (ej. placeholder $99.00 MXN)
- `comision`: tipo `fijo | porcentaje | mixto` (ej. placeholder $15.00 fija, o 1.5%, con min/máx)
- `ivaTasa` = 0.16
- `moneda` = `mxn`

Los montos se manejan en **centavos** (unidad mínima de Stripe) para evitar errores de redondeo.

---

## Consecuencias

**Positivas**
- Stripe absorbe cobranza recurrente, reintentos y PCI; Casana queda en alcance mínimo.
- La lógica de tarifa (IVA, comisión, pass-through) es pura, versionada y testeable, aislada del SDK.

**Costos / cuidados**
- Hay que operar webhooks con idempotencia y firma desde el día 1 (no confiar en respuestas síncronas).
- El monto variable de la dispersión exige conciliación estricta Stripe ↔ STP ↔ IMSS.
- Definir amounts de tarifa y estrategia de IVA (Stripe Tax vs Tax Rate) antes de producción.

---

## Implementación (esta entrega)

- `libs/billing/` — motor de tarifas puro (cuota, comisión, IVA, cargo de dispersión) + tests.
- `apps/api/src/modules/billing/` — `StripeService` (Customer, Subscription por trabajador,
  PaymentIntent de dispersión) + `WebhookController` idempotente (código NestJS/`stripe`).
