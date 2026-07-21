// Pruebas de la cotización de dispersión. Ejecutar con:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import { construirPreviewDispersion } from "./cotizacion.mjs";
import { calcular } from "@casana/imss-calc";

test("obligaciones (centavos) = total IMSS (pesos) × 100", () => {
  const r = construirPreviewDispersion({ salarioDiarioCentavos: 40000, modalidad: "porDia", diasLaborados: 15 });
  const imss = calcular({ salarioDiario: 400, modalidad: "porDia", diasLaborados: 15 });
  assert.equal(r.obligacionesCentavos, Math.round(imss.totales.total * 100));
});

test("salario del periodo = salario diario × días", () => {
  const r = construirPreviewDispersion({ salarioDiarioCentavos: 40000, modalidad: "porDia", diasLaborados: 10 });
  assert.equal(r.salarioPeriodoCentavos, 40000 * 10);
});

test("total a cobrar = salario + obligaciones + comisión (con IVA)", () => {
  const r = construirPreviewDispersion({ salarioDiarioCentavos: 40000, modalidad: "mesCompleto" });
  assert.equal(
    r.cargo.totalACobrar,
    r.salarioPeriodoCentavos + r.obligacionesCentavos + r.cargo.comision.total,
  );
});

test("el pass-through son exactamente salario + obligaciones (sin IVA)", () => {
  const r = construirPreviewDispersion({ salarioDiarioCentavos: 50000, modalidad: "mesCompleto" });
  assert.equal(r.cargo.passthrough.salario, r.salarioPeriodoCentavos);
  assert.equal(r.cargo.passthrough.obligaciones, r.obligacionesCentavos);
  assert.equal(r.cargo.passthrough.total, r.salarioPeriodoCentavos + r.obligacionesCentavos);
});

test("mes completo usa los días del motor IMSS (30.4)", () => {
  const r = construirPreviewDispersion({ salarioDiarioCentavos: 40000, modalidad: "mesCompleto" });
  assert.equal(r.dias, r.imss.inputs.dias);
});

test("entrada inválida lanza error", () => {
  assert.throws(() => construirPreviewDispersion({ salarioDiarioCentavos: 0 }));
});
