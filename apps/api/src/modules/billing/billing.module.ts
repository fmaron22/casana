// Casana · Módulo de facturación (Stripe). Ver ADR-0002.
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { BillingWebhookController } from './billing.webhook.controller';

@Module({
  imports: [ConfigModule],
  controllers: [BillingWebhookController],
  providers: [
    StripeService,
    // ProcessedEventsStore debe proveerse con su implementación de Postgres
    // cuando el módulo `persistence` esté listo:
    //   { provide: ProcessedEventsStore, useClass: PgProcessedEventsStore },
  ],
  exports: [StripeService],
})
export class BillingModule {}
