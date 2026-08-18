'use client';

import { useState } from 'react';
import { Logo } from './Logo';
import { firebaseConfigurado, loginApple, loginDev, loginGoogle } from './auth';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function social(fn: () => Promise<void>) {
    setCargando(true);
    setError(null);
    try {
      await fn();
      onLogin();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  function dev(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    loginDev(email);
    onLogin();
  }

  return (
    <div className="card center">
      <div className="brand" style={{ marginBottom: 8 }}>
        <Logo />
      </div>
      <h1>Entra a tu cuenta</h1>
      <p className="sub">Protege a quien cuida tu hogar, sin trámites.</p>

      {firebaseConfigurado ? (
        <>
          <button className="btn btn-oauth" disabled={cargando} onClick={() => void social(loginGoogle)}>
            Continuar con Google
          </button>
          <button className="btn btn-oauth btn-apple" disabled={cargando} onClick={() => void social(loginApple)}>
            Continuar con Apple
          </button>
        </>
      ) : (
        <form onSubmit={dev} style={{ textAlign: 'left', marginTop: 8 }}>
          <div className="notice">
            Modo desarrollo: falta la configuración de Firebase. Entra con tu correo para probar.
          </div>
          <div className="field">
            <label htmlFor="login-email">Correo</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>
          <button className="btn" type="submit">
            Entrar
          </button>
        </form>
      )}

      {error && <p className="err">{error}</p>}
    </div>
  );
}
