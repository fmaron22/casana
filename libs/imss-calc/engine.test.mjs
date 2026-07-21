// Pruebas del motor de cálculo. Ejecutar con:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcular, PARAMS, versionVigente, money } from "./engine.mjs";

const P = PARAMS["2026"];

test("SBC = salario diario × factor de integración (por encima del piso)", () => {
  const r = calcular({ salarioDiario: 500, modalidad: "mesCompleto" });
  assert.equal(r.sbc, money(500 * P.factorIntegracion));
});

test("SBC nunca es menor al salario mínimo general (piso)", () => {
  const r = calcular({ salarioDiario: 100 }); // 100×1.0493 < SMG
  assert.equal(r.sbc, money(P.smgDiario));
});

test("SBC se topa en 25 UMA", () => {
  const r = calcular({ salarioDiario: 100000 });
  assert.equal(r.sbc, money(P.topeVecesUMA * P.umaDiaria));
});

test("Cuota fija de E&M se calcula sobre UMA, no sobre SBC", () => {
  const r = calcular({ salarioDiario: 500, modalidad: "porDia", diasLaborados: 1 });
  const cuotaFija = r.conceptos.find((c) => c.clave === "eymCuotaFija");
  assert.equal(cuotaFija.patronal, money((P.umaDiaria * 1 * 20.4) / 100));
});

test("Excedente de 3 UMA es 0 cuando el SBC es bajo", () => {
  const r = calcular({ salarioDiario: P.smgDiario, modalidad: "porDia", diasLaborados: 1 });
  const exc = r.conceptos.find((c) => c.clave === "eymExcedente");
  assert.equal(exc.patronal, 0);
  assert.equal(exc.obrera, 0);
});

test("Modalidad mes completo usa 30.4 días", () => {
  const r = calcular({ salarioDiario: 400, modalidad: "mesCompleto" });
  assert.equal(r.inputs.dias, P.diasMesCompleto);
});

test("INFONAVIT = 5% del SBC × días y se separa del total IMSS", () => {
  const r = calcular({ salarioDiario: 400, modalidad: "porDia", diasLaborados: 10 });
  assert.equal(r.totales.infonavit, money(r.sbc * 10 * 0.05));
  assert.equal(r.totales.total, money(r.totales.imss + r.totales.infonavit));
});

test("Más días ⇒ mayor total (monotonía)", () => {
  const a = calcular({ salarioDiario: 400, modalidad: "porDia", diasLaborados: 5 });
  const b = calcular({ salarioDiario: 400, modalidad: "porDia", diasLaborados: 15 });
  assert.ok(b.totales.total > a.totales.total);
});

test("Entradas inválidas lanzan error", () => {
  assert.throws(() => calcular({ salarioDiario: 0 }));
  assert.throws(() => calcular({ salarioDiario: 400, modalidad: "porDia", diasLaborados: 40 }));
});

test("versionVigente selecciona por fecha", () => {
  assert.equal(versionVigente("2026-07-01"), "2026");
});

// ---------------------------------------------------------------------------
// GOLDEN TESTS (pendientes de datos oficiales)
// Correr N combinaciones en el simulador oficial del IMSS y pegar los importes
// aquí. Cuando estos pasen, la emulación está calibrada al centavo.
// ---------------------------------------------------------------------------
const GOLDEN = [
  // { salarioDiario: 315.04, modalidad: "mesCompleto", esperadoTotal: 0.00 },
];
for (const g of GOLDEN) {
  test(`GOLDEN · $${g.salarioDiario}/${g.modalidad}`, () => {
    const r = calcular(g);
    assert.equal(r.totales.total, g.esperadoTotal);
  });
}
