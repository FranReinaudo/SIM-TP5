# TP5 — Simulación del Lavadero (Grupo 25)

Aplicación en **React + JavaScript (Vite)** que simula un lavadero de autos por
**vector de estado / próximo evento**, con el secado de la carrocería resuelto por
**Runge-Kutta de 4to orden**.

## Cómo ejecutar

Necesitás Node.js (v18+). En esta carpeta:

```bash
npm install      # instala dependencias (solo la primera vez)
npm run dev      # levanta la app en http://localhost:5173
```

Para generar una versión optimizada:

```bash
npm run build    # genera la carpeta dist/
npm run preview  # sirve la versión de dist/
```

## Estructura

```
src/
  sim/
    rng.js          Generación de números y variables aleatorias (Exp, Uniforme, tipo de auto)
    rungeKutta.js   RK4 para el secado (ecuaciones con/sin secadora)
    engine.js       Motor de simulación por próximo evento (el corazón del TP)
  components/
    ParametersForm.jsx    Formulario con todos los parámetros (modificables)
    StatisticsPanel.jsx   Las 8 estadísticas
    StateVectorTable.jsx  Vector de estado + inspector de objetos + última fila
    RungeKuttaTables.jsx  Tablas de Runge-Kutta calculadas
  utils/format.js   Formato de números
  App.jsx           Orquesta todo
```

## Modelo del sistema

Cada auto se "parte" en **carrocería** + **alfombras**, que recorren el sistema en
paralelo y se reúnen al final en PA (poner alfombras):

```
llega auto → QA (2') → carrocería → LAVADO (2 lugares, U(6;12)) → SECADO (RK, 1 secadora)
                     → alfombras  → ASPIRADO (AA, U(3;5))
cuando la carrocería está seca Y las alfombras aspiradas → PA (3') → sale
```

### Ecuaciones de secado (Runge-Kutta, paso h = 1 min)

- **Con secadora (rápida):** `dH/dt = -5·t² + 2·H − 200`
- **Sin secadora (sola):** `dH/dt = -k·H`  con `k` = 0,25 (pick-up) / 0,5 (mediano) / 0,75 (pequeño)

`t` = minutos desde que la carrocería empezó a secarse. Humedad inicial 100%.
La carrocería está "seca" cuando `H ≤ 0,05` (se muestra como 0,0%).

## Decisiones de diseño (consensuadas)

1. **QA y PA son operarios distintos** (1 cada uno).
2. **Humedad inicial = 100%** (modificable).
3. **8 estadísticas:** % ocupación de QA, AA, lugares de lavado y secadora;
   tiempo medio de secado de la carrocería; tiempo medio de permanencia;
   tiempo medio de espera en colas; máxima cola de ingreso.
4. **Secadora FIFO:** si se libera, la toma la carrocería que más tiempo lleva
   secándose sola y acelera su secado (pasa a la ecuación con secadora).
5. `t` en la ecuación con secadora es el tiempo local de secado (arranca en 0) y no
   se reinicia al pasar de "sola" a "con secadora".

## Requisitos del enunciado cubiertos

- Hasta 100000 iteraciones **o** hasta el tiempo X (lo que ocurra primero).
- Muestra `i` filas desde la fila `j` (parámetros).
- Muestra la última fila (instante X) sin objetos temporales.
- Todos los parámetros son modificables.
- Vector de estado con el detalle del sistema y las columnas para las métricas.
- Para cada variable aleatoria se muestra el número aleatorio usado.
- Al hacer clic en una fila se ven todos los atributos de los objetos presentes.
- Tablas de Runge-Kutta calculadas.
