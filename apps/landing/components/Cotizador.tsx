'use client';

import { useCallback, useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface Preview {
  dias: number;
  obligacionesCentavos: number;
  salarioPeriodoCentavos: number;
  cargo: { comision: { total: number }; totalACobrar: number };
}

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const pesos = (centavos: number) => mxn.format(centavos / 100);

export function Cotizador() {
  const [salario, setSalario] = useState(400);
  const [data, setData] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cotizar = useCallback(async (salarioDiario: number) => {
    try {
      setError(null);
      const res = await fetch(
        `${API}/v1/cotizador?salarioDiario=${Math.round(salarioDiario * 100)}&modalidad=mesCompleto`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as Preview);
    } catch {
      setData(null);
      setError('El cotizador no está disponible en este momento. Intenta más tarde.');
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (salario > 0) void cotizar(salario);
    }, 350);
    return () => clearTimeout(t);
  }, [salario, cotizar]);

  return (
    <div className="cotizador" id="cotizador">
      <label htmlFor="salario">¿Cuánto pagas por día de trabajo?</label>
      <div className="money">
        <span>$</span>
        <input
          id="salario"
          type="number"
          min={1}
          step={10}
          value={salario}
          onChange={(e) => setSalario(Number(e.target.value))}
        />
        <span>MXN / día</span>
      </div>

      {data && (
        <div className="res">
          <div className="k">Cuotas IMSS e INFONAVIT estimadas</div>
          <div className="v">{pesos(data.obligacionesCentavos)} / mes</div>
          <div className="rows">
            <div>
              <span>Salario mensual ({data.dias} días)</span>
              <span>{pesos(data.salarioPeriodoCentavos)}</span>
            </div>
            <div>
              <span>Servicio Casana (por transferencia)</span>
              <span>{pesos(data.cargo.comision.total)}</span>
            </div>
            <div>
              <span>Total mensual aproximado</span>
              <span>{pesos(data.cargo.totalACobrar)}</span>
            </div>
          </div>
        </div>
      )}
      {error && <p className="err">{error}</p>}

      <p className="nota">
        Estimación con parámetros de referencia (UMA 2026). El importe oficial lo emite el IMSS; con
        Casana lo recibes y pagas en automático.
      </p>
    </div>
  );
}
