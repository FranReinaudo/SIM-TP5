import { useState } from 'react';
import { simular } from './sim/engine.js';
import ParametersForm from './components/ParametersForm.jsx';
import StatisticsPanel from './components/StatisticsPanel.jsx';
import StateVectorTable from './components/StateVectorTable.jsx';
import RungeKuttaTables from './components/RungeKuttaTables.jsx';
import { num } from './utils/format.js';

// Valores por defecto tomados del enunciado.
const PARAMS_DEFECTO = {
  mediaLlegada: 10,
  tiempoX: 480, // 8 horas de jornada
  maxIteraciones: 100000,
  desdeFila: 1,
  cantidadFilas: 50,
  humedadInicial: 100,
  qaTiempo: 2,
  aspMin: 3,
  aspMax: 5,
  lavMin: 6,
  lavMax: 12,
  paTiempo: 3,
  pPequeno: 0.2,
  pMediano: 0.5,
  pPickup: 0.3,
  kPequeno: 0.75,
  kMediano: 0.5,
  kPickup: 0.25,
  semilla: '12345',
};

export default function App() {
  const [params, setParams] = useState(PARAMS_DEFECTO);
  const [resultado, setResultado] = useState(() => simular(normalizar(PARAMS_DEFECTO)));

  function normalizar(p) {
    // asegura que los campos numericos sean numeros (no strings vacios)
    const n = { ...p };
    Object.keys(n).forEach((k) => {
      if (k !== 'semilla' && (n[k] === '' || n[k] === null)) n[k] = 0;
    });
    n.maxIteraciones = Math.min(Number(n.maxIteraciones) || 1, 100000);
    return n;
  }

  function onSimular() {
    setResultado(simular(normalizar(params)));
  }

  const info = resultado.info;

  return (
    <div className="app">
      <header className="cabecera">
        <h1>TP5 — Simulación del Lavadero</h1>
        <p>
          Ingeniería en Sistemas de Información · Simulación · Grupo 25 — Simulación por vector de estado
          (próximo evento) con secado por Runge-Kutta.
        </p>
      </header>

      <div className="layout">
        <aside className="lateral">
          <ParametersForm params={params} setParams={setParams} onSimular={onSimular} />
        </aside>

        <main className="contenido">
          <section className="panel resumen">
            <h2>Resumen de la corrida</h2>
            <div className="resumen-grid">
              <div>
                Iteraciones simuladas: <b>{info.iteraciones}</b>
              </div>
              <div>
                Reloj final: <b>{num(info.relojFinal)} min</b>
              </div>
              <div>
                Motivo de corte:{' '}
                <b>
                  {info.motivoParada === 'iteraciones'
                    ? 'Se alcanzó el máximo de iteraciones'
                    : 'Se alcanzó el tiempo X'}
                </b>
              </div>
            </div>
          </section>

          <StatisticsPanel stats={resultado.stats} />
          <StateVectorTable filas={resultado.filas} ultimaFila={resultado.ultimaFila} info={info} />
          <RungeKuttaTables tablas={resultado.tablasRK} truncadas={info.tablasTruncadas} />
        </main>
      </div>
    </div>
  );
}
