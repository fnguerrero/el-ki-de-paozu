// Puente entre el juego y el arte pixel de art.js.
//
// Aca no se dibuja nada a mano: se elige QUE matriz corresponde a cada pose y
// con que colores pintarla (el pelo y los ojos cambian por transformacion).

// Ciclo de carrera: 4 frames que se repiten.
const CICLO_RUN = ['run1', 'run2', 'run3', 'run4'];

// `dano` 0/1/2: el gi se va rompiendo a medida que te lastiman.
function matrizPose(pose, t, dano) {
  let nombre = pose;
  if (pose === 'run') nombre = CICLO_RUN[Math.floor(t * 11) % 4];
  else if (pose === 'punch1' || pose === 'punch2') nombre = 'punch';

  const sufijo = dano === 2 ? '_r2' : (dano === 1 ? '_r1' : '');
  return GOKU[nombre + sufijo] || GOKU[nombre] || GOKU.idle;
}

// Melena de SSJ3: cae desde la nuca hasta abajo de las rodillas y se mueve
// sola. Se dibuja como capa aparte y no como sprite propio porque asi vale
// para las 15 poses sin multiplicar el arte por cuatro.
function dibujarMelena(x, y, facing, color, sombra, t, largo) {
  const cx = Math.round(x);
  const nuca = Math.round(y) - 30;      // arranca en la nuca, no en la coronilla
  const alto = largo || 26;

  // Mechones separados, no un bloque: un rectangulo continuo se lee como una
  // mancha detras del personaje, no como pelo.
  const mechones = [
    { off: -12, ancho: 4, largo: 0.70, fase: 0.0 },
    { off: -8, ancho: 5, largo: 0.88, fase: 0.9 },
    { off: -3, ancho: 6, largo: 1.00, fase: 1.7 },
    { off: 3, ancho: 6, largo: 0.95, fase: 2.4 },
    { off: 8, ancho: 5, largo: 0.80, fase: 3.1 },
    { off: 12, ancho: 4, largo: 0.62, fase: 3.9 }
  ];

  mechones.forEach(m => {
    const alt = Math.round(alto * m.largo);
    for (let i = 0; i < alt; i++) {
      const f = i / alt;
      // Ondula mas hacia la punta, cada mechon con su propio ritmo
      const onda = Math.sin(t * 2.4 + m.fase + f * 3) * f * 3;
      const px = cx + m.off - facing * (1 + f * 3) + onda;
      const w = Math.max(1, Math.round(m.ancho * (1 - f * 0.55)));
      Px.rect(px - w / 2, nuca + i, w, 1, f > 0.75 ? sombra : color);
    }
    // Punta en pico
    const f = 1;
    const onda = Math.sin(t * 2.4 + m.fase + f * 3) * f * 3;
    const px = cx + m.off - facing * 4 + onda;
    Px.rect(px, nuca + alt, 1, 3, color);
  });
}

// Cola de SSJ4: sale de la cintura y se mueve como latigo.
function dibujarCola(x, y, facing, color, sombra, t) {
  const bx = Math.round(x) - facing * 5;
  const by = Math.round(y) - 14;
  let px = bx, py = by;
  for (let i = 0; i < 16; i++) {
    const f = i / 16;
    const ang = Math.sin(t * 2.6 + f * 2.4) * 0.5 + 0.35;
    px -= facing * (1.1 + Math.cos(ang) * 0.5);
    py += Math.sin(ang + f * 1.6) * 1.5 - 0.35;
    const w = Math.max(2, Math.round(5 - f * 2));
    Px.rect(px - w / 2, py, w, w, i % 4 === 0 ? sombra : color);
  }
  // Punta peluda
  Px.disco(px, py, 3, color);
  Px.disco(px - 1, py - 1, 2, sombra);
}

// o = { x, y (pies), facing, pose, t, tintas, aura, auraFuerte }
function dibujarPeleador(o) {
  if (o.aura) {
    dibujarAura(o.x, o.y, o.aura, o.auraFuerte, o.t || 0, o.fuerzaAura,
                o.rayos, o.electricidad);
  }
  // El pelo largo va DETRAS del cuerpo, la cola tambien
  const t = o.t || 0;
  if (o.melena) {
    dibujarMelena(o.x, o.y, o.facing, o.melena.color, o.melena.sombra, t, o.melena.largo);
  }
  if (o.cola) {
    dibujarCola(o.x, o.y, o.facing, o.cola.color, o.cola.sombra, t);
  }
  dibujarMatriz(matrizPose(o.pose, o.t || 0, o.dano || 0), o.x, o.y, o.facing, o.tintas);
}

