# Casana

Plataforma fintech/regtech de dos lados para **formalizar el empleo del hogar en México**:
alta ante el IMSS, pago de obligaciones sociales y dispersión del salario al trabajador —
automáticamente, cargando a la tarjeta del patrón.

> **Principio de producto:** simplicidad radical. Si no es tan fácil como pagar una
> suscripción, no se usará.

## Estado

🟡 **Conceptualización** — ver [`docs/CONCEPTO.md`](docs/CONCEPTO.md).

## Actores

- **Patrón** (empleador) — cliente pagador en el arranque.
- **Trabajador del hogar** — beneficiario.
- **Back office / Ops** — conciliación, tesorería, soporte.

## Decisiones bloqueantes antes de construir

1. **Figura legal-financiera** para mover dinero de terceros desde cuenta concentradora.
2. **API IMSS** para régimen PTH (o estrategia de automatización del portal).
3. Proveedores de **POS / STP / Wunish** (tesorería).

Ver la tabla completa en `docs/CONCEPTO.md` §12.

## Estructura

```
Casana/
├─ README.md
└─ docs/
   └─ CONCEPTO.md      # Documento de conceptualización (fuente de verdad)
```
