// Campo numerico definido a NIVEL DE MODULO (no dentro del render).
// Si se define dentro del componente, React lo remonta en cada tecla y el
// input pierde el foco (habria que clickear por cada digito).
function NumberField({ label, value, step = '1', min, onChange }) {
  return (
    <label className="campo">
      <span>{label}</span>
      <input type="number" step={step} min={min} value={value} onChange={onChange} />
    </label>
  );
}

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

  return (
    <section className="panel">
      <h2>Parámetros</h2>

      <fieldset>
        <legend>Llegadas</legend>
        <NumberField label="Media entre llegadas (min) — Exp. Neg." value={params.mediaLlegada} step="0.1" min="0.1" onChange={set('mediaLlegada')} />
      </fieldset>

      <fieldset>
        <legend>Corte de la simulación</legend>
        <NumberField label="Tiempo X (min)" value={params.tiempoX} step="1" min="0" onChange={set('tiempoX')} />
        <NumberField label="Máx. iteraciones (≤ 100000)" value={params.maxIteraciones} step="1" min="1" onChange={set('maxIteraciones')} />
      </fieldset>

      <fieldset>
        <legend>Visualización del vector de estado</legend>
        <NumberField label="Mostrar desde la fila j" value={params.desdeFila} step="1" min="1" onChange={set('desdeFila')} />
        <NumberField label="Cantidad de filas i" value={params.cantidadFilas} step="1" min="1" onChange={set('cantidadFilas')} />
      </fieldset>

      <fieldset>
        <legend>Tiempos de proceso</legend>
        <NumberField label="Quitar alfombras QA (min, fijo)" value={params.qaTiempo} step="0.1" min="0" onChange={set('qaTiempo')} />
        <NumberField label="Aspirado AA — mín U(a;b)" value={params.aspMin} step="0.1" min="0" onChange={set('aspMin')} />
        <NumberField label="Aspirado AA — máx U(a;b)" value={params.aspMax} step="0.1" min="0" onChange={set('aspMax')} />
        <NumberField label="Lavado L — mín U(a;b)" value={params.lavMin} step="0.1" min="0" onChange={set('lavMin')} />
        <NumberField label="Lavado L — máx U(a;b)" value={params.lavMax} step="0.1" min="0" onChange={set('lavMax')} />
        <NumberField label="Poner alfombras PA (min, fijo)" value={params.paTiempo} step="0.1" min="0" onChange={set('paTiempo')} />
      </fieldset>

      <fieldset>
        <legend>Tipos de auto (probabilidad)</legend>
        <NumberField label="P(Pequeño)" value={params.pPequeno} step="0.01" min="0" onChange={set('pPequeno')} />
        <NumberField label="P(Mediano)" value={params.pMediano} step="0.01" min="0" onChange={set('pMediano')} />
        <NumberField label="P(Pick-up)" value={params.pPickup} step="0.01" min="0" onChange={set('pPickup')} />
        {!probOk && <p className="warn">⚠ Las probabilidades suman {sumaProb.toFixed(2)} (deberían sumar 1).</p>}
      </fieldset>

      <fieldset>
        <legend>Secado (coeficiente k por tipo)</legend>
        <NumberField label="Humedad inicial (%)" value={params.humedadInicial} step="1" min="0" onChange={set('humedadInicial')} />
        <NumberField label="k Pequeño" value={params.kPequeno} step="0.01" min="0" onChange={set('kPequeno')} />
        <NumberField label="k Mediano" value={params.kMediano} step="0.01" min="0" onChange={set('kMediano')} />
        <NumberField label="k Pick-up" value={params.kPickup} step="0.01" min="0" onChange={set('kPickup')} />
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