// EL AURA. Es lo que dice "este tipo tiene mucho poder", asi que se dibuja
// por capas: resplandor, lenguas de fuego que suben, chispas que orbitan,
// rayos, y ondas en el piso. `fuerza` (0..1.4) escala todo.
function dibujarAura(x, y, color, fuerte, t, fuerza, rayos, electricidad) {
  const f = fuerza === undefined ? (fuerte ? 1 : 0.5) : fuerza;
  if (f <= 0) return;

  const cx = Math.round(x), pies = Math.round(y);
  const centroY = pies - 20;
  const pulso = Math.sin(t * 9) * 0.5 + 0.5;

  // --- 1. Resplandor ---
  // Con tramado, NO con una elipse solida: una elipse llena de color tapa por
  // completo al personaje y se ve como una mancha, no como un aura.
  const rx = 12 + f * 11 + pulso * 2;
  const ry = 22 + f * 20 + pulso * 3;
  for (let y = -ry; y <= ry; y++) {
    const prop = 1 - (y * y) / (ry * ry);
    if (prop <= 0) continue;
    const ancho = Math.round(rx * Math.sqrt(prop));
    for (let x = -ancho; x <= ancho; x++) {
      // Solo los bordes del ovalo, y de a un pixel por medio: queda halo
      const borde = Math.abs(x) > ancho - 2 - f * 2;
      if (!borde) continue;
      if ((x + y + Math.floor(t * 8)) % 2) continue;
      Px.punto(cx + x, centroY + y, color);
    }
  }
  // Contorno superior e inferior, para cerrar la silueta del aura
  for (let x = -rx; x <= rx; x++) {
    const prop = 1 - (x * x) / (rx * rx);
    if (prop <= 0) continue;
    const alto = Math.round(ry * Math.sqrt(prop));
    if ((x + Math.floor(t * 8)) % 2) continue;
    Px.punto(cx + x, centroY - alto, color);
    Px.punto(cx + x, centroY + alto, color);
  }

  // --- 2. Lenguas de fuego: la forma clasica del aura ---
  const lenguas = Math.round(7 + f * 9);
  for (let i = 0; i < lenguas; i++) {
    const fase = (t * 2.2 + i * 0.29) % 1;
    const lado = (i % 2 === 0 ? 1 : -1);
    const sep = (1 + (i % 5)) * (4 + f * 2.5);
    // Las lenguas se cierran hacia el centro a medida que suben: forma de fuego
    const px = cx + lado * sep * (1 - fase * 0.55);
    const alto = (26 + f * 46) * (0.55 + (i % 3) * 0.22);
    const py = pies - 2 - fase * alto;
    const ancho = Math.max(1, Math.round((1 - fase * 0.85) * (3 + f * 4)));
    const largo = Math.max(2, Math.round(ancho * 2.2));
    Px.rect(px - ancho / 2, py, ancho, largo, color);
    // Nucleo claro en la base de cada lengua
    if (fase < 0.45) {
      Px.rect(px - Math.max(1, ancho / 3) / 2, py + 1,
              Math.max(1, Math.round(ancho / 2)), Math.max(1, largo - 2), PAL.blanco);
    }
  }

  // --- 3. Chispas que suben pegadas al cuerpo ---
  const chispas = Math.round(4 + f * 8);
  for (let i = 0; i < chispas; i++) {
    const fase = (t * 3.4 + i * 0.23) % 1;
    const px = cx + Math.sin(i * 2.1 + t * 4) * (10 + f * 12);
    const py = pies - fase * (44 + f * 40);
    Px.rect(px, py, 1, 2, fase < 0.5 ? PAL.blanco : color);
  }

  // --- 4. Rayos electricos ---
  // Nacen del cuerpo y bajan quebrandose, como cuando Gohan pasa a SSJ2. No
  // son rayitas al azar en el aire: salen del personaje.
  if (rayos) {
    // `electricidad` multiplica: SSJ2 y SSJ3 tienen que estar cubiertos de
    // rayos, no tener dos rayitas como el SSJ comun.
    const elec = electricidad === undefined ? 0.4 : electricidad;
    // Ojo con la cantidad: pasados ~8 rayos dejan de leerse como electricidad
    // y tapan al personaje. La sensacion de "mucha" viene del largo y de las
    // ramas, no de llenar la pantalla.
    const cantidad = Math.min(8, Math.round(2 + elec * 4));
    for (let i = 0; i < cantidad; i++) {
      // Cada rayo vive unos pocos frames y despues aparece otro en otro lado
      const semilla = Math.floor(t * 9) + i * 37;
      if (semilla % 3 === 0) continue;
      const lado = (semilla % 2) ? 1 : -1;
      let px = cx + lado * (4 + (semilla % 5));
      let py = centroY - 14 + (semilla % 24);
      const tramos = 3 + (semilla % 3) + Math.round(elec * 2);
      for (let k = 0; k < tramos; k++) {
        const nx = px + lado * rnd(1.5, 5);
        const ny = py + rnd(1.5, 6);
        Px.linea(px, py, nx, ny, k === 0 ? PAL.blanco : color);
        // Ramas que se abren: cuantas mas, mas cargado se ve
        if (k === 1 || (elec > 0.8 && k === 3)) {
          Px.linea(nx, ny, nx + lado * 4, ny - 3, color);
        }
        if (elec > 1 && k === 2) {
          Px.linea(nx, ny, nx - lado * 3, ny + 4, PAL.blanco);
        }
        px = nx; py = ny;
      }
    }
    // Con mucha electricidad, arcos sueltos girando alrededor del cuerpo
    if (elec > 0.8) {
      for (let k = 0; k < 3; k++) {
        const ang = t * 3.5 + k * 2.1;
        const rr = 15 + f * 8;
        const ax = cx + Math.cos(ang) * rr;
        const ay = centroY + Math.sin(ang) * rr * 1.3;
        Px.linea(ax, ay, ax + rnd(-4, 4), ay + rnd(-4, 4), PAL.blanco);
      }
    }

    // Chispazo: un arco corto arriba del cuerpo, no un aro completo. Un aro
    // entero se leia como una burbuja de jabon alrededor del personaje.
    if (Math.floor(t * 5) % 9 === 0) {
      const r2 = Math.round(13 + f * 7);
      for (let a = -0.9; a < 0.9; a += 0.16) {
        Px.punto(cx + Math.sin(a) * r2, centroY - Math.cos(a) * r2, PAL.blanco);
      }
    }
  }

  // --- 5. Onda en el piso: el suelo no aguanta tanto Ki ---
  if (f > 0.6) {
    // Un ANILLO que se expande, no una elipse rellena: rellena tapaba al
    // personaje entero con una mancha de color.
    const fase = (t * 1.6) % 1;
    const rx = Math.round(8 + fase * (16 + f * 18));
    const ry = Math.max(1, Math.round(rx * 0.26));
    for (let a = 0; a < Math.PI * 2; a += 0.24) {
      Px.punto(cx + Math.cos(a) * rx, pies + Math.sin(a) * ry, color);
    }
  }
}

// Version clara de un color, para el nucleo del aura.
function aclarar(hex) {
  if (!hex || hex[0] !== '#') return PAL.blanco;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 90);
  const g = Math.min(255, ((n >> 8) & 255) + 90);
  const b = Math.min(255, (n & 255) + 90);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ---------------------------------------------------------------------------
// Enemigos: cada uno con su matriz y su propio ciclo de caminata.
// ---------------------------------------------------------------------------
function matrizEnemigo(forma, pose, t) {
  const set = ARTE_ENEMIGOS[forma];
  if (!set) return null;
  if (pose === 'run' && set.run1) {
    return (Math.floor(t * 8) % 2 === 0) ? set.run1 : (set.run2 || set.idle);
  }
  if (pose === 'hurt' && set.hurt) return set.hurt;
  if ((pose === 'ki' || pose === 'punch') && set.ataca) return set.ataca;
  return set.idle;
}

function dibujarEnemigoArt(o) {
  if (o.aura) dibujarAura(o.x, o.y, o.aura, o.auraFuerte, o.t || 0, o.fuerzaAura);
  const m = matrizEnemigo(o.forma, o.pose, o.t || 0);
  if (m) dibujarMatriz(m, o.x, o.y, o.facing, o.tintas);
}
