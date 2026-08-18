'use client';

import { useCallback, useEffect, useState } from 'react';
import { Logo } from './Logo';
import { CardStep } from './CardStep';
import { AgregarTrabajadora } from './AgregarTrabajadora';
import { logout } from './auth';
import { api, pesos, type LineaCaptura, type TrabajadoraConCuota } from './api';

interface Perfil { id: string; nombre: string; email: string; tieneTarjeta: boolean }

const chipEstado = (e: string) =>
  e === 'RECIBIDA' || e === 'PAGADA' ? 'ok' : e === 'DISCREPANCIA' || e === 'VENCIDA' ? 'bad' : 'warn';

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [trabajadoras, setTrabajadoras] = useState<TrabajadoraConCuota[]>([]);
  const [lineas, setLineas] = useState<LineaCaptura[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [config, setConfig] = useState(false); // configurando tarjeta

  const cargar = useCallback(async () => {
    try {
      const [p, t, l] = await Promise.all([api.miPerfil(), api.misTrabajadoras(), api.misLineasCaptura()]);
      setPerfil(p);
      setTrabajadoras(t);
      setLineas(l);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function salir() {
    logout();
    onLogout();
  }

  if (error) {
    return (
      <div className="card">
        <p className="err">No se pudo cargar tu cuenta: {error}</p>
        <button className="btn btn-sec" onClick={salir}>
          Salir
        </button>
      </div>
    );
  }
  if (!perfil) return <div className="card center">Cargando tu cuenta…</div>;

  if (config) {
    return <CardStep patronId={perfil.id} onDone={() => { setConfig(false); void cargar(); }} />;
  }
  if (agregando) {
    return <AgregarTrabajadora onDone={() => { setAgregando(false); void cargar(); }} onCancel={() => setAgregando(false)} />;
  }

  return (
    <>
      <div className="dash-top">
        <Logo />
        <button className="salir" onClick={salir}>
          Salir
        </button>
      </div>

      <div className="card">
        <h1>Hola, {perfil.nombre.split(' ')[0]}</h1>
        <p className="sub">{perfil.email}</p>

        {!perfil.tieneTarjeta && (
          <div className="notice" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span>Aún no registras una tarjeta para los pagos automáticos.</span>
            <button className="btn" style={{ width: 'auto', marginTop: 0 }} onClick={() => setConfig(true)}>
              Configurar tarjeta
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="dash-head">
          <h1 style={{ fontSize: '1.15rem' }}>Tus trabajadoras</h1>
          <button className="btn" style={{ width: 'auto', marginTop: 0 }} onClick={() => setAgregando(true)}>
            + Agregar
          </button>
        </div>
        {trabajadoras.length === 0 && <p className="sub">Aún no has registrado a nadie. Agrega a tu primera trabajadora.</p>}
        {trabajadoras.map((t) => (
          <div className="work" key={t.relacionId}>
            <div>
              <div className="work-name">{t.trabajador.nombre}</div>
              <div className="work-sub">
                {t.puesto ?? 'Trabajadora del hogar'} · {pesos(t.salarioDiario)}/día ·{' '}
                {t.modalidad === 'POR_DIA' ? 'por día' : 'mes completo'}
              </div>
            </div>
            <div className="work-cuota">
              {t.preview ? pesos(t.preview.obligacionesCentavos) : '—'}
              <span>cuota/mes</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h1 style={{ fontSize: '1.15rem' }}>Líneas de captura</h1>
        <p className="sub">Lo que llega del IMSS cada mes y sus comprobantes.</p>
        {lineas.length === 0 && <p className="sub">Aún no hay líneas de captura. Llegarán cuando el IMSS emita el primer recibo.</p>}
        {lineas.map((l) => (
          <div className="work" key={l.id}>
            <div>
              <div className="work-name">Periodo {l.periodo ?? '—'}</div>
              <div className="work-sub">{l.lineaCaptura ?? 'Sin línea'} · vence {l.vigencia ?? '—'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="work-name">{l.importeCentavos != null ? pesos(l.importeCentavos) : '—'}</div>
              <span className={`chip ${chipEstado(l.estado)}`}>{l.estado.replaceAll('_', ' ')}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
