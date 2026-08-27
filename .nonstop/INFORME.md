# INFORME — 49 mejoras al juego Dragon Ball

## Qué se construyó

49 mejoras sobre el juego que ya existía, más un banco de pruebas para poder
verificarlas sin jugar a mano.

**Cómo correrlo**

```bash
python -m http.server 8134 --directory "W:/Working Folder Personal/DragonBall"
```

Después <http://localhost:8134>. Desde la consola del navegador:
`Test.humo()`, `Test.saga(3)`, `Test.jugar(9000)`, `Test.campana()`.

## Las 49, por bloque

**La escena de charla (1-7)** — que es lo que disparó el pedido. El problema de
fondo estaba en `humanoide()`: escalaba solo el eje Y, así que los personajes
bajos salían achatados y anchos (Krilin era el caso peor). Se reescribió para
calcular todo como fracción del alto total, con altura y corpulencia propias por
personaje. Además: el que no habla ahora se apaga bajando su paleta en vez de
con líneas negras encima (parecía una reja), fondo en capas con sol, nubes y dos
filas de cerros, suelo con textura, retratos escalados según su alto y globo de
diálogo con cola que apunta al que habla.

**Gráficos (8-17)** — sombra proyectada que se achica con la altura, tiles con
bordes según sus vecinos, nubes en dos capas, partículas de ambiente distintas
por saga, chispas de impacto en abanico, estela de dash, polvo de aterrizaje
proporcional a la caída, flash de daño rojo, barra de jefe con su cara y marcas
de fase, números de daño grandes en los golpes fuertes.

**Jugabilidad (18-30)** — guardia con abajo, golpe pesado manteniendo el ataque,
recuperación en el aire, cancelar con dash, combo aéreo encadenable, enemigos que
bloquean, IA de jefe con tres patrones por fase, daño extra al estrellar contra
una pared, cámara que se aleja al volar, checkpoint, cápsulas de vida, drop de Ki
y derrape al frenar.

**Sonido (31-36)** — pasos con cadencia, tres sonidos de golpe distintos, una
escala y un tempo propios por saga, modo jefe que acelera y baja la música,
aterrizaje según la caída y grito al recibir un golpe fuerte.

**Interfaz (37-43)** — brújula a la esfera más cercana, barra de progreso del
nivel, pausa con estadísticas, aviso de Ki bajo, contador de combo, fundido entre
pantallas y selector de saga en el título.

**Contenido (44-49)** — secuencia de segmentos propia por saga, tres segmentos
nuevos (pozo, torres, pasillo aéreo), Ozaru jugable con luna llena, un disparo
distinto por transformación, tres enemigos originales (Zarko, Sylph, Kaon) y
guardado en localStorage.

## Verificación

| Criterio | Resultado |
|---|---|
| 49 ítems en `[x]` | 50/50 (49 + andamiaje), 0 pendientes, 0 bloqueados |
| Sin errores en consola | 0 errores |
| Bot completa la saga 1 | 100% del nivel, jefe 0/260, 3 de 3 corridas |
| Campaña llega al final | estado `final`, 0 errores |
| 8 pantallas dibujan | 8/8 |
| Sprites dibujan | 39 poses de Goku + 25 personajes |
| `node --check` | pasa en los 17 `.js` |
| Generadores exportan | 39 poses + 25 enemigos |

Las sagas avanzadas quedan entre 33% y 46% con el bot, que no usa
transformaciones ni vuela bien: son más difíciles a propósito y corren sin
errores.

## Decisiones tomadas por criterio propio

- **"49 mejoras" se tomó literal**: 49 ítems distintos y verificables, cada uno
  con su método de verificación declarado antes de implementarlo.
- **Cada mejora tiene que ser observable**: o cambia lo que se dibuja, o cambia
  lo que el jugador puede hacer. No se hizo ningún refactor invisible.
