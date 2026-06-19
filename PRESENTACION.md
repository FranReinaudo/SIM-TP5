# TP5 — Lavadero · Guía de presentación

> **Objetivo de este documento:** que en la defensa sepamos **en qué parte del
> código está cada cosa del enunciado**. No hace falta saberlo de memoria: con
> el nombre de la función / variable alcanza para buscarlo (Ctrl+F) y mostrarlo
> cuando el profe lo pida. El profe **pregunta puntual** ("¿dónde está esto?",
> "mostrame los randoms", "quiero simular 10000, ¿dónde se hace?") y nosotros
> abrimos el archivo y lo señalamos.

---

## 1. Cómo planteamos la simulación (en 30 segundos)

- Es una simulación por **vector de estado / próximo evento** (next-event): el
  reloj **salta de evento en evento**, no de a 1 minuto.
- Cada **auto** se "parte" en dos objetos: la **carrocería** (va a lavado+secado)
  y las **alfombras** (van a aspirado). El auto sale cuando la carrocería está
  seca **y** las alfombras aspiradas, tras poner alfombras (PA).
- El **secado** es lo único que se resuelve con una ecuación diferencial, por
  **Runge-Kutta 4** (paso 0,1 min).
- Todo el motor está en **`src/sim/engine.js`**. Es el archivo a abrir para casi
  cualquier pregunta.

### Mapa de archivos

| Archivo | Qué contiene | Cuándo lo abro |
|---|---|---|
| `src/sim/engine.js` | **El motor**: estado, eventos, colas, recursos, estadísticas, vector de estado. | Para el 90% de las preguntas. |
| `src/sim/rng.js` | Generación de aleatorios: exponencial, uniforme, elección de tipo de auto. **Truncado a 2 decimales.** | Preguntas de variables aleatorias / probabilidades. |
| `src/sim/rungeKutta.js` | Runge-Kutta del secado (ecuaciones con/sin secadora). | Preguntas del secado / RK. |
| `src/components/ParametersForm.jsx` | Formulario con **todos los parámetros modificables**. | "¿Dónde cambio tal parámetro?" |
| `src/components/StateVectorTable.jsx` | Dibuja el vector de estado y el inspector de objetos. | Solo si pregunta por la tabla en pantalla. |
| `src/components/RungeKuttaTables.jsx` | Dibuja las tablas de RK. | "Mostrame las tablas de RK." |
| `src/components/StatisticsPanel.jsx` | Dibuja las 8 estadísticas. | "Mostrame las estadísticas." |
| `src/App.jsx` | Une todo y tiene los **valores por defecto** (`PARAMS_DEFECTO`). | Valores iniciales del enunciado. |

---

## 2. Mapa ENUNCIADO → CÓDIGO (lo más importante)

Cada regla del enunciado y **dónde** está. Buscar por el término en *cursiva*.

| Regla del enunciado | Dónde está | Buscar |
|---|---|---|
| Llegan autos con **Exp. Neg. media 10 min** | `engine.js` → `evLlegada()` programa la próxima; `rng.js` → `exponencial()` | *exponencial* |
| Autos **pequeños 20% / medianos 50% / pick-up 30%** | `rng.js` → `elegirTipo()` (los if de probabilidad acumulada) | *elegirTipo* |
| Un empleado **quita alfombras (QA), 2 min**; si está ocupado, esperan | `engine.js` → `iniciarQA()` (tiempo fijo `qaTiempo`), cola `colaQA`, `evFinQA()` | *iniciarQA* |
| Carrocería → **lavado (L)**, **2 lugares**, **U(6;12)** | `engine.js` → `iniciarLavado()`, array `lugares` (2 elementos), `rng.js` → `uniforme()` | *iniciarLavado* / *lugares* |
| Alfombras → **aspirado (AA)**, **U(3;5)**; si ocupado, esperan | `engine.js` → `iniciarAspirado()`, cola `colaAspirado` | *iniciarAspirado* |
| **Solo se seca 1 a la vez** (1 secadora), pero se lava de a 2 | `engine.js` → objeto `secadora` (capacidad 1) vs `lugares` (2) | *secadora* |
| Al terminar lavado, **empieza a secarse tenga o no secadora** | `engine.js` → `evFinLavado()` (decide modo `con`/`sin`) | *evFinLavado* |
| Si tiene secadora: **dH/dt = -5t² + 2H − 200** | `rungeKutta.js` → `fCon` | *fCon* |
| Si se seca sola: **dH/dt = -k·H** | `rungeKutta.js` → `fSin` | *fSin* |
| **k = 0,25 pick-up / 0,5 mediano / 0,75 pequeño** | `rng.js` → `elegirTipo()` asigna `k`; defaults en `App.jsx` (`kPequeno`...) | *kCoef* / *kPequeno* |
| **Unidad de integración 1 min** (usamos 0,1 para estabilizar) | `rungeKutta.js` → `PASO_FINO = 0.1` (ver nota §6) | *PASO_FINO* |
| **Seca cuando humedad = 0%** | `rungeKutta.js` → `UMBRAL_SECO` (corte del bucle) | *UMBRAL_SECO* |
| **El lugar de lavado NO se libera hasta estar 100% seca** | `engine.js` → `evFinSecado()` (recién ahí pone `l.estado = 'Libre'`) | *evFinSecado* |
| Carrocería derivada a LS **espera si los 2 lugares ocupados** | `engine.js` → cola `colaLavado` (en `evFinQA`) | *colaLavado* |
| Al estar lavada+secada, **PA pone alfombras (3 min) si ya están aspiradas, si no espera** | `engine.js` → `intentarPA()` (condición `bodyReady && matsReady`), `iniciarPA()` | *intentarPA* |
| **Alfombras aspiradas antes que la carrocería deben esperar** | `engine.js` → flags `matsReady` / `bodyReady` + `intentarPA()` | *matsReady* |

