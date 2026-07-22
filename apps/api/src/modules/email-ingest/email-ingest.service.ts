import { Injectable, Logger } from '@nestjs/common';
import type {
  parsearPdfLineaCaptura as ParsearPdf,
  patronIdDeAlias as PatronIdDeAlias,
  CamposLineaCaptura,
} from '@casana/imss-parser';
import type { construirPreviewDispersion as CPD } from '@casana/cotizacion';
import { PrismaService } from '../../persistence/prisma.service';
import { InboundEmailDto } from './dto/inbound-email.dto';

export interface ResultadoIngesta extends CamposLineaCaptura {
  patronId: string | null;
  persistido: boolean;
  estado: 'RECIBIDA' | 'REQUIERE_REVISION' | 'DISCREPANCIA';
  importeCalculadoCentavos: number | null;
}

/**
 * Ingesta del correo mensual del IMSS (ADR-0005):
 *   correo → identifica patrón por alias → parsea PDF → contrasta vs imss-calc
 *   → persiste LineaCaptura. TODO: subir el PDF a Cloud Storage y disparar el
 *   flujo de cobro (Stripe) al confirmarse la línea.
 */
@Injectable()
export class EmailIngestService {
  private readonly logger = new Logger(EmailIngestService.name);

  constructor(private readonly prisma: PrismaService) {}

  async procesar(correo: InboundEmailDto): Promise<ResultadoIngesta> {
    const { parsearPdfLineaCaptura, patronIdDeAlias } = (await import(
      '@casana/imss-parser'
    )) as { parsearPdfLineaCaptura: typeof ParsearPdf; patronIdDeAlias: typeof PatronIdDeAlias };

    const patronId = patronIdDeAlias(correo.destinatario);

    // Primer adjunto PDF.
    const pdf = correo.adjuntos.find((a) => a.nombre.toLowerCase().endsWith('.pdf'));
    if (!pdf) {
      this.logger.warn(`Correo sin PDF adjunto (destinatario: ${correo.destinatario})`);
      return this.resultado(null, patronId, false, 'REQUIERE_REVISION', null);
    }

    const campos = await parsearPdfLineaCaptura(Buffer.from(pdf.contenidoBase64, 'base64'));

    // Contraste vs pre-cálculo (golden test de producción). Mejor esfuerzo:
    // requiere BD y que el patrón tenga exactamente una relación activa.
    let importeCalculado: number | null = null;
    let discrepancia = false;
    if (patronId && campos.importeCentavos != null) {
      try {
        const relaciones = await this.prisma.relacionLaboral.findMany({
          where: { patronId, activa: true },
        });
        if (relaciones.length === 1) {
          const { construirPreviewDispersion } = (await import('@casana/cotizacion')) as {
            construirPreviewDispersion: typeof CPD;
          };
          const rel = relaciones[0];
          const preview = construirPreviewDispersion({
            salarioDiarioCentavos: rel.salarioDiario,
            modalidad: rel.modalidad === 'POR_DIA' ? 'porDia' : 'mesCompleto',
            diasLaborados:
              rel.modalidad === 'POR_DIA' && rel.diasSemana
                ? Math.round(rel.diasSemana * 4.33)
                : undefined,
          });
          importeCalculado = preview.obligacionesCentavos;
          // Tolerancia de ±$1.00 por redondeos del IMSS.
          discrepancia = Math.abs(importeCalculado - campos.importeCentavos) > 100;
          if (discrepancia) {
            this.logger.warn(
              `DISCREPANCIA patrón ${patronId}: IMSS=${campos.importeCentavos} vs calc=${importeCalculado}`,
            );
          }
        }
      } catch (err) {
        this.logger.warn(`Contraste no disponible (¿BD?): ${(err as Error).message}`);
      }
    }

    const estado = !campos.completo
      ? 'REQUIERE_REVISION'
      : discrepancia
        ? 'DISCREPANCIA'
        : 'RECIBIDA';

    // Persistencia (mejor esfuerzo en dev sin BD; en prod debe fallar fuerte).
    let persistido = false;
    try {
      await this.prisma.lineaCaptura.create({
        data: {
          patronId,
          periodo: campos.periodo,
          lineaCaptura: campos.lineaCaptura,
          importeCentavos: campos.importeCentavos,
          vigencia: campos.vigencia,
          destinatario: correo.destinatario,
          importeCalculadoCentavos: importeCalculado,
          estado,
        },
      });
      persistido = true;
    } catch (err) {
      this.logger.warn(`No se persistió la línea (¿BD?): ${(err as Error).message}`);
    }

    return this.resultado(campos, patronId, persistido, estado, importeCalculado);
  }

  private resultado(
    campos: CamposLineaCaptura | null,
    patronId: string | null,
    persistido: boolean,
    estado: ResultadoIngesta['estado'],
    importeCalculadoCentavos: number | null,
  ): ResultadoIngesta {
    return {
      lineaCaptura: campos?.lineaCaptura ?? null,
      importeCentavos: campos?.importeCentavos ?? null,
      vigencia: campos?.vigencia ?? null,
      periodo: campos?.periodo ?? null,
      completo: campos?.completo ?? false,
      patronId,
      persistido,
      estado,
      importeCalculadoCentavos,
    };
  }
}
