// @casana/cotizacion es ESM; se carga con import() dinámico (app en CommonJS).
import type { construirPreviewDispersion as CPD } from '@casana/cotizacion';

let mod: { construirPreviewDispersion: typeof CPD } | null = null;

export async function cotizacion(): Promise<{ construirPreviewDispersion: typeof CPD }> {
  if (!mod) {
    mod = (await import('@casana/cotizacion')) as { construirPreviewDispersion: typeof CPD };
  }
  return mod;
}
