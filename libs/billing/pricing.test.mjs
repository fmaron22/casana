// Pruebas del motor de tarifas. Ejecutar con:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calcularSuscripcionMensual,
  calcularComision,
  calcularCargoDispersion,
  PARAMS_BILLING,
} from "./pricing.mjs";

const P = PARAMS_BILLING["2026"];

test("Suscripción: unitario × trabajadores + IVA 16%", () => {
  const r = calcularSuscripcionMensual({ numTrabajadores: 3 });
  assert.equal(r.subtotal, P.cuotaMensualPorTrabajador * 3);
  assert.equal(r.iva, Math.round(r.subtotal * 0.16));
  assert.equal(r.total, r.subtotal + r.iva);
});

test("Suscripción con 0 trabajadores = 0", () => {
  const r = calcularSuscripcionMensual({ numTrabajadores: 0 });
  assert.equal(r.total, 0);
});

test("Comisión mixta = fijo + % del monto, con IVA", () => {
  const monto = 500000; // $5,000.00
  const r = calcularComision({ montoDispersado: monto });
  const esperadoSub = P.comision.montoFijo + Math.round(monto * P.comision.porcentaje);
  assert.equal(r.subtotal, esperadoSub);
  assert.equal(r.iva, Math.round(esperadoSub * 0.16));
});

test("Comisión respeta piso (min)", () => {
  const r = calcularComision({ montoDispersado: 0 });
  assert.equal(r.subtotal, P.comision.min);
});

test("Comisión respeta techo (max)", () => {
  const r = calcularComision({ montoDispersado: 100000000 }); // monto enorme
  assert.equal(r.subtotal, P.comision.max);
});

test("Cargo de dispersión: pass-through SIN IVA, comisión CON IVA", () => {
  const salario = 300000; // $3,000
  const obligaciones = 80000; // $800
  const r = calcularCargoDispersion({ salario, obligaciones });
  // El pass-through no lleva IVA
  assert.equal(r.passthrough.total, salario + obligaciones);
  // El total a cobrar = pass-through + comisión con IVA
  assert.equal(r.totalACobrar, r.passthrough.total + r.comision.total);
  // La comisión sí trae IVA
  assert.equal(r.comision.iva, Math.round(r.comision.subtotal * 0.16));
});

test("El IVA nunca se aplica al dinero de terceros", () => {
  const r = calcularCargoDispersion({ salario: 1000000, obligaciones: 0 });
  const ivaImplicito = r.totalACobrar - r.passthrough.total - r.comision.subtotal;
  assert.equal(ivaImplicito, r.comision.iva); // solo IVA de la comisión
});

test("Entradas inválidas lanzan error", () => {
  assert.throws(() => calcularSuscripcionMensual({ numTrabajadores: -1 }));
  assert.throws(() => calcularComision({ montoDispersado: -5 }));
  assert.throws(() => calcularCargoDispersion({ salario: -1, obligaciones: 0 }));
});
