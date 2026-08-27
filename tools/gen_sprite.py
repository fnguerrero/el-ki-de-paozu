# -*- coding: utf-8 -*-
"""Genera los sprites de Goku y los exporta a js/art.js.

Se dibuja con primitivas (elipses, triangulos, rectangulos) y el contorno negro
se calcula solo al final. Sale una silueta mucho mejor que escribir los bordes
a mano, y permite generar todas las poses variando brazos y piernas.

    python tools/gen_sprite.py            -> muestra la pose idle en ASCII
    python tools/gen_sprite.py run1       -> muestra esa pose
    python tools/gen_sprite.py --export   -> escribe js/art.js
"""
import io
import re
import sys

W, H = 40, 40
OFFX = 7   # margen a los lados para brazos y piernas extendidos


# --------------------------------------------------------------------- lienzo
def lienzo():
    return [['.' for _ in range(W)] for _ in range(H)]


def pon(g, x, y, c):
    x, y = int(round(x)) + OFFX, int(round(y))
    if 0 <= x < W and 0 <= y < H:
        g[y][x] = c


def rect(g, x0, y0, x1, y1, c):
    for y in range(int(y0), int(y1) + 1):
        for x in range(int(x0), int(x1) + 1):
            pon(g, x, y, c)


def elipse(g, cx, cy, rx, ry, c, ymax=None):
    for y in range(int(cy - ry), int(cy + ry) + 1):
        if ymax is not None and y > ymax:
            continue
        dy = (y - cy) / float(ry)
        if abs(dy) > 1:
            continue
        ancho = rx * (1 - dy * dy) ** 0.5
        for x in range(int(round(cx - ancho)), int(round(cx + ancho)) + 1):
            pon(g, x, y, c)


def triangulo(g, p0, p1, p2, c):
    xs = [p0[0], p1[0], p2[0]]
    ys = [p0[1], p1[1], p2[1]]

    def area(a, b, cc):
        return (b[0] - a[0]) * (cc[1] - a[1]) - (b[1] - a[1]) * (cc[0] - a[0])

    for y in range(int(min(ys)), int(max(ys)) + 1):
        for x in range(int(min(xs)), int(max(xs)) + 1):
            p = (x + 0.5, y + 0.5)
            d0, d1, d2 = area(p0, p1, p), area(p1, p2, p), area(p2, p0, p)
            if not (((d0 < 0) or (d1 < 0) or (d2 < 0)) and ((d0 > 0) or (d1 > 0) or (d2 > 0))):
                pon(g, x, y, c)


