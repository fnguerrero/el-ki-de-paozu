// HUD y pantallas, todo con la fuente bitmap y la paleta.
// Regla de este archivo: el jugador NUNCA tiene que adivinar un control.

const UI = {
  aviso: null,
  avisoT: 0,
  dialogo: null,
  dialogoT: 0,

  mostrar(txt, frames) { this.aviso = txt; this.avisoT = frames || 120; },
  decir(txt, frames) { this.dialogo = txt; this.dialogoT = frames || 150; },

  update() {
    if (this.avisoT > 0) this.avisoT--;
    if (this.dialogoT > 0) this.dialogoT--;
  },

  marco(x, y, w, h, relleno) {
    Px.rect(x - 1, y - 1, w + 2, h + 2, PAL.contorno);
    Px.rect(x, y, w, h, relleno || PAL.negro);
  },

  barra(x, y, w, h, ratio, color, colorFondo) {
    this.marco(x, y, w, h, colorFondo || '#2a2430');
    const relleno = Math.round(w * clamp(ratio, 0, 1));
    if (relleno > 0) {
      Px.rect(x, y, relleno, h, color);
      Px.rect(x, y, relleno, 1, PAL.blanco);
    }
  },

  // Lista unica de controles: se usa en el titulo y en la pausa.
  CONTROLES: [
    ['IZQ DER', 'CORRER'],
    ['ARRIBA', 'SALTAR'],
    ['ARRIBA X2', 'VOLAR  (EN EL AIRE)'],
    ['ABAJO', 'BAJAR VOLANDO'],
    ['ESPACIO', 'GOLPEAR  (EN EL AIRE: PATADA)'],
    ['ENTER', 'RAFAGA DE KI'],
    ['ENTER x1s', 'KAMEHAMEHA'],
    ['SHIFT', 'CARGAR KI'],
    ['X', 'DASH'],
    ['1 A 8', 'TRANSFORMARSE'],
    ['F', 'KAIOKEN'],
    ['M / P', 'SILENCIAR / PAUSA']
  ],

  listaControles(x, y, colorTecla, colorTxt) {
    // La tecla se alinea a la DERECHA de su columna y la descripcion arranca
    // despues de un separador fijo. Centrando la tecla, las largas ("ARRIBA X2")
    // se metian encima del texto y quedaba todo pisado.
    const colTecla = 92;
    this.CONTROLES.forEach((c, i) => {
      const fy = y + i * 10;
      const w = Texto.ancho(c[0]);
      Texto.dibujar(c[0], x + colTecla - w, fy, colorTecla);
      Texto.dibujar(c[1], x + colTecla + 10, fy, colorTxt);
    });
  },

  // ------------------------------------------------------------------- HUD
  hud(jug, esferas, saga) {
    const x = 6, y = 6;

    Texto.dibujar('VIDA', x, y, PAL.blanco);
    this.barra(x + 26, y, 58, 6, jug.hp / jug.hpMax, PAL.rojo);

    const k = jug.ki;
    const ratioKi = k.ki / k.kiMax;
    // Con el Ki bajo la barra parpadea: es el aviso de que no vas a poder
    // volar ni transformarte.
    const kiBajo = ratioKi < 0.2 && k.agotado <= 0;
    const parpadeo = kiBajo && Math.floor(Juego.t * 6) % 2 === 0;
    Texto.dibujar('KI', x, y + 9, parpadeo ? PAL.rojo : PAL.blanco);
    this.barra(x + 26, y + 9, 58, 6, ratioKi,
               k.agotado > 0 ? PAL.roca : (parpadeo ? PAL.rojo : PAL.cyan));

    const f = k.datos();
    const nombre = k.nombreEstado();
    Texto.dibujar(nombre, x, y + 19, k.kaioken > 0 ? PAL.rojo : (f.auraPix || PAL.hueso));
    const dren = k.drenajeTotal();
    if (dren > 0) {
      Texto.dibujar('-' + Math.round(dren) + '/S', x + Texto.ancho(nombre) + 4, y + 19, PAL.rojo);
    }

    this.selectorFormas(x, y + 28, jug);
    this.contadorEsferas(x, y + 39, esferas);

    if (saga) {
      // Alineado a la derecha de verdad: antes se centraba en el borde y la
      // mitad del nombre quedaba fuera de la pantalla.
      const w = Texto.ancho(saga.nombre);
      Texto.dibujar(saga.nombre, CFG.VW - 6 - w, y - 1, PAL.hueso);
    }

    if (k.aviso) {
      Texto.dibujar(k.aviso, x, y + 50, PAL.dorado);
      if (!this._avisoKiT) this._avisoKiT = 0;
      if (++this._avisoKiT > 60) { k.aviso = null; this._avisoKiT = 0; }
    }

    this.brujulaEsfera(jug);
    this.progresoNivel(jug);
    this.combo(jug);

    // Recordatorio permanente de controles: esto no se saca nunca.
    // Una sola linea fina abajo, sobre una franja oscura para que se lea
    // encima de cualquier fondo. Dos lineas tapaban medio nivel.
    const ay = CFG.VH - 8;
    Px.rect(0, ay - 2, CFG.VW, 10, PAL.negro);
    Px.rect(0, ay - 3, CFG.VW, 1, PAL.contorno);
    const pares = [['ESPACIO', 'GOLPE'], ['ARRIBA', 'SALTO'], ['ARR X2', 'VOLAR'],
                   ['ENTER', 'KI'], ['SHIFT', 'CARGA'], ['P', 'AYUDA']];
    const paso = Math.floor((CFG.VW - 8) / pares.length);
    pares.forEach((par, i) => {
      const x0 = 5 + i * paso;
      Texto.dibujar(par[0], x0, ay, PAL.dorado, { sombra: false });
      Texto.dibujar(par[1], x0 + Texto.ancho(par[0]) + 4, ay, PAL.hueso, { sombra: false });
    });
  },

  // Flecha que apunta a la esfera mas cercana que falta. Sin esto hay que
  // barrer el nivel a ciegas.
  brujulaEsfera(jug) {
    let mejor = null, mejorD = Infinity;
    (Nivel.esferas || []).forEach(es => {
      if (es.tomada) return;
      const d = dist(jug.x, jug.y, es.x, es.y);
      if (d < mejorD) { mejorD = d; mejor = es; }
    });
    if (!mejor) return;

    const cx = CFG.VW - 22, cy = 46;
    const ang = Math.atan2(mejor.y - jug.y, mejor.x - jug.x);
    Px.disco(cx, cy, 11, PAL.contorno);
    Px.disco(cx, cy, 10, '#1b1622');
    // Punta de flecha, dibujada como tres segmentos
    const px = cx + Math.cos(ang) * 6, py = cy + Math.sin(ang) * 6;
    const bx = cx - Math.cos(ang) * 5, by = cy - Math.sin(ang) * 5;
    Px.linea(bx, by, px, py, '#ffb833');
    Px.linea(px, py, px - Math.cos(ang - 0.6) * 4, py - Math.sin(ang - 0.6) * 4, '#ffb833');
    Px.linea(px, py, px - Math.cos(ang + 0.6) * 4, py - Math.sin(ang + 0.6) * 4, '#ffb833');
    Px.disco(px, py, 1, PAL.blanco);
    Texto.dibujar(String(Math.round(mejorD / 16)), cx, cy + 13, PAL.hueso, { centro: true });
  },

  // Barra de progreso del nivel: donde estas vos y donde esta el jefe.
  // Va arriba a la derecha; abajo cruzaba la pantalla y tapaba el juego.
  progresoNivel(jug) {
    const w = 110, x = CFG.VW - w - 10, y = 16;
    Px.rect(x - 1, y - 1, w + 2, 5, PAL.contorno);
    Px.rect(x, y, w, 3, '#2a2430');

    // Tramo ya recorrido
    const f = clamp(jug.x / Nivel.ancho, 0, 1);
    Px.rect(x, y, Math.round(w * f), 3, PAL.roca);

    // Checkpoint
    if (Nivel.checkpoint) {
      const cf = clamp(Nivel.checkpoint.x / Nivel.ancho, 0, 1);
      Px.rect(x + w * cf, y - 1, 1, 5, Nivel.checkpoint.tocado ? PAL.dorado : PAL.rocaS);
    }
    // Esferas que faltan
    (Nivel.esferas || []).forEach(es => {
      if (es.tomada) return;
      Px.rect(x + w * clamp(es.x / Nivel.ancho, 0, 1), y, 1, 3, '#ffb833');
    });
    // Jefe
    if (Juego.jefe && !Juego.jefe.muerto) {
      Px.rect(x + w * clamp(Juego.jefe.x / Nivel.ancho, 0, 1) - 1, y - 2, 3, 7, PAL.rojo);
    }
    // Vos
    Px.rect(x + w * f - 1, y - 2, 3, 7, PAL.blanco);
  },

  // Contador de combo con el tiempo que queda para encadenar.
  combo(jug) {
    // `combo` y `comboT` pueden no existir todavia al primer frame
    if (!jug.combo || jug.combo < 2 || !jug.comboT || jug.comboT <= 0) return;
    const x = CFG.VW - 40, y = 92;
    const grande = jug.combo >= 5;
    Texto.dibujar(String(jug.combo), x, y, grande ? PAL.rojo : PAL.dorado, { centro: true });
    if (grande) Texto.dibujar(String(jug.combo), x + 1, y, PAL.rojo, { centro: true });
    Texto.dibujar('HITS', x, y + 9, PAL.hueso, { centro: true });
    // Barrita del tiempo que queda
    const f = clamp(jug.comboT / 34, 0, 1);
    Px.rect(x - 14, y + 18, 28, 2, '#2a2430');
    Px.rect(x - 14, y + 18, Math.round(28 * f), 2, PAL.dorado);
  },

  // Siete huecos que se van llenando de naranja: el objetivo del nivel.
  contadorEsferas(x, y, esferas) {
    Texto.dibujar('ESFERAS', x, y, PAL.hueso);
    for (let i = 0; i < 7; i++) {
      const px = x + 48 + i * 8, py = y + 3;
      if (i < esferas) {
        Px.disco(px, py, 3, '#ffb833');
        Px.rect(px, py - 1, 1, 1, '#c0392b');
      } else {
        Px.aro(px, py, 3, PAL.rocaS);
      }
    }
  },

  selectorFormas(x, y, jug) {
    ORDEN_FORMAS.forEach((id, i) => {
      const f = TRANSFORMACIONES[id];
      const px = x + i * 9;
      const activa = jug.ki.forma === id;
      const puede = f.desbloqueada && jug.ki.ki >= f.costo;
      const fondo = activa ? (f.auraPix || PAL.hueso)
                  : f.desbloqueada ? (puede ? PAL.roca : PAL.rocaS)
                  : '#2a2430';
      Px.rect(px - 1, y - 1, 9, 9, PAL.contorno);
      Px.rect(px, y, 7, 7, fondo);
      Texto.dibujar(f.desbloqueada ? String(i + 1) : '?', px + 1, y,
                    activa ? PAL.contorno : PAL.blanco, { sombra: false });
    });

    const px = x + ORDEN_FORMAS.length * 9 + 3;
    const dispo = KAIOKEN.desbloqueadoHasta > 0;
    Px.rect(px - 1, y - 1, 9, 9, PAL.contorno);
    Px.rect(px, y, 7, 7, jug.ki.kaioken > 0 ? PAL.rojo : (dispo ? PAL.rojoS : '#2a2430'));
    Texto.dibujar(dispo ? 'F' : '?', px + 1, y, PAL.blanco, { sombra: false });
  },

  // Barra del jefe con su cara al lado: sirve para saber contra quien peleas
  // sin leer el nombre.
  barraJefe(jefe) {
    const w = 120, x = CFG.VW - w - 10, y = 38;
    const ratio = jefe.hp / jefe.hpMax;

    // Marco
    Px.rect(x - 24, y - 12, w + 26, 24, PAL.contorno);
    Px.rect(x - 23, y - 11, w + 24, 22, '#1b1622');

    // Cara del jefe, recortada de su sprite
    const m = matrizPersonaje(jefe.tipo);
    if (m) {
      const alto = Math.min(16, m.length);
      const recorte = m.slice(0, alto);
      const ancho = recorte[0].length;
      const ox = x - 20 - Math.floor(ancho / 2) + 8;
      for (let fy = 0; fy < alto; fy++) {
        for (let fx = 0; fx < ancho; fx++) {
          const ch = recorte[fy][fx];
          if (ch === '.') continue;
          const c = TINTA[ch];
          if (c) Px.punto(ox + fx, y - 9 + fy, c);
        }
      }
    }

    Texto.dibujar(jefe.p.nombre, x + w / 2, y - 9, PAL.blanco, { centro: true });
    this.barra(x, y, w, 7, ratio, ratio < 0.25 ? '#ff6b6b' : PAL.rojo);

    // Marcas de fase, para ver cuanto falta para el proximo cambio
    if (jefe.p.fases) {
      jefe.p.fases.forEach(f => {
        if (f.hp >= 1) return;
        Px.rect(x + w * f.hp, y - 2, 1, 11, PAL.contorno);
      });
    }
  },

  overlays() {
    if (this.avisoT > 0 && this.aviso) {
      const w = Texto.ancho(this.aviso) + 10;
      this.marco((CFG.VW - w) / 2, 52, w, 13, PAL.contorno);
      Texto.dibujar(this.aviso, CFG.VW / 2, 55, PAL.dorado, { centro: true });
    }
    if (this.dialogoT > 0 && this.dialogo) {
      const w = Texto.ancho(this.dialogo) + 10;
      const x = (CFG.VW - w) / 2, y = CFG.VH - 34;
      this.marco(x, y, w, 13, PAL.contorno);
      Texto.dibujar(this.dialogo, CFG.VW / 2, y + 3, PAL.blanco, { centro: true });
    }
  },

  // --------------------------------------------------------------- titulo
  titulo(t) {
    Px.rect(0, 0, CFG.VW, CFG.VH, '#1b1428');
    Px.disco(CFG.VW / 2, 78, 54, '#3a2450');
    Px.disco(CFG.VW / 2, 78, 44, '#4d2a52');

    Texto.dibujar('DRAGON BALL', CFG.VW / 2, 22, PAL.gi, { centro: true });
    Texto.dibujar('LAS SIETE SAGAS', CFG.VW / 2, 36, PAL.dorado, { centro: true });

    dibujarPeleador({ x: CFG.VW / 2, y: 100, facing: 1, pose: 'idle', t: t });
    this.listaControles(126, 108, PAL.dorado, PAL.hueso);

    // Selector de saga: solo aparece si ya superaste alguna
    const tope = Progreso.sagaMaxima();
    if (tope > 0) {
      const sel = Juego.sagaElegida || 0;
      const total = Progreso.total();
      Texto.dibujar('< ' + SAGAS[sel].nombre + ' >', CFG.VW / 2, 240, PAL.dorado, { centro: true });
      for (let i = 0; i < SAGAS.length; i++) {
        const px = CFG.VW / 2 - SAGAS.length * 6 + i * 12;
        const abierta = i <= tope;
        Px.rect(px, 250, 9, 5, i === sel ? PAL.dorado : (abierta ? PAL.roca : '#2a2430'));
      }
      Texto.dibujar(total.sagas + ' SAGAS  ' + total.esferas + ' ESFERAS',
                    CFG.VW / 2, 259, PAL.rocaS, { centro: true });
    }

    if (Math.floor(t * 2) % 2 === 0) {
      Texto.dibujar('ENTER PARA EMPEZAR', CFG.VW / 2, tope > 0 ? 228 : 240,
                    PAL.blanco, { centro: true });
    }
  },

  pausa() {
    for (let y = 0; y < CFG.VH; y += 2) Px.rect(0, y, CFG.VW, 1, PAL.negro);
    const w = 430, h = 210, x = (CFG.VW - w) / 2, y = (CFG.VH - h) / 2;
    this.marco(x, y, w, h, '#161226');

    Texto.dibujar('PAUSA', CFG.VW / 2, y + 8, PAL.dorado, { centro: true });

    // Columna izquierda: como venis
    const jug = Juego.jug;
    const est = [
      ['SAGA', (Juego.sagaIdx + 1) + '/' + SAGAS.length],
      ['LUGAR', Juego.saga.lugar],
      ['ESFERAS', Juego.esferas + '/7'],
      ['BAJAS', String(Juego.bajas)],
      ['NIVEL', String(jug.nivel)],
      ['VIDA', Math.round(jug.hp) + '/' + jug.hpMax],
      ['KI', Math.round(jug.ki.ki) + '/' + jug.ki.kiMax],
      ['FORMA', jug.ki.nombreEstado()],
      ['AVANCE', Math.round(jug.x / Nivel.ancho * 100) + '%']
    ];
    Texto.dibujar('PARTIDA', x + 12, y + 26, PAL.cyan);
    est.forEach((e, i) => {
      const fy = y + 40 + i * 10;
      Texto.dibujar(e[0], x + 12, fy, PAL.hueso);
      Texto.dibujar(e[1], x + 108, fy, PAL.blanco);
    });

    // Columna derecha: controles
    Texto.dibujar('CONTROLES', x + 190, y + 26, PAL.cyan);
    this.CONTROLES.forEach((c, i) => {
      const fy = y + 40 + i * 10;
      Texto.dibujar(c[0], x + 250, fy, PAL.dorado, { centro: true });
      Texto.dibujar(c[1], x + 272, fy, PAL.hueso);
    });

    Texto.dibujar('P PARA SEGUIR', CFG.VW / 2, y + h - 12, PAL.blanco, { centro: true });
  },

  // ---------------------------------------------- la charla antes del nivel
  // Escena de dialogo: los dos personajes sobre un paisaje con los colores de
  // la saga y el texto en un globo con cola. Se avanza con ENTER.
  charla(saga, idx, t) {
    const tema = saga.tema;
    const linea = saga.charla[idx];
    const quien = linea[0];
    const otro = saga.charla.find(l => l[0] !== 'goku')[0];
    const hablaGoku = quien === 'goku';

    this.fondoCharla(tema, t);

    // Los dos personajes, parados sobre el pasto
    const suelo = 178;
    this.retrato(otro, 330, suelo, -1, !hablaGoku, t);
    this.retrato('goku', 150, suelo, 1, hablaGoku, t);

    // Cartel de la saga
    const n = SAGAS.indexOf(saga) + 1;
    const titulo = 'SAGA ' + n + '   ' + saga.nombre;
    const tw = Texto.ancho(titulo) + 16;
    Px.rect((CFG.VW - tw) / 2, 6, tw, 13, PAL.contorno);
    Px.rect((CFG.VW - tw) / 2 + 1, 7, tw - 2, 11, '#1b1428');
    Texto.dibujar(titulo, CFG.VW / 2, 10, PAL.dorado, { centro: true });
    if (saga.original) {
      Texto.dibujar('CAPITULO NUEVO', CFG.VW / 2, 24, PAL.rojo, { centro: true });
    }

    this.globo(saga, idx, quien, hablaGoku, t);
  },

  // Paisaje de fondo: cielo en bandas, sol, nubes y dos filas de cerros.
  fondoCharla(tema, t) {
    Px.rect(0, 0, CFG.VW, 70, tema.cielo[0]);
    Px.rect(0, 70, CFG.VW, 46, tema.cielo[1]);
    Px.rect(0, 116, CFG.VW, 64, tema.cielo[2]);

    // Sol / astro de la saga
    Px.disco(392, 52, 16, aclarar(tema.cielo[1]));
    Px.disco(392, 52, 13, tema.cielo[2]);

    // Nubes quietas (esto es una escena, no hay scroll)
    [[60, 40], [180, 28], [300, 46], [130, 62]].forEach((c, i) => {
      const y = c[1] + Math.round(Math.sin(t * 0.6 + i) * 2);
      Px.rect(c[0], y, 30, 6, PAL.cielo3);
      Px.rect(c[0] + 6, y - 5, 18, 6, PAL.cielo3);
      Px.rect(c[0] + 12, y - 9, 9, 5, PAL.cielo3);
    });

    // Pocos cerros y bien distintos entre si: antes eran nueve iguales y
    // hacian mas ruido que fondo.
    const cerros = [[10, 62, 96], [140, 40, 74], [250, 78, 120], [386, 46, 84]];
    cerros.forEach(c => {
      for (let k = 0; k < c[1]; k++) {
        const w = Math.round(c[2] * (k / c[1]));
        Px.rect(c[0] + c[2] / 2 - w / 2, 156 - c[1] + k, w, 1, PAL.lejos);
      }
      Px.rect(c[0] + c[2] / 2 - 4, 156 - c[1] + 3, 9, 4, PAL.cielo3);
    });
    [[60, 26, 70], [200, 20, 60], [330, 30, 78]].forEach(c => {
      for (let k = 0; k < c[1]; k++) {
        const w = Math.round(c[2] * (k / c[1]));
        Px.rect(c[0] + c[2] / 2 - w / 2, 168 - c[1] + k, w, 1, PAL.lejos2);
      }
    });

    // Suelo con textura: pasto irregular arriba, tierra veteada abajo
    Px.rect(0, 168, CFG.VW, 11, tema.pasto);
    Px.rect(0, 179, CFG.VW, 2, tema.pastoS);
    for (let x = 0; x < CFG.VW; x += 4) {
      const h = 1 + ((x * 7) % 3);
      Px.rect(x, 166 - h, 2, h + 2, tema.pasto);
      if ((x * 13) % 5 === 0) Px.rect(x + 1, 170, 1, 3, tema.pastoS);
    }
    Px.rect(0, 181, CFG.VW, CFG.VH - 181, tema.tierra);
    for (let x = 0; x < CFG.VW; x += 7) {
      const v = (x * 11) % 5;
      Px.rect(x + v, 184, 4, 2, tema.tierraS);
      Px.rect(x + 3, 192 + v, 3, 2, tema.tierraS);
      if (v === 2) Px.rect(x, 200, 5, 2, tema.tierraS);
    }
  },

  // Globo de texto con la cola apuntando al que habla.
  globo(saga, idx, quien, hablaGoku, t) {
    const bx = 24, by = 206, bw = CFG.VW - 48, bh = 42;
    Px.rect(bx - 2, by - 2, bw + 4, bh + 4, PAL.contorno);
    Px.rect(bx, by, bw, bh, '#12101c');
    Px.rect(bx, by, bw, 1, PAL.roca);

    // Cola: un triangulito hacia el que esta hablando
    const colaX = hablaGoku ? 100 : 364;
    for (let k = 0; k < 8; k++) {
      const w = 10 - k;
      Px.rect(colaX - w / 2, by - 2 - k, w, 1, k === 7 ? PAL.contorno : '#12101c');
    }
    Px.rect(colaX - 6, by - 3, 12, 1, PAL.contorno);

    // Chapita con el nombre
    const nom = NOMBRES[quien] || quien.toUpperCase();
    const nw = Texto.ancho(nom) + 10;
    const nx = hablaGoku ? bx + 8 : bx + bw - nw - 10;
    Px.rect(nx, by - 7, nw, 11, PAL.contorno);
    Px.rect(nx + 1, by - 6, nw - 2, 9, hablaGoku ? '#b8531a' : '#1d3a86');
    Texto.dibujar(nom, nx + nw / 2, by - 4, PAL.blanco, { centro: true, sombra: false });

    // El texto sale letra por letra
    const completo = saga.charla[idx][1];
    const visibles = Math.min(completo.length, Math.floor(t * 34));
    Texto.dibujar(completo.slice(0, visibles), bx + 12, by + 14, PAL.blanco);

    Texto.dibujar((idx + 1) + '/' + saga.charla.length, bx + bw - 22, by + bh - 11, PAL.roca);

    if (visibles >= completo.length && Math.floor(t * 3) % 2 === 0) {
      const ultima = idx >= saga.charla.length - 1;
      Texto.dibujar(ultima ? 'ENTER PARA PELEAR' : 'ENTER',
                    bx + bw - 48, by + 14, PAL.dorado, { centro: true });
    }
  },

  // Un personaje de la escena. El que no habla se apaga bajando su paleta,
  // no con lineas negras encima: eso parecia una reja.
  retrato(id, x, sueloY, facing, activo, t) {
    const m = matrizPersonaje(id);
    // Escala pensada para que todos ocupen mas o menos lo mismo en pantalla
    // Mas grandes: la escena es de dos personajes hablando, tienen que ocupar
    const esc = clamp(Math.round(124 / m.length), 3, 5);
    const bob = activo ? Math.round(Math.sin(t * 5) * 2) : 0;

    Px.elipse(x, sueloY + 2, 20, 5, PAL.negro);
    dibujarMatrizEscala(m, x, sueloY + bob, facing, activo ? null : TINTA_APAGADA, esc);

    if (activo) {
      // Destello suave alrededor del que habla
      const w = m[0].length * esc, h = m.length * esc;
      const ox = Math.round(x - w / 2), oy = sueloY - h + bob;
      // Chispas subiendo alrededor del que habla
      for (let i = 0; i < 7; i++) {
        const fase = (t * 1.3 + i * 0.19) % 1;
        const px = ox - 4 + ((i * 13) % (w + 8));
        Px.rect(px, oy + h - fase * (h + 14), 2, 2, PAL.dorado);
      }
    }
  },

  gameOver(t) {
    Px.rect(0, 0, CFG.VW, CFG.VH, '#1a0a10');
    Texto.dibujar('TE VENCIERON', CFG.VW / 2, 110, PAL.rojo, { centro: true });
    if (Math.floor(t * 2) % 2 === 0) {
      Texto.dibujar('ENTER PARA REINTENTAR LA SAGA', CFG.VW / 2, 140, PAL.blanco, { centro: true });
    }
  },

  // ------------------------------------------------------------- SHENLONG
  // Sale de las siete esferas, se enrosca por toda la pantalla y concede el
  // deseo de la saga.
  shenlong(saga, t) {
    // El cielo se apaga
    const oscuro = clamp(t / 0.8, 0, 1);
    for (let y = 0; y < CFG.VH; y++) {
      if ((y % 2 === 0) || oscuro > 0.6) Px.rect(0, y, CFG.VW, 1, '#080610');
    }

    // Las siete esferas, brillando abajo
    for (let i = 0; i < 7; i++) {
      const px = CFG.VW / 2 + (i - 3) * 26;
      const py = 232 + Math.sin(t * 3 + i) * 2;
      const pulso = Math.floor(t * 8 + i) % 3 === 0;
      Px.disco(px, py, pulso ? 7 : 6, '#e08a12');
      Px.disco(px, py, 5, '#ffb833');
      if (t > 0.6) Px.aro(px, py, 8 + Math.sin(t * 6 + i) * 2, '#ffe9a8');
    }

    // El cuerpo: una fila de discos siguiendo una onda. Crece con el tiempo.
    const largo = Math.floor(clamp((t - 0.7) / 1.6, 0, 1) * 44);
    for (let i = 0; i < largo; i++) {
      const p = i / 44;
      const px = CFG.VW / 2 + Math.sin(p * 6.2 + t * 0.8) * (30 + p * 150);
      const py = 226 - p * 190;
      const r = 7 - p * 2.5;
      Px.disco(px, py, r, '#2f7d33');
      Px.disco(px - 1, py - 1, Math.max(1, r - 3), '#4caf50');
      // Cresta
      if (i % 3 === 0) Px.rect(px - 1, py - r - 1, 2, 2, '#ffb833');
    }

    // Cabeza
    if (largo > 4) {
      const p = (largo - 1) / 44;
      const hx = CFG.VW / 2 + Math.sin(p * 6.2 + t * 0.8) * (30 + p * 150);
      const hy = 226 - p * 190;
      Px.disco(hx, hy, 10, '#2f7d33');
      Px.disco(hx, hy - 1, 8, '#4caf50');
      // Cuernos
      Px.rect(hx - 8, hy - 12, 2, 7, '#e6e0d0');
      Px.rect(hx + 6, hy - 12, 2, 7, '#e6e0d0');
      // Ojos rojos
      Px.rect(hx - 6, hy - 3, 3, 3, '#e0384f');
      Px.rect(hx + 3, hy - 3, 3, 3, '#e0384f');
      // Bigotes
      Px.rect(hx - 16, hy + 4, 9, 1, '#4caf50');
      Px.rect(hx + 7, hy + 4, 9, 1, '#4caf50');
    }

    if (t > 2.0) {
      Texto.dibujar('SHENLONG', CFG.VW / 2, 16, '#4caf50', { centro: true });
      Texto.dibujar('DIME TU DESEO', CFG.VW / 2, 30, PAL.hueso, { centro: true });
    }
    if (t > 2.8) {
      const w = Texto.ancho(saga.deseo) + 14;
      this.marco((CFG.VW - w) / 2, 186, w, 15, '#0e1a0e');
      Texto.dibujar(saga.deseo, CFG.VW / 2, 190, '#ffb833', { centro: true });
    }
    if (t > 3.4 && Math.floor(t * 2) % 2 === 0) {
      Texto.dibujar('ENTER', CFG.VW / 2, 212, PAL.blanco, { centro: true });
    }
  },

  // -------------------------------------------------------- fin de una saga
  finSaga(saga, jug, esferas, t) {
    Px.rect(0, 0, CFG.VW, CFG.VH, '#0f1a12');
    Texto.dibujar('SAGA COMPLETA', CFG.VW / 2, 34, PAL.dorado, { centro: true });
    Texto.dibujar(saga.nombre, CFG.VW / 2, 50, PAL.blanco, { centro: true });

    Texto.dibujar('ESFERAS  ' + esferas + ' DE 7', CFG.VW / 2, 84, PAL.hueso, { centro: true });
    for (let i = 0; i < 7; i++) {
      const px = CFG.VW / 2 + (i - 3) * 12;
      if (i < esferas) Px.disco(px, 100, 4, '#ffb833');
      else Px.aro(px, 100, 4, PAL.rocaS);
    }
    if (esferas < 7) {
      Texto.dibujar('SIN LAS 7 NO APARECE SHENLONG', CFG.VW / 2, 114, PAL.rocaS, { centro: true });
    }

    Texto.dibujar('DESBLOQUEASTE', CFG.VW / 2, 140, PAL.hueso, { centro: true });
    Texto.dibujar(Juego.nombreDesbloqueo(saga.desbloquea), CFG.VW / 2, 154,
                  PAL.dorado, { centro: true });

    Texto.dibujar('NIVEL DE PODER  ' + jug.nivel, CFG.VW / 2, 182, PAL.blanco, { centro: true });
    Texto.dibujar('VIDA  ' + jug.hpMax + '    KI  ' + jug.ki.kiMax,
                  CFG.VW / 2, 196, PAL.hueso, { centro: true });

    if (t > 0.6 && Math.floor(t * 2) % 2 === 0) {
      const ultima = SAGAS.indexOf(saga) >= SAGAS.length - 1;
      Texto.dibujar(ultima ? 'ENTER' : 'ENTER PARA LA SIGUIENTE SAGA',
                    CFG.VW / 2, 234, PAL.blanco, { centro: true });
    }
  },

  // ------------------------------------------------------ final del juego
  final(jug, t) {
    Px.rect(0, 0, CFG.VW, CFG.VH, '#0a0818');
    // Estrellas
    for (let i = 0; i < 60; i++) {
      const px = (i * 97) % CFG.VW;
      const py = (i * 61) % CFG.VH;
      if (Math.floor(t * 3 + i) % 5 !== 0) Px.punto(px, py, PAL.hueso);
    }
    Texto.dibujar('EL UNIVERSO ESTA A SALVO', CFG.VW / 2, 60, PAL.dorado, { centro: true });
    Texto.dibujar('OCHO SAGAS. UN SOLO SAIYAJIN.', CFG.VW / 2, 84, PAL.blanco, { centro: true });

    dibujarPeleador({
      x: CFG.VW / 2, y: 190, facing: 1, pose: 'idle', t: t,
      tintas: { P: '#e8eaf6', p: '#a8b0c8', O: '#c0c8e0' },
      aura: '#dfe6ff', auraFuerte: true
    });

    Texto.dibujar('NIVEL DE PODER FINAL  ' + jug.nivel, CFG.VW / 2, 210, PAL.hueso, { centro: true });
    if (t > 1.2 && Math.floor(t * 2) % 2 === 0) {
      Texto.dibujar('ENTER', CFG.VW / 2, 240, PAL.blanco, { centro: true });
    }
  }
};
