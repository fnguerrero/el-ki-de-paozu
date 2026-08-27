// Nivel: tilemap, colisiones, camara y fondos con parallax.

const Nivel = {
  datos: null,
  mapa: [],          // array de strings, uno por fila
  w: 0, h: 0,        // en tiles
  ancho: 0, alto: 0, // en pixeles
  cam: { x: 0, y: 0 },
  spawns: [],
  carteles: [],
  items: [],
  inicio: { x: 32, y: 0 },
  jefePos: null,
  t: 0,

  cargar(saga) {
    this.saga = saga;
    this.tema = saga.tema;
    this.mapa = [];
    this.spawns = [];
    this.carteles = [];
    this.items = [];
    this.esferas = [];
    this.t = 0;

    const orden = ORDENES_POR_SAGA[saga.id] || ORDEN_SEGMENTOS;
    const filas = SEGMENTOS[orden[0]].length;
    for (let f = 0; f < filas; f++) {
      this.mapa[f] = orden.map(sg => SEGMENTOS[sg][f]).join('');
    }
    this.h = filas;
    this.w = this.mapa[0].length;
    this.ancho = this.w * CFG.TILE;
    this.alto = this.h * CFG.TILE;

    // Las letras del mapa son PUESTOS, no personajes: cada saga pone su tropa.
    const tropa = saga.tropa;
    let cartelIdx = 0;
    for (let y = 0; y < this.h; y++) {
      const fila = this.mapa[y].split('');
      for (let x = 0; x < this.w; x++) {
        const c = fila[x];
        const px = x * CFG.TILE + CFG.TILE / 2;
        const py = y * CFG.TILE + CFG.TILE;
        switch (c) {
          case 'P': this.inicio = { x: px, y: py }; fila[x] = '.'; break;
          case 'B': this.jefePos = { x: px, y: py }; fila[x] = '.'; break;
          case 'S': this.spawns.push({ tipo: tropa[0], x: px, y: py }); fila[x] = '.'; break;
          case 'D': this.spawns.push({ tipo: tropa[1] || tropa[0], x: px, y: py }); fila[x] = '.'; break;
          case 'V': this.spawns.push({ tipo: tropa[2] || tropa[0], x: px, y: py }); fila[x] = '.'; break;
          case 'k': this.items.push({ tipo: 'ki', x: px, y: py - 8, tomado: false }); fila[x] = '.'; break;
          case 'T':
            this.carteles.push({ x: px, y: py, lineas: CARTELES[cartelIdx] || CARTELES[0] });
            cartelIdx++;
            fila[x] = '.';
            break;
        }
      }
      this.mapa[y] = fila.join('');
    }

    this.colocarEsferas();

    // Checkpoint a mitad de camino: morir no te manda al principio de todo.
    const txMedio = Math.floor(this.w / 2);
    let tyMedio = 2;
    while (tyMedio < this.h && this.tile(txMedio, tyMedio) === '.') tyMedio++;
    this.checkpoint = {
      x: txMedio * CFG.TILE + CFG.TILE / 2,
      y: tyMedio * CFG.TILE,
      tocado: false
    };

    // Un par de capsulas de vida repartidas por el nivel
    [0.32, 0.68].forEach(f => {
      const tx = Math.floor(this.w * f);
      let ty = 2;
      while (ty < this.h && this.tile(tx, ty) === '.') ty++;
      this.items.push({
        tipo: 'vida', x: tx * CFG.TILE + CFG.TILE / 2,
        y: ty * CFG.TILE - 10, tomado: false
      });
    });
  },

  // Siete esferas repartidas a lo largo del nivel. Las impares quedan bien
  // alto: esas SOLO se agarran volando, que es la razon de ser del vuelo.
  colocarEsferas() {
    for (let i = 0; i < 7; i++) {
      const tx = Math.max(2, Math.min(this.w - 3, Math.floor((i + 0.5) * this.w / 7)));

      // Primera fila solida de esa columna, contando desde arriba
      let tyPiso = 2;
      while (tyPiso < this.h && this.tile(tx, tyPiso) === '.') tyPiso++;

      const alta = i % 2 === 1;
      // 3 tiles sobre el piso se alcanza de un salto; 9 tiles, solo volando.
      const ty = clamp(tyPiso - (alta ? 9 : 3), 2, this.h - 3);

      this.esferas.push({
        x: tx * CFG.TILE + CFG.TILE / 2,
        y: ty * CFG.TILE + CFG.TILE / 2,
        num: i + 1, tomada: false, alta
      });
    }
  },

  tile(tx, ty) {
    if (ty < 0) return '.';
    if (tx < 0 || tx >= this.w || ty >= this.h) return '#';   // bordes cerrados
    return this.mapa[ty][tx];
  },

  solido(tx, ty) { return this.tile(tx, ty) === '#'; },
  plataforma(tx, ty) { return this.tile(tx, ty) === '='; },

  // ¿El rectangulo choca con tierra solida?
  chocaSolido(x, y, w, h) {
    const t = CFG.TILE;
    const x0 = Math.floor(x / t), x1 = Math.floor((x + w - 1) / t);
    const y0 = Math.floor(y / t), y1 = Math.floor((y + h - 1) / t);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++)
        if (this.solido(tx, ty)) return true;
    return false;
  },

  // Plataformas de una via: solo frenan si venis cayendo y tus pies estaban arriba.
  plataformaBajoPies(x, w, yAntes, yAhora) {
    const t = CFG.TILE;
    const x0 = Math.floor(x / t), x1 = Math.floor((x + w - 1) / t);
    const tyAntes = Math.floor((yAntes - 0.01) / t);
    const tyAhora = Math.floor(yAhora / t);
    for (let ty = tyAntes; ty <= tyAhora; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (this.plataforma(tx, ty)) {
          const techo = ty * t;
          if (yAntes <= techo && yAhora >= techo) return techo;
        }
      }
    }
    return null;
  },

  // Suelta las particulas de ambiente de la saga alrededor de lo que se ve.
  actualizarAmbiente() {
    const amb = AMBIENTE[this.saga.id];
    if (!amb) return;
    this.contAmb = (this.contAmb || 0) + 1;
    if (this.contAmb % amb.cada !== 0) return;
    const x = this.cam.x + rnd(-20, CFG.VW + 20);
    const y = amb.tipo === 'chispas' || amb.tipo === 'estrellas'
      ? this.cam.y + rnd(0, CFG.VH)
      : this.cam.y - 10;
    FX.ambiente(x, y, amb.color, amb.tipo);
  },

  actualizarCamara(jug, dt) {
    this.t += dt;
    this.actualizarAmbiente();
    // Look-ahead: la camara mira hacia donde vas.
    // Volando se centra mas al personaje, para ver arriba y abajo por igual.
    // Volando alto la camara se corre para arriba: se ve mas cielo y se puede
    // planear la bajada.
    const alturaSobreSuelo = clamp((Nivel.alto - 48 - jug.y) / 160, 0, 1);
    const extraAire = jug.volando ? alturaSobreSuelo * 0.18 : 0;
    const objetivoX = jug.x + jug.facing * 52 - CFG.VW / 2;
    const anclaY = (jug.volando ? 0.50 : 0.62) - extraAire;
    const objetivoY = jug.y - CFG.VH * anclaY;
    this.cam.x = lerp(this.cam.x, objetivoX, 0.09);
    this.cam.y = lerp(this.cam.y, objetivoY, jug.volando ? 0.07 : 0.06);
    this.cam.x = clamp(this.cam.x, 0, Math.max(0, this.ancho - CFG.VW));
    this.cam.y = clamp(this.cam.y, 0, Math.max(0, this.alto - CFG.VH));
  },

  // ------------------------------------------------------------------ fondo
  // El fondo tambien se mueve en vertical: al volar alto tenes que ver que
  // subiste, si no el cielo parece una pared quieta.
  dibujarFondo() {
    const c = this.tema.cielo;
    const desY = this.cam.y * 0.35;
    const suelo = (this.alto - 32) - this.cam.y * 0.55;

    Px.rect(0, 0, CFG.VW, CFG.VH, c[0]);
    Px.rect(0, suelo - 150 + desY * 0.2, CFG.VW, 90, c[1]);
    Px.rect(0, suelo - 60 + desY * 0.2, CFG.VW, CFG.VH, c[2]);

    // La luna llena de la saga GT, enorme y baja
    if (Juego.hayLuna) {
      const lx = CFG.VW - 70, ly = 46 + desY * 0.25;
      Px.disco(lx, ly, 26, '#e8e4d0');
      Px.disco(lx, ly, 24, '#fffbe8');
      [[-8, -6, 5], [7, 4, 4], [-3, 9, 3], [10, -8, 3]].forEach(c => {
        Px.disco(lx + c[0], ly + c[1], c[2], '#ded8c0');
      });
    }

    // Nubes en dos capas: las de atras van mas lento y son mas chicas.
    const nLejos = -(this.cam.x * 0.06) % 200;
    for (let i = -1; i < 5; i++) {
      const bx = nLejos + i * 200;
      this.nube(bx + 20, suelo - 250 + desY * 0.35, 0.7);
      this.nube(bx + 120, suelo - 215 + desY * 0.35, 0.6);
    }
    const nCerca = -(this.cam.x * 0.15) % 240;
    for (let i = -1; i < 4; i++) {
      const bx = nCerca + i * 240;
      this.nube(bx + 30, suelo - 190 + desY * 0.5, 1);
      this.nube(bx + 150, suelo - 155 + desY * 0.5, 1.2);
      this.nube(bx + 90, suelo - 232 + desY * 0.5, 0.9);
    }

    // Montañas lejanas
    const mx = -(this.cam.x * 0.25) % 180;
    for (let i = -1; i < 5; i++) {
      const bx = mx + i * 180;
      this.montana(bx + 10, suelo - 4, 56, 52, PAL.lejos);
      this.montana(bx + 90, suelo - 4, 74, 66, PAL.lejos);
    }

    // Colinas cercanas
    const hx = -(this.cam.x * 0.5) % 140;
    for (let i = -1; i < 6; i++) {
      const bx = hx + i * 140;
      this.montana(bx, suelo + 8, 54, 32, PAL.lejos2);
      this.montana(bx + 68, suelo + 10, 62, 26, PAL.lejos2);
    }
  },

  nube(x, y, esc) {
    const e = esc || 1;
    const w = Math.round(30 * e);
    Px.rect(x, y, w, Math.round(6 * e), PAL.cielo3);
    Px.rect(x + w * 0.2, y - 5 * e, w * 0.6, 6 * e, PAL.cielo3);
    Px.rect(x + w * 0.4, y - 9 * e, w * 0.3, 5 * e, PAL.cielo3);
    // Sombra abajo, para que no sea una mancha plana
    Px.rect(x + 2, y + 5 * e, w - 4, 1, PAL.lejos2);
  },

  montana(x, base, ancho, alto, color) {
    for (let i = 0; i < alto; i++) {
      const w = Math.round(ancho * (i / alto));
      Px.rect(x + ancho / 2 - w / 2, base - alto + i, w, 1, color);
    }
    Px.rect(x + ancho / 2 - 3, base - alto + 2, 7, 3, PAL.cielo3);
  },

  // ------------------------------------------------------------------ tiles
  dibujar() {
    const t = CFG.TILE;
    const camx = Math.round(this.cam.x), camy = Math.round(this.cam.y);
    const x0 = Math.floor(camx / t), x1 = Math.ceil((camx + CFG.VW) / t);
    const y0 = Math.floor(camy / t), y1 = Math.ceil((camy + CFG.VH) / t);

    for (let ty = Math.max(0, y0); ty <= Math.min(this.h - 1, y1); ty++) {
      for (let tx = Math.max(0, x0); tx <= Math.min(this.w - 1, x1); tx++) {
        const c = this.mapa[ty][tx];
        if (c === '.') continue;
        const px = tx * t - camx, py = ty * t - camy;
        if (c === '#') this.tileTierra(px, py, tx, ty);
        else if (c === '=') this.tilePlataforma(px, py);
      }
    }

    // Checkpoint: un poste que se enciende al pasar
    if (this.checkpoint) {
      const cp = this.checkpoint;
      const px = Math.round(cp.x - camx), py = Math.round(cp.y - camy);
      Px.rect(px - 1, py - 26, 3, 26, PAL.rocaS);
      const color = cp.tocado ? PAL.dorado : PAL.roca;
      Px.rect(px + 2, py - 26, 12, 8, PAL.contorno);
      Px.rect(px + 2, py - 25, 11, 6, color);
      if (cp.tocado && Math.floor(this.t * 4) % 2 === 0) {
        Px.aro(px, py - 30, 5, PAL.dorado);
      }
    }

    // Items: cyan = Ki, rojo = vida
    this.items.forEach(it => {
      if (it.tomado) return;
      const px = it.x - camx, py = it.y - camy + Math.sin(this.t * 3 + it.x) * 2;
      const vida = it.tipo === 'vida';
      Px.disco(px, py, 4, vida ? PAL.rojo : PAL.cyan);
      Px.disco(px, py, 2, PAL.blanco);
      Px.aro(px, py, 5, vida ? PAL.rojoS : PAL.azul);
      // Cruz en las de vida, para distinguirlas de un vistazo
      if (vida) {
        Px.rect(px - 2, py, 5, 1, PAL.rojoS);
        Px.rect(px, py - 2, 1, 5, PAL.rojoS);
      }
    });

    // Esferas del dragon: naranjas, con sus estrellas rojas
    this.esferas.forEach(es => {
      if (es.tomada) return;
      const px = Math.round(es.x - camx);
      const py = Math.round(es.y - camy + Math.sin(this.t * 2.5 + es.num) * 2);
      const brillo = Math.floor(this.t * 6 + es.num) % 4 === 0;
      Px.disco(px, py, 6, '#e08a12');
      Px.disco(px, py, 5, '#ffb833');
      Px.rect(px - 3, py - 3, 2, 2, '#ffe9a8');          // reflejo
      // Las estrellas: tantos puntos rojos como su numero
      const puntos = [[0,0],[-2,-2],[2,-2],[-2,2],[2,2],[-3,0],[3,0]];
      for (let i = 0; i < es.num; i++) {
        Px.rect(px + puntos[i][0], py + puntos[i][1], 1, 1, '#c0392b');
      }
      if (brillo) Px.aro(px, py, 8, '#ffe9a8');
    });

    // Carteles de tutorial
    this.carteles.forEach(ca => {
      const px = Math.round(ca.x - camx), py = Math.round(ca.y - camy);
      const w = 6 + Math.max.apply(null, ca.lineas.map(l => Texto.ancho(l)));
      const h = ca.lineas.length * 8 + 5;
      const top = py - 20 - h;
      Px.rect(px - 1, top + h, 3, 20, PAL.tierraS);      // poste
      Px.rect(px - w / 2 - 1, top - 1, w + 2, h + 2, PAL.contorno);
      Px.rect(px - w / 2, top, w, h, PAL.hueso);
      ca.lineas.forEach((l, i) => {
        Texto.dibujar(l, px, top + 3 + i * 8, PAL.contorno, { centro: true, sombra: false });
      });
    });
  },

  tileTierra(px, py, tx, ty) {
    const T = this.tema;
    const aire = !this.solido(tx, ty - 1);
    const aireIzq = !this.solido(tx - 1, ty);
    const aireDer = !this.solido(tx + 1, ty);
    Px.rect(px, py, 16, 16, T.tierra);
    // Veteado deterministico para que no sea un bloque plano
    const v = (tx * 7 + ty * 13) % 4;
    Px.rect(px + 2 + v * 3, py + 8, 3, 2, T.tierraS);
    Px.rect(px + 10 - v * 2, py + 12, 4, 2, T.tierraS);
    Px.rect(px, py + 15, 16, 1, T.tierraS);

    if (aire) {
      Px.rect(px, py, 16, 5, T.pasto);
      Px.rect(px, py + 5, 16, 1, T.pastoS);
      const p = (tx * 5) % 3;
      Px.rect(px + 1 + p * 4, py - 2, 2, 2, T.pasto);
      Px.rect(px + 9 - p * 2, py - 1, 2, 1, T.pasto);
      Px.rect(px, py, 16, 1, T.pastoS);
    }

    // Bordes: un tile con aire al lado se dibuja distinto que uno del interior.
    // Sin esto el terreno parece una pared de bloques iguales.
    if (aireIzq) {
      Px.rect(px, py, 2, 16, T.tierraS);
      Px.rect(px, py + 3, 1, 3, PAL.negro);
      if (aire) Px.rect(px, py, 2, 5, T.pastoS);
    }
    if (aireDer) {
      Px.rect(px + 14, py, 2, 16, T.tierraS);
      Px.rect(px + 15, py + 8, 1, 4, PAL.negro);
      if (aire) Px.rect(px + 14, py, 2, 5, T.pastoS);
    }
    // Piedritas asomando en el borde de abajo
    if (!this.solido(tx, ty + 1)) {
      Px.rect(px + 3, py + 13, 3, 3, T.tierraS);
      Px.rect(px + 10, py + 14, 2, 2, T.tierraS);
    }
  },

  tilePlataforma(px, py) {
    const T = this.tema;
    Px.rect(px, py, 16, 6, T.tierra);
    Px.rect(px, py, 16, 3, T.pasto);
    Px.rect(px, py + 3, 16, 1, T.pastoS);
    Px.rect(px, py + 5, 16, 1, T.tierraS);
    Px.rect(px, py, 1, 6, T.tierraS);
    Px.rect(px + 15, py, 1, 6, T.tierraS);
  }
};
