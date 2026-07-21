// Tipos de @casana/billing (motor de tarifas). Ver pricing.mjs.

export interface ComisionParams {
  tipo: "fijo" | "porcentaje" | "mixto";
  montoFijo: number;
  porcentaje: number;
  min?: number;
  max?: number;
}

export interface VersionBilling {
  vigenteDesde: string;
  moneda: string;
  ivaTasa: number;
  cuotaMensualPorTrabajador: number;
  comision: ComisionParams;
}

export const PARAMS_BILLING: Record<string, VersionBilling>;

export function centavosAPesos(centavos: number): number;
export function pesosACentavos(pesos: number): number;

export interface MontoConIva {
  subtotal: number;
  iva: number;
  total: number;
}

export function calcularSuscripcionMensual(
  args: { numTrabajadores: number; version?: string },
  params?: Record<string, VersionBilling>,
): MontoConIva & { numTrabajadores: number; unitario: number };

export function calcularComision(
  args: { montoDispersado: number; version?: string },
  params?: Record<string, VersionBilling>,
): MontoConIva & { base: number };

export function calcularCargoDispersion(
  args: { salario: number; obligaciones: number; version?: string },
  params?: Record<string, VersionBilling>,
): {
  moneda: string;
  passthrough: { salario: number; obligaciones: number; total: number };
  comision: MontoConIva & { base: number };
  totalACobrar: number;
};
