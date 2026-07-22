import { Body, Controller, NotFoundException, Param, Post } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { PrismaService } from '../../persistence/prisma.service';
import { StripeService } from './stripe.service';

class MetodoPagoDto {
  @IsString()
  @MinLength(1)
  paymentMethodId!: string;
}

/**
 * Configuración de pago del patrón (Stripe Elements):
 *  1. POST /v1/patrones/:id/setup-intent → clientSecret para Elements.
 *  2. El navegador confirma el SetupIntent con Stripe (el PAN nunca nos toca).
 *  3. POST /v1/patrones/:id/metodo-pago → fija la tarjeta como default.
 */
@Controller('patrones/:id')
export class SetupPagoController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  @Post('setup-intent')
  async setupIntent(@Param('id') id: string): Promise<{ clientSecret: string | null }> {
    const patron = await this.prisma.patron.findUnique({ where: { id } });
    if (!patron) throw new NotFoundException(`Patrón ${id} no encontrado`);

    const customerId = await this.stripe.ensureCustomer({
      id: patron.id,
      email: patron.email,
      nombre: patron.nombre,
      stripeCustomerId: patron.stripeCustomerId,
    });
    if (!patron.stripeCustomerId) {
      await this.prisma.patron.update({
        where: { id },
        data: { stripeCustomerId: customerId },
      });
    }

    const si = await this.stripe.crearSetupIntent(customerId);
    return { clientSecret: si.client_secret };
  }

  @Post('metodo-pago')
  async metodoPago(
    @Param('id') id: string,
    @Body() dto: MetodoPagoDto,
  ): Promise<{ ok: true }> {
    const patron = await this.prisma.patron.findUnique({ where: { id } });
    if (!patron?.stripeCustomerId) {
      throw new NotFoundException(`Patrón ${id} sin customer de Stripe`);
    }
    await this.stripe.attachDefaultPaymentMethod(patron.stripeCustomerId, dto.paymentMethodId);
    await this.prisma.patron.update({
      where: { id },
      data: { estadoOnboarding: 'METODO_PAGO_OK' },
    });
    return { ok: true };
  }
}
