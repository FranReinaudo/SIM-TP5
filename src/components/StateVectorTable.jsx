import { useState } from 'react';
import { num, rndFmt } from '../utils/format.js';

// Tabla del VECTOR DE ESTADO. Muestra la ventana [j, j+i) y la ultima fila.
// Al hacer clic en una fila, se despliegan los OBJETOS TEMPORALES (autos en
// el sistema en ese instante) con todos sus atributos.
export default function StateVectorTable({ filas, ultimaFila, info }) {
  const [sel, setSel] = useState(null);

  const Lugar = ({ l }) => {
    if (l.estado === 'Libre') return <td className="libre">Libre</td>;
    const txt =
      l.estado === 'Lavando'
        ? `Lavando A${l.auto}`
        : l.estado === 'SecandoCon'
        ? `Secando+sec. A${l.auto} (H=${num(l.H, 1)}%)`
        : `Secando solo A${l.auto} (H=${num(l.H, 1)}%)`;
    return <td className="ocupado">{txt}</td>;
  };

  const Fila = ({ f, onClick, activa }) => {
    // Resalta en rojo la celda del proximo evento que fue tomado como SIGUIENTE.
    const ps = f.proxSel;
    const cls = (type, slot) =>
      ps && ps.type === type && (slot === undefined || ps.slot === slot) ? 'prox-sel' : undefined;
    return (
    <tr className={activa ? 'fila-activa' : ''} onClick={onClick}>
      <td>{f.n}</td>
      <td>{num(f.reloj)}</td>
      <td className="evento">{f.evento}</td>
      {/* === POR EVENTO: cada evento con sus RND, tiempos y proximo evento === */}
      {/* Llegada (exponencial) */}
      <td>{f.rnd.llegada ? rndFmt(f.rnd.llegada.rnd) : ''}</td>
      <td>{f.rnd.llegada ? num(f.rnd.llegada.valor) : ''}</td>
      <td className={cls('LLEGADA')}>{num(f.prox.llegada)}</td>
      <td>{f.rnd.tipo ? rndFmt(f.rnd.tipo.rnd) : ''}</td>
      <td>{f.rnd.tipo ? f.rnd.tipo.tipo : ''}</td>
      {/* Fin Quitar Alfombras (tiempo fijo) */}
      <td className={cls('FIN_QA')}>{num(f.prox.finQA)}</td>
      {/* Fin Aspirado (uniforme) */}
      <td>{f.rnd.aspirado ? rndFmt(f.rnd.aspirado.rnd) : ''}</td>
      <td>{f.rnd.aspirado ? num(f.rnd.aspirado.valor) : ''}</td>
      <td className={cls('FIN_AA')}>{num(f.prox.finAA)}</td>
      {/* Fin Lavado (uniforme, 2 lugares) */}
      <td>{f.rnd.lavado ? rndFmt(f.rnd.lavado.rnd) : ''}</td>
      <td>{f.rnd.lavado ? num(f.rnd.lavado.valor) : ''}</td>
      <td className={cls('FIN_LAVADO', 0)}>{num(f.prox.finLavado[0])}</td>
      <td className={cls('FIN_LAVADO', 1)}>{num(f.prox.finLavado[1])}</td>
      {/* Fin Secado (ecuacion diferencial / Runge-Kutta, sin RND) */}
      <td className={cls('FIN_SECADO', 0)}>{num(f.prox.finSecado[0])}</td>
      <td className={cls('FIN_SECADO', 1)}>{num(f.prox.finSecado[1])}</td>
      {/* Fin Poner Alfombras (tiempo fijo) */}
      <td className={cls('FIN_PA')}>{num(f.prox.finPA)}</td>
      {/* === OBJETOS PERMANENTES: servidores y colas === */}
      <td>{f.estados.QA}</td>
      <td>{f.colas.qa}</td>
      <td>{f.estados.AA}</td>
      <td>{f.colas.aspirado}</td>
      <Lugar l={f.estados.lugares[0]} />
      <Lugar l={f.estados.lugares[1]} />
      <td>{f.colas.lavado}</td>
      <td>{f.estados.secadora}</td>
      <td>{f.estados.PA}</td>
      <td>{f.colas.pa}</td>
      {/* === ESTADISTICAS: acumuladores === */}
      <td>{num(f.acum.busyQA)}</td>
      <td>{num(f.acum.busyAA)}</td>
      <td>{num(f.acum.busyLug)}</td>
      <td>{num(f.acum.busySec)}</td>
      <td>{num(f.acum.busyPA)}</td>
      <td>{num(f.acum.sumaPerm)}</td>
      <td>{f.acum.salidos}</td>
    </tr>
    );
  };

  const Encabezado = () => (
    <thead>
      {/* Fila 1: macro-secciones */}
      <tr className="grupo">
        <th rowSpan={3}>n</th>
        <th rowSpan={3}>Reloj</th>
        <th rowSpan={3}>Evento</th>
        <th colSpan={16}>Por evento — RND, tiempos y próximos eventos</th>
        <th colSpan={10}>Objetos permanentes</th>
        <th colSpan={7}>Estadísticas</th>
      </tr>
      {/* Fila 2: un grupo por evento / por objeto permanente */}
      <tr className="subgrupo">
        <th colSpan={5}>Llegada (exp)</th>
        <th colSpan={1}>Fin QA (2′)</th>
        <th colSpan={3}>Fin Aspirado U(3;5)</th>
        <th colSpan={4}>Fin Lavado U(6;12)</th>
        <th colSpan={2}>Fin Secado (RK)</th>
        <th colSpan={1}>Fin PA (3′)</th>
        <th colSpan={2}>QA</th>
        <th colSpan={2}>AA</th>
        <th colSpan={3}>Lavado</th>
        <th colSpan={1}>Secadora</th>
        <th colSpan={2}>PA</th>
        <th colSpan={7}>Acumuladores</th>
      </tr>
      {/* Fila 3: columnas */}
      <tr className="columnas">
        {/* Llegada */}
        <th>RND</th>
        <th>T.entre lleg.</th>
        <th>Próx. lleg.</th>
        <th>RND tipo</th>
        <th>Tipo</th>
        {/* Fin QA */}
        <th>Próx. fin QA</th>
        {/* Fin Aspirado */}
        <th>RND</th>
        <th>T.asp.</th>
        <th>Próx. fin AA</th>
        {/* Fin Lavado */}
        <th>RND</th>
        <th>T.lav.</th>
        <th>Próx. lav.1</th>
        <th>Próx. lav.2</th>
        {/* Fin Secado */}
        <th>Próx. sec.1</th>
        <th>Próx. sec.2</th>
        {/* Fin PA */}
        <th>Próx. fin PA</th>
        {/* QA */}
        <th>Estado</th>
        <th>Cola</th>
        {/* AA */}
        <th>Estado</th>
        <th>Cola</th>
        {/* Lavado */}
        <th>Lugar 1</th>
        <th>Lugar 2</th>
        <th>Cola</th>
        {/* Secadora */}
        <th>Estado</th>
        {/* PA */}
        <th>Estado</th>
        <th>Cola</th>
        {/* Acumuladores */}
        <th>∑ocup QA</th>
        <th>∑ocup AA</th>
        <th>∑ocup Lug.</th>
        <th>∑ocup Sec.</th>
        <th>∑ocup PA</th>
        <th>∑Perm.</th>
        <th>#Salidos</th>
      </tr>
    </thead>
  );

  return (
    <section className="panel">
      <h2>Vector de Estado</h2>
      <p className="hint">
        Mostrando {filas.length} fila(s) desde la iteración {info.ventana.desde}. Para ver más eventos
        aumentá <b>"Cantidad de filas i"</b> (o cambiá <b>"Mostrar desde la fila j"</b>) en el panel
        izquierdo. La tabla tiene scroll vertical y horizontal propio. Hacé clic en una fila para ver
        los objetos temporales (autos presentes en ese instante).
      </p>
      <div className="tabla-scroll vector-wrap">
        <table className="vector">
          <Encabezado />
          <tbody>
            {filas.length === 0 && (
              <tr>
                <td colSpan={36} className="vacio">
                  No hay filas en la ventana elegida (j puede ser mayor que la cantidad de iteraciones).
                </td>
              </tr>
            )}
            {filas.map((f) => (
              <Fila
                key={f.n}
                f={f}
                activa={sel && sel.n === f.n}
                onClick={() => setSel(f)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Inspector de objetos temporales de la fila seleccionada */}
      {sel && sel.objetos && (
        <div className="inspector">
          <h3>
            Objetos en el sistema — fila n={sel.n} (reloj {num(sel.reloj)} min)
          </h3>
          {sel.objetos.length === 0 ? (
            <p>No hay autos en el sistema en este instante.</p>
          ) : (
            <table className="objetos">
              <thead>
                <tr>
                  <th>Auto</th>
                  <th>Tipo</th>
                  <th>k</th>
                  <th>Llegó (min)</th>
                  <th>Carrocería</th>
                  <th>Alfombras</th>
                  <th>Humedad</th>
                  <th>Carroc. lista</th>
                  <th>Alf. listas</th>
                </tr>
              </thead>
              <tbody>
                {sel.objetos.map((o) => (
                  <tr key={o.id}>
                    <td>A{o.id}</td>
                    <td>{o.tipo}</td>
                    <td>{o.k}</td>
                    <td>{num(o.llegada)}</td>
                    <td>{o.carroceria}</td>
                    <td>{o.alfombras}</td>
                    <td>{o.H === null ? '—' : num(o.H, 1) + '%'}</td>
                    <td>{o.bodyReady ? 'Sí' : 'No'}</td>
                    <td>{o.matsReady ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Ultima fila (instante X) - sin objetos temporales, como pide el enunciado */}
      {ultimaFila && (
        <div className="ultima">
          <h3>Última fila de simulación (instante X)</h3>
          <div className="tabla-scroll">
            <table className="vector">
              <Encabezado />
              <tbody>
                <Fila f={ultimaFila} onClick={() => {}} activa={false} />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
