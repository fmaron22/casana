// Contrato de OCR de identificaciones (INE). Implementaciones intercambiables:
// Document AI (producción) o mock (dev/pruebas). Ver ADR-0003.

export interface DatosINE {
  nombre?: string;
  curp?: string;
  claveElector?: string;
  domicilio?: string;
  vigencia?: string;
}

export abstract class OcrService {
  /** Extrae datos de una imagen de INE (base64, sin encabezado data:). */
  abstract extraerINE(imagenBase64: string): Promise<DatosINE>;
}
