# ADR-0005 · Operación mensual IMSS: ingesta por correo + pago SIPARE

- **Estado:** Aceptado (con validaciones pendientes marcadas ⚠️)
- **Fecha:** 2026-07-21
- **Decisores:** Equipo Casana
- **Relacionado:** [ADR-0004](./ADR-0004-imss-gateway-rpa.md), [`docs/IMSS-CALCULO-Y-LINEA-DE-CAPTURA.md`](../IMSS-CALCULO-Y-LINEA-DE-CAPTURA.md)

---

## Contexto — nuevo entendimiento del ciclo

Conocimiento operativo del negocio: **una vez dada de alta la persona trabajadora con sus
condiciones (salario, días, modalidad), el IMSS envía la línea de captura automáticamente cada mes
al correo registrado en el alta.** ⚠️ *A validar en la práctica con la primera alta real.*

Esto **cambia el diseño** de forma favorable:

| Antes (ADR-0004) | Ahora |
|---|---|
| RPA genera la línea de captura **cada mes** | RPA solo para el **alta inicial** y **modificaciones** (cambio de salario/días, baja) |
| Operación mensual = automatizar el portal | Operación mensual = **ingerir un correo** + **pagar** |

El RPA pasa de proceso recurrente (frágil, N ejecuciones/mes) a proceso **puntual** (una vez por
trabajador). La operación mensual se vuelve pasiva y mucho más robusta.

---

## Decisión 1 — Correo bajo dominio de Casana (ingesta automática)

En el alta, el correo que se registra ante el IMSS será un **alias por patrón bajo dominio de
Casana** (p. ej. `imss+{patronId}@casana.mx`), con consentimiento del patrón:

- Todas las líneas de captura mensuales llegan a **nuestra** infraestructura de correo.
- Un **webhook de correo entrante** (p. ej. inbound parse de SendGrid/Mailgun, o Gmail API sobre
  Google Workspace) entrega el correo al módulo `email-ingest`:
  1. Identifica al patrón por el alias destinatario.
  2. Extrae el PDF y **parsea la línea de captura, importe y vigencia**.
  3. Indexa en `documents` (patrón × trabajador × periodo) y actualiza `reconciliation`
     (*línea recibida → pendiente de pago*).
  4. Dispara el flujo de cobro/pago (cargo al patrón vía Stripe → pago de la línea).
- **Contraste automático:** el importe recibido se compara con el pre-cálculo de `imss-calc`.
  Divergencia → alerta (posible cambio normativo o error de alta). Esto convierte cada correo en un
  **golden test de producción** para la calculadora.

**Fallbacks:** si el correo del mes no llega → descarga desde el portal con el RPA (alcance
reducido de ADR-0004); último recurso, intervención manual.

⚠️ Validar: viabilidad de registrar un alias de Casana como contacto (términos del portal +
consentimiento en el contrato del patrón), y si el **comprobante de pago** también llega por correo
o se descarga del portal.

---

## Decisión 2 — Pago de la línea de captura (conexión "con SIPARE")

SIPARE es el esquema de pago referenciado: la línea **se paga a través de bancos** (ventanilla o
banca en línea). No hay API pública de SIPARE para pagar directo; la vía programática es **bancaria**:

### Ruta elegida: banco con pago de SIPARE programático/masivo
Integración de tesorería con un banco cuyo canal empresarial pague líneas SIPARE:
- **Banorte (Banorte en su Empresa / BEM):** pago de impuestos **IMSS SUA/SIPARE individual o
  masivo** — encaja directo con nuestro caso (N líneas por mes).
- **BBVA (Net Cash + APIs empresariales / host-to-host):** conexión directa servidor-a-servidor
  para automatizar pagos en volumen; SIPARE disponible en su banca de empresas.

Trabajo a hacer (comercial + técnico):
1. ⚠️ Confirmar con Banorte/BBVA el **canal exacto** para pagar SIPARE de forma programática
   (API, archivo por lotes host-to-host, o carga en portal) y sus requisitos de contratación.
2. ⚠️ Preguntar a **Wunish** si su capa de tesorería ya tiene conector de pago de
   servicios/impuestos (SIPARE) — nos ahorraría la integración directa.
3. El módulo `treasury` ejecutará el pago y capturará el **comprobante** para `documents` y
   `reconciliation`.

### Rutas descartadas
- **"Pago en línea" del minisitio PTH:** redirige a la banca del patrón → requiere sus credenciales
  bancarias. Inviable y prohibido por diseño (nunca manejamos credenciales bancarias del cliente).
- **RPA sobre portales bancarios:** frágil y contra términos de uso. No.

### Dependencia con la decisión STP (pausada)
- Modelo **(a) concentradora**: Casana paga las líneas desde su cuenta → necesita el canal bancario
  programático de arriba.
- Modelo **(b) cuenta por cliente**: el pago podría originarse desde la cuenta del patrón → la
  integración cambia de forma. **La elección del banco/canal debe esperar o contemplar ambos.**

---

## Flujo mensual resultante (objetivo)

```
[Alta única: RPA portal PTH]───────────────┐
                                           ▼
IMSS envía línea de captura ──▶ correo alias Casana ──▶ email-ingest
                                                            │ parsea PDF (línea, importe, vigencia)
                                                            │ contrasta vs imss-calc (alerta si difiere)
                                                            ▼
                                    Stripe cobra al patrón (salario + obligaciones + comisión)
                                                            ▼
                                    treasury paga la línea SIPARE (canal bancario) y dispersa salario*
                                                            ▼
                                    comprobante → documents → reconciliation ✓
                                           (*dispersión según decisión STP pendiente)
```

---

## Consecuencias

- El RPA queda **acotado al alta** → menos fragilidad y mantenimiento.
- La operación mensual es **pasiva** (correo entrante) y auditable; cada correo valida la calculadora.
- El pago requiere **contratación bancaria** (Banorte/BBVA) o conector de Wunish — es un track
  comercial, no solo técnico, y conviene arrancarlo ya.

## Pendientes de validación

| # | Qué | Cómo |
|---|---|---|
| V1 | El correo mensual llega automáticamente (y su formato exacto) | Primera alta real |
| V2 | Alias de Casana como correo de contacto (términos + consentimiento) | Alta real + contrato |
| V3 | Canal programático SIPARE de Banorte/BBVA y requisitos | Reunión comercial |
| V4 | Conector de pago de servicios en Wunish | Preguntar a Wunish |
| V5 | ¿El comprobante de pago llega por correo o se descarga del portal? | Primera operación real |
