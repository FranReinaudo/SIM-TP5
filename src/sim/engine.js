// ============================================================================
//  MOTOR DE SIMULACION  -  Lavadero (TP5, Grupo 25)
// ----------------------------------------------------------------------------
//  Simulacion por VECTOR DE ESTADO / PROXIMO EVENTO (next-event).
//  El reloj salta de evento en evento; en cada salto se acumulan las areas
//  para las estadisticas y se arma una fila del vector de estado.
//
//  FLUJO DEL SISTEMA (cada auto se "parte" en carroceria + alfombras):
//
//      llega auto -> QA (quita alfombras, 2')
//                       |-- carroceria -> LAVADO (2 lugares, U(6;12))
//                       |                    -> SECADO (RK, 1 secadora)
//                       |-- alfombras  -> ASPIRADO (AA, U(3;5))
//      cuando la carroceria esta seca Y las alfombras aspiradas:
//                    PA (pone alfombras, 3') -> sale del sistema
//
//  Reglas clave del enunciado:
//   - 2 lugares de lavado, pero 1 sola secadora.
//   - El lugar de lavado NO se libera hasta que la carroceria este 100% seca.
//   - La carroceria empieza a secarse al terminar el lavado, tenga o no la
//     secadora. Con secadora se seca rapido; sola, lento (dH/dt = -k*H).
//   - Decision confirmada: si la secadora se libera, la toma (FIFO) la
//     carroceria que mas tiempo lleva secandose sola y acelera su secado.
// ============================================================================

import { crearRng, exponencial, uniforme, elegirTipo } from './rng.js';
import { resolverSecado, avanzarSecado } from './rungeKutta.js';

const INF = Infinity;
const TOPE_TABLAS_RK = 500; // limite de tablas RK guardadas (para no agotar memoria)

// Prioridad para desempate cuando dos eventos ocurren en el mismo instante.
// (Primero las "salidas/fin", al final las llegadas.)
const PRIORIDAD = {
  FIN_PA: 0,
  FIN_SECADO: 1,
  FIN_LAVADO: 2,
  FIN_AA: 3,
  FIN_QA: 4,
  LLEGADA: 5,
};

