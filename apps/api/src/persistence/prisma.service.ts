import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Conectado a PostgreSQL');
    } catch (err) {
      // No bloquea el arranque si la BD no está disponible (útil en dev sin
      // Postgres). En producción conviene fallar rápido: relanzar el error.
      this.logger.warn(`Sin conexión a la BD al iniciar: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
