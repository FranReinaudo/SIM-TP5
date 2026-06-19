// ============================================================================
//  Generacion de numeros y variables aleatorias
// ----------------------------------------------------------------------------
//  Cada funcion devuelve TANTO el numero aleatorio crudo (rnd, entre 0 y 1)
//  COMO el valor de la variable calculada. Esto es porque el enunciado pide:
//  "Para cada variable aleatoria de la simulacion se debe mostrar el numero
//   aleatorio que se uso para determinar su valor."
// ============================================================================

// Trunca un numero de [0,1) a DOS decimales (no redondea): 0,9797 -> 0,97.
//  El mismo numero truncado es el que se usa para calcular el evento y el que
//  se muestra en el vector de estado.
function truncar2(x) {
  return Math.floor(x * 100) / 100;
}

// Crea un generador de numeros pseudoaleatorios. Cada numero se entrega ya
// TRUNCADO a dos decimales.
//  - Si se pasa una semilla, usa mulberry32 (resultados REPRODUCIBLES).
//  - Si no, usa Math.random (resultados distintos en cada corrida).
export function crearRng(semilla) {
  if (semilla === undefined || semilla === null || semilla === '') {
    return () => truncar2(Math.random());
  }
  let s = (Number(semilla) >>> 0) || 1;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return truncar2(((t ^ (t >>> 14)) >>> 0) / 4294967296);
  };
}

// Distribucion Exponencial Negativa.
//  Formula:  T = -media * ln(1 - rnd)
export function exponencial(rng, media) {
  const rnd = rng();
  const valor = -media * Math.log(1 - rnd);
  return { rnd, valor };
}

// Distribucion Uniforme U(a, b).
//  Formula:  T = a + rnd * (b - a)
export function uniforme(rng, a, b) {
  const rnd = rng();
  const valor = a + rnd * (b - a);
  return { rnd, valor };
}

// Determina el tipo de auto a partir de un unico numero aleatorio.
//  Orden acumulado:  [0, pPequeno) -> Pequeno
//                    [pPequeno, pPequeno+pMediano) -> Mediano
//                    el resto -> Pick-up
//  Cada tipo trae asociado su coeficiente k usado en el secado.
export function elegirTipo(rng, prob, kCoef) {
  const rnd = rng();
  if (rnd < prob.pPequeno) {
    return { rnd, tipo: 'Pequeño', k: kCoef.kPequeno };
  }
  if (rnd < prob.pPequeno + prob.pMediano) {
    return { rnd, tipo: 'Mediano', k: kCoef.kMediano };
  }
  return { rnd, tipo: 'Pick-up', k: kCoef.kPickup };
}