> **Frase para el profe:** "Cada regla 'si pasa X, hacé Y' está como un `if`
> dentro de la función del evento correspondiente (`evFinQA`, `evFinLavado`,
> etc.). Si querés te muestro la que precises."

---

## 3. Parámetros modificables (todos los del enunciado)

**Todos** se editan en el formulario (`ParametersForm.jsx`) y los valores por
defecto del enunciado están en **`App.jsx` → `PARAMS_DEFECTO`**. El motor los
recibe desestructurados al principio de `simular(params)` en `engine.js`.

| Parámetro (enunciado) | Nombre en código | Default | Dónde se edita |
|---|---|---|---|
| Media entre llegadas (10 min) | `mediaLlegada` | 10 | Formulario → "Llegadas" |
| Tiempo X de corte | `tiempoX` | 480 | "Corte de la simulación" |
| Máx. iteraciones (≤ 100000) | `maxIteraciones` | 100000 | "Corte de la simulación" |
| Mostrar desde fila j / cantidad i | `desdeFila` / `cantidadFilas` | 1 / 50 | "Visualización" |
| QA (2 min fijo) | `qaTiempo` | 2 | "Tiempos de proceso" |
| Aspirado U(3;5) | `aspMin` / `aspMax` | 3 / 5 | "Tiempos de proceso" |
| Lavado U(6;12) | `lavMin` / `lavMax` | 6 / 12 | "Tiempos de proceso" |
| PA (3 min fijo) | `paTiempo` | 3 | "Tiempos de proceso" |
| Prob. pequeño/mediano/pick-up | `pPequeno` / `pMediano` / `pPickup` | 0,2 / 0,5 / 0,3 | "Tipos de auto" |
| k por tipo | `kPequeno` / `kMediano` / `kPickup` | 0,75 / 0,5 / 0,25 | "Secado" |
| Humedad inicial | `humedadInicial` | 100 | "Secado" |
| Semilla (reproducibilidad) | `semilla` | 12345 | "Reproducibilidad" |

> **Demo típica:** el profe dice "cambiá la probabilidad a 0,6 / 0,4..." → lo
> tocamos en el formulario, apretamos **▶ Simular**, y se re-corre todo. El
> formulario incluso **avisa si las probabilidades no suman 1** (`probOk` en
> `ParametersForm.jsx`).

---

## 4. Cosas puntuales que suelen preguntar

### "¿Dónde está la probabilidad de los tipos de auto?"
`src/sim/rng.js` → función **`elegirTipo()`**. Es probabilidad acumulada:
```
rnd < pPequeno                 → Pequeño
rnd < pPequeno + pMediano      → Mediano
resto                          → Pick-up
```
Si pide cambiar los cortes (ej. 0,15 / 0,17...), se cambian los parámetros
`pPequeno`/`pMediano`/`pPickup` en el formulario; la lógica del `if` no cambia.

### "Mostrame los randoms que usaste"
- Cada variable aleatoria devuelve **el número aleatorio crudo Y el valor**
  calculado (`rng.js`: `exponencial`, `uniforme`, `elegirTipo` devuelven
  `{ rnd, valor }`).
- En el motor se guardan en `rndLog` y se vuelcan a cada fila del vector
  (`engine.js` → `construirFila` → campo `rnd`). En pantalla se ven en las
  columnas "RND" de cada evento. **No las ocultamos**: se muestran todas.

### "Los randoms están truncados a 2 decimales"
`src/sim/rng.js` → función **`truncar2()`**; `crearRng` entrega cada número ya
truncado. El **mismo** valor truncado se usa para calcular el evento y para
mostrar. (Buscar *truncar2*.)