export function simular(params) {
  // ---- Parametros (todos modificables por el usuario) ----------------------
  const {
    mediaLlegada,
    tiempoX,
    maxIteraciones,
    desdeFila: j,
    cantidadFilas: i,
    humedadInicial,
    qaTiempo,
    aspMin,
    aspMax,
    lavMin,
    lavMax,
    paTiempo,
    pPequeno,
    pMediano,
    pPickup,
    kPequeno,
    kMediano,
    kPickup,
    semilla,
  } = params;

  const rng = crearRng(semilla);
  const prob = { pPequeno, pMediano, pPickup };
  const kCoef = { kPequeno, kMediano, kPickup };

  // ---- Estado del sistema --------------------------------------------------
  let clock = 0;
  let lastClock = 0;
  let iter = 0;
  let idAuto = 0;

  const autos = new Map(); // id -> objeto auto (solo los que estan en el sistema)
  const enSistema = new Set();

  // Recursos (todos con capacidad 1, salvo los 2 lugares de lavado)
  const QA = { ocupado: false, auto: null };
  const AA = { ocupado: false, auto: null };
  const PA = { ocupado: false, auto: null };
  const secadora = { ocupada: false, lugar: null };
  const lugares = [
    { estado: 'Libre', auto: null, finLavado: INF, finSecado: INF, secado: null },
    { estado: 'Libre', auto: null, finLavado: INF, finSecado: INF, secado: null },
  ];

  // Colas (FIFO)
  const colaQA = []; // autos esperando que se desocupe QA
  const colaAspirado = []; // alfombras esperando AA
  const colaLavado = []; // carrocerias esperando lugar de lavado
  const colaPA = []; // autos listos esperando que se desocupe PA

  // Proxima llegada
  const S = { proxLlegada: INF, finQA: INF, finAA: INF, finPA: INF };
  let proxLlegadaRnd = null;
  let proxLlegadaValor = null;

  // ---- Acumuladores para estadisticas --------------------------------------
  let busyQA = 0,
    busyAA = 0,
    busyPA = 0,
    busySec = 0,
    busyLug = 0; // tiempo-lugar ocupado (sumando ambos lugares)
  let sumaPerm = 0,
    salidos = 0;
  let sumaEspera = 0,
    countEspera = 0;
  let maxColaQA = 0,
    maxColaAspirado = 0,
    maxColaLavado = 0,
    maxColaPA = 0;

  // ---- Salidas -------------------------------------------------------------
  const filas = []; // filas del vector de estado dentro de la ventana [j, j+i)
  let ultimaFila = null;
  const tablasRK = []; // tablas de Runge-Kutta calculadas
  let tablasTruncadas = false;

  let rndLog = {}; // numeros aleatorios usados en el evento actual

  // ==========================================================================
  //  Helpers de inicio de cada operacion
  // ==========================================================================
  function iniciarQA(auto) {
    QA.ocupado = true;
    QA.auto = auto;
    auto.qaStart = clock;
    auto.esperaQA = clock - auto.llegada;
    S.finQA = clock + qaTiempo; // 2 minutos fijos (sin aleatorio)
  }

  function iniciarAspirado(auto) {
    AA.ocupado = true;
    AA.auto = auto;
    auto.aspStart = clock;
    auto.esperaAspirado = clock - auto.qaEnd;
    const u = uniforme(rng, aspMin, aspMax);
    S.finAA = clock + u.valor;
    rndLog.aspirado = { rnd: u.rnd, valor: u.valor };
  }

  function iniciarLavado(auto, idx) {
    const l = lugares[idx];
    l.estado = 'Lavando';
    l.auto = auto;
    auto.washStart = clock;
    auto.esperaLavado = clock - auto.qaEnd;
    const u = uniforme(rng, lavMin, lavMax);
    l.finLavado = clock + u.valor;
    rndLog.lavado = { rnd: u.rnd, valor: u.valor };
  }

  function iniciarPA(auto) {
    PA.ocupado = true;
    PA.auto = auto;
    auto.paStart = clock;
    auto.esperaPA = clock - Math.max(auto.dryEnd, auto.aspEnd);
    S.finPA = clock + paTiempo; // 3 minutos fijos
  }

  // Intenta arrancar el PA si la carroceria esta seca Y las alfombras aspiradas.
  function intentarPA(auto) {
    if (auto.bodyReady && auto.matsReady && !auto.paIniciado) {
      auto.paIniciado = true;
      if (!PA.ocupado) iniciarPA(auto);
      else colaPA.push(auto.id);
    }
  }

  // Guarda una tabla de Runge-Kutta (con tope para no agotar memoria).
  function guardarTabla(auto, modoInicial, pasos, minutos) {
    if (tablasRK.length >= TOPE_TABLAS_RK) {
      tablasTruncadas = true;
      return null;
    }
    const t = {
      autoId: auto.id,
      tipo: auto.tipo,
      k: auto.k,
      modoInicial,
      cambioSecadora: false,
      pasos,
      minutos,
      relojInicio: clock,
      iteracion: iter,
    };
    tablasRK.push(t);
    return t;
  }

  // Cuando una carroceria que se secaba SOLA consigue la secadora.
  function reasignarSecadora(idx) {
    const l = lugares[idx];
    const auto = l.auto;
    // minutos enteros ya transcurridos secandose sola
    const elapsed = Math.max(0, Math.floor(clock - l.secado.dryingStart));
    // humedad actual: avanzamos esos minutos en modo "sin"
    const av = avanzarSecado({
      Hinicial: humedadInicial,
      tInicial: 0,
      modo: 'sin',
      k: auto.k,
      nPasos: elapsed,
    });
    // continuamos en modo "con" hasta secarse
    const res = resolverSecado({ Hinicial: av.H, tInicial: elapsed, modo: 'con', k: auto.k });
    l.estado = 'SecandoCon';
    l.secado.modo = 'con';
    secadora.ocupada = true;
    secadora.lugar = idx;
    l.finSecado = clock + res.minutos;
    // tabla combinada: fase sin + fase con
    const pasosComb = [...av.pasos, ...res.pasos];
    l.secado.tabla = pasosComb;
    if (l.secado.tablaRef) {
      l.secado.tablaRef.pasos = pasosComb;
      l.secado.tablaRef.minutos = pasosComb.length;
      l.secado.tablaRef.cambioSecadora = true;
    }
  }

  // Humedad actual mostrada de una carroceria que se esta secando.
  function humedadActual(l) {
    if (!l.secado || !l.secado.tabla) return null;
    const e = Math.max(0, Math.floor(clock - l.secado.dryingStart));
    const paso = l.secado.tabla.find((s) => s.t === e);
    if (paso) return paso.H;
    const ult = l.secado.tabla[l.secado.tabla.length - 1];
    return ult ? Math.max(0, ult.Hnext) : 0;
  }

  // ==========================================================================
  //  Procesamiento de cada tipo de evento
  // ==========================================================================
  function evLlegada() {
    // numero aleatorio que genero ESTA llegada
    rndLog.llegada = { rnd: proxLlegadaRnd, valor: proxLlegadaValor };

    const id = ++idAuto;
    const t = elegirTipo(rng, prob, kCoef);
    rndLog.tipo = { rnd: t.rnd, tipo: t.tipo };
    const auto = {
      id,
      tipo: t.tipo,
      k: t.k,
      rndTipo: t.rnd,
      llegada: clock,
      bodyReady: false,
      matsReady: false,
      paIniciado: false,
      esperaQA: 0,
      esperaLavado: 0,
      esperaAspirado: 0,
      esperaPA: 0,
      qaEnd: 0,
      dryEnd: 0,
      aspEnd: 0,
    };
    autos.set(id, auto);
    enSistema.add(id);

    // programar la proxima llegada
    const e = exponencial(rng, mediaLlegada);
    S.proxLlegada = clock + e.valor;
    proxLlegadaRnd = e.rnd;
    proxLlegadaValor = e.valor;

    // el auto va a QA (o a la cola)
    if (!QA.ocupado) iniciarQA(auto);
    else colaQA.push(id);
  }

  function evFinQA() {
    const auto = QA.auto;
    auto.qaEnd = clock;
    // se parte: alfombras -> aspirado ; carroceria -> lavado
    if (!AA.ocupado) iniciarAspirado(auto);
    else colaAspirado.push(auto.id);

    const libre = lugares.findIndex((l) => l.estado === 'Libre');
    if (libre >= 0) iniciarLavado(auto, libre);
    else colaLavado.push(auto.id);

    // liberar / continuar QA
    if (colaQA.length) iniciarQA(autos.get(colaQA.shift()));
    else {
      QA.ocupado = false;
      QA.auto = null;
      S.finQA = INF;
    }
  }

  function evFinAA() {
    const auto = AA.auto;
    auto.aspEnd = clock;
    auto.matsReady = true;
    if (colaAspirado.length) iniciarAspirado(autos.get(colaAspirado.shift()));
    else {
      AA.ocupado = false;
      AA.auto = null;
      S.finAA = INF;
    }
    intentarPA(auto);
  }

  function evFinLavado(idx) {
    const l = lugares[idx];
    const auto = l.auto;
    auto.washEnd = clock; // empieza a secarse en este instante
    let modo;
    if (!secadora.ocupada) {
      modo = 'con';
      secadora.ocupada = true;
      secadora.lugar = idx;
      l.estado = 'SecandoCon';
    } else {
      modo = 'sin';
      l.estado = 'SecandoSin';
    }
    l.finLavado = INF;
    const res = resolverSecado({ Hinicial: humedadInicial, tInicial: 0, modo, k: auto.k });
    l.secado = { dryingStart: clock, modo, k: auto.k, tabla: res.pasos, tablaRef: null };
    l.finSecado = clock + res.minutos;
    l.secado.tablaRef = guardarTabla(auto, modo, res.pasos, res.minutos);
  }

  function evFinSecado(idx) {
    const l = lugares[idx];
    const auto = l.auto;
    auto.dryEnd = clock;
    auto.bodyReady = true;
    const teniaSecadora = l.estado === 'SecandoCon';

    // liberar el lugar de lavado (recien ahora, ya esta 100% seca)
    l.estado = 'Libre';
    l.auto = null;
    l.finSecado = INF;
    l.secado = null;

    // liberar y reasignar la secadora (FIFO entre las que se secan solas)
    if (teniaSecadora) {
      secadora.ocupada = false;
      secadora.lugar = null;
      let cand = -1;
      let mejor = INF;
      lugares.forEach((lg, kIdx) => {
        if (lg.estado === 'SecandoSin' && lg.secado.dryingStart < mejor) {
          mejor = lg.secado.dryingStart;
          cand = kIdx;
        }
      });
      if (cand >= 0) reasignarSecadora(cand);
    }

    // arrancar un lavado en cola en este lugar liberado
    if (colaLavado.length) iniciarLavado(autos.get(colaLavado.shift()), idx);

    intentarPA(auto);
  }

  function evFinPA() {
    const auto = PA.auto;
    auto.paEnd = clock;
    auto.salida = clock;
    // estadisticas de salida
    salidos++;
    sumaPerm += auto.salida - auto.llegada;
    sumaEspera += auto.esperaQA + auto.esperaLavado + auto.esperaAspirado + auto.esperaPA;
    countEspera++;
    enSistema.delete(auto.id);
    autos.delete(auto.id);

    if (colaPA.length) iniciarPA(autos.get(colaPA.shift()));
    else {
      PA.ocupado = false;
      PA.auto = null;
      S.finPA = INF;
    }
  }

  // ==========================================================================
  //  Busqueda del proximo evento
  // ==========================================================================
  function proximoEvento() {
    let best = null;
    const cons = (time, type, slot) => {
      if (time === INF) return;
      if (
        best === null ||
        time < best.time ||
        (time === best.time && PRIORIDAD[type] < PRIORIDAD[best.type])
      ) {
        best = { time, type, slot };
      }
    };
    cons(S.proxLlegada, 'LLEGADA');
    cons(S.finQA, 'FIN_QA');
    cons(S.finAA, 'FIN_AA');
    cons(S.finPA, 'FIN_PA');
    lugares.forEach((l, idx) => {
      cons(l.finLavado, 'FIN_LAVADO', idx);
      cons(l.finSecado, 'FIN_SECADO', idx);
    });
    return best;
  }

  function acumular(dt) {
    if (dt <= 0) return;
    if (QA.ocupado) busyQA += dt;
    if (AA.ocupado) busyAA += dt;
    if (PA.ocupado) busyPA += dt;
    if (secadora.ocupada) busySec += dt;
    let oc = 0;
    if (lugares[0].estado !== 'Libre') oc++;
    if (lugares[1].estado !== 'Libre') oc++;
    busyLug += dt * oc;
  }

  function actualizarMaximos() {
    if (colaQA.length > maxColaQA) maxColaQA = colaQA.length;
    if (colaAspirado.length > maxColaAspirado) maxColaAspirado = colaAspirado.length;
    if (colaLavado.length > maxColaLavado) maxColaLavado = colaLavado.length;
    if (colaPA.length > maxColaPA) maxColaPA = colaPA.length;
  }

  function nombreEvento(ev) {
    switch (ev.type) {
      case 'LLEGADA':
        return `Llegada (Auto ${idAuto})`;
      case 'FIN_QA':
        return 'Fin Quitar Alfombras';
      case 'FIN_AA':
        return 'Fin Aspirado';
      case 'FIN_LAVADO':
        return `Fin Lavado (Lugar ${ev.slot + 1})`;
      case 'FIN_SECADO':
        return `Fin Secado (Lugar ${ev.slot + 1})`;
      case 'FIN_PA':
        return 'Fin Poner Alfombras';
      default:
        return ev.type;
    }
  }

  // Describe donde esta cada parte de un auto (para el inspector de objetos).
  function ubicacionAuto(id) {
    const a = autos.get(id);
    if (QA.auto && QA.auto.id === id) {
      return { carroceria: 'En QA', alfombras: 'En QA' };
    }
    if (colaQA.includes(id)) {
      return { carroceria: 'Cola QA', alfombras: 'Cola QA' };
    }
    if (PA.auto && PA.auto.id === id) {
      return { carroceria: 'En PA', alfombras: 'En PA' };
    }
    if (colaPA.includes(id)) {
      return { carroceria: 'Cola PA', alfombras: 'Cola PA' };
    }
    // carroceria
    let carroceria = '—';
    const lugIdx = lugares.findIndex((l) => l.auto && l.auto.id === id);
    if (lugIdx >= 0) {
      const est = lugares[lugIdx].estado;
      const nombre =
        est === 'Lavando' ? 'Lavando' : est === 'SecandoCon' ? 'Secando (con secadora)' : 'Secando (sola)';
      carroceria = `${nombre} (Lugar ${lugIdx + 1})`;
    } else if (colaLavado.includes(id)) {
      carroceria = 'Cola Lavado';
    } else if (a.bodyReady) {
      carroceria = 'Seca, esperando alfombras/PA';
    }
    // alfombras
    let alfombras = '—';
    if (AA.auto && AA.auto.id === id) alfombras = 'En Aspirado';
    else if (colaAspirado.includes(id)) alfombras = 'Cola Aspirado';
    else if (a.matsReady) alfombras = 'Aspiradas, esperando carroceria/PA';
    return { carroceria, alfombras };
  }

  function snapshotObjetos() {
    const lista = [];
    enSistema.forEach((id) => {
      const a = autos.get(id);
      const ub = ubicacionAuto(id);
      const lugIdx = lugares.findIndex((l) => l.auto && l.auto.id === id);
      const H = lugIdx >= 0 ? humedadActual(lugares[lugIdx]) : a.bodyReady ? 0 : null;
      lista.push({
        id,
        tipo: a.tipo,
        k: a.k,
        llegada: a.llegada,
        carroceria: ub.carroceria,
        alfombras: ub.alfombras,
        bodyReady: a.bodyReady,
        matsReady: a.matsReady,
        H,
      });
    });
    return lista;
  }

  function construirFila(ev, conObjetos) {
    return {
      n: iter,
      reloj: clock,
      evento: nombreEvento(ev),
      rnd: { ...rndLog },
      prox: {
        llegada: S.proxLlegada,
        finQA: S.finQA,
        finAA: S.finAA,
        finLavado: [lugares[0].finLavado, lugares[1].finLavado],
        finSecado: [lugares[0].finSecado, lugares[1].finSecado],
        finPA: S.finPA,
      },
      estados: {
        QA: QA.ocupado ? `Ocupado (A${QA.auto.id})` : 'Libre',
        AA: AA.ocupado ? `Ocupado (A${AA.auto.id})` : 'Libre',
        secadora: secadora.ocupada ? `Ocupada (L${secadora.lugar + 1})` : 'Libre',
        PA: PA.ocupado ? `Ocupado (A${PA.auto.id})` : 'Libre',
        lugares: lugares.map((l) => ({
          estado: l.estado,
          auto: l.auto ? l.auto.id : null,
          H: l.secado ? humedadActual(l) : null,
        })),
      },
      colas: {
        qa: colaQA.length,
        aspirado: colaAspirado.length,
        lavado: colaLavado.length,
        pa: colaPA.length,
      },
      acum: {
        busyQA,
        busyAA,
        busyLug,
        busySec,
        busyPA,
        sumaPerm,
        salidos,
        sumaEspera,
        countEspera,
      },
      objetos: conObjetos ? snapshotObjetos() : null,
    };
  }

  // ==========================================================================
  //  Inicializacion: primera llegada
  // ==========================================================================
  {
    const e = exponencial(rng, mediaLlegada);
    S.proxLlegada = e.valor;
    proxLlegadaRnd = e.rnd;
    proxLlegadaValor = e.valor;
  }

  // ==========================================================================
  //  Bucle principal de eventos
  // ==========================================================================
  while (true) {
    const ev = proximoEvento();
    if (!ev) break; // no hay mas eventos
    if (ev.time > tiempoX) break; // se llego al tiempo X
    if (iter >= maxIteraciones) break; // se llego al maximo de iteraciones

    // acumular areas sobre el intervalo [lastClock, ev.time] con el estado previo
    acumular(ev.time - lastClock);

    clock = ev.time;
    iter++;
    rndLog = {};

    switch (ev.type) {
      case 'LLEGADA':
        evLlegada();
        break;
      case 'FIN_QA':
        evFinQA();
        break;
      case 'FIN_AA':
        evFinAA();
        break;
      case 'FIN_LAVADO':
        evFinLavado(ev.slot);
        break;
      case 'FIN_SECADO':
        evFinSecado(ev.slot);
        break;
      case 'FIN_PA':
        evFinPA();
        break;
      default:
        break;
    }

    actualizarMaximos();

    // guardar la fila si esta dentro de la ventana [j, j+i)
    if (iter >= j && iter < j + i) {
      filas.push(construirFila(ev, true));
    }
    // la ultima fila se recalcula siempre (sin objetos temporales)
    ultimaFila = construirFila(ev, false);

    lastClock = clock;
  }

  // ==========================================================================
  //  Estadisticas finales (las 8 pedidas + extras de apoyo)
  // ==========================================================================
  const T = clock || 1;
  const stats = {
    // 1-5: ocupacion de recursos
    ocupacionQA: (busyQA / T) * 100,
    ocupacionAA: (busyAA / T) * 100,
    ocupacionLugares: (busyLug / (2 * T)) * 100,
    ocupacionSecadora: (busySec / T) * 100,
    ocupacionPA: (busyPA / T) * 100,
    // 6: tiempo medio de permanencia en el sistema
    permanenciaMedia: salidos ? sumaPerm / salidos : 0,
    // 7: tiempo medio de espera en colas (por auto)
    esperaMediaColas: countEspera ? sumaEspera / countEspera : 0,
    // 8: cantidad maxima de autos en cola (cola de ingreso QA)
    maxColaQA,
    // extras de apoyo
    maxColaAspirado,
    maxColaLavado,
    maxColaPA,
    autosIngresados: idAuto,
    autosSalidos: salidos,
    autosEnSistema: enSistema.size,
  };

  return {
    filas,
    ultimaFila,
    stats,
    tablasRK,
    info: {
      iteraciones: iter,
      relojFinal: clock,
      motivoParada: iter >= maxIteraciones ? 'iteraciones' : 'tiempo',
      tablasTruncadas,
      ventana: { desde: j, cantidad: i },
    },
  };
}
