# SPEC — 49 mejoras al juego Dragon Ball

## Objetivo

Hacer 49 mejoras concretas y verificables al juego que ya existe en
`W:\Working Folder Personal\DragonBall`: gráficos, jugabilidad, sonido, UI y
contenido. El disparador puntual y confirmado por Nico con captura son los
retratos de las charlas, que se ven deformes (Krilin sobre todo), el tramado de
"no habla" que parece rejas, y el fondo plano de la escena.

No es una reescritura: el motor, la campaña de 8 sagas y el pipeline de sprites
ya funcionan. Esto es pulido y agregado sobre eso.

## Alcance

Entra:
- Rehacer los sprites de aliados y arreglar la escena de charla completa.
- Mejoras visuales del mundo, los efectos y la UI.
- Mecánicas nuevas de combate y de nivel.
- Sonido: variedad y ambiente.
- Contenido: terreno por saga, Ozaru, guardado.

NO entra:
- Cambiar el stack (sigue HTML + JS puro, sin build ni dependencias).
- Sprites hechos a mano en `js/art.js` — todo sale de `tools/*.py`.
- Multijugador, backend, o publicar el juego.
- Commit / push (requieren confirmación explícita de Nico).

## Stack y decisiones

- HTML + JS puro, canvas interno 480x270 escalado x2, sin dependencias.
- Sprites generados por `tools/gen_sprite.py` y `tools/gen_enemigos.py`,
  exportados con `--export` a `js/art.js`. **Nunca editar `art.js` a mano.**
- Audio 100% sintetizado con Web Audio, cero archivos.
- Servidor local: entrada `dragonball` en `.claude/launch.json`, puerto 8134.

## Supuestos

Decisiones tomadas por criterio propio (esta sección crece durante el trabajo):

1. "49 mejoras" se toma literal: 49 ítems distintos y verificables, no "un montón".
2. Se priorizan primero los ítems que Nico marcó en la captura (retratos/charla),
   después gráficos, jugabilidad, audio, UI y contenido en ese orden.
3. Cada mejora tiene que ser observable: o cambia lo que se dibuja, o cambia lo
   que el jugador puede hacer. Nada de refactors internos invisibles.
4. Si una mejora choca con el balance ya probado (el bot completa la saga 1), gana
   el balance: se ajusta la mejora, no se rompe la curva.

## Criterios de aceptación

1. Los 49 ítems del TODO están en `[x]`, cada uno con su verificación corrida.
2. Cero errores en consola al cargar y al jugar una saga completa.
3. El bot de prueba sigue completando la saga 1 (100% del nivel, jefe muerto).
4. La campaña completa sigue corriendo de la saga 1 al estado `final`.
5. Todas las pantallas (titulo, intro, juego, pausa, gameover, shenlong, finsaga,
   final) dibujan sin excepción.
6. Todos los sprites de `GOKU` y `ARTE_ENEMIGOS` dibujan sin excepción.
7. `node --check` pasa en todos los `.js`.
8. Los generadores de Python corren y exportan sin error.

## Presupuesto

60 iteraciones. El TODO tiene 50 ítems (1 de andamiaje + 49 mejoras), así que
entra con margen para imprevistos.
