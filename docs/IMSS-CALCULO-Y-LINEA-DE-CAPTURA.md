# Casana — Cálculo de cuotas IMSS y generación de la línea de captura (PTH)

> **Estado:** Investigación v0.1 · **Fecha:** 2026-07-21
> Objetivo de este documento: definir **cómo emular la calculadora de cuotas** del IMSS para
> Personas Trabajadoras del Hogar (PTH) y **cómo generar/obtener la línea de captura** para el pago.
> ⚠️ Todos los parámetros numéricos deben **verificarse contra el DOF / IMSS vigente** antes de
> usarse en producción. Son la base para el módulo de configuración versionada (§5), no constantes
> fijas en código.

---

## 1. Cómo funciona el proceso oficial (dos partes)

El proceso del IMSS para PTH tiene **dos partes separables**, y Casana debe resolver ambas:

| Parte | Qué es | Depende de | Servicio Casana |
|---|---|---|---|
| **A. Cálculo** | Determinar cuánto se debe pagar (cuotas IMSS + INFONAVIT) a partir de salario diario y días | Solo de fórmula y parámetros | `imss-calc` (emulable 100% offline) |
| **B. Declaración + línea de captura** | Registrar el movimiento en el IMSS y obtener la **línea de captura** oficial para pagar | Del portal/sistema del IMSS | `imss-gateway` (requiere integración con IMSS) |

> **Insight clave:** la Parte A **se puede replicar por completo** (es matemática con parámetros
> públicos). La Parte B **no**: la línea de captura la emite el IMSS y hoy **no hay API pública
> oficial** para PTH. Ver §3.

### Portal oficial y flujo (fuente: imss.gob.mx)
- Trámite en **`adodigital.imss.gob.mx/pth/`**.
- Pasos oficiales de inscripción:
  1. Iniciar trámite con datos de la **persona empleadora** (CURP + correo).
  2. Datos de contacto y domicilio del empleador.
  3. Datos del **trabajador**: **NSS**, **CURP**, correo (opcional), domicilio, **modalidad de
     cotización (mes completo o por día)**, **salario diario**, **días laborados**.
  4. Confirmación de datos.
  5. **Generar el formato de incorporación y la(s) línea(s) de captura** para pago de IMSS e INFONAVIT.
- Pago: **banca en línea** (al terminar el registro) o **ventanilla bancaria** con la línea de
  captura, vía **SIPARE** (Sistema de Pago Referenciado). También se descargan **línea de captura y
  comprobante de pago** desde el portal.

---

## 2. Emular la calculadora (Parte A) — fórmula

La calculadora del IMSS pide esencialmente **3 entradas** y produce el importe:

**Entradas:**
- `salario_diario` (≥ salario mínimo general)
- `dias_laborados` en el periodo
- `modalidad`: **mes completo** o **por día** (también admite día/mes/bimestre/semestre/año)

**Cálculo paso a paso:**

```
1. SBC (Salario Base de Cotización) = salario_diario × factor_integración
   - factor_integración mínimo 2026 (1er año): 1.0493  ⚠️ verificar
   - SBC con piso en el Salario Mínimo General (SMG 2026: $315.04/día ⚠️ verificar)
   - SBC con tope superior de 25 UMA

2. Base de cada ramo = SBC × dias_laborados  (o mes completo = ~30.4 días / mes)

3. Cuota por ramo = base × porcentaje_ramo   (ver tabla §2.1)

4. Total IMSS   = Σ cuotas de todos los ramos (parte patronal + parte obrera)
   Total INFONAVIT = SBC × dias × 5%
   Retiro (SAR) = SBC × dias × 2%   (incluido en el bloque RCV)

5. Importe a pagar = Total IMSS + INFONAVIT
```

> En PTH el **empleador cubre la totalidad** (la parte patronal y retiene/absorbe la obrera), por
> eso la calculadora del IMSS presenta un solo importe a pagar por trabajador.

### 2.1 Tabla de ramos y porcentajes 2026 (⚠️ verificar contra DOF)

| Ramo / Seguro | Patrón | Obrero | Base de cálculo |
|---|---|---|---|
| Riesgos de Trabajo | prima por clase | — | SBC |
| Enf. y Maternidad — cuota fija | 20.40% | — | 1 UMA (por debajo de 3 UMA de SBC) |
| Enf. y Maternidad — excedente | 1.10% | 0.40% | (SBC − 3 UMA) |
| Enf. y Maternidad — gastos médicos pensionados | 1.05% | 0.375% | SBC |
| Enf. y Maternidad — prestaciones en dinero | 0.70% | 0.25% | SBC |
| Invalidez y Vida | 1.75% | 0.625% | SBC |
| Guarderías y Prest. Sociales | 1.00% | — | SBC |
| Retiro | 2.00% | — | SBC |
| Cesantía y Vejez (CEAV) | **progresivo 3.150% → 7.513%** | 1.125% | SBC (patronal según nivel de SBC) |
| **INFONAVIT** | 5.00% | — | SBC |

**Parámetros que cambian y deben estar en configuración (§5):**
- UMA (diaria/mensual/anual), SMG, factor de integración por antigüedad, tabla progresiva CEAV,
  prima de Riesgos de Trabajo, topes (25 UMA), días de mes completo.

