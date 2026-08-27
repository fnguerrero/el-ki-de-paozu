# TODO — 49 mejoras

Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecho y verificado · `[!]` bloqueado

## Andamiaje (previo a todo)

- [x] 00 · Banco de pruebas `test.js`: correr el juego sin manos (simular teclas, saltar a una saga, bot que juega, captura de píxeles) · verif: `Test.humo()` devuelve 0 errores desde la consola

## A. La escena de charla (lo que Nico marcó en la captura)

- [x] 01 ·  Rehacer Krilin: proporciones bajas correctas, calvo, 6 puntos, gi naranja con cinto azul · verif: ASCII del sprite + conteo de colores esperados
- [x] 02 ·  Rehacer Bulma, Trunks, Gohan y Pan con las mismas proporciones sanas · verif: los 4 exportan y dibujan sin error
- [x] 03 ·  Sacar el tramado de rejas: el que no habla se oscurece con paleta (tintas oscuras), no con líneas · verif: la zona del retrato pasivo no tiene filas negras puras
- [x] 04 ·  Fondo de charla en capas: cielo en bandas, nubes, 2 filas de cerros, con los colores de la saga · verif: muestreo de píxeles en 6 alturas da 6 colores distintos
- [x] 05 ·  Suelo de la charla con textura de pasto y tierra (no franja plana) · verif: hay al menos 3 colores distintos en la franja de suelo
- [x] 06 ·  Retratos más grandes y mejor compuestos (escala y posición según alto del sprite) · verif: ambos retratos entran completos en pantalla, sin recorte
- [x] 07 ·  Globo de diálogo con cola apuntando al que habla · verif: la cola cambia de lado según quién habla

## B. Gráficos del juego

- [x] 08 ·  Sombra proyectada bajo todos los personajes en el nivel · verif: píxel oscuro bajo los pies del jugador y de un enemigo
- [x] 09 ·  Tiles de tierra con bordes y esquinas (transición, no bloques planos) · verif: un tile con aire a la izquierda dibuja distinto que uno interior
- [x] 10 ·  Nubes con más formas y dos capas a distinta velocidad · verif: dos capas se mueven distinto al mover la cámara
- [x] 11 ·  Partículas de ambiente por saga (hojas, ceniza, nieve, chispas) · verif: cada saga tiene su tipo y aparecen partículas tras 2s
- [x] 12 ·  Chispas de impacto direccionales (salen hacia donde pega el golpe) · verif: al golpear a la derecha, las partículas tienen vx>0 en promedio
- [x] 13 ·  Estela de movimiento al dashear y al correr con sprint · verif: hay copias del sprite detrás durante el dash
- [x] 14 ·  Polvo de aterrizaje con anillo, según la velocidad de caída · verif: caída fuerte genera más partículas que caída suave
- [x] 15 ·  Enemigos golpeados parpadean en rojo, no en blanco puro · verif: el flash usa el color rojo de la paleta
- [x] 16 ·  Barra de vida del jefe con marco, retrato chico y nombre · verif: dibuja sin error y el retrato corresponde al jefe
- [x] 17 ·  Números de daño escalados según magnitud (golpe fuerte = número grande) · verif: daño 40 dibuja más ancho que daño 8

## C. Jugabilidad

- [x] 18 ·  Guardia: mantener abajo en el suelo reduce el daño a la mitad · verif: mismo golpe hace la mitad de daño con guardia
- [x] 19 ·  Golpe cargado: mantener espacio y soltar rompe la guardia y manda lejos · verif: el golpe cargado hace más daño y más empuje
- [x] 20 ·  Recuperación en el aire: apretar salto al salir despedido corta el knockback · verif: vy se corta al apretar arriba durante el stun
- [x] 21 ·  Cancelar el ataque con dash · verif: durante un ataque, el dash lo interrumpe
- [x] 22 ·  Combo aéreo: la patada permite encadenar otra si conectó · verif: dos patadas seguidas en el aire
- [x] 23 ·  Enemigos que bloquean de a ratos (reducen daño y no se aturden) · verif: un enemigo en guardia recibe menos daño
- [x] 24 ·  IA del jefe por fases, con patrones distintos (no aleatoria pura) · verif: la fase 3 usa ataques que la fase 1 no usa
- [x] 25 (mecanica verificada directo; el nivel actual no tiene paredes verticales, cobra efecto con el item 45) ·  Chocar contra una pared con knockback hace daño extra · verif: enemigo empujado contra pared pierde vida extra
- [x] 26 ·  La cámara se aleja al volar alto (más campo de visión) · verif: el offset de cámara cambia al subir
- [x] 27 ·  Checkpoint a mitad de nivel: morir reaparece ahí, no al principio · verif: tras pasar el checkpoint, revivir deja al jugador en él
- [x] 28 ·  Ítem de curación (cápsula roja) además del de Ki · verif: al tomarlo sube la vida
- [x] 29 ·  Los enemigos sueltan una chispa de Ki al morir que se puede recoger · verif: al morir un enemigo aparece un ítem
- [x] 30 ·  Freno derrape: soltar la dirección corriendo rápido deja marca y desliza · verif: la desaceleración es más larga con sprint

