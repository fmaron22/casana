import type { ResultadoCalculo, Modalidad } from "@casana/imss-calc";

export interface PreviewDispersion {
  dias: number;
  imss: ResultadoCalculo;
  salarioPeriodoCentavos: number;
  obligacionesCentavos: number;
  cargo: {
    moneda: string;
    passthrough: { salario: number; obligaciones: number; total: number };
    comision: { base: number; subtotal: number; iva: number; total: number };
    totalACobrar: number;
  };
}

export function construirPreviewDispersion(p: {
  salarioDiarioCentavos: number;
  modalidad?: Modalidad;
  diasLaborados?: number;
  versionImss?: string;
  versionBilling?: string;
}): PreviewDispersion;
