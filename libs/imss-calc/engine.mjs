// =============================================================================
// Casana · Motor de cálculo de cuotas IMSS/INFONAVIT — Personas Trabajadoras
// del Hogar (PTH).
//
// Diseño:
//  - MOTOR PURO: sin DOM, sin I/O. Importable en el navegador y en Node.
//  - PARÁMETROS EN CONFIGURACIÓN VERSIONADA (`PARAMS`): nada de números mágicos
//    en la lógica. Un cambio normativo = nueva versión con `vigenteDesde`.
//  - Los cálculos históricos deben usar la versión vigente en su fecha.
//
// ⚠️ TODOS los valores numéricos de `PARAMS` deben verificarse contra el DOF /
//    IMSS y calibrarse con la suite de "golden tests" contra el simulador
//    oficial (ver engine.test.mjs y docs/IMSS-CALCULO-Y-LINEA-DE-CAPTURA.md).
// =============================================================================

/**
 * Tabla progresiva de Cesantía en Edad Avanzada y Vejez (parte PATRONAL),
 * por nivel de SBC expresado en veces UMA. Fase de incremento gradual
 * (2023–2030). Obrera fija = 1.125%.
 *
 * ⚠️ Los extremos (3.150% y ~7.513%) provienen de fuente secundaria para 2026;
 *    los tramos intermedios son PROVISIONALES y deben sustituirse por la tabla
 *    exacta del DOF. La estructura es correcta; los valores se calibran con
 *    golden tests.
 */
const CEAV_PATRONAL_2026 = [
  { hastaVecesUMA: 1.0, pct: 3.15 }, // hasta 1 salario mínimo
  { hastaVecesUMA: 1.5, pct: 4.202 },
  { hastaVecesUMA: 2.0, pct: 4.751 },
  { hastaVecesUMA: 2.5, pct: 5.079 },
  { hastaVecesUMA: 3.0, pct: 5.297 },
  { hastaVecesUMA: 3.5, pct: 5.483 },
  { hastaVecesUMA: 4.0, pct: 5.598 },
  { hastaVecesUMA: Infinity, pct: 7.513 }, // 4.01 UMA en adelante
];

/**
 * Registro de parámetros por versión. La clave es el identificador de versión.
 * Cada versión declara desde cuándo es vigente.
 */
export const PARAMS = {
  "2026": {
    vigenteDesde: "2026-02-01", // UMA vigente desde 01/02/2026 (DOF 09/01/2026)
    umaDiaria: 117.31, // ⚠️ DOF 09/01/2026
    smgDiario: 315.04, // ⚠️ verificar salario mínimo general 2026
    diasMesCompleto: 30.4, // promedio de días por mes (Ley UMA)
    factorIntegracion: 1.0493, // ⚠️ mínimo 1er año (15 aguinaldo, 12 vac, 25% prima)
    topeVecesUMA: 25, // tope superior del SBC
    // Ramos de aseguramiento. `base` define sobre qué se aplica el %.
    //   sbc          -> SBC × días
    //   uma          -> UMA diaria × días (cuota fija de E&M)
    //   excedente3uma-> max(0, SBC − 3·UMA) × días
    ramos: {
      riesgosTrabajo: { nombre: "Riesgos de Trabajo", base: "sbc", patronal: 0.54355, obrera: 0 }, // ⚠️ prima mínima clase I
      eymCuotaFija: { nombre: "Enf. y Maternidad · Cuota fija", base: "uma", patronal: 20.4, obrera: 0 },
      eymExcedente: { nombre: "Enf. y Maternidad · Excedente", base: "excedente3uma", patronal: 1.1, obrera: 0.4 },
      eymGastosMed: { nombre: "Enf. y Maternidad · Gastos médicos pensionados", base: "sbc", patronal: 1.05, obrera: 0.375 },
      eymDinero: { nombre: "Enf. y Maternidad · Prestaciones en dinero", base: "sbc", patronal: 0.7, obrera: 0.25 },
      invalidezVida: { nombre: "Invalidez y Vida", base: "sbc", patronal: 1.75, obrera: 0.625 },
      guarderias: { nombre: "Guarderías y Prestaciones Sociales", base: "sbc", patronal: 1.0, obrera: 0 },
      retiro: { nombre: "Retiro (SAR)", base: "sbc", patronal: 2.0, obrera: 0 },
      cesantiaVejez: { nombre: "Cesantía y Vejez", base: "sbc", patronalTabla: CEAV_PATRONAL_2026, obrera: 1.125 },
    },
    infonavit: { nombre: "INFONAVIT", base: "sbc", patronal: 5.0, obrera: 0 },
  },
};

