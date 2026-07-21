# @casana/billing

Motor de **tarifas** de Casana. Puro (sin SDK ni I/O), en **centavos**, con
parámetros en **configuración versionada** (`PARAMS_BILLING`). Ver [ADR-0002](../../docs/adr/ADR-0002-facturacion-stripe.md).

## API

- `calcularSuscripcionMensual({ numTrabajadores })` → cuota mensual (subtotal + **IVA 16%**).
- `calcularComision({ montoDispersado })` → comisión por transferencia (subtotal + **IVA**).
- `calcularCargoDispersion({ salario, obligaciones })` → **total a cobrar** en el PaymentIntent,
  separando el **pass-through sin IVA** (salario + obligaciones, dinero de terceros) de la
  **comisión con IVA** (ingreso de Casana).

## Regla fiscal clave

El **IVA aplica solo a los servicios de Casana** (cuota + comisión), **nunca** al dinero de
terceros (salario del trabajador, obligaciones IMSS). Verificado en `pricing.test.mjs`.

```bash
node --test        # 8/8
```

> ⚠️ Los importes (`cuotaMensualPorTrabajador`, `comision`) son **placeholders pendientes de
> definir por el negocio**.
