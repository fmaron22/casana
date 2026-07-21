# apps/api — Monolito modular (NestJS)

Backend de Casana. Cada dominio del [concepto §10](../../docs/CONCEPTO.md) es un módulo con
frontera dura (ADR-0001). Los módulos se desprenden a microservicios cuando la escala lo exija.

## Estado

| Módulo | Estado |
|---|---|
| `persistence` | **Corriendo** — `PrismaService` global, esquema Postgres (schemas `identity` + `onboarding`), migración `0001_init`. |
| `identity` | **Corriendo** — alta y consulta de patrones (`POST/GET /v1/patrones`). |
| `onboarding` | **Corriendo** — trabajadores, relación laboral y **OCR de INE** (`/v1/onboarding/ocr-ine`) con Document AI o mock. |
| `billing` (Stripe) | **Corriendo** — `StripeService` (suscripción por trabajador + PaymentIntent de dispersión) y webhook idempotente. Ver ADR-0002. |
| `imss-gateway`, `treasury`, `reconciliation`, `documents`, … | Pendientes (roadmap por fases). |

App verificado arrancando: rutas montadas, `GET /v1/health` → 200, OCR mock funcional,
validación de DTOs (400), webhook con firma inválida → 400.

## Correr

```bash
# 1) Postgres local
docker compose up -d           # desde la raíz del repo

# 2) Cliente Prisma + migración
cd apps/api
cp .env.example .env            # ajustar valores
npx prisma generate
npx prisma migrate deploy       # aplica prisma/migrations/0001_init

# 3) Compilar y arrancar
npm run build && npm start      # http://localhost:3000
```

## Config

Variables en `.env` (ver `.env.example`); en producción, Secret Manager (GCP).
Si `GCP_DOCUMENTAI_PROCESSOR` no está definido, el OCR usa el **mock** (dev).

## Nota de integración del webhook

El webhook de Stripe requiere el **body crudo** para verificar la firma. En `main.ts`:

```ts
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
```
