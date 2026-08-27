// Capa de dibujo pixel: paleta limitada, primitivas que caen siempre en pixel
// entero, y una fuente bitmap de 5x7. Nada de antialiasing en ningun lado.

const PAL = {
  negro:    '#0d0b12',
  contorno: '#14111c',
  blanco:   '#f4f4f4',
  hueso:    '#dcd3c0',

  piel:     '#f5c396',
  pielS:    '#c98f63',   // sombra
  pielL:    '#ffe0bd',   // luz

  gi:       '#f07f28',
  giS:      '#b8531a',
  giL:      '#ffa94d',
  azul:     '#2f5fc4',
  azulS:    '#1d3a86',

  pelo:     '#231a1a',
  peloS:    '#120d0d',
  dorado:   '#ffd23f',
  doradoS:  '#e09b13',
  doradoL:  '#fff2a8',

  rojo:     '#e0384f',
  rojoS:    '#a01f36',
  cyan:     '#4fc3f7',
  violeta:  '#a56ee0',
  verde:    '#4caf50',
  verdeS:   '#2f7d33',

  cielo1:   '#3b6ea5',
  cielo2:   '#7fb2d9',
  cielo3:   '#c9e6f0',
  tierra:   '#8a5a3b',
  tierraS:  '#5d3a25',
  pasto:    '#5aa84f',
  pastoS:   '#3d7d3a',
  roca:     '#7c7488',
  rocaS:    '#4e4859',
  lejos:    '#6d84a8',
  lejos2:   '#8a9dbd'
};

