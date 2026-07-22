// Casana · Módulo de facturación (Stripe). Ver ADR-0002.
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { BillingWebhookController, ProcessedEventsStore } from './billing.webhook.controller';
import { SetupPagoController } from './setup-pago.controller';
import { InMemoryProcessedEventsStore } from './in-memory-processed-events.store';

@Module({
  imports: [ConfigModule],
  controllers: [BillingWebhookController, SetupPagoController],
  providers: [
    StripeService,
    // En producción, sustituir por la implementación con Postgres (módulo persistence).
    { provide: ProcessedEventsStore, useClass: InMemoryProcessedEventsStore },
  ],
  exports: [StripeService],
})
export class BillingModule {}
