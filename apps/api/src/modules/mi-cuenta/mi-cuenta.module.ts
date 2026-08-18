import { Module } from '@nestjs/common';
import { MiCuentaService } from './mi-cuenta.service';
import { MiCuentaController } from './mi-cuenta.controller';

@Module({
  controllers: [MiCuentaController],
  providers: [MiCuentaService],
})
export class MiCuentaModule {}
