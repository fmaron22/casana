import { Injectable } from '@nestjs/common';
import type { construirPreviewDispersion as CPD } from '@casana/cotizacion';
import { DatosDeclaracion, ImssGateway, LineaDeCaptura } from './imss-gateway.service';

/**
 * Adaptador de desarrollo: NO toca el portal. Devuelve una línea de captura de
 * ejemplo, con el importe calculado por el motor real (imss-calc vía cotización)
 * para que el mock sea coherente con las cuotas.
 */
@Injectable()
export class MockImssGateway extends ImssGateway {
  async generarLineaDeCaptura(datos: DatosDeclaracion): Promise<LineaDeCaptura> {
    const { construirPreviewDispersion } = (await import('@casana/cotizacion')) as {
      construirPreviewDispersion: typeof CPD;
    };
    const preview = construirPreviewDispersion({
      salarioDiarioCentavos: datos.salarioDiarioCentavos,
      modalidad: datos.modalidad === 'POR_DIA' ? 'porDia' : 'mesCompleto',
      diasLaborados: datos.diasLaborados,
    });
    // Línea de captura ficticia pero con formato plausible.
    const lineaCaptura = `MOCK${datos.periodo.replace('-', '')}${String(
      datos.trabajador.curp.length,
    ).padStart(2, '0')}`;
    return {
      estado: 'GENERADA',
      lineaCaptura,
      importeCentavos: preview.obligacionesCentavos,
      vigencia: `${datos.periodo}-17`,
      urlPdfLineaCaptura: `mock://linea-captura/${lineaCaptura}.pdf`,
    };
  }
}
