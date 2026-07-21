// Selectores del portal PTH (adodigital.imss.gob.mx/pth).
//
// ⚠️ PLACEHOLDERS. El DOM real debe MAPEARSE con acceso autorizado al portal
// (ver ADR-0004 §5). Al mapear, se ajusta SOLO este archivo. Los valores aquí
// son suposiciones razonables para estructurar el flujo, no selectores reales.

export const SELECTORS = {
  // Paso 1 — datos del empleador
  empleador: {
    curp: '#empleador-curp',
    correo: '#empleador-correo',
    continuar: 'button[data-step="1-continuar"]',
  },
  // Paso 2 — contacto y domicilio del empleador
  contacto: {
    continuar: 'button[data-step="2-continuar"]',
  },
  // Paso 3 — datos del trabajador y cotización
  trabajador: {
    nss: '#trabajador-nss',
    curp: '#trabajador-curp',
    modalidad: '#modalidad-cotizacion', // select: mes completo / por día
    salarioDiario: '#salario-diario',
    diasLaborados: '#dias-laborados',
    continuar: 'button[data-step="3-continuar"]',
  },
  // Paso 4 — confirmación
  confirmacion: {
    confirmar: 'button[data-step="4-confirmar"]',
  },
  // Paso 5 — resultado: línea de captura + descargas
  resultado: {
    lineaCaptura: '[data-field="linea-captura"]',
    importe: '[data-field="importe"]',
    vigencia: '[data-field="vigencia"]',
    descargarLinea: 'a[data-download="linea-captura"]',
    descargarComprobante: 'a[data-download="comprobante"]',
  },
  // Señales de verificación anti-bot (CAPTCHA) — el robot NO las resuelve.
  captcha: [
    'iframe[src*="recaptcha"]',
    '.g-recaptcha',
    'iframe[src*="hcaptcha"]',
    '#captcha',
  ],
} as const;
