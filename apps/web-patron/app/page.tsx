'use client';

import { useEffect, useState } from 'react';
import { getToken } from '../components/auth';
import { Login } from '../components/Login';
import { Dashboard } from '../components/Dashboard';

export default function Home() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);

  useEffect(() => {
    setAutenticado(Boolean(getToken()));
  }, []);

  return (
    <main className="shell">
      {autenticado === null ? null : autenticado ? (
        <Dashboard onLogout={() => setAutenticado(false)} />
      ) : (
        <Login onLogin={() => setAutenticado(true)} />
      )}
    </main>
  );
}
