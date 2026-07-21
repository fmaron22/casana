// =============================================================================
// Casana · Cotización de dispersión. Enlaza @casana/imss-calc (cuotas) con
// @casana/billing (cargo a la tarjeta del patrón).
//
// Reconciliación de unidades:
//   - imss-calc trabaja en PESOS.
//   - billing/Stripe trabajan en CENTAVOS.
// Aquí se convierte con cuidado para evitar errores de redondeo.
// =============================================================================
import { calcular } from "@casana/imss-calc";
import { calcularCargoDispersion } from "@casana/billing";

/**
 * Construye la vista previa de una dispersión a partir del salario diario.
 *
 * @param {Object} p
 * @param {number} p.salarioDiarioCentavos  Salario diario en CENTAVOS.
 * @param {"mesCompleto"|"porDia"} [p.modalidad="mesCompleto"]
 * @param {number} [p.diasLaborados]         Requerido si modalidad="porDia".
 * @param {string} [p.versionImss]
 * @param {string} [p.versionBilling]
 * @returns {Object} Desglose: cuotas IMSS, salario del periodo, y cargo a cobrar.
 */
export function construirPreviewDispersion({
  salarioDiarioCentavos,
  modalidad = "mesCompleto",
  diasLaborados,
  versionImss,
  versionBilling,
}) {
  if (!(salarioDiarioCentavos > 0)) throw new Error("salarioDiarioCentavos debe ser > 0");

  // imss-calc en pesos.
  const imss = calcular({
    salarioDiario: salarioDiarioCentavos / 100,
    modalidad,
    diasLaborados,
    version: versionImss,
  });

  const dias = imss.inputs.dias;
  const salarioPeriodoCentavos = Math.round(salarioDiarioCentavos * dias);
  const obligacionesCentavos = Math.round(imss.totales.total * 100); // pesos → centavos

  // billing en centavos: pass-through (salario + obligaciones) + comisión (con IVA).
  const cargo = calcularCargoDispersion({
    salario: salarioPeriodoCentavos,
    obligaciones: obligacionesCentavos,
    version: versionBilling,
  });

  return {
    dias,
    imss, // desglose en PESOS (SBC, conceptos, totales)
    salarioPeriodoCentavos, // salario del periodo (CENTAVOS)
    obligacionesCentavos, // cuotas IMSS/INFONAVIT (CENTAVOS)
    cargo, // { moneda, passthrough, comision, totalACobrar } en CENTAVOS
  };
}
