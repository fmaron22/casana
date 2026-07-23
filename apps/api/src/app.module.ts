import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PersistenceModule } from './persistence/persistence.module';
import { IdentityModule } from './modules/identity/identity.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { BillingModule } from './modules/billing/billing.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ImssGatewayModule } from './modules/imss-gateway/imss-gateway.module';
import { EmailIngestModule } from './modules/email-ingest/email-ingest.module';
import { BackofficeModule } from './modules/backoffice/backoffice.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PersistenceModule,
    IdentityModule,
    OnboardingModule,
    BillingModule,
    PaymentsModule,
    ImssGatewayModule,
    EmailIngestModule,
    BackofficeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