def contorno(g, tinta='K'):
    """Rodea con 1px negro todo lo que se haya dibujado."""
    lleno = [[g[y][x] != '.' for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if lleno[y][x]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and lleno[ny][nx]:
                    g[y][x] = tinta
                    break


def volcar(g):
    return [''.join(f) for f in g]


# --------------------------------------------------------------------- cabeza
def cabeza(g, dy=0, ix=0, expresion='normal'):
    # Cara grande, para que el pelo no se la coma
    elipse(g, 13 + ix, 17 + dy, 5.5, 6.2, 'S')
    # Domo del pelo, solo por encima de la frente
    elipse(g, 13 + ix, 12 + dy, 6.5, 4.0, 'P', ymax=12 + dy)
    rect(g, 7 + ix, 11 + dy, 7 + ix, 15 + dy, 'P')     # patilla izq
    rect(g, 19 + ix, 11 + dy, 19 + ix, 15 + dy, 'P')   # patilla der
    # Picos: base ancha sobre el craneo, punta fina, abiertos en abanico
    picos = [
        ((3, 13), (9, 13), (2, 7)),
        ((5, 13), (12, 13), (5, 3)),
        ((9, 13), (16, 13), (11, 1)),
        ((13, 13), (20, 13), (18, 4)),
        ((16, 13), (23, 13), (23, 8)),
    ]
    for a, b, pk in picos:
        triangulo(g,
                  (a[0] + ix, a[1] + dy),
                  (b[0] + ix, b[1] + dy),
                  (pk[0] + ix, pk[1] + dy), 'P')
    # Mechon en el centro de la frente
    triangulo(g, (11 + ix, 12 + dy), (15 + ix, 12 + dy), (13 + ix, 16 + dy), 'P')
    if expresion == 'esfuerzo':
        # Cejas fruncidas en diagonal hacia el centro: es lo que lee como furia
        rect(g, 8 + ix, 16 + dy, 10 + ix, 16 + dy, 'P')
        rect(g, 10 + ix, 17 + dy, 11 + ix, 17 + dy, 'P')
        rect(g, 16 + ix, 16 + dy, 18 + ix, 16 + dy, 'P')
        rect(g, 15 + ix, 17 + dy, 16 + ix, 17 + dy, 'P')
        # Ojos entrecerrados
        rect(g, 9 + ix, 18 + dy, 10 + ix, 19 + dy, 'W')
        rect(g, 10 + ix, 18 + dy, 10 + ix, 19 + dy, 'O')
        rect(g, 16 + ix, 18 + dy, 17 + ix, 19 + dy, 'W')
        rect(g, 16 + ix, 18 + dy, 16 + ix, 19 + dy, 'O')
        # Boca abierta gritando
        rect(g, 11 + ix, 21 + dy, 15 + ix, 22 + dy, 'r')
        rect(g, 12 + ix, 21 + dy, 14 + ix, 21 + dy, 'K')
    else:
        # Cejas cortas
        rect(g, 9 + ix, 16 + dy, 10 + ix, 16 + dy, 'P')
        rect(g, 16 + ix, 16 + dy, 17 + ix, 16 + dy, 'P')
        # Ojos de 2px con la pupila hacia el centro
        rect(g, 9 + ix, 17 + dy, 10 + ix, 19 + dy, 'W')
        rect(g, 10 + ix, 17 + dy, 10 + ix, 19 + dy, 'O')
        rect(g, 16 + ix, 17 + dy, 17 + ix, 19 + dy, 'W')
        rect(g, 16 + ix, 17 + dy, 16 + ix, 19 + dy, 'O')
        # Boca
        rect(g, 12 + ix, 21 + dy, 14 + ix, 21 + dy, 's')


# ---------------------------------------------------------------------- torso
def torso(g, dy=0, ix=0, dano=0):
    """dano 0 = gi entero, 1 = roto, 2 = hecho jirones."""
    rect(g, 11 + ix, 23 + dy, 15 + ix, 24 + dy, 'S')      # cuello
    rect(g, 10 + ix, 24 + dy, 16 + ix, 25 + dy, 'A')

    # Hombros anchos que bajan a una cintura fina: eso da el cuerpo trabajado
    anchos = [6, 6, 6, 5, 5, 5, 4, 4]
    for i, y in enumerate(range(25, 33)):
        w = anchos[i]
        rect(g, 13 - w + ix, y + dy, 13 + w + ix, y + dy, 'N')

    # Pectorales y abdominales marcados con la sombra del gi
    rect(g, 13 + ix, 26 + dy, 13 + ix, 29 + dy, 'n')      # linea del medio
    rect(g, 9 + ix, 29 + dy, 17 + ix, 29 + dy, 'n')       # bajo los pectorales
    rect(g, 10 + ix, 31 + dy, 11 + ix, 31 + dy, 'n')      # abdominales
    rect(g, 15 + ix, 31 + dy, 16 + ix, 31 + dy, 'n')

    if dano == 0:
        triangulo(g, (10 + ix, 25 + dy), (16 + ix, 25 + dy), (13 + ix, 28 + dy), 'A')
        rect(g, 9 + ix, 27 + dy, 11 + ix, 29 + dy, 'W')   # emblema
        rect(g, 10 + ix, 28 + dy, 10 + ix, 28 + dy, 'r')
    elif dano == 1:
        # Gi rasgado: se ve la piel por los cortes y el emblema quedo a medias
        triangulo(g, (10 + ix, 25 + dy), (16 + ix, 25 + dy), (13 + ix, 28 + dy), 'A')
        rect(g, 9 + ix, 27 + dy, 10 + ix, 29 + dy, 'W')
        rect(g, 15 + ix, 27 + dy, 17 + ix, 28 + dy, 'S')  # tajo en el costado
        rect(g, 16 + ix, 30 + dy, 17 + ix, 31 + dy, 'S')
        rect(g, 8 + ix, 30 + dy, 9 + ix, 30 + dy, 'S')
        rect(g, 15 + ix, 26 + dy, 16 + ix, 26 + dy, 's')  # magulladura
    else:
        # Sin la parte de arriba: torso descubierto y jirones colgando
        for i, y in enumerate(range(25, 31)):
            w = anchos[i]
            rect(g, 13 - w + ix, y + dy, 13 + w + ix, y + dy, 'S')
        # Pectorales y abdominales, ahora sobre la piel
        rect(g, 13 + ix, 26 + dy, 13 + ix, 29 + dy, 's')
        rect(g, 9 + ix, 28 + dy, 17 + ix, 28 + dy, 's')
        rect(g, 10 + ix, 30 + dy, 11 + ix, 30 + dy, 's')
        rect(g, 15 + ix, 30 + dy, 16 + ix, 30 + dy, 's')
        # Lo que queda del gi: unos jirones sobre los hombros
        rect(g, 7 + ix, 25 + dy, 9 + ix, 27 + dy, 'N')
        rect(g, 17 + ix, 25 + dy, 19 + ix, 26 + dy, 'N')
        rect(g, 8 + ix, 28 + dy, 8 + ix, 29 + dy, 'n')
        # Moretones
        rect(g, 11 + ix, 27 + dy, 12 + ix, 27 + dy, 'r')
        rect(g, 15 + ix, 31 + dy, 16 + ix, 31 + dy, 'r')

    # Cinturon (aguanta hasta el final, pero se descose)
    rect(g, 9 + ix, 31 + dy, 17 + ix, 32 + dy, 'A')
    rect(g, 9 + ix, 33 + dy, 17 + ix, 33 + dy, 'a')
    if dano == 2:
        rect(g, 16 + ix, 31 + dy, 17 + ix, 32 + dy, 'S')


# --------------------------------------------------------------------- brazos
BRAZOS = {
    # (x0, y0, x1, y1, tinta) para el brazo de atras y el de adelante
    'idle': [(5, 26, 7, 30, 'N'), (5, 31, 7, 31, 'A'), (5, 32, 7, 34, 'S'),
             (19, 26, 21, 30, 'N'), (19, 31, 21, 31, 'A'), (19, 32, 21, 34, 'S')],
    'corriendo': [(5, 25, 7, 29, 'N'), (5, 30, 7, 30, 'A'), (5, 31, 7, 33, 'S'),
                  (19, 27, 21, 31, 'N'), (19, 32, 21, 32, 'A'), (19, 33, 21, 35, 'S')],
    'arriba': [(5, 24, 7, 28, 'N'), (5, 29, 7, 29, 'A'), (5, 30, 7, 32, 'S'),
               (19, 23, 21, 27, 'N'), (19, 28, 21, 28, 'A'), (19, 29, 21, 31, 'S')],
    # LA PIÑA: brazo estirado a fondo, punio grande al final, y el otro brazo
    # recogido contra el cuerpo (contrapeso, como al tirar un golpe de verdad).
    'golpe': [(4, 28, 7, 31, 'N'), (4, 32, 7, 33, 'S'),
              (19, 26, 24, 29, 'N'),        # hombro y biceps salen del torso
              (24, 26, 25, 29, 'A'),        # muñequera
              (25, 26, 28, 29, 'S'),        # antebrazo estirado
              (28, 25, 31, 30, 'S')],       # punio: mas alto y mas ancho
    # Anticipacion: el brazo va atras y el cuerpo se carga antes de soltarla.
    'golpe_prep': [(2, 26, 6, 29, 'N'), (1, 26, 3, 30, 'S'),
                   (16, 28, 19, 31, 'N'), (16, 32, 19, 33, 'S')],
    # Gesto de carga: codos flexionados hacia atras y los dos punos cerrados
    # adelante, a la altura de la cintura. Es la pose de juntar Ki.
    'carga': [(4, 26, 7, 29, 'N'), (4, 29, 6, 31, 'N'),      # brazo izq flexionado
              (5, 31, 8, 32, 'A'),                           # muñequera
              (5, 32, 9, 35, 'S'),                           # puño cerrado
              (19, 26, 22, 29, 'N'), (20, 29, 22, 31, 'N'),
              (18, 31, 21, 32, 'A'),
              (17, 32, 21, 35, 'S')],
    # Las dos manos juntas al frente
    'ki': [(7, 28, 9, 30, 'N'), (7, 31, 9, 32, 'S'),
           (19, 27, 22, 30, 'N'), (22, 28, 24, 30, 'S')],
    'dolor': [(4, 25, 6, 29, 'N'), (4, 30, 6, 32, 'S'),
              (20, 25, 22, 29, 'N'), (20, 30, 22, 32, 'S')],
    # Flotando: los brazos caen abiertos, ni tensos ni pegados al cuerpo
    'flota': [(3, 27, 5, 31, 'N'), (3, 32, 5, 33, 'A'), (2, 34, 5, 36, 'S'),
              (21, 27, 23, 31, 'N'), (21, 32, 23, 33, 'A'), (21, 34, 24, 36, 'S')],
}


def brazos(g, modo, dy=0, dano=0):
    for x0, y0, x1, y1, c in BRAZOS[modo]:
        # Con el gi roto las mangas desaparecen: queda el brazo desnudo
        if dano >= 1 and c == 'N' and y1 - y0 >= 3:
            c = 'S' if dano == 2 else c
        rect(g, x0, y0 + dy, x1, y1 + dy, c)
        # Biceps marcado
        if c in ('S', 'N') and y1 - y0 >= 3:
            rect(g, x0, y0 + dy + 1, x0, y0 + dy + 2, 's' if c == 'S' else 'n')


# -------------------------------------------------------------------- piernas
def piernas(g, modo, dy=0, dano=0):
    if modo == 'idle':
        rect(g, 9, 34 + dy, 12, 37 + dy, 'N')
        rect(g, 14, 34 + dy, 17, 37 + dy, 'N')
        rect(g, 9, 38 + dy, 12, 39, 'A')
        rect(g, 14, 38 + dy, 17, 39, 'A')

    elif modo == 'juntas':
        rect(g, 10, 34 + dy, 13, 37 + dy, 'N')
        rect(g, 14, 34 + dy, 17, 37 + dy, 'N')
        rect(g, 9, 38 + dy, 13, 39, 'A')
        rect(g, 14, 38 + dy, 18, 39, 'A')

    elif modo == 'paso+':      # pierna de adelante estirada al frente
        rect(g, 13, 34 + dy, 16, 36 + dy, 'N')
        rect(g, 15, 36 + dy, 19, 38 + dy, 'N')
        rect(g, 17, 38 + dy, 21, 39, 'A')
        rect(g, 8, 34 + dy, 11, 38 + dy, 'N')
        rect(g, 6, 38 + dy, 11, 39, 'A')

    elif modo == 'paso-':      # la otra mitad del ciclo
        rect(g, 10, 34 + dy, 13, 36 + dy, 'N')
        rect(g, 7, 36 + dy, 11, 38 + dy, 'N')
        rect(g, 5, 38 + dy, 10, 39, 'A')
        rect(g, 15, 34 + dy, 18, 38 + dy, 'N')
        rect(g, 15, 38 + dy, 20, 39, 'A')

    elif modo == 'flota':      # piernas juntas y algo dobladas, colgando
        rect(g, 10, 34 + dy, 13, 38 + dy, 'N')
        rect(g, 14, 34 + dy, 17, 38 + dy, 'N')
        rect(g, 10, 38 + dy, 14, 39, 'A')
        rect(g, 14, 38 + dy, 18, 39, 'A')

    elif modo == 'salto':      # una recogida, la otra estirada abajo
        rect(g, 14, 33 + dy, 18, 35 + dy, 'N')
        rect(g, 17, 35 + dy, 20, 37 + dy, 'N')
        rect(g, 18, 37 + dy, 22, 38 + dy, 'A')
        rect(g, 9, 34 + dy, 12, 38 + dy, 'N')
        rect(g, 8, 38 + dy, 12, 39, 'A')

    elif modo == 'empuje':     # de atras empuja estirada, la de adelante frena
        rect(g, 14, 34 + dy, 18, 37 + dy, 'N')
        rect(g, 17, 37 + dy, 21, 39, 'A')
        rect(g, 6, 34 + dy, 11, 37 + dy, 'N')
        rect(g, 2, 37 + dy, 8, 39, 'A')

    elif modo == 'patada':     # pierna de adelante en horizontal
        rect(g, 14, 32 + dy, 21, 35 + dy, 'N')
        rect(g, 20, 32 + dy, 25, 35 + dy, 'A')
        rect(g, 9, 34 + dy, 12, 38 + dy, 'N')
        rect(g, 8, 38 + dy, 12, 39, 'A')


# ----------------------------------------------------------------------- poses
POSES = {
    'idle':   {'brazos': 'idle',      'piernas': 'idle',   'dy': 0,  'ix': 0},
    'run1':   {'brazos': 'corriendo', 'piernas': 'paso+',  'dy': 0,  'ix': 1},
    'run2':   {'brazos': 'idle',      'piernas': 'juntas', 'dy': -1, 'ix': 1},
    'run3':   {'brazos': 'arriba',    'piernas': 'paso-',  'dy': 0,  'ix': 1},
    'run4':   {'brazos': 'idle',      'piernas': 'juntas', 'dy': -1, 'ix': 1},
    'jump':   {'brazos': 'arriba',    'piernas': 'salto',  'dy': 0,  'ix': 1},
    'fall':   {'brazos': 'arriba',    'piernas': 'salto',  'dy': 0,  'ix': 0},
    'punch':  {'brazos': 'golpe',      'piernas': 'empuje', 'dy': 0,  'ix': 3, 'cara': 'esfuerzo'},
    'punch_prep': {'brazos': 'golpe_prep', 'piernas': 'juntas', 'dy': 1, 'ix': -2, 'cara': 'esfuerzo'},
    'patada': {'brazos': 'dolor',     'piernas': 'patada', 'dy': 0,  'ix': -1},
    'charge': {'brazos': 'carga',     'piernas': 'juntas', 'dy': 0,  'ix': 0},
    'ki':     {'brazos': 'ki',        'piernas': 'paso+',  'dy': 0,  'ix': 1},
    'hurt':   {'brazos': 'dolor',     'piernas': 'juntas', 'dy': 1,  'ix': -2},
    'vuela':  {'brazos': 'flota',     'piernas': 'flota',  'dy': -1, 'ix': 0},
    'vuelaRapido': {'brazos': 'idle',  'piernas': 'idle',   'dy': 0,  'ix': 0},
}


def vuela_rapido(dano=0):
    """Volando a fondo: el cuerpo acostado y de punta, como en la serie.

    Se dibuja aparte de la maquinaria de brazos/piernas porque el eje largo del
    cuerpo es horizontal. La clave para que se lea es que cada parte tenga su
    propia altura: brazo arriba, torso al medio, piernas abajo. Si va todo a la
    misma altura queda un bloque naranja.
    """
    g = lienzo()
    Y = 18

    # --- Brazo estirado al frente, arriba del eje ---
    rect(g, 24, Y - 7, 31, Y - 4, 'S' if dano == 2 else 'N')
    rect(g, 30, Y - 7, 32, Y - 4, 'A')            # muñequera
    rect(g, 32, Y - 8, 36, Y - 3, 'S')            # puño

    # --- Torso, en el medio ---
    if dano == 2:
        rect(g, 13, Y - 3, 24, Y + 3, 'S')
        rect(g, 14, Y, 23, Y + 1, 's')
        rect(g, 13, Y - 3, 16, Y - 1, 'N')        # jirones de gi
    else:
        rect(g, 13, Y - 3, 24, Y + 3, 'N')
        rect(g, 14, Y + 1, 23, Y + 2, 'n')        # sombra debajo
        rect(g, 20, Y - 3, 24, Y - 1, 'A')        # camiseta azul en el pecho
        if dano == 0:
            rect(g, 16, Y - 1, 18, Y + 1, 'W')    # emblema
            rect(g, 17, Y, 17, Y, 'r')
    rect(g, 11, Y - 3, 13, Y + 3, 'A')            # cinturon

    # --- Piernas juntas hacia atras, abajo del eje ---
    rect(g, 3, Y + 1, 12, Y + 4, 'N' if dano != 2 else 'N')
    rect(g, 3, Y + 4, 11, Y + 6, 'n')
    rect(g, 1, Y + 1, 5, Y + 6, 'A')              # botas

    # --- Brazo de atras, pegado al cuerpo y mas abajo ---
    rect(g, 15, Y + 3, 21, Y + 5, 'S' if dano == 2 else 'N')

    # --- Cabeza al frente, mirando adelante ---
    elipse(g, 26, Y + 1, 4, 4, 'S')
    rect(g, 28, Y, 29, Y + 1, 'W')                # ojo
    rect(g, 29, Y, 29, Y + 1, 'O')
    rect(g, 26, Y + 4, 28, Y + 4, 's')            # boca

    # --- Pelo tirado hacia atras por el viento ---
    rect(g, 21, Y - 4, 27, Y + 1, 'P')
    for y0, largo in [(-4, 11), (-2, 14), (0, 12), (2, 8)]:
        triangulo(g, (22, Y + y0), (24, Y + y0 + 2), (22 - largo, Y + y0 - 2), 'P')

    contorno(g)
    return volcar(g)


def construir(pose='idle', dano=0):
    if pose == 'vuelaRapido':
        return vuela_rapido(dano)
    cfg = POSES[pose]
    dy, ix = cfg['dy'], cfg['ix']
    g = lienzo()
    cabeza(g, dy, ix, cfg.get('cara', 'normal'))
    torso(g, dy, ix, dano)
    brazos(g, cfg['brazos'], dy, dano)
    piernas(g, cfg['piernas'], dy, dano)
    # Rasguños en las piernas cuando esta muy golpeado
    if dano == 2:
        rect(g, 10, 35 + dy, 11, 36 + dy, 'S')
        rect(g, 16, 36 + dy, 17, 37 + dy, 'S')
    contorno(g)
    return volcar(g)


def bloque(nombre, filas):
    return "  %s: [\n%s\n  ]" % (nombre, ',\n'.join("    '%s'" % f for f in filas))


if __name__ == '__main__':
    if '--export' in sys.argv:
        # Cada pose en tres estados: entero, roto y hecho jirones
        sprites = []
        for n in POSES:
            sprites.append((n, construir(n, 0)))
            sprites.append((n + '_r1', construir(n, 1)))
            sprites.append((n + '_r2', construir(n, 2)))
        ruta = 'js/art.js'
        s = io.open(ruta, encoding='utf-8').read()
        nuevo = 'const GOKU = {\n' + ',\n\n'.join(bloque(n, f) for n, f in sprites) + '\n};'
        s = re.sub(r"const GOKU = \{.*?\n\};", nuevo, s, flags=re.S)
        io.open(ruta, 'w', encoding='utf-8').write(s)
        print('exportado: %d poses de %dx%d' % (len(sprites), W, H))
    else:
        pose = sys.argv[1] if len(sys.argv) > 1 else 'idle'
        dano = int(sys.argv[2]) if len(sys.argv) > 2 else 0
        for i, f in enumerate(construir(pose, dano)):
            print('%2d %s' % (i, f))
