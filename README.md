# Dragon Ball — El Ki de Paozu

Plataformas 2D estilo Mega Drive, en HTML + JS puro, sin build ni dependencias.
Ocho sagas, ocho jefes, siete esferas del dragón por nivel y Shenlong al final
de cada una.

Fan game personal, sin fines comerciales.

## Correr

```bash
python -m http.server 8134 --directory "W:/Working Folder Personal/DragonBall"
```

Después abrí <http://localhost:8134>. Con doble clic en `index.html` también anda.

## Controles

| Tecla | Acción |
|---|---|
| `←` `→` | correr — **dos toques seguidos y corrés más rápido** |
| `↑` | saltar |
| `↑` otra vez **en el aire** | volar |
| `↓` | bajar volando; en el piso, caer de una plataforma |
| `Espacio` | golpear — combo de 3 en el suelo, patada en el aire |
| `Enter` | ráfaga de Ki (**se autoapunta** al enemigo más cercano) |
| `Enter` mantenido ~1s | Kamehameha |
| `Shift` | cargar Ki — **te va subiendo de transformación sola** |
| `X` | dash |
| `1` a `8` | transformarse a mano |
| `F` | Kaioken |
| `M` / `P` | silenciar / pausa |

## Detalles de pelea

- **Los poderes chocan entre sí.** Si tu ráfaga cruza con la del enemigo, se
  anulan las dos. Si la tuya es más del doble de fuerte, la atraviesa pero
  pierde daño.
- **La ráfaga se autoapunta**: sin eso, pegarle a los que vuelan es imposible.
- **Cargar Ki con Shift sube de forma**: cada 1,3 segundos pasás a la siguiente
  transformación que tengas desbloqueada y puedas pagar; cuando no quedan más,
  se apila el Kaioken encima.
- **El gi se rompe.** Arriba del 66% de vida está intacto; abajo del 66% se
  rasga y se ve la piel; abajo del 33% queda hecho jirones, sin la parte de
  arriba y con moretones.

## Sonido

Todo sintetizado con Web Audio: no hay un solo archivo de audio en el proyecto.
Los golpes son ruido blanco filtrado, los poderes son barridos de frecuencia, y
la música es un loop chiptune de bajo, melodía y percusión.

El **vuelo suena por ráfagas de aire** (pulsos cortos de ruido filtrado, cada
uno con un corte distinto). Un oscilador sostenido acá sonaba a pedo.

Hay un **grito** sintetizado —sierra con vibrato pasando por dos formantes de
vocal abierta— que suena al transformarse y mientras cargás Ki. No es una voz
de verdad (para eso harían falta samples) pero se lee como alguien gritando.

El navegador no deja sonar nada hasta que tocás una tecla, así que el audio
arranca solo con el primer input.

## Cómo se ve así

Todo se dibuja en un canvas interno de **480×270** y se escala ×2 sin suavizado.
Esa sola decisión es la que da el look de consola de 16 bits: paleta limitada,
fuente bitmap de 5×7 hecha a mano, y nada de antialiasing en ningún lado.

Los sprites **no** se dibujan con rectángulos apilados en tiempo real: son
matrices de píxeles en `js/art.js`, generadas por los scripts de `tools/`.

```bash
python tools/gen_sprite.py            # ver la pose idle de Goku en ASCII
python tools/gen_sprite.py punch      # ver otra pose
python tools/gen_sprite.py --export   # escribir js/art.js
python tools/gen_enemigos.py --export # lo mismo para los enemigos
```

Los generadores dibujan con primitivas (elipses, triángulos) y **calculan el
contorno negro solos**. Eso es lo que hace que la silueta tenga forma —los picos
del pelo, los hombros, la cintura— en vez de parecer bloques pegados.
Para cambiar el aspecto de un personaje se toca el generador y se re-exporta,
nunca el `art.js` a mano.

## La campaña

Ocho sagas, una por nivel. Antes de cada una hay una **charla** entre Goku y un
aliado: los dos personajes en pantalla, el que habla se ilumina y el otro se
apaga con tramado, el texto sale letra por letra y se avanza con Enter.

| # | Saga | Jefe | Te deja |
|---|---|---|---|
| 1 | El demonio Piccolo | Piccolo | Kaioken |
| 2 | Llegan los Saiyajin | Vegeta | Kaioken x3 |
| 3 | El planeta Namek | Freezer | Super Saiyan |
| 4 | Los androides | Cell | Super Saiyan 2 |
| 5 | Majin Buu | Majin Buu | Super Saiyan 3 |
| 6 | Las esferas oscuras | Omega Shenron | Super Saiyan 4 |
| 7 | El torneo del poder | Jiren | SSJ God y Blue |
| 8 | **El cazador de mundos** | Draken | Ultra Instinto |

