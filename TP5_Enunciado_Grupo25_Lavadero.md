SIMULACIÓN

Trabajo Práctico 5

Consigna Grupo 25

Ciclo lectivo 2026 - 4K2

SIMULACIÓN

Consignas para la actividad

Desarrollar un aplicativo que efectúe la simulación del sistema definido con las siguientes pautas:

• El aplicativo debe permitir simular hasta 100000 iteraciones del vector de estado ó hasta el

tiempo X, lo que ocurra primero.

•

•

Se deberá mostrar en el vector de estado i iteraciones a partir de una iteración j (valores i y j
ingresados por parámetro).

Se deberá mostrar en el vector de estado la última fila de simulación, es decir la fila
correspondiente al instante X. En esta fila no es necesario mostrar los objetos temporales.

• Todos los parámetros del enunciado deben ser modificables por el usuario.
• El vector de estado debe mostrar en detalle el estado del sistema simulado (mostrar tanto el

estado como las columnas necesarias para el cálculo de las métricas solicitadas).

•

Para cada variable aleatoria de la simulación se debe mostrar el número aleatorio que se usó
para determinar su valor.

• El vector de estado que se muestre como resultado de la construcción del aplicativo debe
permitir conocer a partir de una hora (o iteración) j y durante i iteraciones en cualquier
instante de ese intervalo (fila seleccionada) el valor de todos los atributos de los objetos
presentes en el sistema en ese instante (no es necesario mostrar los objetos que ya dejaron de
existir en el sistema).

• Mostrar las tablas de Runge Kutta que hayan calculado.

Enunciado: “LAVADERO”
Llegan autos a un lavadero con una distribución exponencial negativa de media 10 minutos. Los
autos pueden ser pequeños (20%), medianos (50%) o utilitarios pick-up (30%).
Cuando los autos llegan, un empleado quita las alfombras (QA) y las deriva al área de aspirado
(AA). Si el operario QA ya está ocupado quitando alfombras, los autos deben esperar a que se
desocupe.
Las carrocerías son derivadas al área de lavado (L) y secado (S) , la cual tiene lugar para lavar dos
autos a la vez, pero solo puede secar uno a la vez. Esto quiere decir que si una carrocería termina su
lavado, y la secadora esta ocupada, deberá esperar.
En el instante que termina su lavado, una carrocería comienza a secarse tenga o no la secadora a su
disposición. Si tiene la secadora a disposición, la tasa de perdida de humedad responde a la
siguiente ecuación:

dH/dt = (-5) * (t^2) + 2 * H - 200

En cambio sí se está sacando sola, la carrocería pierde humedad con una tasa igual a:

dH/dt = -k*H

Con k = 0,25 para pick-ups, 0,5 para autos medianos y 0,75 para autos pequeños. Se considera una
unidad de integración igual a 1 minuto.
Una carrocería está seca, cuando su humedad llega al 0,0%. Los espacios para lavado, no se liberan
hasta que la carrocería este completamente seca.

SIMULACIÓN

Las carrocerías que son derivadas a LS deben esperar si los dos lugares están ocupados. Lo mismo
sucede con las alfombras si el AA está ocupada.
Una vez que la carrocería ha sido lavada y secada, un operario (PA) coloca las alfombras
correspondientes si es que ya han sido aspiradas, sino espera a que la operación se realice.
Las alfombras que han sido aspiradas antes que su correspondiente carrocería haya sido lavada y
secada, deben esperar a que esto ocurra.
Los tiempos de proceso de cada sección son:
Quitar alfombras (QA): 2 minutos. Área de aspirado (AA): U(3;5) minutos. Lavado (L): U(6;12)
minutos. Pone alfombras (PA):  3 minutos.
Determinar mediante la simulación:

• Calcular 8 estadísticas (distintas entre sí) que ayuden a comprender el funcionamiento del

sistema que se está simulando.

Consideraciones a tener en cuenta para la entrega
La fecha de entrega en el aula virtual es el viernes 19/6/2026 en el horario de clases.

