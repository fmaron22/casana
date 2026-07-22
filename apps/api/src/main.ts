import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS para los frontends (landing/web/apps). En prod, restringir por env.
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? true,
  });

  // El webhook de Stripe necesita el body CRUDO para verificar la firma.
  // Debe registrarse ANTES del parser JSON global.
  app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
  app.use(express.json());

  app.setGlobalPrefix('v1', { exclude: ['health', 'webhooks/stripe', 'webhooks/email-ingest'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  new Logger('Bootstrap').log(`Casana API escuchando en http://localhost:${port}`);
}

void bootstrap();
