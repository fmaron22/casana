'use client';

import { useEffect, useState } from 'react';
import { api, pesos, type Preview } from './api';

/** Alta de una trabajadora desde el dashboard (con cotización en vivo). */
export function AgregarTrabajadora({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [nombre, setNombre] = useState('');
  const [curp, setCurp] = useState('');
  const [nss, setNss] = useState('');
  const [clabe, setClabe] = useState('');
  const [puesto, setPuesto] = useState('');
  const [salario, setSalario] = useState(400);
  const [modalidad, setModalidad] = useState<'MES_COMPLETO' | 'POR_DIA'>('MES_COMPLETO');
  const [diasSemana, setDiasSemana] = useState(5);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (salario <= 0) return;
      api
        .cotizar(
          Math.round(salario * 100),
          modalidad === 'POR_DIA' ? 'porDia' : 'mesCompleto',
          modalidad === 'POR_DIA' ? Math.round(diasSemana * 4.33) : undefined,
        )
        .then(setPreview)
        .catch(() => setPreview(null));
    }, 300);
    return () => clearTimeout(t);
  }, [salario, modalidad, diasSemana]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.agregarTrabajadora({
        nombre,
        curp: curp || undefined,
        nss: nss || undefined,
        clabe: clabe || undefined,
        puesto: puesto || undefined,
        salarioDiario: Math.round(salario * 100),
        modalidad,
        diasSemana: modalidad === 'POR_DIA' ? diasSemana : undefined,
      });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h1>Agregar trabajadora</h1>
      <p className="sub">Sus datos y condiciones para darla de alta ante el IMSS.</p>

      <div className="field">
        <label htmlFor="a-nombre">Nombre completo</label>
        <input id="a-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="a-curp">CURP</label>
          <input id="a-curp" value={curp} onChange={(e) => setCurp(e.target.value)} maxLength={18} />
        </div>
        <div className="field">
          <label htmlFor="a-nss">NSS (si lo tiene)</label>
          <input id="a-nss" value={nss} onChange={(e) => setNss(e.target.value)} maxLength={11} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="a-clabe">CLABE para su salario</label>
        <input id="a-clabe" value={clabe} onChange={(e) => setClabe(e.target.value)} maxLength={18} placeholder="18 dígitos" />
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="a-salario">Salario por día (MXN)</label>
          <input id="a-salario" type="number" min={1} value={salario} onChange={(e) => setSalario(Number(e.target.value))} required />
        </div>
        <div className="field">
          <label htmlFor="a-mod">Modalidad</label>
          <select id="a-mod" value={modalidad} onChange={(e) => setModalidad(e.target.value as typeof modalidad)}>
            <option value="MES_COMPLETO">Mes completo</option>
            <option value="POR_DIA">Por día</option>
          </select>
        </div>
      </div>
      {modalidad === 'POR_DIA' && (
        <div className="field">
          <label htmlFor="a-dias">Días por semana</label>
          <input id="a-dias" type="number" min={1} max={7} value={diasSemana} onChange={(e) => setDiasSemana(Number(e.target.value))} />
        </div>
      )}
      <div className="field">
        <label htmlFor="a-puesto">Puesto (opcional)</label>
        <input id="a-puesto" value={puesto} onChange={(e) => setPuesto(e.target.value)} placeholder="p. ej. Limpieza y cocina" />
      </div>

      {preview && (
        <div className="quote">
          <div className="k">Cuotas IMSS estimadas</div>
          <div className="v">{pesos(preview.obligacionesCentavos)}<span style={{ fontSize: '0.9rem', fontWeight: 600 }}> /mes</span></div>
        </div>
      )}

      <button className="btn" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Registrar trabajadora'}
      </button>
      <button type="button" className="btn btn-sec" onClick={onCancel}>
        Cancelar
      </button>
      {error && <p className="err">{error}</p>}
    </form>
  );
}
