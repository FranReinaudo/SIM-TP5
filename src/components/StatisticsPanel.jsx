import { num } from '../utils/format.js';

// Muestra las 8 estadisticas pedidas + datos de apoyo.
export default function StatisticsPanel({ stats }) {
  if (!stats) return null;
  const principales = [
    { n: 1, label: '% Ocupación operario QA (quita alfombras)', val: num(stats.ocupacionQA) + ' %' },
    { n: 2, label: '% Ocupación área de aspirado (AA)', val: num(stats.ocupacionAA) + ' %' },
    { n: 3, label: '% Ocupación lugares de lavado/secado (2 lugares)', val: num(stats.ocupacionLugares) + ' %' },
    { n: 4, label: '% Ocupación secadora', val: num(stats.ocupacionSecadora) + ' %' },
    { n: 5, label: '% Ocupación operario PA (pone alfombras)', val: num(stats.ocupacionPA) + ' %' },
    { n: 6, label: 'Tiempo medio de permanencia del auto en el sistema', val: num(stats.permanenciaMedia) + ' min' },
    { n: 7, label: 'Tiempo medio de espera en colas (por auto)', val: num(stats.esperaMediaColas) + ' min' },
    { n: 8, label: 'Cantidad máxima de autos en cola (ingreso QA)', val: stats.maxColaQA },
  ];
  return (
    <section className="panel">
      <h2>Estadísticas (8)</h2>
      <div className="stats-grid">
        {principales.map((s) => (
          <div className="stat-card" key={s.n}>
            <div className="stat-num">#{s.n}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-val">{s.val}</div>
          </div>
        ))}
      </div>
      <h3>Datos de apoyo</h3>
      <ul className="apoyo">
        <li>Autos ingresados: <b>{stats.autosIngresados}</b></li>
        <li>Autos que salieron del sistema: <b>{stats.autosSalidos}</b></li>
        <li>Autos aún en el sistema al cortar: <b>{stats.autosEnSistema}</b></li>
        <li>Máx. cola aspirado: <b>{stats.maxColaAspirado}</b></li>
        <li>Máx. cola lavado: <b>{stats.maxColaLavado}</b></li>
        <li>Máx. cola PA: <b>{stats.maxColaPA}</b></li>
      </ul>
    </section>
  );
}
