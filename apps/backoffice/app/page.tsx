import { Logo } from '../components/Logo';

const API = process.env.API_URL ?? 'http://localhost:3000';
export const dynamic = 'force-dynamic'; // datos vivos en cada request

interface Resumen { patrones: number; trabajadores: number; relaciones: number; lineasCaptura: number; }
interface Trabajador { id: string; nombre: string; curp: string | null; nss: string | null; clabe: string | null; }
interface Relacion { id: string; salarioDiario: number; modalidad: string; puesto: string | null; activa: boolean; trabajador: Trabajador; }
interface Patron {
  id: string; nombre: string; email: string; estadoOnboarding: string;
  stripeCustomerId: string | null; createdAt: string; relaciones: Relacion[];
}
interface Linea {
  id: string; periodo: string | null; lineaCaptura: string | null; importeCentavos: number | null;
  importeCalculadoCentavos: number | null; vigencia: string | null; estado: string; destinatario: string | null;
}

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const pesos = (c: number | null) => (c == null ? '—' : mxn.format(c / 100));

async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function ChipEstado({ estado }: { estado: string }) {
  const cls =
    estado === 'ACTIVO' || estado === 'RECIBIDA' || estado === 'PAGADA' || estado === 'METODO_PAGO_OK'
      ? 'ok'
      : estado === 'DISCREPANCIA' || estado === 'VENCIDA'
        ? 'bad'
        : estado === 'REQUIERE_REVISION'
          ? 'warn'
          : 'mut';
  return <span className={`chip ${cls}`}>{estado.replaceAll('_', ' ')}</span>;
}

export default async function Dashboard() {
  const [resumen, patrones, lineas] = await Promise.all([
    getJSON<Resumen>('/v1/admin/resumen'),
    getJSON<Patron[]>('/v1/admin/patrones'),
    getJSON<Linea[]>('/v1/admin/lineas-captura'),
  ]);

  return (
    <main className="wrap">
      <div className="top">
        <Logo wordmark="#F2EEF0" />
        <span className="tag">Back office · operación</span>
      </div>

      {!resumen && (
        <div className="panel">
          <p className="empty">No se pudo conectar con el API ({API}). ¿Está corriendo?</p>
        </div>
      )}

      {resumen && (
        <div className="stats">
          <div className="stat"><div className="k">Patrones</div><div className="v"><em>{resumen.patrones}</em></div></div>
          <div className="stat"><div className="k">Trabajadoras</div><div className="v"><em>{resumen.trabajadores}</em></div></div>
          <div className="stat"><div className="k">Relaciones activas</div><div className="v"><em>{resumen.relaciones}</em></div></div>
          <div className="stat"><div className="k">Líneas de captura</div><div className="v"><em>{resumen.lineasCaptura}</em></div></div>
        </div>
      )}

      <div className="panel">
        <h2>Patrones y sus trabajadoras</h2>
        <p className="sub">Quién está registrado, con quién y en qué estado del onboarding va.</p>
        <div className="overflow">
          <table className="tbl">
            <thead>
              <tr>
                <th>Patrón</th><th>Correo</th><th>Onboarding</th><th>Stripe</th>
                <th>Trabajadora</th><th>Puesto</th><th className="num">Salario/día</th><th>Modalidad</th>
              </tr>
            </thead>
            <tbody>
              {(patrones ?? []).flatMap((p) =>
                p.relaciones.length === 0
                  ? [
                      <tr key={p.id}>
                        <td>{p.nombre}</td><td>{p.email}</td>
                        <td><ChipEstado estado={p.estadoOnboarding} /></td>
                        <td>{p.stripeCustomerId ? <span className="chip ok">TARJETA</span> : <span className="chip mut">SIN TARJETA</span>}</td>
                        <td colSpan={4} className="empty">Sin trabajadoras registradas</td>
                      </tr>,
                    ]
                  : p.relaciones.map((r, i) => (
                      <tr key={r.id}>
                        <td>{i === 0 ? p.nombre : ''}</td>
                        <td>{i === 0 ? p.email : ''}</td>
                        <td>{i === 0 ? <ChipEstado estado={p.estadoOnboarding} /> : ''}</td>
                        <td>{i === 0 ? (p.stripeCustomerId ? <span className="chip ok">TARJETA</span> : <span className="chip mut">SIN TARJETA</span>) : ''}</td>
                        <td>{r.trabajador.nombre}</td>
                        <td>{r.puesto ?? '—'}</td>
                        <td className="num">{pesos(r.salarioDiario)}</td>
                        <td>{r.modalidad === 'POR_DIA' ? 'Por día' : 'Mes completo'}</td>
                      </tr>
                    )),
              )}
              {patrones?.length === 0 && (
                <tr><td colSpan={8} className="empty">Aún no hay patrones registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>Líneas de captura (ingesta de correo)</h2>
        <p className="sub">Lo recibido del IMSS, su contraste vs el cálculo propio y su estado.</p>
        <div className="overflow">
          <table className="tbl">
            <thead>
              <tr>
                <th>Periodo</th><th>Línea de captura</th><th className="num">Importe IMSS</th>
                <th className="num">Importe calculado</th><th>Vigencia</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(lineas ?? []).map((l) => (
                <tr key={l.id}>
                  <td>{l.periodo ?? '—'}</td>
                  <td>{l.lineaCaptura ?? '—'}</td>
                  <td className="num">{pesos(l.importeCentavos)}</td>
                  <td className="num">{pesos(l.importeCalculadoCentavos)}</td>
                  <td>{l.vigencia ?? '—'}</td>
                  <td><ChipEstado estado={l.estado} /></td>
                </tr>
              ))}
              {(lineas ?? []).length === 0 && (
                <tr><td colSpan={6} className="empty">Sin líneas de captura aún — llegarán con la ingesta de correo mensual.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
