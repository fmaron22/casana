// =============================================================================
// Casana · StripeService — integración de cobro (NestJS).
//
// Responsabilidades (ADR-0002):
//   1. Cuota mensual por trabajador  → Subscription con quantity = activos.
//   2. Comisión por transferencia    → PaymentIntent por evento de dispersión.
//
// Stripe SOLO cobra a la tarjeta del patrón. La dispersión (salario/obligaciones)
// sale por STP en el módulo `treasury`. Casana no toca el PAN (PCI SAQ-A).
//
// NOTA: este archivo forma parte del módulo `billing` de `apps/api`. Compila y
// corre una vez que el monorepo NestJS esté andamiado (ADR-0003) con deps
// `stripe`, `@nestjs/common`, `@nestjs/config`. La lógica de montos vive en
// `@casana/billing` (motor puro, ya testeado).
// =============================================================================
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
// `@casana/billing` es ESM; se carga con import() dinámico dentro de los métodos
// async para poder consumirlo desde este app compilado a CommonJS. Los tipos se
// importan con `import type` (se borran en compilación).
import type { calcularCargoDispersion as CalcularCargoDispersion } from '@casana/billing';

export interface Patron {
  id: string; // id de dominio (módulo identity)
  email: string;
  nombre: string;
  stripeCustomerId?: string | null;
}

export interface CargoDispersionInput {
  patron: Patron;
  paymentMethodId: string;
  salario: number; // centavos
  obligaciones: number; // centavos
  // Referencias de dominio para trazabilidad/conciliación:
  trabajadorId: string;
  periodo: string; // p.ej. "2026-07"
  dispersionId: string; // id idempotente del evento de dispersión
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;
  private readonly cuotaPriceId: string;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(this.config.getOrThrow<string>('STRIPE_SECRET_KEY'), {
      // apiVersion se fija en el dashboard de Stripe (y en la config de webhooks).
      appInfo: { name: 'Casana', version: '0.1.0' },
    });
    // Price recurrente mensual "Cuota Casana por trabajador".
    this.cuotaPriceId = this.config.getOrThrow<string>('STRIPE_PRICE_CUOTA_MENSUAL');
  }

  /** Crea (o recupera) el Customer del patrón. Idempotente por id de dominio. */
  async ensureCustomer(patron: Patron): Promise<string> {
    if (patron.stripeCustomerId) return patron.stripeCustomerId;
    const customer = await this.stripe.customers.create(
      {
        email: patron.email,
        name: patron.nombre,
        metadata: { casanaPatronId: patron.id },
      },
      { idempotencyKey: `customer:${patron.id}` },
    );
    this.logger.log(`Stripe Customer creado para patrón ${patron.id}`);
    return customer.id;
  }

  /**
   * Crea un SetupIntent para tokenizar la tarjeta del patrón con Stripe
   * Elements (el PAN nunca toca nuestros servidores — PCI SAQ-A).
   */
  async crearSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    return this.stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });
  }

  /** Guarda la tarjeta como método por defecto (off_session) del patrón. */
  async attachDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  /**
   * Sincroniza la suscripción de cuota mensual con el número de trabajadores
   * activos del patrón (quantity). Crea la suscripción si no existe.
   * IVA: vía Stripe Tax o un Tax Rate fijo (16%) según configuración de Stripe.
   */
  async syncSuscripcion(customerId: string, trabajadoresActivos: number): Promise<Stripe.Subscription> {
    const existentes = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    });
    const activa = existentes.data.find((s) => s.status === 'active' || s.status === 'trialing');

    if (!activa) {
      if (trabajadoresActivos <= 0) {
        throw new Error('No se crea suscripción con 0 trabajadores');
      }
      return this.stripe.subscriptions.create(
        {
          customer: customerId,
          items: [{ price: this.cuotaPriceId, quantity: trabajadoresActivos }],
          off_session: true,
          payment_behavior: 'error_if_incomplete',
          proration_behavior: 'create_prorations',
        },
        { idempotencyKey: `sub:create:${customerId}` },
      );
    }

    // Actualiza la cantidad (alta/baja de trabajadores) con prorrateo.
    const item = activa.items.data[0];
    return this.stripe.subscriptions.update(activa.id, {
      items: [{ id: item.id, quantity: Math.max(trabajadoresActivos, 0) }],
      proration_behavior: 'create_prorations',
    });
  }

  /**
   * Cobra un evento de dispersión: salario + obligaciones + comisión (con IVA
   * solo sobre la comisión). Devuelve el PaymentIntent. La dispersión real por
   * STP se dispara al recibir el webhook `payment_intent.succeeded`.
   */
  async cobrarDispersion(input: CargoDispersionInput): Promise<Stripe.PaymentIntent> {
    const { calcularCargoDispersion } = (await import('@casana/billing')) as {
      calcularCargoDispersion: typeof CalcularCargoDispersion;
    };
    const desglose = calcularCargoDispersion({
      salario: input.salario,
      obligaciones: input.obligaciones,
    });

    const customerId = await this.ensureCustomer(input.patron);

    return this.stripe.paymentIntents.create(
      {
        amount: desglose.totalACobrar,
        currency: desglose.moneda,
        customer: customerId,
        payment_method: input.paymentMethodId,
        off_session: true,
        confirm: true,
        description: `Casana dispersión ${input.periodo} · trabajador ${input.trabajadorId}`,
        metadata: {
          casanaPatronId: input.patron.id,
          casanaTrabajadorId: input.trabajadorId,
          casanaDispersionId: input.dispersionId,
          periodo: input.periodo,
          salario: String(input.salario),
          obligaciones: String(input.obligaciones),
          comisionSubtotal: String(desglose.comision.subtotal),
          comisionIva: String(desglose.comision.iva),
        },
      },
      // Idempotencia por evento de dispersión: no se cobra dos veces.
      { idempotencyKey: `pi:dispersion:${input.dispersionId}` },
    );
  }

  /** Verifica la firma del webhook y devuelve el evento. */
  construirEvento(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'),
    );
  }
}
