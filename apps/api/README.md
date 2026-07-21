# apps/api — Monolito modular (NestJS)

Backend de Casana. Cada dominio del [concepto §10](../../docs/CONCEPTO.md) es un módulo con
frontera dura (ADR-0001). Los módulos se desprenden a microservicios cuando la escala lo exija.

## Estado

| Módulo | Estado |
|---|---|
| `billing` (Stripe) | **Código listo** — `StripeService` (suscripción por trabajador + PaymentIntent de dispersión) y webhook idempotente. Ver ADR-0002. |
| `identity`, `onboarding`, `imss-gateway`, `treasury`, `reconciliation`, … | Pendientes (roadmap por fases). |

> El **bootstrap completo de NestJS** (Nx, `package.json` con deps `@nestjs/*` + `stripe`, `main.ts`,
> `AppModule`, Prisma, Terraform) es el **ADR-0003 / primera PR de estructura**. El código de
> `src/modules/billing` compila una vez instaladas esas dependencias. La **lógica de montos** ya es
> verificable hoy: vive en `@casana/billing` (`libs/billing`, 8/8 tests).

## Config

Variables en `.env` (ver `.env.example`); en producción, Secret Manager (GCP).

## Nota de integración del webhook

El webhook de Stripe requiere el **body crudo** para verificar la firma. En `main.ts`:

```ts
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
```
