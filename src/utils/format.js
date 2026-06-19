// Utilidades de formato para mostrar numeros de forma legible.

// Numero con 'dec' decimales. Infinity -> "—".
export function num(v, dec = 2) {
  if (v === Infinity || v === undefined || v === null) return '—';
  if (typeof v !== 'number' || Number.isNaN(v)) return '—';
  return v.toFixed(dec);
}

// Numero aleatorio truncado a 2 decimales.
export function rndFmt(v) {
  if (v === undefined || v === null) return '—';
  return v.toFixed(2);
}
