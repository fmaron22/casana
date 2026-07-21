# Casana · Calculadora de cuotas IMSS (PTH)

Primer componente de código de Casana: **emula el cálculo de cuotas
IMSS/INFONAVIT** para Personas Trabajadoras del Hogar y lo presenta con la
identidad de marca.

## Estructura

| Archivo | Rol |
|---|---|
| `engine.mjs` | **Motor puro** de cálculo + **parámetros en configuración versionada** (`PARAMS`). Sin DOM. Importable en navegador y Node. |
| `engine.test.mjs` | Pruebas de sanidad + hueco para **golden tests** contra el simulador oficial. |
| `styles.css` | Sistema de diseño (tokens del manual de marca, tema claro/oscuro). |
| `index.html` | UI de la calculadora (importa `engine.mjs`). Requiere servidor estático. |
| `build.mjs` | Inlina todo en un solo archivo self-contained + versión para Artifact. |
| `dist/casana-calculadora.html` | Versión de un solo archivo (se abre sin servidor / se comparte). |

## Correr

```bash
# Tests del motor
node --test

# Regenerar el archivo self-contained
node build.mjs

# UI en desarrollo (necesita servidor por los módulos ES)
npx serve .        # y abrir /index.html
# — o simplemente abrir dist/casana-calculadora.html en el navegador
```

## Cómo calcula (resumen)

```
SBC = salario_diario × factor_integración   (piso: salario mínimo; tope: 25 UMA)
Cuota_ramo = base(ramo) × % del ramo          base ∈ {SBC×días, UMA×días, excedente 3 UMA×días}
Total = Σ cuotas IMSS + INFONAVIT (5% del SBC×días)
```

Detalle de ramos, fórmula y rutas para la **línea de captura** en
[`../../docs/IMSS-CALCULO-Y-LINEA-DE-CAPTURA.md`](../../docs/IMSS-CALCULO-Y-LINEA-DE-CAPTURA.md).

## ⚠️ Estado de los parámetros

Los valores de `PARAMS["2026"]` (UMA, salario mínimo, factor de integración,
porcentajes por ramo y **la tabla progresiva de CEAV**) son de **referencia** y
deben calibrarse con **golden tests** contra el simulador oficial del IMSS antes
de usarse en producción. La arquitectura ya está lista para ello: todo vive en
configuración versionada, no en la lógica.
