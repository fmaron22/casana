// Contrato del gateway con el IMSS (generación de línea de captura para PTH).
// Adaptadores intercambiables: RPA (Playwright), API de terceros, o mock.
// Ver ADR-0004.

export interface DatosEmpleador {
  curp: string;
  correo: string;
  nombre: string;
}

export interface DatosTrabajador {
  curp: string;
  nss?: string;
  nombre: string;
}

export interface DatosDeclaracion {
  empleador: DatosEmpleador;
  trabajador: DatosTrabajador;
  salarioDiarioCentavos: number;
  modalidad: 'MES_COMPLETO' | 'POR_DIA';
  diasLaborados?: number;
  periodo: string; // YYYY-MM
}

export type EstadoLineaCaptura = 'GENERADA' | 'REQUIERE_INTERVENCION' | 'ERROR';

export interface LineaDeCaptura {
  estado: EstadoLineaCaptura;
  lineaCaptura?: string; // el número de línea de captura emitido por el IMSS
  importeCentavos?: number;
  vigencia?: string; // fecha límite de pago
  urlPdfLineaCaptura?: string; // en Cloud Storage
  urlPdfComprobante?: string;
  // Diagnóstico cuando estado != GENERADA (p.ej. captura de pantalla).
  motivo?: string;
  urlDiagnostico?: string;
}

/** Se lanza cuando el portal presenta un CAPTCHA: el robot NO lo resuelve. */
export class CaptchaDetectadoError extends Error {
  constructor(public readonly urlDiagnostico?: string) {
    super('El portal del IMSS presentó un CAPTCHA; se requiere intervención humana');
    this.name = 'CaptchaDetectadoError';
  }
}

export abstract class ImssGateway {
  /** Genera (o recupera) la línea de captura para una declaración PTH. */
  abstract generarLineaDeCaptura(datos: DatosDeclaracion): Promise<LineaDeCaptura>;
}
