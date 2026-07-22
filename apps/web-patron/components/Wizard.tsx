'use client';

import { useEffect, useRef, useState } from 'react';
import { api, archivoABase64, pesos, type Preview } from './api';
import { CardStep } from './CardStep';

type Paso = 'patron' | 'tarjeta' | 'trabajadora' | 'condiciones' | 'listo';
const ORDEN: Paso[] = ['patron', 'tarjeta', 'trabajadora', 'condiciones', 'listo'];

export function Wizard() {
  const [paso, setPaso] = useState<Paso>('patron');
  const [patronId, setPatronId] = useState<string | null>(null);
  const [trabajadorId, setTrabajadorId] = useState<string | null>(null);
  const [resumen, setResumen] = useState<{ trabajadora: string; salario: number; total: number } | null>(null);

  const idx = ORDEN.indexOf(paso);
  return (
    <>
      <div className="steps" aria-label={`Paso ${idx + 1} de ${ORDEN.length}`}>
        {ORDEN.map((p, i) => (
          <span key={p} className={i <= idx ? 'on' : ''} />
        ))}
      </div>

      {paso === 'patron' && (
        <StepPatron
          onDone={(id) => {
            setPatronId(id);
            setPaso('tarjeta');
          }}
        />
      )}
      {paso === 'tarjeta' && patronId && (
        <CardStep patronId={patronId} onDone={() => setPaso('trabajadora')} />
      )}
      {paso === 'trabajadora' && (
        <StepTrabajadora
          onDone={(id) => {
            setTrabajadorId(id);
            setPaso('condiciones');
          }}
        />
      )}
      {paso === 'condiciones' && patronId && trabajadorId && (
        <StepCondiciones
          patronId={patronId}
          trabajadorId={trabajadorId}
          onDone={(r) => {
            setResumen(r);
            setPaso('listo');
          }}
        />
      )}
      {paso === 'listo' && <StepListo resumen={resumen} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
function EscanearINE({ onDatos }: { onDatos: (d: { nombre?: string; curp?: string }) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<'idle' | 'leyendo' | 'ok' | 'error'>('idle');

  async function onFile(f: File | undefined) {
    if (!f) return;
    setEstado('leyendo');
    try {
      const datos = await api.ocrINE(await archivoABase64(f));
      onDatos(datos);
      setEstado('ok');
    } catch {
      setEstado('error');
    }
  }

  return (
    <label className="scan">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {estado === 'leyendo' && 'Leyendo identificación…'}
      {estado === 'ok' && '✓ Datos extraídos — revísalos abajo'}
      {estado === 'error' && 'No se pudo leer. Intenta otra foto o captura manual.'}
      {estado === 'idle' && (
        <>
          📷 <strong>Toma una foto de la INE</strong> y llenamos los datos por ti (opcional)
        </>
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ */
function StepPatron({ onDone }: { onDone: (patronId: string) => void }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [curp, setCurp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const p = await api.crearPatron({ nombre, email, telefono: telefono || undefined, curp: curp || undefined });
      onDone(p.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h1>Crea tu cuenta</h1>
      <p className="sub">Tus datos como persona empleadora. Toma un minuto.</p>

      <EscanearINE
        onDatos={(d) => {
          if (d.nombre) setNombre(d.nombre);
          if (d.curp) setCurp(d.curp);
        }}
      />

      <div className="field">
        <label htmlFor="p-nombre">Nombre completo</label>
        <input id="p-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="p-email">Correo</label>
          <input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="p-tel">Teléfono (opcional)</label>
          <input id="p-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="p-curp">CURP (opcional)</label>
        <input id="p-curp" value={curp} onChange={(e) => setCurp(e.target.value)} maxLength={18} />
      </div>

      <button className="btn" disabled={enviando}>
        {enviando ? 'Creando…' : 'Continuar'}
      </button>
      {error && <p className="err">{error}</p>}
    </form>
  );
}

/* ------------------------------------------------------------------ */
function StepTrabajadora({ onDone }: { onDone: (trabajadorId: string) => void }) {
  const [nombre, setNombre] = useState('');
  const [curp, setCurp] = useState('');
  const [nss, setNss] = useState('');
  const [clabe, setClabe] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const t = await api.crearTrabajador({
        nombre,
        curp: curp || undefined,
        nss: nss || undefined,
        clabe: clabe || undefined,
      });
      onDone(t.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h1>¿Quién trabaja en tu casa?</h1>
      <p className="sub">
        Sus datos para darla de alta ante el IMSS. Si aún no tiene NSS, te ayudamos a tramitarlo.
      </p>

      <EscanearINE
        onDatos={(d) => {
          if (d.nombre) setNombre(d.nombre);
          if (d.curp) setCurp(d.curp);
        }}
      />

      <div className="field">
        <label htmlFor="t-nombre">Nombre completo</label>
        <input id="t-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="t-curp">CURP</label>
          <input id="t-curp" value={curp} onChange={(e) => setCurp(e.target.value)} maxLength={18} />
        </div>
        <div className="field">
          <label htmlFor="t-nss">NSS (si lo tiene)</label>
          <input id="t-nss" value={nss} onChange={(e) => setNss(e.target.value)} maxLength={11} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="t-clabe">CLABE para depositarle su salario</label>
        <input id="t-clabe" value={clabe} onChange={(e) => setClabe(e.target.value)} maxLength={18} placeholder="18 dígitos" />
      </div>

      <button className="btn" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Continuar'}
      </button>
      {error && <p className="err">{error}</p>}
    </form>
  );
}

/* ------------------------------------------------------------------ */
function StepCondiciones({
  patronId,
  trabajadorId,
  onDone,
}: {
  patronId: string;
  trabajadorId: string;
  onDone: (r: { trabajadora: string; salario: number; total: number }) => void;
}) {
  const [salario, setSalario] = useState(400);
  const [modalidad, setModalidad] = useState<'MES_COMPLETO' | 'POR_DIA'>('MES_COMPLETO');
  const [diasSemana, setDiasSemana] = useState(5);
  const [puesto, setPuesto] = useState('');
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
      await api.crearRelacion({
        patronId,
        trabajadorId,
        salarioDiario: Math.round(salario * 100),
        modalidad,
        diasSemana: modalidad === 'POR_DIA' ? diasSemana : undefined,
        puesto: puesto || undefined,
      });
      onDone({
        trabajadora: puesto || 'Trabajadora del hogar',
        salario,
        total: preview?.cargo.totalACobrar ?? 0,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h1>Condiciones de trabajo</h1>
      <p className="sub">Con esto calculamos sus cuotas del IMSS.</p>

      <div className="row2">
        <div className="field">
          <label htmlFor="c-salario">Salario por día (MXN)</label>
          <input
            id="c-salario"
            type="number"
            min={1}
            value={salario}
            onChange={(e) => setSalario(Number(e.target.value))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="c-mod">Modalidad</label>
          <select id="c-mod" value={modalidad} onChange={(e) => setModalidad(e.target.value as typeof modalidad)}>
            <option value="MES_COMPLETO">Mes completo</option>
            <option value="POR_DIA">Por día</option>
          </select>
        </div>
      </div>
      {modalidad === 'POR_DIA' && (
        <div className="field">
          <label htmlFor="c-dias">Días por semana</label>
          <input
            id="c-dias"
            type="number"
            min={1}
            max={7}
            value={diasSemana}
            onChange={(e) => setDiasSemana(Number(e.target.value))}
          />
        </div>
      )}
      <div className="field">
        <label htmlFor="c-puesto">Puesto (opcional)</label>
        <input id="c-puesto" value={puesto} onChange={(e) => setPuesto(e.target.value)} placeholder="p. ej. Limpieza y cocina" />
      </div>

      {preview && (
        <div className="quote">
          <div className="k">Estimación mensual</div>
          <div className="v">{pesos(preview.cargo.totalACobrar)}</div>
          <div className="rows">
            <div>
              <span>Salario ({preview.dias} días)</span>
              <span>{pesos(preview.salarioPeriodoCentavos)}</span>
            </div>
            <div>
              <span>Cuotas IMSS e INFONAVIT</span>
              <span>{pesos(preview.obligacionesCentavos)}</span>
            </div>
            <div>
              <span>Servicio Casana</span>
              <span>{pesos(preview.cargo.comision.total)}</span>
            </div>
          </div>
        </div>
      )}

      <button className="btn" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Confirmar registro'}
      </button>
      {error && <p className="err">{error}</p>}
    </form>
  );
}

/* ------------------------------------------------------------------ */
function StepListo({ resumen }: { resumen: { trabajadora: string; salario: number; total: number } | null }) {
  return (
    <div className="card center">
      <div className="check">✓</div>
      <h1>¡Registro completo!</h1>
      <p className="sub">
        Nosotros nos encargamos del alta ante el IMSS. Te avisaremos cuando esté lista y cada mes
        verás aquí su línea de captura y comprobantes.
      </p>
      {resumen && (
        <div className="summary" style={{ textAlign: 'left' }}>
          <div>
            <span>Puesto</span>
            <span>{resumen.trabajadora}</span>
          </div>
          <div>
            <span>Salario diario</span>
            <span>${resumen.salario}</span>
          </div>
          {resumen.total > 0 && (
            <div>
              <span>Cargo mensual estimado</span>
              <span>{pesos(resumen.total)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
