import { useState } from 'react';
import { num } from '../utils/format.js';

// Muestra las tablas de Runge-Kutta calculadas para el secado de cada
// carroceria. Cada tabla se puede expandir/contraer.
export default function RungeKuttaTables({ tablas, truncadas }) {
  const [abierta, setAbierta] = useState(null);

  if (!tablas || tablas.length === 0) {
    return (
      <section className="panel">
        <h2>Tablas de Runge-Kutta</h2>
        <p className="hint">Todavía no se calcularon secados en esta corrida.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Tablas de Runge-Kutta ({tablas.length})</h2>
      <p className="hint">
        Una tabla por cada secado. Paso h = 1 min. "con" = ecuación con secadora; "sin" = se seca sola.
        {truncadas && ' (se alcanzó el tope de tablas guardadas)'}
      </p>
      <div className="rk-lista">
        {tablas.map((t, idx) => {
          const open = abierta === idx;
          return (
            <div className="rk-item" key={idx}>
              <button className="rk-head" onClick={() => setAbierta(open ? null : idx)}>
                {open ? '▼' : '►'} Auto {t.autoId} ({t.tipo}, k={t.k}) — empezó a secar en t={num(t.relojInicio)} min
                — {t.minutos} min {t.modoInicial === 'con' ? '(con secadora)' : '(empezó solo)'}
                {t.cambioSecadora ? ' → tomó la secadora' : ''}
              </button>
              {open && (
                <div className="tabla-scroll">
                  <table className="rk">
                    <thead>
                      <tr>
                        <th>Fase</th>
                        <th>t (min)</th>
                        <th>H(t)</th>
                        <th>k1</th>
                        <th>k2</th>
                        <th>k3</th>
                        <th>k4</th>
                        <th>H(t+1)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.pasos.map((p, i2) => (
                        <tr key={i2} className={p.fase === 'con' ? 'fase-con' : 'fase-sin'}>
                          <td>{p.fase}</td>
                          <td>{p.t}</td>
                          <td>{num(p.H, 4)}</td>
                          <td>{num(p.k1, 4)}</td>
                          <td>{num(p.k2, 4)}</td>
                          <td>{num(p.k3, 4)}</td>
                          <td>{num(p.k4, 4)}</td>
                          <td>{num(Math.max(0, p.Hnext), 4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
