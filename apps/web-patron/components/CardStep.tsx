'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { api } from './api';

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PK ? loadStripe(PK) : null;

/**
 * Alta de tarjeta con Stripe Elements (SetupIntent). El número de tarjeta va
 * directo de Elements a Stripe: nunca toca nuestros servidores (PCI SAQ-A).
 * Sin NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (dev), permite continuar y configurar
 * el método de pago después.
 */
export function CardStep({ patronId, onDone }: { patronId: string; onDone: () => void }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripePromise) return;
    api
      .setupIntent(patronId)
      .then((r) => setClientSecret(r.clientSecret))
      .catch((e: Error) => setError(e.message));
  }, [patronId]);

  return (
    <div className="card">
      <h1>Tu tarjeta</h1>
      <p className="sub">
        Con ella cargamos cada mes las cuotas del IMSS, el salario y el servicio. Sin efectivo, sin
        filas.
      </p>

      {!stripePromise && (
        <>
          <div className="notice">
            Modo desarrollo: falta <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>. Puedes continuar
            y registrar la tarjeta después.
          </div>
          <button className="btn" onClick={onDone}>
            Continuar sin tarjeta (dev)
          </button>
        </>
      )}

      {stripePromise && !clientSecret && !error && <p className="sub">Preparando formulario seguro…</p>}
      {error && <p className="err">{error}</p>}

      {stripePromise && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret, locale: 'es' }}>
          <FormularioTarjeta patronId={patronId} onDone={onDone} />
        </Elements>
      )}
    </div>
  );
}

function FormularioTarjeta({ patronId, onDone }: { patronId: string; onDone: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setEnviando(true);
    setError(null);

    const result = await stripe.confirmSetup({ elements, redirect: 'if_required' });
    if (result.error) {
      setError(result.error.message ?? 'No se pudo guardar la tarjeta');
      setEnviando(false);
      return;
    }
    try {
      const pm = result.setupIntent?.payment_method;
      if (typeof pm === 'string') await api.metodoPago(patronId, pm);
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <PaymentElement />
      <button className="btn" disabled={!stripe || enviando} style={{ marginTop: 18 }}>
        {enviando ? 'Guardando…' : 'Guardar tarjeta'}
      </button>
      {error && <p className="err">{error}</p>}
    </form>
  );
}