// ---------------------------------------------------------------------------
// Primitivas. Todas redondean a pixel entero.
// ---------------------------------------------------------------------------
const Px = {
  ctx: null,

  rect(x, y, w, h, c) {
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  },

  punto(x, y, c) { this.rect(x, y, 1, 1, c); },

  linea(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      this.punto(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  },

  // Circulo relleno pixelado (sin antialias)
  disco(cx, cy, r, c) {
    cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    for (let y = -r; y <= r; y++) {
      const ancho = Math.floor(Math.sqrt(r * r - y * y));
      this.rect(cx - ancho, cy + y, ancho * 2 + 1, 1, c);
    }
  },

  aro(cx, cy, r, c) {
    cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    let x = r, y = 0, err = 1 - r;
    while (x >= y) {
      [[x, y], [y, x], [-x, y], [-y, x], [-x, -y], [-y, -x], [x, -y], [y, -x]]
        .forEach(p => this.punto(cx + p[0], cy + p[1], c));
      y++;
      if (err < 0) err += 2 * y + 1;
      else { x--; err += 2 * (y - x) + 1; }
    }
  },

  // Elipse rellena, util para sombras y auras
  elipse(cx, cy, rx, ry, c) {
    cx = Math.round(cx); cy = Math.round(cy);
    for (let y = -ry; y <= ry; y++) {
      const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      if (w > 0) this.rect(cx - w, cy + y, w * 2, 1, c);
    }
  }
};

// ---------------------------------------------------------------------------
// Fuente bitmap 5x7.
// ---------------------------------------------------------------------------
const FUENTE = {
  A: '.###./#...#/#...#/#####/#...#/#...#/#...#',
  B: '####./#...#/#...#/####./#...#/#...#/####.',
  C: '.####/#..../#..../#..../#..../#..../.####',
  D: '####./#...#/#...#/#...#/#...#/#...#/####.',
  E: '#####/#..../#..../####./#..../#..../#####',
  F: '#####/#..../#..../####./#..../#..../#....',
  G: '.###./#...#/#..../#.###/#...#/#...#/.###.',
  H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
  I: '.###./..#../..#../..#../..#../..#../.###.',
  J: '..###/...#./...#./...#./...#./#..#./.##..',
  K: '#...#/#..#./#.#../##.../#.#../#..#./#...#',
  L: '#..../#..../#..../#..../#..../#..../#####',
  M: '#...#/##.##/#.#.#/#...#/#...#/#...#/#...#',
  N: '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
  O: '.###./#...#/#...#/#...#/#...#/#...#/.###.',
  P: '####./#...#/#...#/####./#..../#..../#....',
  Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
  R: '####./#...#/#...#/####./#.#../#..#./#...#',
  S: '.####/#..../#..../.###./....#/....#/####.',
  T: '#####/..#../..#../..#../..#../..#../..#..',
  U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
  V: '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
  W: '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#',
  X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  Y: '#...#/#...#/.#.#./..#../..#../..#../..#..',
  Z: '#####/....#/...#./..#../.#.../#..../#####',
  0: '.###./#...#/#..##/#.#.#/##..#/#...#/.###.',
  1: '..#../.##../..#../..#../..#../..#../.###.',
  2: '.###./#...#/....#/...#./..#../.#.../#####',
  3: '####./....#/....#/.###./....#/....#/####.',
  4: '#..#./#..#./#..#./#####/...#./...#./...#.',
  5: '#####/#..../####./....#/....#/#...#/.###.',
  6: '.###./#..../#..../####./#...#/#...#/.###.',
  7: '#####/....#/...#./..#../.#.../.#.../.#...',
  8: '.###./#...#/#...#/.###./#...#/#...#/.###.',
  9: '.###./#...#/#...#/.####/....#/....#/.###.',
  ' ': '...../...../...../...../...../...../.....',
  '.': '...../...../...../...../...../...../..#..',
  ',': '...../...../...../...../..#../..#../.#...',
  '!': '..#../..#../..#../..#../..#../...../..#..',
  '?': '.###./#...#/....#/...#./..#../...../..#..',
  ':': '...../..#../...../...../..#../...../.....',
  '-': '...../...../...../.###./...../...../.....',
  '+': '...../..#../..#../#####/..#../..#../.....',
  '/': '....#/...#./...#./..#../.#.../.#.../#....',
  '<': '...#./..#../.#.../#..../.#.../..#../...#.',
  '>': '.#.../..#../...#./....#/...#./..#../.#...',
  '(': '...#./..#../.#.../.#.../.#.../..#../...#.',
  ')': '.#.../..#../...#./...#./...#./..#../.#...',
  '%': '#...#/....#/...#./..#../.#.../#..../#...#',
  '*': '...../#.#.#/.###./#####/.###./#.#.#/.....',
  "'": '..#../..#../...../...../...../...../.....'
};

const Texto = {
  _cache: {},

  _glifo(ch) {
    const c = FUENTE[ch] || FUENTE[ch.toUpperCase()];
    if (!c) return null;
    if (!this._cache[ch]) this._cache[ch] = c.split('/');
    return this._cache[ch];
  },

  ancho(txt, esp) { return txt.length * (5 + (esp === undefined ? 1 : esp)); },

  // Dibuja texto. `sombra` pinta el mismo texto un pixel abajo en negro.
  dibujar(txt, x, y, color, opts) {
    opts = opts || {};
    const esp = opts.esp === undefined ? 1 : opts.esp;
    txt = String(txt);
    if (opts.centro) x -= Math.floor(this.ancho(txt, esp) / 2);
    x = Math.round(x); y = Math.round(y);

    if (opts.sombra !== false) this._pintar(txt, x, y + 1, opts.colorSombra || PAL.negro, esp);
    this._pintar(txt, x, y, color, esp);
  },

  _pintar(txt, x, y, color, esp) {
    let cx = x;
    for (const ch of txt) {
      const g = this._glifo(ch);
      if (g) {
        for (let fy = 0; fy < g.length; fy++) {
          const fila = g[fy];
          for (let fx = 0; fx < fila.length; fx++) {
            if (fila[fx] === '#') Px.punto(cx + fx, y + fy, color);
          }
        }
      }
      cx += 5 + esp;
    }
  }
};
