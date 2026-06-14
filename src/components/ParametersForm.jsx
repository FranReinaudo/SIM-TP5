// Formulario con TODOS los parametros del enunciado (todos modificables).
export default function ParametersForm({ params, setParams, onSimular }) {
  // helper para actualizar un campo numerico
  const set = (key) => (e) => {
    const v = e.target.value;
    setParams((p) => ({ ...p, [key]: v === '' ? '' : Number(v) }));
  };
  const setSemilla = (e) => setParams((p) => ({ ...p, semilla: e.target.value }));

  const sumaProb = Number(params.pPequeno) + Number(params.pMediano) + Number(params.pPickup);
  const probOk = Math.abs(sumaProb - 1) < 1e-9;

  const Campo = ({ label, k, step = '1', min }) => (
    <label className="campo">
      <span>{label}</span>
      <input type="number" step={step} min={min} value={params[k]} onChange={set(k)} />
    </label>
  );

  return (
    <section className="panel">
      <h2>Parámetros</h2>

      <fieldset>
        <legend>Llegadas</legend>
        <Campo label="Media entre llegadas (min) — Exp. Neg." k="mediaLlegada" step="0.1" min="0.1" />
      </fieldset>

      <fieldset>
        <legend>Corte de la simulación</legend>
        <Campo label="Tiempo X (min)" k="tiempoX" step="1" min="0" />
        <Campo label="Máx. iteraciones (≤ 100000)" k="maxIteraciones" step="1" min="1" />
      </fieldset>

      <fieldset>
        <legend>Visualización del vector de estado</legend>
        <Campo label="Mostrar desde la fila j" k="desdeFila" step="1" min="1" />
        <Campo label="Cantidad de filas i" k="cantidadFilas" step="1" min="1" />
      </fieldset>

      <fieldset>
        <legend>Tiempos de proceso</legend>
        <Campo label="Quitar alfombras QA (min, fijo)" k="qaTiempo" step="0.1" min="0" />
        <Campo label="Aspirado AA — mín U(a;b)" k="aspMin" step="0.1" min="0" />
        <Campo label="Aspirado AA — máx U(a;b)" k="aspMax" step="0.1" min="0" />
        <Campo label="Lavado L — mín U(a;b)" k="lavMin" step="0.1" min="0" />
        <Campo label="Lavado L — máx U(a;b)" k="lavMax" step="0.1" min="0" />
        <Campo label="Poner alfombras PA (min, fijo)" k="paTiempo" step="0.1" min="0" />
      </fieldset>

      <fieldset>
        <legend>Tipos de auto (probabilidad)</legend>
        <Campo label="P(Pequeño)" k="pPequeno" step="0.01" min="0" />
        <Campo label="P(Mediano)" k="pMediano" step="0.01" min="0" />
        <Campo label="P(Pick-up)" k="pPickup" step="0.01" min="0" />
        {!probOk && <p className="warn">⚠ Las probabilidades suman {sumaProb.toFixed(2)} (deberían sumar 1).</p>}
      </fieldset>

      <fieldset>
        <legend>Secado (coeficiente k por tipo)</legend>
        <Campo label="Humedad inicial (%)" k="humedadInicial" step="1" min="0" />
        <Campo label="k Pequeño" k="kPequeno" step="0.01" min="0" />
        <Campo label="k Mediano" k="kMediano" step="0.01" min="0" />
        <Campo label="k Pick-up" k="kPickup" step="0.01" min="0" />
      </fieldset>

      <fieldset>
        <legend>Reproducibilidad</legend>
        <label className="campo">
          <span>Semilla (vacío = aleatorio real)</span>
          <input type="text" value={params.semilla} onChange={setSemilla} />
        </label>
      </fieldset>

      <button className="btn-simular" onClick={onSimular}>
        ▶ Simular
      </button>
    </section>
  );
}
