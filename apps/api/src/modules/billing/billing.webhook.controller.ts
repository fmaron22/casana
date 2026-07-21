// =============================================================================
// Casana · Webhook de Stripe (idempotente).
//
// El estado real de los pagos se actualiza AQUÍ, no en la respuesta síncrona.
// - Verifica la firma (`construirEvento`).
// - Deduplica por `event.id` (idempotencia) antes de procesar.
// - Despacha a los handlers de dominio.
//
// Requiere el body CRUDO (raw) para verificar la firma. En `main.ts` se
// configura: app.use('/webhooks/stripe', express.raw({ type: 'application/json' })).
// =============================================================================
import { Controller, Post, Req, Headers, HttpCode, BadRequestException, Logger } from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';

/**
 * Almacén de eventos ya procesados (idempotencia). Implementar con Postgres:
 * INSERT ... ON CONFLICT DO NOTHING sobre (stripe_event_id).
 */
export abstract class ProcessedEventsStore {
  /** Devuelve true si el evento es nuevo (y lo marca); false si ya se procesó. */
  abstract marcarSiNuevo(eventId: string): Promise<boolean>;
}

@Controller('webhooks/stripe')
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name);

  constructor(
    private readonly stripe: StripeService,
    private readonly procesados: ProcessedEventsStore,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(@Req() req: Request, @Headers('stripe-signature') signature: string): Promise<{ received: true }> {
    let event: Stripe.Event;
    try {
      // req.body debe ser el Buffer crudo (ver nota de main.ts).
      event = this.stripe.construirEvento(req.body as Buffer, signature);
    } catch (err) {
      throw new BadRequestException(`Firma de webhook inválida: ${(err as Error).message}`);
    }

    // Idempotencia: si ya se procesó este event.id, salir sin repetir efectos.
    const esNuevo = await this.procesados.marcarSiNuevo(event.id);
    if (!esNuevo) {
      this.logger.debug(`Evento ${event.id} ya procesado; se ignora`);
      return { received: true };
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.onDispersionCobrada(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.onDispersionFallida(event.data.object as Stripe.PaymentIntent);
        break;
      case 'invoice.paid':
        await this.onCuotaPagada(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.onCuotaFallida(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        this.logger.log(`Suscripción ${event.type}: ${(event.data.object as Stripe.Subscription).id}`);
        break;
      default:
        this.logger.debug(`Evento no manejado: ${event.type}`);
    }
    return { received: true };
  }

  // --- Handlers de dominio (TODO: cablear a treasury/reconciliation) ---------

  /** Pago de dispersión OK → disparar dispersión por STP (salario + obligaciones). */
  private async onDispersionCobrada(pi: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Dispersión cobrada · dispersionId=${pi.metadata.casanaDispersionId} · ${pi.amount} ${pi.currency}`);
    // TODO: emitir evento Pub/Sub "dispersion.fondeada" → treasury (STP) reparte
    //       salario al trabajador y paga obligaciones (línea de captura IMSS).
  }

  private async onDispersionFallida(pi: Stripe.PaymentIntent): Promise<void> {
    this.logger.warn(`Dispersión FALLIDA · dispersionId=${pi.metadata.casanaDispersionId}`);
    // TODO: notificar al patrón (tarjeta rechazada) y marcar en reconciliation.
  }

  private async onCuotaPagada(inv: Stripe.Invoice): Promise<void> {
    this.logger.log(`Cuota mensual pagada · customer=${inv.customer}`);
    // TODO: registrar ingreso de suscripción para conciliación.
  }

  private async onCuotaFallida(inv: Stripe.Invoice): Promise<void> {
    this.logger.warn(`Cuota mensual FALLIDA · customer=${inv.customer}`);
    // TODO: dunning ya lo maneja Stripe; notificar y, si aplica, suspender servicio.
  }
}
