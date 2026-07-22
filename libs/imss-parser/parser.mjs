// =============================================================================
// Casana · Parser de la línea de captura del IMSS (correo/PDF mensual PTH).
//
// Dos capas:
//   - parsearTextoLineaCaptura(texto): PURA, regex sobre texto → testeable.
//   - parsearPdfLineaCaptura(buffer):  PDF → texto (pdf-parse) → parser de texto.
//
// ⚠️ Los patrones se calibran contra el FORMATO REAL del PDF del IMSS cuando
//    llegue el primer correo (validación V1 del ADR-0005). Están escritos para
//    ser tolerantes a etiquetas comunes.
// =============================================================================

const RE = {
  // "Línea de captura: XXXXXXXXXXXX" (alfanumérica, 10-30 chars)
  lineaEtiquetada: /l[ií]nea\s+de\s+captura[:\s]*([A-Z0-9]{10,30})/i,
  // Fallback: token alfanumérico largo aislado (mayúsculas/dígitos)
  lineaSuelta: /\b([A-Z0-9]{14,30})\b/,
  importe: /(?:importe|total\s+a\s+pagar|monto)[:\s]*\$?\s*([\d,]+\.\d{2})/i,
  vigencia: /(?:vigencia|fecha\s+l[ií]mite(?:\s+de\s+pago)?)[:\s]*(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/i,
  periodo: /periodo[:\s]*(\d{4}-\d{2}|[A-Za-zÁ-Úá-ú]+\s+(?:de\s+)?\d{4})/i,
};

/** "3,312.42" → 331242 (centavos). */
export function importeACentavos(txt) {
  const limpio = String(txt).replace(/[^0-9.]/g, "");
  if (!limpio) return null;
  return Math.round(parseFloat(limpio) * 100);
}

/**
 * Extrae los campos de la línea de captura desde texto plano.
 * @returns {{lineaCaptura: string|null, importeCentavos: number|null,
 *            vigencia: string|null, periodo: string|null, completo: boolean}}
 */
export function parsearTextoLineaCaptura(texto) {
  const t = String(texto ?? "");
  const linea = t.match(RE.lineaEtiquetada)?.[1] ?? t.match(RE.lineaSuelta)?.[1] ?? null;
  const importeTxt = t.match(RE.importe)?.[1] ?? null;
  const vigencia = t.match(RE.vigencia)?.[1] ?? null;
  const periodo = t.match(RE.periodo)?.[1] ?? null;

  const importeCentavos = importeTxt ? importeACentavos(importeTxt) : null;
  return {
    lineaCaptura: linea,
    importeCentavos,
    vigencia,
    periodo,
    completo: Boolean(linea && importeCentavos != null && vigencia),
  };
}

/**
 * Extrae los campos desde un PDF (Buffer/Uint8Array). Usa pdfjs-dist (Mozilla).
 */
export async function parsearPdfLineaCaptura(buffer) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await getDocument({
    data: new Uint8Array(buffer),
    // Sin workers en Node; suprime warnings de fuentes.
    useSystemFonts: true,
    verbosity: 0,
  }).promise;

  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => ("str" in it ? it.str : "")).join("\n") + "\n";
  }
  await doc.destroy();

  return { ...parsearTextoLineaCaptura(text), textoExtraido: text };
}

/** Extrae el patronId de un alias `imss+{uuid}@dominio`. */
export function patronIdDeAlias(destinatario) {
  const m = String(destinatario ?? "").match(
    /imss\+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})@/i,
  );
  return m ? m[1].toLowerCase() : null;
}