/** Redondeo a centavos. */
export const money = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Selecciona la versión de parámetros vigente para una fecha dada (YYYY-MM-DD). */
export function versionVigente(fecha, params = PARAMS) {
  const candidatas = Object.entries(params)
    .filter(([, p]) => p.vigenteDesde <= fecha)
    .sort((a, b) => (a[1].vigenteDesde < b[1].vigenteDesde ? 1 : -1));
  return candidatas.length ? candidatas[0][0] : Object.keys(params)[0];
}

/** Devuelve el % patronal de CEAV según el SBC (en veces UMA). */
function ceavPatronal(sbc, umaDiaria, tabla) {
  const veces = sbc / umaDiaria;
  const tramo = tabla.find((t) => veces <= t.hastaVecesUMA) || tabla[tabla.length - 1];
  return tramo.pct;
}

/**
 * Calcula las cuotas IMSS + INFONAVIT para una persona trabajadora del hogar.
 *
 * @param {Object} input
 * @param {number} input.salarioDiario  Salario diario pactado (MXN).
 * @param {"mesCompleto"|"porDia"} [input.modalidad="mesCompleto"]
 * @param {number} [input.diasLaborados] Requerido si modalidad="porDia" (1–31).
 * @param {string} [input.version]       Versión de PARAMS (default: la más reciente).
 * @returns {Object} Desglose completo.
 */
export function calcular(input, params = PARAMS) {
  const version = input.version || Object.keys(params).sort().reverse()[0];
  const P = params[version];
  if (!P) throw new Error(`Versión de parámetros desconocida: ${version}`);

  const modalidad = input.modalidad || "mesCompleto";
  const salarioDiario = Number(input.salarioDiario);
  if (!(salarioDiario > 0)) throw new Error("salarioDiario debe ser mayor a 0");

  // Días del periodo según modalidad.
  let dias;
  if (modalidad === "mesCompleto") {
    dias = P.diasMesCompleto;
  } else {
    dias = Number(input.diasLaborados);
    if (!(dias > 0 && dias <= 31)) throw new Error("diasLaborados debe estar entre 1 y 31");
  }

  // Salario Base de Cotización: integrado, con piso (SMG) y tope (25 UMA).
  const sbcIntegrado = salarioDiario * P.factorIntegracion;
  const piso = P.smgDiario;
  const tope = P.topeVecesUMA * P.umaDiaria;
  const sbc = Math.min(Math.max(sbcIntegrado, piso), tope);

  const excedente3Uma = Math.max(0, sbc - 3 * P.umaDiaria);

  const baseMonto = (base) => {
    switch (base) {
      case "sbc": return sbc * dias;
      case "uma": return P.umaDiaria * dias;
      case "excedente3uma": return excedente3Uma * dias;
      default: throw new Error(`Base desconocida: ${base}`);
    }
  };

  const conceptos = [];
  let totalPatronal = 0;
  let totalObrera = 0;

  const todos = { ...P.ramos, infonavit: P.infonavit };
  for (const [clave, ramo] of Object.entries(todos)) {
    const base = baseMonto(ramo.base);
    const pctPatronal = ramo.patronalTabla
      ? ceavPatronal(sbc, P.umaDiaria, ramo.patronalTabla)
      : ramo.patronal;
    const patronal = money((base * pctPatronal) / 100);
    const obrera = money((base * (ramo.obrera || 0)) / 100);
    conceptos.push({
      clave,
      nombre: ramo.nombre,
      pctPatronal,
      pctObrera: ramo.obrera || 0,
      patronal,
      obrera,
      subtotal: money(patronal + obrera),
    });
    totalPatronal += patronal;
    totalObrera += obrera;
  }

  const totalInfonavit = conceptos.find((c) => c.clave === "infonavit").subtotal;
  const totalImss = money(totalPatronal + totalObrera - totalInfonavit);
  const granTotal = money(totalPatronal + totalObrera);

  return {
    version,
    inputs: { salarioDiario, modalidad, dias },
    sbc: money(sbc),
    sbcIntegradoSinTope: money(sbcIntegrado),
    conceptos,
    totales: {
      patronal: money(totalPatronal),
      obrera: money(totalObrera),
      imss: totalImss,
      infonavit: totalInfonavit,
      total: granTotal,
    },
  };
}
