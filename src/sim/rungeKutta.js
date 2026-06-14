// ============================================================================
//  Runge-Kutta de 4to orden (RK4) para el SECADO de la carroceria
// ----------------------------------------------------------------------------
//  Ecuaciones de la tasa de perdida de humedad (dH/dt):
//
//    CON secadora (rapida):   dH/dt = -5 * t^2 + 2 * H - 200
//    SIN secadora (sola):     dH/dt = -k * H
//
//  donde:
//    t = minutos transcurridos desde que la carroceria EMPEZO a secarse
//        (reloj local del secado, arranca en 0).
//    H = humedad actual (%). Arranca en 100% y la carroceria esta "seca"
//        cuando H <= UMBRAL_SECO (se muestra como 0,0%).
//    k = 0,25 (pick-up) / 0,5 (mediano) / 0,75 (pequeno).
//
//  Unidad de integracion (paso h) = 1 minuto, como indica el enunciado.
// ============================================================================

export const UMBRAL_SECO = 0.05; // H por debajo de esto -> se considera 0,0% (seca)
export const PASO_H = 1; // unidad de integracion = 1 minuto

// f con secadora
export const fCon = (t, H) => -5 * t * t + 2 * H - 200;
// f sin secadora (depende de k)
export const fSin = (k) => (t, H) => -k * H;

// Un paso de RK4. Devuelve las 4 pendientes y el H del siguiente minuto.
export function pasoRK4(f, t, H, h) {
  const k1 = f(t, H);
  const k2 = f(t + h / 2, H + (h / 2) * k1);
  const k3 = f(t + h / 2, H + (h / 2) * k2);
  const k4 = f(t + h, H + h * k3);
  const Hnext = H + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
  return { k1, k2, k3, k4, Hnext };
}

// Integra el secado minuto a minuto HASTA que la carroceria queda seca.
//  Devuelve la tabla de pasos (para mostrarla) y la cantidad de minutos.
export function resolverSecado({ Hinicial, tInicial, modo, k, h = PASO_H, maxPasos = 300 }) {
  const f = modo === 'con' ? fCon : fSin(k);
  let t = tInicial;
  let H = Hinicial;
  const pasos = [];
  let count = 0;
  while (H > UMBRAL_SECO && count < maxPasos) {
    const p = pasoRK4(f, t, H, h);
    pasos.push({ fase: modo, t, H, k1: p.k1, k2: p.k2, k3: p.k3, k4: p.k4, Hnext: p.Hnext });
    H = p.Hnext;
    t += h;
    count++;
  }
  return { pasos, minutos: count, Hfinal: H };
}

// Integra el secado un numero FIJO de minutos (no hasta secarse).
//  Se usa cuando una carroceria que se secaba sola consigue la secadora:
//  primero reconstruimos su humedad actual avanzando los minutos ya
//  transcurridos en modo "sin", y luego continuamos en modo "con".
export function avanzarSecado({ Hinicial, tInicial, modo, k, nPasos, h = PASO_H }) {
  const f = modo === 'con' ? fCon : fSin(k);
  let t = tInicial;
  let H = Hinicial;
  const pasos = [];
  for (let s = 0; s < nPasos; s++) {
    const p = pasoRK4(f, t, H, h);
    pasos.push({ fase: modo, t, H, k1: p.k1, k2: p.k2, k3: p.k3, k4: p.k4, Hnext: p.Hnext });
    H = p.Hnext;
    t += h;
  }
  return { pasos, H, t };
}
