// Pruebas del parser. Ejecutar con:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  importeACentavos,
  parsearTextoLineaCaptura,
  patronIdDeAlias,
} from "./parser.mjs";

const TEXTO_TIPICO = `
INSTITUTO MEXICANO DEL SEGURO SOCIAL
Personas Trabajadoras del Hogar

Periodo: 2026-07
Línea de captura: 26079412345678901234
Importe: $3,312.42
Fecha límite de pago: 17/08/2026
`;

test("extrae los 4 campos de un texto típico", () => {
  const r = parsearTextoLineaCaptura(TEXTO_TIPICO);
  assert.equal(r.lineaCaptura, "26079412345678901234");
  assert.equal(r.importeCentavos, 331242);
  assert.equal(r.vigencia, "17/08/2026");
  assert.equal(r.periodo, "2026-07");
  assert.equal(r.completo, true);
});

test("tolera variantes de etiquetas (monto / vigencia / acentos)", () => {
  const r = parsearTextoLineaCaptura(`
    LINEA DE CAPTURA 990011223344556677
    Monto: $1,000.00
    Vigencia: 2026-08-17
    Periodo: julio de 2026
  `);
  assert.equal(r.lineaCaptura, "990011223344556677");
  assert.equal(r.importeCentavos, 100000);
  assert.equal(r.vigencia, "2026-08-17");
  assert.match(r.periodo, /julio/i);
});

test("incompleto cuando falta el importe", () => {
  const r = parsearTextoLineaCaptura("Línea de captura: ABC1234567890XYZ");
  assert.equal(r.completo, false);
  assert.equal(r.importeCentavos, null);
});

test("importeACentavos maneja comas y símbolos", () => {
  assert.equal(importeACentavos("$12,160.00"), 1216000);
  assert.equal(importeACentavos("3312.42"), 331242);
  assert.equal(importeACentavos(""), null);
});

test("patronIdDeAlias extrae el uuid del alias", () => {
  assert.equal(
    patronIdDeAlias("imss+7c9e6679-7425-40de-944b-e07fc1f90ae7@casana.mx"),
    "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  );
  assert.equal(patronIdDeAlias("otro@casana.mx"), null);
});