La saga 8 no existe en la serie: es un capítulo original. Draken cataloga
planetas y los vende, y ya copió todas las técnicas que te vio usar.

**Las transformaciones no se compran: despiertan.** Si el jefe te tiene contra
las cuerdas —o vos a él— se desbloquea sola la forma de esa saga, en el momento.
Si la pelea termina sin ese momento, igual la ganás al completar el nivel.

Las mejoras y las formas se acumulan de saga en saga. Morir te devuelve al
principio del nivel, no al principio del juego.

## Las esferas del dragón

Hay **7 escondidas en cada nivel**. Las pares están a un salto del piso; las
impares, a nueve tiles de altura: a esas **solo se llega volando**.

Si juntás las 7 antes de matar al jefe, aparece **Shenlong** — sale de las siete
esferas, se enrosca por toda la pantalla y te concede el deseo de esa saga, que
es una mejora permanente (más vida, más Ki, más daño o más velocidad). Si te
faltó alguna, el nivel termina igual pero sin dragón.

El deseo de la última saga es el que salva el universo.

## La idea central

El Ki es el único recurso: **cuanto más fuerte la forma, menos podés sostenerla.**

- Cada forma tiene costo de activación y drenaje por segundo.
- SSJ3 y Ultra Instinto drenan tanto que son ventanas de segundos.
- Kaioken se multiplica *sobre* la forma actual y te cuesta vida.
- SSJ God tiene poco drenaje y regenera: es la forma eficiente, no la más fuerte.
- El doble salto y el dash también gastan Ki, así que moverte compite con pegar.

## Estructura

```
index.html
css/style.css
js/
  config.js      resolución interna y constantes de física y vuelo
  audio.js       sonido y música sintetizados (sin archivos)
  pixel.js       paleta, primitivas pixel-perfect, fuente bitmap 5x7
  art.js         GENERADO — matrices de píxeles de Goku y los enemigos
  sprites.js     puente: qué matriz va con cada pose, y el aura
  input.js       teclado (acciones semánticas, no keycodes sueltos)
  ki.js          EL SISTEMA CENTRAL: Ki, formas, Kaioken
  entity.js      física de plataformas, proyectiles, efectos, hitstop
  enemy.js       plantillas e IA de los enemigos
  level.js       tilemap, colisiones, cámara, parallax
  player.js      Goku
  ui.js          HUD y pantallas
  main.js        loop a 60fps fijo y máquina de estados
  data/
    transformaciones.js  balance de todas las formas
    niveles.js           segmentos del terreno y carteles
    sagas.js             LA CAMPAÑA: las 8 sagas, sus jefes y sus deseos
tools/
  gen_sprite.py    genera 39 sprites de Goku (13 poses x 3 estados de ropa)
  gen_enemigos.py  genera los 22 personajes (jefes, tropa y aliados)
```

El nivel se arma con **segmentos de 20×22 tiles** diseñados a mano que se
concatenan. Así tiene ritmo (respiro, salto, pelea, respiro) en vez de ser
terreno generado al azar. Agregar una pantalla es agregar un bloque de texto.

## Qué hace que pegar se sienta

- **Hitstop**: al conectar, el juego se congela 4 frames (9 en el golpe final).
- Sacudón de cámara, destello blanco y chispas en el punto de impacto.
- El enemigo parpadea en blanco un frame entero.
- Combo de 3: el tercer golpe manda a volar y te devuelve Ki.
- La patada aérea rebota sobre el enemigo y te devuelve el doble salto.

## Estado actual

Andando:

- Nivel completo de 9 pantallas (2880px) con jefe final, verificado transitable
  de punta a punta.
- Física con momentum, coyote time, buffer de salto y salto variable.
- 12 poses animadas de Goku, 4 enemigos con IA distinta (melee que salta,
  tirador que mantiene distancia, volador, jefe con embestida y fases).
- Progresión: el Kaioken se desbloquea a las 3 bajas; el **Super Saiyan despierta
  solo** durante la pelea con Raditz, cuando estás por perder.
- Las 8 formas + Ozaru definidas y balanceadas; 3 desbloqueadas en este nivel.

Pendiente:

- Terreno propio por saga (hoy los 8 niveles comparten el trazado y cambian
  colores, tropa y jefe).
- Una pose de sprite propia para volar (hoy reusa las de salto y caída).
- Sprites de los enemigos restantes (Nappa, Freezer, Cell, Buu y los originales
  Draken, Nerva, Ozmar, Hueco ya están en el diseño pero no dibujados).
- Ozaru: la forma está balanceada pero falta el evento de luna llena.
- Guardado (no hay persistencia entre recargas).