> ⚠️ **Punto a validar con IMSS/contador:** confirmar si el esquema definitivo PTH ("IMSS para el
> Bienestar de las y los Trabajadores del Hogar") aplica **exactamente** estos porcentajes o si hay
> ajustes/subsidios específicos del régimen. La aritmética es la misma; solo cambian parámetros.

### 2.2 Estrategia de validación de la emulación
Antes de confiar en `imss-calc`, hacer **pruebas de contraste** contra el simulador oficial:
- Correr N combinaciones (salario diario × días × modalidad) en el simulador del IMSS y guardar el
  importe oficial → **suite de golden tests** que nuestra calculadora debe reproducir al centavo.
- Cualquier desviación = parámetro mal configurado. Esto blinda el módulo ante cambios normativos.

---

## 3. Generar / obtener la línea de captura (Parte B)

**No existe API pública oficial del IMSS para PTH.** La línea de captura solo la emite el IMSS.
Tres rutas, de mayor a menor deseabilidad:

### Ruta 1 — API comercial de terceros (recomendada para arrancar)
Existen proveedores que ya envuelven IDSE/IMSS con **API REST** (ej. **IDSE PRO / apimarket.mx**,
y otros). Ventajas: integración rápida, sandbox, soporte. A validar:
- ¿Cubren el régimen **PTH** específicamente (no solo régimen ordinario/IDSE)?
- ¿Devuelven la **línea de captura** y el **comprobante**?
- Modelo de autenticación (¿e.firma/FIEL del empleador o de Casana como intermediario?), precio por
  transacción, límites, SLA, y **términos legales** (que un tercero opere por cuenta del patrón).

### Ruta 2 — Automatización del portal (RPA / headless)
Si ninguna API cubre PTH, automatizar **`adodigital.imss.gob.mx/pth/`** con un servicio headless
(Playwright/Puppeteer) que:
- Inicie sesión / trámite con las credenciales del empleador.
- Capture los datos del trabajador (paso 3).
- Genere y **descargue la línea de captura y el comprobante (PDF)**.
- Los suba al repositorio documental (`documents`).

Riesgos: captchas, cambios de UI, sesión/2FA, términos de uso del portal, escalabilidad. Requiere
monitoreo y "self-healing". Encapsular tras la misma interfaz que la Ruta 1 para poder cambiar.

### Ruta 3 — SUA + SIPARE
El pago referenciado se puede generar subiendo un archivo **.SUA** (Sistema Único de
Autodeterminación) a **SIPARE**, que devuelve la línea de captura. Menos ágil para PTH masivo, pero
útil como respaldo/gran volumen. A evaluar según cómo aplique al esquema PTH.

### Diseño para no casarnos con una ruta
`imss-gateway` expone una **interfaz única** (ej. `generarLineaDeCaptura(trabajador, periodo)`) con
**adaptadores intercambiables** (API-terceros | RPA | SUA). Empezamos con la que esté disponible y
cambiamos sin tocar el resto del sistema.

---

## 4. Descarga y repositorio de comprobantes

Independiente de la ruta, Casana debe:
- Descargar **línea de captura** (para pagar) y **comprobante de pago** (una vez pagado).
- Guardarlos en `documents` indexados por **patrón × trabajador × periodo**.
- Exponerlos al patrón (cumplimiento/entrega) y al trabajador (transparencia).
- Reflejar el estado en `reconciliation`: *calculado → declarado → línea generada → pagado →
  comprobante disponible*.

---

## 5. Módulo de configuración de variables (versionado)

Estilo "config de variables de Wontime". Requisitos:
- Todos los parámetros de §2.1 en una tabla **versionada por fecha de vigencia** (no hardcode).
- Un cambio normativo = nueva versión con `vigente_desde`; los cálculos históricos usan la versión
  vigente en su fecha (auditable).
- Cambios revisables/aprobables antes de entrar en vigor.
- La suite de golden tests (§2.2) corre contra cada nueva versión.

---

## 6. Pendientes de verificación (antes de construir `imss-calc`)

| # | Verificar | Fuente |
|---|---|---|
| V1 | Porcentajes exactos y si PTH tiene ajustes propios | Contador + DOF + simulador IMSS |
| V2 | UMA 2026, SMG 2026, factor de integración por antigüedad | DOF / IMSS |
| V3 | Definición de "mes completo" (días) que usa el simulador PTH | Simulador IMSS |
| V4 | Si algún proveedor de API cubre **PTH** con línea de captura | apimarket / proveedores |
| V5 | Términos legales para que Casana opere el trámite por el patrón | Despacho (lo ve el cliente) |
| V6 | Estructura de la línea de captura / SIPARE para conciliación | SIPARE / IMSS |

---

## 7. Recomendación de arranque

1. **Construir `imss-calc` ya** — es 100% emulable y no depende de nadie. Empezar por la suite de
   golden tests contra el simulador oficial (§2.2) y el módulo de configuración (§5).
2. **En paralelo, validar la Ruta 1** (API de terceros para PTH). Es lo que decide si `imss-gateway`
   es una integración limpia (semanas) o una automatización RPA (más frágil).
3. Diseñar `imss-gateway` con adaptadores desde el día 1 para no depender de una sola ruta.

---

### Fuentes consultadas
- IMSS — Personas Trabajadoras del Hogar: https://www.imss.gob.mx/personas-trabajadoras-hogar
- IMSS — Calculadora de cuotas: https://www.imss.gob.mx/personas-trabajadoras-hogar/cuotas
- IMSS — Inscripción (portal adodigital): https://www.imss.gob.mx/personas-trabajadoras-hogar/inscripcion
- IMSS — SIPARE: https://www.imss.gob.mx/patrones/sipare
- IMSS — IDSE: https://www.imss.gob.mx/patrones/idse
- Cuotas IMSS 2026 (tablas y porcentajes): https://contadormx.com/cuotas-imss-2026-tablas-porcentajes-y-fechas/
- Factor de integración 2026: https://facturama.mx/blog/factor-integracion/
- API de terceros IDSE (referencia): https://apimarket.mx/idse-pro

> ⚠️ Las cifras provienen de fuentes secundarias y deben confirmarse contra el DOF y el propio IMSS.
