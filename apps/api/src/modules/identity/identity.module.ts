import { Module } from '@nestjs/common';
import { PatronesService } from './patrones.service';
import { PatronesController } from './patrones.controller';

@Module({
  controllers: [PatronesController],
  providers: [PatronesService],
  exports: [PatronesService],
})
export class IdentityModule {}
