import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PersistenceModule } from './persistence/persistence.module';
import { IdentityModule } from './modules/identity/identity.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { BillingModule } from './modules/billing/billing.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PersistenceModule,
    IdentityModule,
    OnboardingModule,
    BillingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
