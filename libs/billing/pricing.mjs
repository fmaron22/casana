// =============================================================================
// Casana · Motor de tarifas (billing). Puro, sin SDK ni I/O.
//
//  - Todos los montos en CENTAVOS (unidad mínima de Stripe) → sin errores de
//    redondeo. Helpers `pesos()`/`centavos()` para conversión de presentación.
//  - IVA 16% aplica SOLO a los servicios de Casana (cuota + comisión), NUNCA al
//    dinero de terceros (salario, obligaciones IMSS). Ver ADR-0002 §C.
//  - Parámetros en CONFIGURACIÓN VERSIONADA (`PARAMS_BILLING`).
//
// ⚠️ Los importes de tarifa son PLACEHOLDERS pendientes de definir por negocio.
// =============================================================================

export const PARAMS_BILLING = {
  "2026": {
    vigenteDesde: "2026-01-01",
    moneda: "mxn",
    ivaTasa: 0.16,
    // Cuota mensual por cada trabajador registrado (servicio de Casana).
    cuotaMensualPorTrabajador: 9900, // ⚠️ $99.00 MXN — TBD negocio
    // Comisión por transferencia (dispersión). tipo: fijo | porcentaje | mixto.
    comision: {
      tipo: "mixto", // ⚠️ TBD negocio
      montoFijo: 1000, // $10.00 base
      porcentaje: 0.01, // 1.0% del monto dispersado
      min: 1500, // piso $15.00
      max: 9900, // techo $99.00
    },
  },
};

export const centavosAPesos = (c) => Math.round(c) / 100;
export const pesosACentavos = (p) => Math.round(p * 100);
const round = (n) => Math.round(n);

function ultimaVersion(params) {
  return Object.keys(params).sort().reverse()[0];
}

function aplicaIva(subtotalCentavos, tasa) {
  const iva = round(subtotalCentavos * tasa);
  return { subtotal: subtotalCentavos, iva, total: subtotalCentavos + iva };
}

/**
 * Cuota mensual de suscripción (servicio de Casana, con IVA).
 * @returns {{numTrabajadores:number, unitario:number, subtotal:number, iva:number, total:number}}
 */
export function calcularSuscripcionMensual({ numTrabajadores, version } = {}, params = PARAMS_BILLING) {
  const P = params[version || ultimaVersion(params)];
  if (!Number.isInteger(numTrabajadores) || numTrabajadores < 0)
    throw new Error("numTrabajadores debe ser un entero >= 0");
  const unitario = P.cuotaMensualPorTrabajador;
  const subtotal = unitario * numTrabajadores;
  return { numTrabajadores, unitario, ...aplicaIva(subtotal, P.ivaTasa) };
}

/**
 * Comisión por una transferencia (servicio de Casana, con IVA), a partir del
 * monto dispersado (salario + obligaciones).
 * @returns {{base:number, subtotal:number, iva:number, total:number}}
 */
export function calcularComision({ montoDispersado, version } = {}, params = PARAMS_BILLING) {
  const P = params[version || ultimaVersion(params)];
  if (!(montoDispersado >= 0)) throw new Error("montoDispersado debe ser >= 0");
  const c = P.comision;
  let subtotal;
  switch (c.tipo) {
    case "fijo": subtotal = c.montoFijo; break;
    case "porcentaje": subtotal = round(montoDispersado * c.porcentaje); break;
    case "mixto": subtotal = c.montoFijo + round(montoDispersado * c.porcentaje); break;
    default: throw new Error(`Tipo de comisión desconocido: ${c.tipo}`);
  }
  if (c.min != null) subtotal = Math.max(subtotal, c.min);
  if (c.max != null) subtotal = Math.min(subtotal, c.max);
  return { base: montoDispersado, ...aplicaIva(subtotal, P.ivaTasa) };
}

/**
 * Cargo TOTAL a la tarjeta del patrón en un evento de dispersión.
 * Separa el pass-through (sin IVA) de la comisión de Casana (con IVA).
 *
 * @param {Object} p
 * @param {number} p.salario        Salario neto al trabajador (centavos).
 * @param {number} p.obligaciones   Cuotas IMSS/INFONAVIT (centavos).
 * @returns {Object} Desglose y `totalACobrar` (lo que se manda al PaymentIntent).
 */
export function calcularCargoDispersion({ salario, obligaciones, version } = {}, params = PARAMS_BILLING) {
  if (!(salario >= 0) || !(obligaciones >= 0))
    throw new Error("salario y obligaciones deben ser >= 0");
  const passthrough = salario + obligaciones; // dinero de terceros, SIN IVA
  const comision = calcularComision({ montoDispersado: passthrough, version }, params);
  return {
    moneda: params[version || ultimaVersion(params)].moneda,
    passthrough: { salario, obligaciones, total: passthrough }, // se dispersa vía STP
    comision, // ingreso de Casana (subtotal + iva)
    totalACobrar: passthrough + comision.total, // PaymentIntent.amount
  };
}