- **El balance manda sobre la mejora**: cuando el bloqueo de enemigos y Zarko en
  la saga 1 rompieron la curva ya probada, se ajustaron ellos, no el balance.
- **Los sprites nunca se editaron a mano**: todo salió de `tools/*.py`.

## Desvíos de la SPEC

1. **El ítem 25 (daño contra pared) se verificó de forma distinta a la
   planeada.** El nivel no tenía paredes verticales, así que la verificación
   contra el nivel real era imposible; se verificó la mecánica directamente y
   recién con el ítem 45 (segmento `pozo`) el nivel pasó a tener paredes de
   verdad. Hoy hay 2 paredes verticales y la mecánica tiene efecto.
2. **El ítem 49 (guardado) se adelantó**, porque el 43 (selector de saga) lo
   necesitaba para saber qué sagas están desbloqueadas.
3. **Los ítems 35 y 36 (sonido de aterrizaje y grito al recibir daño) se
   implementaron antes de tiempo**, dentro del bloque de gráficos, porque salían
   del mismo cambio que el polvo de aterrizaje y el impacto.
4. **El segmento `torres` se rediseñó después de crearlo.** Tal como salió eran
   paredes de 17 tiles que cortaban el nivel: el bot moría al 13% en la saga GT.
   Se bajaron y se les agregaron plataformas; GT pasó a 74%.

Fuera de eso, no hubo desvíos: el alcance, el stack y los criterios se
mantuvieron como se escribieron en Fase 0.

## Bloqueados

Ninguno.

## Correcciones sobre el propio trabajo

Cuatro verificaciones fallaron y hubo que distinguir si estaba mal el código o
la prueba:

- **Ítem 13 (estela)**: bug real. El `return` del parpadeo de invulnerabilidad
  cortaba antes de dibujar la estela, y el dash justamente da invulnerabilidad.
- **Ítem 21 (cancelar con dash)**: bug real. `mover()` no se llama mientras hay
  un ataque en curso, así que el dash nunca se leía.
- **Ítems 20/22 y campaña**: pruebas mal escritas (hitstop de tests previos
  comiéndose frames, enemigo mal alineado, y falta de espera del fundido).
- **Golpe al soltar**: regresión propia. Se había cambiado el golpe para que
  saliera al soltar el botón, lo que agregaba latencia a todos los golpes y
  rompió el bot. Se volvió a "sale al apretar" y el pesado quedó aparte.

También apareció un bug de mi propia mejora: al agregar partículas de ambiente
permanentes (ítem 11), la condición que cerraba la saga (`FX.particulas` vacío)
dejó de cumplirse nunca. Ahora el cierre es por tiempo desde la caída del jefe, y
de paso un KO simultáneo lo gana el jugador.

## Ronda extra: poder ver el juego

Todo el trabajo se hizo sin poder mirar el resultado: el panel del navegador no
estaba visible y sin eso Chrome no compone frames, así que los screenshots
fallaban. Se resolvió con `tools/servidor_capturas.py` (un POST con CORS que
guarda PNG) más `Test.capturar(nombre)`: el propio juego manda lo que dibuja y
queda un archivo en `.nonstop/capturas/`.

Al poder ver por fin las capturas aparecieron 4 problemas que ninguna
verificación por píxeles había detectado, y se arreglaron (ítems 50-53):

- El apagado del personaje que no habla era tan fuerte que lo volvía
  irreconocible. Ahora se baja el brillo conservando el tono.
- Krilin tenía la cabeza enorme respecto del cuerpo y no se le veían los
  seis puntos.
- Los brazos se fusionaban con el torso: estaban a 1px y el contorno
  automático no entraba. Ahora van a 2px.
- Nueve montañas iguales de fondo hacían más ruido que paisaje.

Es la lección del trabajo: contar píxeles verifica que algo *está*, no que se
*vea bien*.

## Números

18 iteraciones sobre un presupuesto de 60. 53 ítems (49 planeados + 1 de
andamiaje + 4 detectados al ver las capturas).
