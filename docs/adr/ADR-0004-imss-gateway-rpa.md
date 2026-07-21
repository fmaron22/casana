# ADR-0004 · imss-gateway: generación de la línea de captura por RPA

- **Estado:** Aceptado
- **Fecha:** 2026-07-21
- **Decisores:** Equipo Casana
- **Relacionado:** [ADR-0001](./ADR-0001-stack-y-arquitectura.md), [`docs/IMSS-CALCULO-Y-LINEA-DE-CAPTURA.md`](../IMSS-CALCULO-Y-LINEA-DE-CAPTURA.md)

---

## Contexto

La **línea de captura** solo la emite el IMSS y **no hay API pública oficial** para el régimen PTH
(ver investigación). El portal es `adodigital.imss.gob.mx/pth/`. Se decide implementar la vía de
**automatización del portal (RPA)**: un robot que sigue el flujo de 5 pasos, genera la línea de
captura y descarga los PDFs (línea de captura + comprobante).

## Decisión

### 1. Interfaz estable con adaptadores intercambiables

`imss-gateway` expone una interfaz única `ImssGateway.generarLineaDeCaptura(datos)`. Los adaptadores
son intercambiables sin tocar el resto del sistema:
- **`rpa` (Playwright)** — esta entrega. Automatiza el portal.
- **`api-terceros`** — si algún proveedor expone PTH por API (futuro).
- **`mock`** — dev/pruebas, sin tocar el portal.

Si mañana aparece una API, se cambia el adaptador y nada más.

### 2. RPA con Playwright

- **Playwright** (TypeScript) por robustez, auto-waiting, manejo de descargas y captura de pantalla.
- El flujo se estructura en los **5 pasos oficiales** (empleador → contacto/domicilio → trabajador →
  confirmación → generar línea de captura y descargar).
- **Selectores en un solo archivo** (`selectors.ts`), como configuración, porque el DOM real del
  portal debe **mapearse con acceso autorizado** (ver §5). Cambia el portal → se ajusta un archivo.

### 3. ⚠️ Política de CAPTCHA — el robot NO los resuelve

Si el portal presenta un **CAPTCHA** u otra verificación anti-bot, el robot **lo detecta, toma
captura de pantalla y escala a un operador humano** (cola de intervención manual). **Nunca** intenta
resolverlo ni evadirlo. Es una regla dura de diseño y de cumplimiento (ToS del portal). El diseño
asume intervención humana como parte normal del flujo, no como excepción.

### 4. Robustez (operar un portal ajeno es frágil)

- **Idempotencia:** una declaración por (trabajador, periodo); no se genera dos veces.
- **Timeouts y reintentos** acotados; **captura de pantalla + HTML** en cada fallo para diagnóstico.
- **Circuit breaker**: si el portal cambia o cae, se pausa y se alerta, no se martillea.
- Los PDFs (línea de captura, comprobante) se suben a **Cloud Storage** e indexan en `documents`.
- El estado se refleja en `reconciliation`: *declarado → línea generada → pagado → comprobante*.

### 5. ⚠️ Credenciales y acceso (a mapear con acceso autorizado)

- El flujo PTH inicia con **CURP + correo** del empleador (según el portal); **e.firma no parece
  requerida** para PTH (a confirmar al mapear; IDSE sí la requiere, PTH aparentemente no).
- Cualquier credencial del patrón para el portal se guarda **cifrada** (KMS/Secret Manager), nunca
  en texto plano ni en logs. Los logs del robot **no** registran datos personales ni credenciales.
- El mapeo real de selectores y la prueba end-to-end requieren **acceso autorizado al portal con
  datos reales** — no se hace en CI ni en este entorno.

---

## Consecuencias

**Positivas**
- Desbloquea la línea de captura sin depender de una API que no existe.
- La interfaz con adaptadores deja la puerta abierta a una API oficial o de terceros.
- La política de CAPTCHA + intervención humana mantiene el cumplimiento y evita bloqueos.

**Costos / cuidados**
- El RPA es **frágil** ante cambios de UI del portal → requiere monitoreo y mantenimiento de selectores.
- Escalabilidad limitada (un navegador por trámite); mitigar con cola de trabajos y concurrencia acotada.
- Riesgo de bloqueo por el portal → circuit breaker + operación respetuosa (sin martilleo).

---

## Alcance de esta entrega

- Interfaz `ImssGateway` + tipos.
- Adaptador **RPA (Playwright)**: esqueleto del flujo de 5 pasos, detección de CAPTCHA → escalación,
  captura de pantalla en fallos, descarga de PDFs. **Selectores placeholder** (a mapear, §5).
- Adaptador **mock** (default en dev) y endpoint de prueba.
- **No se ejecuta** contra el portal real aquí (requiere credenciales y acceso autorizado).
