// Tipos de @casana/imss-calc. Ver engine.mjs.

export type Modalidad = "mesCompleto" | "porDia";

export interface CalcularInput {
  salarioDiario: number; // PESOS
  modalidad?: Modalidad;
  diasLaborados?: number;
  version?: string;
}

export interface ConceptoCuota {
  clave: string;
  nombre: string;
  pctPatronal: number;
  pctObrera: number;
  patronal: number;
  obrera: number;
  subtotal: number;
}

export interface ResultadoCalculo {
  version: string;
  inputs: { salarioDiario: number; modalidad: Modalidad; dias: number };
  sbc: number;
  sbcIntegradoSinTope: number;
  conceptos: ConceptoCuota[];
  totales: {
    patronal: number;
    obrera: number;
    imss: number;
    infonavit: number;
    total: number;
  };
}

export const PARAMS: Record<string, any>;
export function money(n: number): number;
export function versionVigente(fecha: string, params?: Record<string, any>): string;
export function calcular(input: CalcularInput, params?: Record<string, any>): ResultadoCalculo;
