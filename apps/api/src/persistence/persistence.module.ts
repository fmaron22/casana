import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global: PrismaService disponible en todos los módulos sin re-importar.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PersistenceModule {}