### "Quiero simular 10000 iteraciones / hasta el tiempo X"
`src/sim/engine.js` → **bucle principal** (`while (true)`), cortes:
```js
if (ev.time > tiempoX) { cortePorTiempo = true; break; }   // corte por tiempo X
if (iter >= maxIteraciones) break;                          // corte por iteraciones
```
Lo que ocurra primero. `maxIteraciones` se topea a 100000 en `App.jsx`
(`normalizar`).

### "¿Cómo acumulás los promedios / registros en memoria?"
`src/sim/engine.js`, sección **"Acumuladores para estadísticas"** (variables
`busyQA`, `busyAA`, `busySec`, `busyLug`, `sumaPerm`, `sumaEspera`,
`sumaSecado`, `maxColaQA`, etc.).
- Se actualizan **por área** en `acumular(dt)` (tiempo que cada recurso estuvo
  ocupado en el intervalo entre eventos).
- Los promedios finales se calculan **una sola vez al final** en el objeto
  `stats`. No guardamos todas las filas, solo los acumuladores → eficiente en
  memoria.

### "Mostrame la última fila (instante X)"
`engine.js` → `ultimaFila = construirFila({ type: 'FIN' ... }, false)`. El
`false` es porque, como pide el enunciado, **esa fila NO muestra los objetos
temporales**.

### "¿Y la fila de inicialización?"
`engine.js` → bloque "Inicialización": fila **n=0, reloj=0** (`filaInicial`) que
muestra el cálculo del **primer evento** (primera llegada). Se agrega al frente
con `filas.unshift(filaInicial)`.

---

## 5. Las 8 estadísticas (dónde se calculan)

`src/sim/engine.js` → objeto **`stats`** al final de `simular()`:

1. `ocupacionQA` — % ocupación del empleado QA
2. `ocupacionAA` — % ocupación del aspirado
3. `ocupacionLugares` — % ocupación de los 2 lugares de lavado
4. `ocupacionSecadora` — % ocupación de la secadora
5. `secadoMedio` — tiempo medio de secado por carrocería
6. `permanenciaMedia` — tiempo medio en el sistema
7. `esperaMediaColas` — espera media en colas por auto
8. `maxColaQA` — cola máxima de ingreso

Se dibujan en `StatisticsPanel.jsx`.

---

## 6. Runge-Kutta del secado (lo más "técnico")

Archivo: **`src/sim/rungeKutta.js`**.

- **Ecuaciones:** `fCon` (con secadora, `-5t²+2H-200`) y `fSin(k)` (sola, `-k·H`).
- **Paso 0,1 min** (`PASO_FINO`). *Por qué 0,1 y no 1:* la ecuación con secadora
  tiene `+2H`, es **inestable**; con paso 1 "se desborda" a valores negativos y
  daría siempre 3 min mal. Con 0,1 la curva es estable y el corte por 0% es real.
- **Tiempo de secado alineado al paso** (un decimal): `resolverSecado` corta la
  carrocería seca al completarse el paso que cruza el umbral → `minutos` siempre
  múltiplo de 0,1.

### El caso "se secaba sola y se libera la secadora" (decisión del grupo)
`engine.js` → **`reasignarSecadora()`** (se llama desde `evFinSecado` cuando la
secadora queda libre y hay una carrocería en `SecandoSin`):

1. Mira cuánto llevaba secándose sola: `t_solo = reloj − inicio_secado`
   (redondeado al paso 0,1).
2. Lee de la **tabla RK sin secadora** la **humedad restante `H_r`** en ese
   instante (`humedadEnPaso`).
3. Arranca una **fase nueva con secadora**: RK con `fCon`, **humedad inicial
   `H_r` y t desde 0**.
4. La tabla mostrada concatena las dos fases (`sin` truncada + `con`).

> Si hay dos secándose solas, la toma la que **empezó antes** (FIFO): ver el
> `forEach` que busca el menor `dryingStart` en `evFinSecado`.

---

## 7. Guion rápido para la defensa

1. Abrir la app corriendo (ya simula con los defaults del enunciado).
2. Si piden, **cambiar un parámetro** en el formulario y volver a **Simular**.
3. Si piden randoms → señalar las columnas RND del **vector de estado** (no
   ocultarlas).
4. Si piden RK → bajar a **Tablas de Runge-Kutta**, abrir una y mostrar los
   pasos.
5. Cuando pregunten "¿dónde está X en el código?" → usar el **mapa de la §2/§4**,
   abrir el archivo y mostrar la función. No explicar línea por línea: mostrar y
   listo.

> **Recordatorio:** el motor entero es `engine.js`. Casi todo lo que pregunten
> está en una función con nombre claro (`evLlegada`, `evFinLavado`,
> `evFinSecado`, `reasignarSecadora`, `elegirTipo`, `resolverSecado`).
