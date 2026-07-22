# apps/api — Monolito modular (NestJS)

Backend de Casana. Cada dominio del [concepto §10](../../docs/CONCEPTO.md) es un módulo con
frontera dura (ADR-0001). Los módulos se desprenden a microservicios cuando la escala lo exija.

## Estado

| Módulo | Estado |
|---|---|
| `persistence` | **Corriendo** — `PrismaService` global, esquema Postgres (schemas `identity` + `onboarding`), migración `0001_init`. |
| `identity` | **Corriendo** — alta y consulta de patrones (`POST/GET /v1/patrones`). |
| `onboarding` | **Corriendo** — trabajadores, relación laboral y **OCR de INE** (`/v1/onboarding/ocr-ine`) con Document AI o mock. |
| `billing` (Stripe) | **Corriendo** — `StripeService` (suscripción por trabajador + PaymentIntent de dispersión), webhook idempotente y **setup de pago** (`POST /v1/patrones/:id/setup-intent` + `/metodo-pago` para Elements). Ver ADR-0002. |
| `payments` | **Corriendo** — `GET /v1/cotizador` (sin estado: enlaza imss-calc + billing) y `/v1/relaciones/:id/dispersion` (preview + cobrar por relación, BD + Stripe). |
| `imss-gateway` | **Corriendo (mock)** — `POST /v1/imss/linea-captura`. Adaptador **RPA (Playwright)** acotado al **alta** (ADR-0005); selectores placeholder a mapear. Ver ADR-0004. |
| `email-ingest` | **Corriendo** — `POST /webhooks/email-ingest`: ingesta del correo mensual del IMSS (alias por patrón → parseo del PDF vía `@casana/imss-parser` → contraste vs imss-calc → `LineaCaptura` en BD). Ver ADR-0005. |
| `treasury` (STP), `reconciliation`, `documents`, … | Pendientes. STP **pausado** por decisión de modelo (concentradora vs cuenta por cliente). |

App verificado arrancando: rutas montadas, `GET /health` → 200, OCR mock funcional,
validación de DTOs (400), webhook con firma inválida → 400, y **cotizador en vivo**
(`GET /v1/cotizador?salarioDiario=40000&modalidad=mesCompleto` → cuotas + cargo total).

## Correr

```bash
# 1) Postgres local — DOS opciones:
npm run db:dev                  # (a) Postgres EMBEBIDO, sin Docker (recomendado en dev)
docker compose up -d            # (b) o con Docker, desde la raíz del repo

# 2) Cliente Prisma + migración
cd apps/api
cp .env.example .env            # ajustar valores
npx prisma generate
npx prisma migrate deploy       # aplica prisma/migrations/*

# 3) Compilar y arrancar
npm run build && npm start      # http://localhost:3000

# Ver el contenido de la BD de desarrollo:
npm run db:check                # desde la raíz
```

## Config

Variables en `.env` (ver `.env.example`); en producción, Secret Manager (GCP).
Si `GCP_DOCUMENTAI_PROCESSOR` no está definido, el OCR usa el **mock** (dev).

## Nota de integración del webhook

El webhook de Stripe requiere el **body crudo** para verificar la firma. En `main.ts`:

```ts
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
```
