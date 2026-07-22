// Tipos de @casana/imss-parser. Ver parser.mjs.

export interface CamposLineaCaptura {
  lineaCaptura: string | null;
  importeCentavos: number | null;
  vigencia: string | null;
  periodo: string | null;
  completo: boolean;
}

export function importeACentavos(txt: string): number | null;
export function parsearTextoLineaCaptura(texto: string): CamposLineaCaptura;
export function parsearPdfLineaCaptura(
  buffer: Buffer | Uint8Array,
): Promise<CamposLineaCaptura & { textoExtraido: string }>;
export function patronIdDeAlias(destinatario: string): string | null;
