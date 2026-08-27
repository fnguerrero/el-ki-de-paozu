# -*- coding: utf-8 -*-
"""Genera los sprites de todos los enemigos y los exporta a js/art.js.

Casi todos salen de `humanoide()`, que arma el cuerpo base con las proporciones
del sprite de Goku. Cada personaje agrega encima solo lo que lo hace
reconocible: el turbante de Piccolo, el pelo en llama de Vegeta, los cuernos de
Freezer. A 30-40px de alto lo unico que se lee es la silueta.

    python tools/gen_enemigos.py piccolo   -> muestra ese sprite en ASCII
    python tools/gen_enemigos.py --export  -> escribe js/art.js
"""
import io
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_sprite as gs


def lienzo(w, h, offx=0):
    gs.W, gs.H, gs.OFFX = w, h, offx
    return gs.lienzo()


# ---------------------------------------------------------------------------
# Cuerpo base. cx = centro horizontal, base = fila de los pies.
# ---------------------------------------------------------------------------
def humanoide(g, cx, base, pose, o):
    """Cuerpo base con las proporciones del sprite de Goku, que son las que
    quedaron bien.

    `alto` es el alto TOTAL del personaje en pixeles y todo se calcula como
    fraccion de eso: por eso un personaje bajito sale bajito y proporcionado,
    en vez de achatado y ancho como pasaba antes al escalar solo el eje Y.
    """
    r, e = gs.rect, gs.elipse
    piel = o.get('piel', 'S')
    traje = o.get('traje', 'V')
    trajeS = o.get('trajeS', 'v')
    alto = o.get('alto', 40)
    corpulencia = o.get('corpulencia', 1.0)

    def Y(frac):
        return int(round(base - alto * frac))

    def A(frac):
        return max(1, int(round(alto * frac * corpulencia)))

    # Medidas, todas como fraccion del alto
    semiHombro = A(0.155)
    semiCintura = A(0.115)
    semiPierna = A(0.042)
    brazoAncho = A(0.075)
    cabezaR = int(round(alto * 0.135))

    yHombro, yCintura = Y(0.375), Y(0.175)
    yPiernaFin, yBota = Y(0.06), Y(0.0)

    paso = 0 if pose in ('idle', 'ataca') else (A(0.07) if pose == 'run1' else -A(0.07))

    # --- Piernas: dos, separadas, con bota ---
    sepP = A(0.085)
    r(g, cx - sepP - semiPierna, yCintura, cx - sepP + semiPierna, yPiernaFin, traje)
    r(g, cx + sepP - semiPierna, yCintura, cx + sepP + semiPierna, yPiernaFin, traje)
    bota = o.get('bota', trajeS)
    r(g, cx - sepP - semiPierna - 1 - max(0, paso), yPiernaFin, cx - sepP + semiPierna, yBota, bota)
    r(g, cx + sepP - semiPierna, yPiernaFin, cx + sepP + semiPierna + 1 + max(0, -paso), yBota, bota)

    # --- Torso: hombros anchos que bajan a la cintura ---
    filas = max(1, yCintura - yHombro)
    for k in range(filas + 1):
        f = k / float(filas)
        w = int(round(semiHombro + (semiCintura - semiHombro) * f))
        r(g, cx - w, yHombro + k, cx + w, yHombro + k, traje)

    if o.get('peto'):
        r(g, cx - semiHombro - 1, yHombro, cx + semiHombro + 1, Y(0.29), o['peto'])
        r(g, cx - semiHombro - 1, Y(0.29), cx + semiHombro + 1, Y(0.275), 'n')
    if o.get('cinto'):
        r(g, cx - semiCintura - 1, Y(0.20), cx + semiCintura + 1, yCintura, o['cinto'])

    # --- Brazos ---
    # Dos pixeles de separacion, no uno: con uno el contorno automatico no
    # entra y la manga se fusiona con el torso (quedaba un bloque de color).
    bx = semiHombro + 2
    dy = A(0.03) if pose == 'run1' else 0
    if pose == 'ataca':
        # Brazo de adelante extendido
        r(g, cx + bx - 1, Y(0.33), cx + bx + A(0.22), Y(0.33) + brazoAncho, piel)
        r(g, cx - bx - brazoAncho, Y(0.34) , cx - bx, Y(0.20), piel)
    else:
        r(g, cx - bx - brazoAncho, Y(0.35) - dy, cx - bx, Y(0.16) - dy, piel)
        r(g, cx + bx, Y(0.35) + dy, cx + bx + brazoAncho, Y(0.16) + dy, piel)
        # Manga del traje en la mitad de arriba del brazo
        if o.get('manga', True):
            r(g, cx - bx - brazoAncho, Y(0.35) - dy, cx - bx, Y(0.26) - dy, traje)
            r(g, cx + bx, Y(0.35) + dy, cx + bx + brazoAncho, Y(0.26) + dy, traje)

    # --- Cabeza ---
    cy = Y(0.375) - cabezaR - 1
    e(g, cx, cy, cabezaR, cabezaR + 1, piel)
    ojo = o.get('ojo', 'O')
    oy = cy - max(1, cabezaR // 3)
    r(g, cx - cabezaR + 1, oy, cx - cabezaR + 2, oy + 1, 'W')
    r(g, cx - cabezaR + 2, oy, cx - cabezaR + 2, oy + 1, ojo)
    r(g, cx + cabezaR - 2, oy, cx + cabezaR - 1, oy + 1, 'W')
    r(g, cx + cabezaR - 2, oy, cx + cabezaR - 2, oy + 1, ojo)
    # Boca
    r(g, cx - 2, cy + cabezaR - 2, cx + 2, cy + cabezaR - 2, o.get('boca', 's'))
    return cx, cy, cabezaR


# ---------------------------------------------------------------------------
# Jefes de cada saga
# ---------------------------------------------------------------------------
def piccolo(pose='idle'):
    g = lienzo(30, 40)
    r, t = gs.rect, gs.triangulo
    cx, cy, cr = humanoide(g, 15, 39, pose, {
        'piel': 'G', 'traje': 'V', 'trajeS': 'v', 'cinto': 'g',
        'alto': 38, 'corpulencia': 1.0, 'ojo': 'R'
    })
    # Capa y turbante: su silueta es esa, no el cuerpo
    r(g, cx - 9, cy + 4, cx - 6, 34, 'H')
    r(g, cx + 6, cy + 4, cx + 9, 34, 'H')
    r(g, cx - 7, cy - 6, cx + 7, cy - 2, 'H')
    r(g, cx - 7, cy - 2, cx + 7, cy - 1, 'n')
    r(g, cx - 4, cy + 3, cx + 4, cy + 4, 'g')
    r(g, cx - 3, cy - 8, cx - 2, cy - 6, 'G')
    r(g, cx + 2, cy - 8, cx + 3, cy - 6, 'G')
    gs.contorno(g)
    return gs.volcar(g)


def vegeta(pose='idle'):
    g = lienzo(30, 36)
    r, t = gs.rect, gs.triangulo
    cx, cy, cr = humanoide(g, 15, 35, pose, {
        'piel': 'S', 'traje': 'A', 'trajeS': 'a', 'peto': 'H',
        'bota': 'H', 'alto': 34, 'corpulencia': 1.05
    })
    # Pelo en llama: dos picos altos y rectos
    t(g, (cx - 5, cy - 3), (cx + 5, cy - 3), (cx - 1, cy - 16), 'P')
    t(g, (cx - 1, cy - 3), (cx + 6, cy - 3), (cx + 5, cy - 12), 'P')
    r(g, cx - 5, cy - 4, cx + 5, cy - 2, 'P')
    r(g, cx - 3, cy + 3, cx + 3, cy + 3, 's')
    gs.contorno(g)
    return gs.volcar(g)


def nappa(pose='idle'):
    g = lienzo(34, 44)
    r = gs.rect
    cx, cy, cr = humanoide(g, 17, 43, pose, {
        'piel': 'S', 'traje': 'A', 'trajeS': 'a', 'peto': 'H',
        'bota': 'H', 'alto': 42, 'corpulencia': 1.35
    })
    r(g, cx - 4, cy + 3, cx + 4, cy + 4, 's')
    r(g, cx - 5, cy + 3, cx + 5, cy + 3, 'P')
    gs.contorno(g)
    return gs.volcar(g)


def freezer(pose='idle'):
    g = lienzo(32, 38)
    r, e, t = gs.rect, gs.elipse, gs.triangulo
    cx, cy, cr = humanoide(g, 16, 37, pose, {
        'piel': 'H', 'traje': 'H', 'trajeS': 'n', 'alto': 36, 'corpulencia': 0.95, 'ojo': 'R'
    })
    # Placas moradas del pecho, hombros y craneo
    r(g, cx - 5, cy + 7, cx + 5, cy + 12, 'V')
    r(g, cx - 7, cy + 6, cx - 5, cy + 9, 'V')
    r(g, cx + 5, cy + 6, cx + 7, cy + 9, 'V')
    e(g, cx, cy - 2, 5, 4, 'V')
    t(g, (cx - 6, cy - 2), (cx - 3, cy - 2), (cx - 9, cy - 6), 'H')
    t(g, (cx + 3, cy - 2), (cx + 6, cy - 2), (cx + 9, cy - 6), 'H')
    r(g, cx + 6, 30, cx + 11, 32, 'H')
    r(g, cx + 10, 24, cx + 12, 31, 'H')
    r(g, cx - 3, cy + 3, cx + 3, cy + 3, 'r')
    gs.contorno(g)
    return gs.volcar(g)


def cell(pose='idle'):
    g = lienzo(34, 42)
    r, t = gs.rect, gs.triangulo
    cx, cy, cr = humanoide(g, 17, 41, pose, {
        'piel': 'G', 'traje': 'G', 'trajeS': 'g', 'alto': 40, 'corpulencia': 1.15, 'ojo': 'R'
    })
    for (px, py) in [(-5, 8), (2, 10), (-2, 14), (4, 16), (-6, 17)]:
        r(g, cx + px, cy + py, cx + px + 2, cy + py + 2, 'm')
    r(g, cx - 4, cy + 6, cx + 4, cy + 8, 'H')
    t(g, (cx - 7, cy + 5), (cx - 7, cy + 14), (cx - 13, cy + 2), 'g')
    t(g, (cx + 7, cy + 5), (cx + 7, cy + 14), (cx + 13, cy + 2), 'g')
    t(g, (cx - 5, cy - 3), (cx - 1, cy - 3), (cx - 5, cy - 11), 'G')
    t(g, (cx + 1, cy - 3), (cx + 5, cy - 3), (cx + 5, cy - 11), 'G')
    r(g, cx - 5, cy - 3, cx + 5, cy - 1, 'm')
    gs.contorno(g)
    return gs.volcar(g)


def majinbuu(pose='idle'):
    g = lienzo(36, 42)
    r, e = gs.rect, gs.elipse
    cx, base = 18, 41
    # Cuerpo gordo: elipses, no el humanoide flaco
    e(g, cx, base - 12, 11, 12, 'R')
    e(g, cx, base - 27, 7, 7, 'R')
    r(g, cx - 12, base - 16, cx - 8, base - 4, 'R')
    r(g, cx + 8, base - 16, cx + 12, base - 4, 'R')
    r(g, cx - 8, base - 3, cx - 2, base, 'R')
    r(g, cx + 2, base - 3, cx + 8, base, 'R')
    r(g, cx - 10, base - 8, cx + 10, base - 4, 'H')
    r(g, cx - 11, base - 18, cx + 11, base - 15, 'V')
    r(g, cx - 1, base - 40, cx + 1, base - 33, 'R')
    r(g, cx - 5, base - 28, cx - 3, base - 26, 'W')
    r(g, cx + 3, base - 28, cx + 5, base - 26, 'W')
    r(g, cx - 4, base - 28, cx - 4, base - 26, 'O')
    r(g, cx + 4, base - 28, cx + 4, base - 26, 'O')
    r(g, cx - 3, base - 23, cx + 3, base - 22, 'r')
    r(g, cx - 9, base - 24, cx - 8, base - 23, 'r')
    r(g, cx + 8, base - 24, cx + 9, base - 23, 'r')
    gs.contorno(g)
    return gs.volcar(g)


def omega(pose='idle'):
    """Shenron oscuro: el jefe de las esferas envenenadas."""
    g = lienzo(38, 44)
    r, t = gs.rect, gs.triangulo
    cx, cy, cr = humanoide(g, 19, 43, pose, {
        'piel': 'g', 'traje': 'm', 'trajeS': 'm', 'alto': 42, 'corpulencia': 1.2, 'ojo': 'R'
    })
    r(g, cx - 6, cy + 8, cx + 6, cy + 11, 'G')
    for px in (-6, -2, 2, 6):
        r(g, cx + px, cy + 13, cx + px + 1, cy + 16, 'G')
    t(g, (cx - 6, cy - 3), (cx - 3, cy - 1), (cx - 13, cy - 9), 'H')
    t(g, (cx + 3, cy - 1), (cx + 6, cy - 3), (cx + 13, cy - 9), 'H')
    r(g, cx - 7, cy - 4, cx + 7, cy - 1, 'm')
    r(g, cx - 2, cy + 3, cx + 6, cy + 5, 'g')
    r(g, cx + 2, cy + 4, cx + 6, cy + 4, 'R')
    r(g, cx - 5, cy, cx - 3, cy + 1, 'R')
    r(g, cx + 3, cy, cx + 5, cy + 1, 'R')
    gs.contorno(g)
    return gs.volcar(g)


def jiren(pose='idle'):
    g = lienzo(34, 42)
    r = gs.rect
    cx, cy, cr = humanoide(g, 17, 41, pose, {
        'piel': 'm', 'traje': 'K', 'trajeS': 'K', 'alto': 40, 'corpulencia': 1.4, 'ojo': 'W'
    })
    r(g, cx - 8, cy + 7, cx + 8, cy + 11, 'R')
    r(g, cx - 8, cy + 11, cx + 8, cy + 12, 'r')
    r(g, cx - 11, cy + 6, cx - 9, cy + 10, 'R')
    r(g, cx + 9, cy + 6, cx + 11, cy + 10, 'R')
    # Ojos enormes, sin cejas: la cara de Jiren
    r(g, cx - 4, cy - 1, cx - 1, cy + 2, 'W')
    r(g, cx + 1, cy - 1, cx + 4, cy + 2, 'W')
    r(g, cx - 3, cy, cx - 2, cy + 1, 'O')
    r(g, cx + 2, cy, cx + 3, cy + 1, 'O')
    gs.contorno(g)
    return gs.volcar(g)


def draken(pose='idle'):
    g = lienzo(32, 40)
    r, t = gs.rect, gs.triangulo
    cx, cy, cr = humanoide(g, 16, 39, pose, {
        'piel': 'm', 'traje': 'm', 'trajeS': 'K', 'alto': 38, 'corpulencia': 1.0, 'ojo': 'C'
    })
    # Circuitos cian sobre la armadura oscura
    r(g, cx - 5, cy + 8, cx + 5, cy + 9, 'C')
    r(g, cx - 1, cy + 9, cx, cy + 16, 'C')
    r(g, cx - 6, cy + 12, cx - 5, cy + 17, 'C')
    r(g, cx + 5, cy + 12, cx + 6, cy + 17, 'C')
    t(g, (cx - 6, cy + 2), (cx + 6, cy + 2), (cx, cy - 8), 'K')
    r(g, cx - 5, cy, cx + 5, cy + 1, 'C')
    r(g, cx - 9, cy + 4, cx - 7, 34, 'K')
    r(g, cx + 7, cy + 4, cx + 9, 34, 'K')
    gs.contorno(g)
    return gs.volcar(g)


# ---------------------------------------------------------------------------
# Tropa
# ---------------------------------------------------------------------------
def a17(pose='idle'):
    g = lienzo(28, 36)
    r = gs.rect
    cx, cy, cr = humanoide(g, 14, 35, pose, {
        'piel': 'S', 'traje': 'A', 'trajeS': 'a', 'alto': 34, 'corpulencia': 0.95
    })
    r(g, cx - 5, cy + 6, cx + 5, cy + 9, 'W')
    r(g, cx - 5, cy - 3, cx + 5, cy - 1, 'P')
    r(g, cx - 6, cy - 2, cx - 5, cy + 3, 'P')
    r(g, cx + 5, cy - 2, cx + 6, cy + 3, 'P')
    r(g, cx - 5, cy + 5, cx + 5, cy + 6, 'R')
    gs.contorno(g)
    return gs.volcar(g)


def babidi(pose='idle'):
    g = lienzo(24, 28)
    r, e = gs.rect, gs.elipse
    cx, base = 12, 27
    e(g, cx, base - 8, 5, 8, 'V')
    e(g, cx, base - 20, 6, 6, 'Y')
    r(g, cx - 9, base - 19, cx - 6, base - 16, 'Y')
    r(g, cx + 6, base - 19, cx + 9, base - 16, 'Y')
    r(g, cx - 4, base - 21, cx - 2, base - 19, 'W')
    r(g, cx + 2, base - 21, cx + 4, base - 19, 'W')
    r(g, cx - 3, base - 21, cx - 3, base - 19, 'O')
    r(g, cx + 3, base - 21, cx + 3, base - 19, 'O')
    r(g, cx - 6, base - 12, cx - 4, base - 6, 'Y')
    r(g, cx + 4, base - 12, cx + 6, base - 6, 'Y')
    gs.contorno(g)
    return gs.volcar(g)


def a19(pose='idle'):
    g = lienzo(28, 34)
    r, e = gs.rect, gs.elipse
    cx, cy, cr = humanoide(g, 14, 33, pose, {
        'piel': 'H', 'traje': 'V', 'trajeS': 'v', 'alto': 32, 'corpulencia': 1.35
    })
    e(g, cx, cy + 12, 8, 7, 'H')          # panza
    r(g, cx - 5, cy - 4, cx + 5, cy - 2, 'K')   # gorro
    r(g, cx - 6, cy - 2, cx + 6, cy - 1, 'n')
    r(g, cx - 3, cy + 3, cx + 3, cy + 3, 'K')
    gs.contorno(g)
    return gs.volcar(g)


def saibaman(pose='idle'):
    g = lienzo(22, 26)
    r, e = gs.rect, gs.elipse
    e(g, 11, 8, 8, 7, 'G')
    r(g, 6, 1, 15, 3, 'g')
    e(g, 11, 6, 6, 4, 'g')
    r(g, 7, 7, 9, 10, 'R'); r(g, 8, 8, 9, 9, 'Y')
    r(g, 13, 7, 15, 10, 'R'); r(g, 13, 8, 14, 9, 'Y')
    r(g, 9, 13, 13, 13, 'g')
    e(g, 11, 18, 4, 4, 'G')
    if pose == 'run1':
        r(g, 6, 21, 8, 25, 'G'); r(g, 13, 21, 15, 24, 'G')
        r(g, 3, 16, 6, 18, 'G'); r(g, 16, 18, 19, 20, 'G')
    elif pose == 'run2':
        r(g, 7, 21, 9, 24, 'G'); r(g, 12, 21, 14, 25, 'G')
        r(g, 3, 18, 6, 20, 'G'); r(g, 16, 16, 19, 18, 'G')
    elif pose == 'ataca':
        r(g, 7, 21, 9, 25, 'G'); r(g, 12, 21, 14, 25, 'G')
        r(g, 16, 14, 21, 16, 'G'); r(g, 2, 18, 6, 20, 'G')
    else:
        r(g, 7, 21, 9, 25, 'G'); r(g, 12, 21, 14, 25, 'G')
        r(g, 3, 17, 6, 19, 'G'); r(g, 16, 17, 19, 19, 'G')
    gs.contorno(g)
    return gs.volcar(g)


def soldado(pose='idle'):
    g = lienzo(24, 34)
    r, e = gs.rect, gs.elipse
    e(g, 12, 6, 5, 5, 'G')
    r(g, 8, 1, 16, 3, 'g')
    r(g, 9, 5, 11, 7, 'Y'); r(g, 10, 6, 11, 7, 'O')
    r(g, 13, 4, 18, 7, 'C'); r(g, 17, 2, 18, 8, 'c')
    r(g, 7, 12, 17, 20, 'V')
    r(g, 6, 12, 18, 16, 'H')
    r(g, 6, 16, 18, 17, 'n')
    r(g, 9, 13, 15, 15, 'v')
    if pose == 'ataca':
        r(g, 18, 14, 23, 16, 'V'); r(g, 2, 15, 5, 20, 'V')
    elif pose == 'run1':
        r(g, 3, 14, 5, 20, 'V'); r(g, 19, 16, 21, 22, 'V')
    else:
        r(g, 3, 16, 5, 22, 'V'); r(g, 19, 16, 21, 22, 'V')
    if pose == 'run1':
        r(g, 7, 21, 10, 28, 'V'); r(g, 13, 21, 16, 26, 'V')
        r(g, 5, 29, 10, 33, 'H'); r(g, 13, 27, 18, 30, 'H')
    elif pose == 'run2':
        r(g, 8, 21, 11, 26, 'V'); r(g, 13, 21, 16, 28, 'V')
        r(g, 6, 27, 11, 30, 'H'); r(g, 13, 29, 18, 33, 'H')
    else:
        r(g, 7, 21, 10, 30, 'V'); r(g, 13, 21, 16, 30, 'V')
        r(g, 6, 31, 11, 33, 'H'); r(g, 13, 31, 18, 33, 'H')
    gs.contorno(g)
    return gs.volcar(g)


def velk(pose='idle'):
    g = lienzo(26, 28)
    r, e, t = gs.rect, gs.elipse, gs.triangulo
    e(g, 13, 7, 5, 6, 'C')
    r(g, 9, 5, 11, 9, 'W'); r(g, 10, 6, 11, 8, 'O')
    r(g, 15, 5, 17, 9, 'W'); r(g, 15, 6, 16, 8, 'O')
    r(g, 9, 0, 10, 2, 'c'); r(g, 16, 0, 17, 2, 'c')
    e(g, 13, 17, 4, 6, 'C')
    r(g, 10, 14, 16, 16, 'c')
    ondeo = 1 if pose == 'run2' else 0
    r(g, 4, 13 + ondeo, 9, 14 + ondeo, 'C')
    r(g, 17, 13 - ondeo, 22, 14 - ondeo, 'C')
    r(g, 5, 18 - ondeo, 9, 19 - ondeo, 'C')
    r(g, 17, 18 + ondeo, 21, 19 + ondeo, 'C')
    if pose == 'ataca':
        r(g, 20, 12, 25, 15, 'C')
    t(g, (11, 22), (15, 22), (13, 27), 'c')
    gs.contorno(g)
    return gs.volcar(g)


def hueco(pose='idle'):
    g = lienzo(26, 32)
    r = gs.rect
    cx, cy, cr = humanoide(g, 13, 31, pose, {
        'piel': 'K', 'traje': 'K', 'trajeS': 'K', 'alto': 30, 'corpulencia': 1.0, 'ojo': 'W'
    })
    r(g, cx - 3, cy, cx - 2, cy + 1, 'W')
    r(g, cx + 2, cy, cx + 3, cy + 1, 'W')
    for (px, py) in [(-3, 6), (2, 9), (-1, 13)]:
        r(g, cx + px, cy + py, cx + px + 1, cy + py + 1, 'V')
    gs.contorno(g)
    return gs.volcar(g)


def raditz(pose='idle'):
    g = lienzo(32, 42)
    r, e, t = gs.rect, gs.elipse, gs.triangulo
    e(g, 16, 13, 9, 9, 'P')
    r(g, 3, 14, 6, 32, 'P')
    r(g, 26, 14, 29, 32, 'P')
    t(g, (3, 30), (6, 30), (4, 39), 'P')
    t(g, (26, 30), (29, 30), (28, 39), 'P')
    for a, b, pk in [((8, 8), (15, 8), (7, 0)), ((13, 8), (20, 8), (16, -1)),
                     ((17, 8), (24, 8), (25, 1))]:
        t(g, a, b, pk, 'P')
    e(g, 16, 14, 5, 5, 'S')
    r(g, 12, 12, 14, 14, 'W'); r(g, 13, 12, 14, 14, 'O')
    r(g, 18, 12, 20, 14, 'W'); r(g, 18, 12, 19, 14, 'O')
    r(g, 15, 17, 18, 17, 's')
    r(g, 19, 11, 24, 14, 'C')
    r(g, 10, 21, 22, 32, 'M')
    r(g, 9, 21, 23, 27, 'H')
    r(g, 9, 27, 23, 28, 'n')
    r(g, 12, 22, 20, 26, 'm')
    if pose == 'ataca':
        r(g, 23, 22, 30, 25, 'S'); r(g, 7, 24, 9, 30, 'S')
    elif pose == 'run1':
        r(g, 7, 22, 9, 29, 'S'); r(g, 23, 24, 25, 31, 'S')
    else:
        r(g, 7, 24, 9, 31, 'S'); r(g, 23, 24, 25, 31, 'S')
    if pose == 'run1':
        r(g, 11, 33, 15, 39, 'M'); r(g, 18, 33, 22, 37, 'M')
        r(g, 9, 39, 15, 41, 'H'); r(g, 18, 38, 24, 40, 'H')
    else:
        r(g, 11, 33, 15, 39, 'M'); r(g, 18, 33, 22, 39, 'M')
        r(g, 10, 40, 16, 41, 'H'); r(g, 18, 40, 24, 41, 'H')
    gs.contorno(g)
    return gs.volcar(g)



# ---------------------------------------------------------------------------
# Aliados: solo aparecen en las charlas, pero necesitan cara propia.
# ---------------------------------------------------------------------------
def krilin(pose='idle'):
    # Mas alto y menos ancho que antes: con alto 26 la cabeza le quedaba
    # enorme respecto del cuerpo y parecia un muneco.
    g = lienzo(26, 32)
    r = gs.rect
    cx, cy, cr = humanoide(g, 13, 31, pose, {
        'piel': 'S', 'traje': 'N', 'trajeS': 'n', 'cinto': 'A',
        'bota': 'A', 'alto': 30, 'corpulencia': 0.9
    })
    # Los seis puntos de la frente, en dos filas de tres
    for px in (-2, 0, 2):
        r(g, cx + px, cy - 3, cx + px, cy - 3, 'm')
        r(g, cx + px, cy - 5, cx + px, cy - 5, 'm')
    gs.contorno(g)
    return gs.volcar(g)


def bulma(pose='idle'):
    g = lienzo(26, 34)
    r = gs.rect
    cx, cy, cr = humanoide(g, 13, 33, pose, {
        'piel': 'S', 'traje': 'R', 'trajeS': 'r', 'bota': 'H',
        'alto': 32, 'corpulencia': 0.85
    })
    # Pelo celeste corto con flequillo
    r(g, cx - 6, cy - 4, cx + 6, cy - 1, 'C')
    r(g, cx - 6, cy - 1, cx - 4, cy + 4, 'C')
    r(g, cx + 4, cy - 1, cx + 6, cy + 4, 'C')
    r(g, cx - 4, cy - 1, cx + 4, cy, 'C')
    r(g, cx - 2, cy + 3, cx + 2, cy + 3, 'r')
    gs.contorno(g)
    return gs.volcar(g)


def trunks(pose='idle'):
    g = lienzo(28, 36)
    r, t = gs.rect, gs.triangulo
    cx, cy, cr = humanoide(g, 14, 35, pose, {
        'piel': 'S', 'traje': 'A', 'trajeS': 'a', 'bota': 'Y',
        'alto': 34, 'corpulencia': 0.95
    })
    # Pelo lila hasta los hombros
    r(g, cx - 6, cy - 4, cx + 6, cy - 1, 'V')
    r(g, cx - 6, cy - 1, cx - 4, cy + 5, 'V')
    r(g, cx + 4, cy - 1, cx + 6, cy + 5, 'V')
    r(g, cx - 4, cy - 1, cx + 4, cy, 'V')
    # Campera y la vaina de la espada
    r(g, cx - 5, cy + 7, cx + 5, cy + 9, 'Y')
    r(g, cx - 9, cy + 4, cx - 7, cy + 16, 'm')
    gs.contorno(g)
    return gs.volcar(g)


def gohan(pose='idle'):
    g = lienzo(26, 30)
    r, t = gs.rect, gs.triangulo
    cx, cy, cr = humanoide(g, 13, 29, pose, {
        'piel': 'S', 'traje': 'N', 'trajeS': 'n', 'cinto': 'A',
        'bota': 'A', 'alto': 28, 'corpulencia': 0.9
    })
    # Pelo negro con dos picos cortos
    r(g, cx - 5, cy - 4, cx + 5, cy - 1, 'P')
    t(g, (cx - 4, cy - 3), (cx, cy - 3), (cx - 3, cy - 9), 'P')
    t(g, (cx, cy - 3), (cx + 4, cy - 3), (cx + 3, cy - 8), 'P')
    r(g, cx - 2, cy + 3, cx + 2, cy + 3, 's')
    gs.contorno(g)
    return gs.volcar(g)


def pan(pose='idle'):
    g = lienzo(24, 26)
    r = gs.rect
    cx, cy, cr = humanoide(g, 12, 25, pose, {
        'piel': 'S', 'traje': 'R', 'trajeS': 'r', 'bota': 'A',
        'alto': 24, 'corpulencia': 0.85
    })
    r(g, cx - 5, cy - 4, cx + 5, cy - 1, 'P')
    r(g, cx - 5, cy - 1, cx - 4, cy + 2, 'P')
    r(g, cx + 4, cy - 1, cx + 5, cy + 2, 'P')
    r(g, cx - 5, cy - 5, cx + 5, cy - 4, 'N')   # panuelo naranja
    gs.contorno(g)
    return gs.volcar(g)



# ---------------------------------------------------------------------------
# Enemigos originales, uno por bloque de sagas
# ---------------------------------------------------------------------------
def zarko(pose='idle'):
    """Bestia baja de cuatro patas: corre rapido y embiste. Sagas 1-2."""
    g = lienzo(30, 26)
    r, e, t = gs.rect, gs.elipse, gs.triangulo
    cx, base = 15, 25
    e(g, cx, base - 9, 10, 6, 'M')            # lomo alargado
    r(g, cx - 10, base - 12, cx + 2, base - 8, 'm')
    e(g, cx + 9, base - 12, 5, 5, 'M')        # cabeza adelante
    r(g, cx + 12, base - 13, cx + 15, base - 11, 'W')   # colmillos
    r(g, cx + 11, base - 14, cx + 13, base - 12, 'R')   # ojo
    t(g, (cx + 4, base - 16), (cx + 8, base - 16), (cx + 6, base - 21), 'm')  # cuerno
    for px in (-8, -3, 3, 7):                 # cuatro patas
        r(g, cx + px, base - 5, cx + px + 2, base, 'm')
    t(g, (cx - 13, base - 12), (cx - 9, base - 10), (cx - 16, base - 18), 'M')  # cola
    gs.contorno(g)
    return gs.volcar(g)


def sylph(pose='idle'):
    """Medusa flotante que se parte al morir. Sagas 3-5."""
    g = lienzo(28, 32)
    r, e = gs.rect, gs.elipse
    cx, base = 14, 31
    fl = 1 if pose == 'run1' else 0
    e(g, cx, 10 + fl, 9, 7, 'V')              # campana
    e(g, cx, 8 + fl, 6, 4, 'v')
    r(g, cx - 5, 6 + fl, cx + 5, 8 + fl, 'C')  # banda brillante
    for i, px in enumerate([-7, -3, 1, 5]):    # tentaculos
        const_off = (i % 2) * 2 + fl
        r(g, cx + px, 16 + fl, cx + px + 1, 26 + const_off, 'V')
        r(g, cx + px, 26 + const_off, cx + px + 1, 29 + const_off, 'C')
    r(g, cx - 4, 9 + fl, cx - 2, 11 + fl, 'W')
    r(g, cx + 2, 9 + fl, cx + 4, 11 + fl, 'W')
    r(g, cx - 3, 9 + fl, cx - 3, 11 + fl, 'O')
    r(g, cx + 3, 9 + fl, cx + 3, 11 + fl, 'O')
    gs.contorno(g)
    return gs.volcar(g)


def kaon(pose='idle'):
    """Centinela blindado que dispara desde lejos. Sagas 6-8."""
    g = lienzo(30, 38)
    r, e, t = gs.rect, gs.elipse, gs.triangulo
    cx, cy, cr = humanoide(g, 15, 37, pose, {
        'piel': 'K', 'traje': 'H', 'trajeS': 'n', 'ojo': 'C',
        'alto': 36, 'corpulencia': 1.15
    })
    # Placa frontal y nucleo brillante
    r(g, cx - 6, cy + 7, cx + 6, cy + 14, 'H')
    e(g, cx, cy + 11, 3, 3, 'C')
    r(g, cx - 7, cy + 15, cx + 7, cy + 16, 'n')
    # Casco cerrado con una sola ranura
    t(g, (cx - 6, cy + 3), (cx + 6, cy + 3), (cx, cy - 7), 'H')
    r(g, cx - 5, cy, cx + 5, cy + 1, 'C')
    # Canon en el brazo
    r(g, cx + 7, cy + 8, cx + 13, cy + 11, 'n')
    r(g, cx + 12, cy + 8, cx + 13, cy + 11, 'C')
    gs.contorno(g)
    return gs.volcar(g)


# ---------------------------------------------------------------------------
POSES_STD = ['idle', 'run1', 'ataca']
ENEMIGOS = {
    'saibaman': (saibaman, ['idle', 'run1', 'run2', 'ataca']),
    'soldado':  (soldado,  ['idle', 'run1', 'run2', 'ataca']),
    'velk':     (velk,     ['idle', 'run1', 'run2', 'ataca']),
    'hueco':    (hueco,    POSES_STD),
    'raditz':   (raditz,   ['idle', 'run1', 'ataca']),
    'piccolo':  (piccolo,  POSES_STD),
    'vegeta':   (vegeta,   POSES_STD),
    'nappa':    (nappa,    POSES_STD),
    'freezer':  (freezer,  POSES_STD),
    'cell':     (cell,     POSES_STD),
    'majinbuu': (majinbuu, POSES_STD),
    'omega':    (omega,    POSES_STD),
    'jiren':    (jiren,    POSES_STD),
    'draken':   (draken,   POSES_STD),
    'a17':      (a17,      POSES_STD),
    'a19':      (a19,      POSES_STD),
    'babidi':   (babidi,   POSES_STD),
    'krilin':   (krilin,   ['idle']),
    'bulma':    (bulma,    ['idle']),
    'trunks':   (trunks,   ['idle']),
    'gohan':    (gohan,    ['idle']),
    'pan':      (pan,      ['idle']),
    'zarko':    (zarko,    ['idle', 'run1', 'ataca']),
    'sylph':    (sylph,    ['idle', 'run1', 'ataca']),
    'kaon':     (kaon,     ['idle', 'run1', 'ataca']),
}


def bloque_enemigo(nombre):
    fn, lista = ENEMIGOS[nombre]
    partes = []
    for p in lista:
        filas = fn(p)
        txt = ',\n'.join("      '%s'" % f for f in filas)
        partes.append("    %s: [\n%s\n    ]" % (p, txt))
    return "  %s: {\n%s\n  }" % (nombre, ',\n'.join(partes))


if __name__ == '__main__':
    if '--export' in sys.argv:
        cuerpo = ',\n\n'.join(bloque_enemigo(n) for n in ENEMIGOS)
        nuevo = 'const ARTE_ENEMIGOS = {\n' + cuerpo + '\n};'
        ruta = 'js/art.js'
        s = io.open(ruta, encoding='utf-8').read()
        if 'const ARTE_ENEMIGOS' in s:
            s = re.sub(r"const ARTE_ENEMIGOS = \{.*?\n\};", nuevo, s, flags=re.S)
        else:
            s = s.rstrip() + '\n\n' + nuevo + '\n'
        io.open(ruta, 'w', encoding='utf-8').write(s)
        print('exportados %d enemigos' % len(ENEMIGOS))
    else:
        nombre = sys.argv[1] if len(sys.argv) > 1 else 'piccolo'
        fn, poses = ENEMIGOS[nombre]
        for i, f in enumerate(fn('idle')):
            print('%2d %s' % (i, f))
