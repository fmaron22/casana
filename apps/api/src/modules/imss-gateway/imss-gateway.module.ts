import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImssGateway } from './imss-gateway.service';
import { MockImssGateway } from './mock-imss.gateway';
import { PlaywrightImssGateway } from './rpa/playwright-imss.gateway';
import { ImssGatewayController } from './imss-gateway.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ImssGatewayController],
  providers: [
    // RPA real solo si IMSS_RPA_ENABLED=true; de lo contrario, mock (dev).
    {
      provide: ImssGateway,
      inject: [ConfigService],
      useFactory: (config: ConfigService): ImssGateway =>
        config.get<string>('IMSS_RPA_ENABLED') === 'true'
          ? new PlaywrightImssGateway(config)
          : new MockImssGateway(),
    },
  ],
  exports: [ImssGateway],
})
export class ImssGatewayModule {}
