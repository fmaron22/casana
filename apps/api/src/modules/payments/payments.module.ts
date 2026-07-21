import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { CotizadorController } from './cotizador.controller';
import { DispersionController } from './dispersion.controller';
import { DispersionService } from './dispersion.service';

@Module({
  imports: [BillingModule], // aporta StripeService
  controllers: [CotizadorController, DispersionController],
  providers: [DispersionService],
})
export class PaymentsModule {}
