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

// o = { x, y (pies), facing, pose, t, tintas, aura, auraFuerte }
function dibujarPeleador(o) {
  if (o.aura) {
    dibujarAura(o.x, o.y, o.aura, o.auraFuerte, o.t || 0, o.fuerzaAura, o.rayos);
  }
  dibujarMatriz(matrizPose(o.pose, o.t || 0, o.dano || 0), o.x, o.y, o.facing, o.tintas);
}

// EL AURA. Es lo que dice "este tipo tiene mucho poder", asi que se dibuja
// por capas: resplandor, lenguas de fuego que suben, chispas que orbitan,
// rayos, y ondas en el piso. `fuerza` (0..1.4) escala todo.
function dibujarAura(x, y, color, fuerte, t, fuerza, rayos) {
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
    const cantidad = Math.round(2 + f * 3);
    for (let i = 0; i < cantidad; i++) {
      // Cada rayo vive unos pocos frames y despues aparece otro en otro lado
      const semilla = Math.floor(t * 9) + i * 37;
      if (semilla % 3 === 0) continue;
      const lado = (semilla % 2) ? 1 : -1;
      let px = cx + lado * (6 + (semilla % 7));
      let py = centroY - 16 + (semilla % 26);
      const tramos = 4 + (semilla % 3);
      for (let k = 0; k < tramos; k++) {
        const nx = px + lado * rnd(2, 7);
        const ny = py + rnd(2, 9);
        Px.linea(px, py, nx, ny, k === 0 ? PAL.blanco : color);
        // Ramita que se abre
        if (k === 1) Px.linea(nx, ny, nx + lado * 4, ny - 3, color);
        px = nx; py = ny;
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
    const anillo = Math.floor((t * 1.6) % 1 * (20 + f * 22));
    Px.elipse(cx, pies, 10 + anillo, Math.max(1, (10 + anillo) * 0.22), color);
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
