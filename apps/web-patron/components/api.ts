// Mini-SDK del API de Casana para el navegador.
// TODO: extraer a @casana/api-client generado desde OpenAPI (ADR-0003).

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body.message) msg = Array.isArray(body.message) ? body.message.join('; ') : body.message;
    } catch {
      /* cuerpo no-JSON */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export interface Patron { id: string; nombre: string; email: string; }
export interface Trabajador { id: string; nombre: string; }
export interface DatosINE { nombre?: string; curp?: string; domicilio?: string; }
export interface Preview {
  dias: number;
  obligacionesCentavos: number;
  salarioPeriodoCentavos: number;
  cargo: { comision: { total: number }; totalACobrar: number };
}

export const api = {
  ocrINE: (imagenBase64: string) =>
    req<DatosINE>('/v1/onboarding/ocr-ine', { method: 'POST', body: JSON.stringify({ imagenBase64 }) }),

  crearPatron: (d: { nombre: string; email: string; telefono?: string; curp?: string }) =>
    req<Patron>('/v1/patrones', { method: 'POST', body: JSON.stringify(d) }),

  setupIntent: (patronId: string) =>
    req<{ clientSecret: string | null }>(`/v1/patrones/${patronId}/setup-intent`, { method: 'POST' }),

  metodoPago: (patronId: string, paymentMethodId: string) =>
    req<{ ok: true }>(`/v1/patrones/${patronId}/metodo-pago`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId }),
    }),

  crearTrabajador: (d: { nombre: string; curp?: string; nss?: string; clabe?: string }) =>
    req<Trabajador>('/v1/trabajadores', { method: 'POST', body: JSON.stringify(d) }),

  crearRelacion: (d: {
    patronId: string;
    trabajadorId: string;
    salarioDiario: number;
    modalidad: 'MES_COMPLETO' | 'POR_DIA';
    diasSemana?: number;
    puesto?: string;
    lugarTrabajo?: string;
  }) => req<{ id: string }>('/v1/relaciones', { method: 'POST', body: JSON.stringify(d) }),

  cotizar: (salarioDiarioCentavos: number, modalidad: 'mesCompleto' | 'porDia', diasLaborados?: number) =>
    req<Preview>(
      `/v1/cotizador?salarioDiario=${salarioDiarioCentavos}&modalidad=${modalidad}` +
        (diasLaborados ? `&diasLaborados=${diasLaborados}` : ''),
    ),
};

export const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
export const pesos = (centavos: number) => mxn.format(centavos / 100);

/** Lee un archivo de imagen y lo devuelve como base64 (sin encabezado data:). */
export function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
