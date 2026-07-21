import { Injectable, NotFoundException } from '@nestjs/common';
import type { ModalidadCotizacion } from '@prisma/client';
import type { PreviewDispersion } from '@casana/cotizacion';
import { PrismaService } from '../../persistence/prisma.service';
import { StripeService } from '../billing/stripe.service';
import { cotizacion } from './cotizacion.loader';

function aModalidadImss(m: ModalidadCotizacion): 'mesCompleto' | 'porDia' {
  return m === 'POR_DIA' ? 'porDia' : 'mesCompleto';
}

@Injectable()
export class DispersionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  /** Vista previa de la dispersión de una relación laboral (cuotas + cargo). */
  async preview(relacionId: string): Promise<PreviewDispersion> {
    const rel = await this.prisma.relacionLaboral.findUnique({ where: { id: relacionId } });
    if (!rel) throw new NotFoundException(`Relación ${relacionId} no encontrada`);

    const { construirPreviewDispersion } = await cotizacion();
    return construirPreviewDispersion({
      salarioDiarioCentavos: rel.salarioDiario,
      modalidad: aModalidadImss(rel.modalidad),
      // POR_DIA: aproxima días del mes desde días/semana. TODO: modelar días/mes.
      diasLaborados: rel.modalidad === 'POR_DIA' && rel.diasSemana
        ? Math.round(rel.diasSemana * 4.33)
        : undefined,
    });
  }

  /**
   * Cobra la dispersión a la tarjeta del patrón vía Stripe. Idempotente por
   * (relación, periodo). Al confirmarse el pago (webhook), treasury dispersa.
   */
  async cobrar(relacionId: string, paymentMethodId: string, periodo: string) {
    const rel = await this.prisma.relacionLaboral.findUnique({
      where: { id: relacionId },
      include: { patron: true },
    });
    if (!rel) throw new NotFoundException(`Relación ${relacionId} no encontrada`);

    const preview = await this.preview(relacionId);

    return this.stripe.cobrarDispersion({
      patron: {
        id: rel.patron.id,
        email: rel.patron.email,
        nombre: rel.patron.nombre,
        stripeCustomerId: rel.patron.stripeCustomerId,
      },
      paymentMethodId,
      salario: preview.salarioPeriodoCentavos,
      obligaciones: preview.obligacionesCentavos,
      trabajadorId: rel.trabajadorId,
      periodo,
      dispersionId: `${relacionId}:${periodo}`, // idempotencia por relación/periodo
    });
  }
}