## D. Sonido

- [x] 31 ·  Pasos al correr, con cadencia según velocidad · verif: se llama el sonido cada N frames corriendo
- [x] 32 ·  Sonido distinto por tipo de golpe (puño, patada, final) · verif: los 3 existen y suenan distinto (frecuencias distintas)
- [x] 33 ·  Variación de música por saga (tono y tempo distintos) · verif: cada saga setea un tempo o escala distinta
- [x] 34 ·  Música de jefe: cambia cuando el jefe se activa · verif: al activarse el jefe cambia el patrón
- [x] 35 ·  Sonido de aterrizaje según fuerza de caída · verif: caída fuerte suena más grave
- [x] 36 ·  Grito corto al recibir un golpe fuerte · verif: se dispara con daño alto y no con daño bajo

## E. Interfaz

- [x] 37 ·  Flecha que apunta a la esfera más cercana no tomada · verif: la flecha rota hacia la esfera correcta
- [x] 38 ·  Barra de progreso del nivel con la posición del jugador y el jefe · verif: el marcador se mueve al avanzar
- [x] 39 ·  Pausa con estadísticas (bajas, esferas, forma, nivel) · verif: dibuja los datos reales de la partida
- [x] 40 ·  Aviso visual cuando el Ki está por agotarse (barra parpadea) · verif: con Ki < 20% la barra alterna color
- [x] 41 ·  Contador de combo con estilo y tiempo restante · verif: dibuja al encadenar 2+ golpes
- [x] 42 ·  Fundido a negro entre pantallas · verif: la transición tiene frames intermedios
- [x] 43 ·  Menú de título con selección de saga desbloqueada · verif: se puede arrancar en una saga ya superada

## F. Contenido

- [x] 44 ·  Orden de segmentos propio por saga (no todas el mismo trazado) · verif: dos sagas tienen mapas distintos
- [x] 45 ·  Tres segmentos de nivel nuevos (pozo, torres, pasillo aéreo) · verif: los 3 miden 20x22 y cargan
- [x] 46 ·  Ozaru jugable: evento de luna llena en la saga GT · verif: se activa y el jugador cambia de forma y tamaño
- [x] 47 ·  Ataque especial distinto por transformación · verif: base y SSJ disparan proyectiles distintos
- [x] 48 ·  Un enemigo nuevo propio por bloque de sagas · verif: aparece en el nivel y tiene sprite
- [x] 49 ·  Guardado del progreso en localStorage (sagas superadas, formas) · verif: guardar, recargar y leer devuelve lo guardado

## G. Correcciones al ver las capturas (no previstas en Fase 0)

- [x] 50 · El apagado del que no habla es tan fuerte que lo vuelve irreconocible: calcular el color en sombra manteniendo el tono · verif: el gi de Krilin apagado sigue leyendose naranja (canal R > B)
- [x] 51 · Krilin tiene la cabeza enorme respecto del cuerpo y no se le ven los 6 puntos · verif: la cabeza ocupa menos de 1/3 del alto y hay pixeles de los puntos
- [x] 52 · Demasiadas montanas iguales en la charla: hacen ruido y tapan a los personajes · verif: menos siluetas y con alturas variadas
- [x] 53 · Los personajes de la charla son chicos y estan muy separados · verif: mas grandes y mas cerca del centro

## H. Segunda ronda con capturas a la vista

- [x] 54 · El efecto de vuelo era una chispa suelta flotando abajo: estela hacia atras + ondas de sustentacion · verif: captura
- [x] 55 · Volaba con la animacion de salto: poses propias 'vuela' (flotando) y 'vuelaRapido' (horizontal de punta) · verif: pose correcta segun velocidad + captura
- [x] 56 · El aura era una elipse SOLIDA que tapaba al personaje: ahora es tramada, con llamas y sin aro-burbuja · verif: captura de las 6 formas
- [x] 57 · Cargar Ki tambien volando, quedando suspendido en el aire · verif: Ki 34 -> 146 volando, pose charge
- [x] 58 · Al llenar el Ki pasa solo a la forma siguiente: fase 1, 2, 3... encadenadas sin soltar la tecla · verif: base -> ssj1 -> ssj2 -> ssj3 -> ssj4 -> dios cargando
- [x] 59 · Rayos electricos desde SSJ1 (antes solo SSJ2+), que nacen del cuerpo y se ramifican · verif: las 6 formas con rayos + captura
- [x] 60 · Grito con distorsion, tres armonicos y formantes que se abren · verif: suena sin errores, WaveShaper aplicado
- [x] 61 · Gesto de carga: codos flexionados y punos cerrados adelante · verif: sprite regenerado
- [x] 62 · El HUD de abajo se amontonaba y tapaba el nivel: una linea sobre franja oscura, progreso arriba a la derecha · verif: captura
- [x] 63 · Dos bugs vistos en captura: 'UNDEFINED HITS' en el combo y el nombre de saga cortado en el borde · verif: ya no aparecen
