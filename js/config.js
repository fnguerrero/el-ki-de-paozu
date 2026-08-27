// Resolucion interna baja escalada a la ventana: eso solo ya da el look Genesis.
// TODO el juego se dibuja en 320x180 y se agranda x3 sin suavizado.

const CFG = {
  VW: 480,          // ancho interno (30 tiles de 16px)
  VH: 270,          // alto interno
  ESCALA: 2,
  TILE: 16,

  // --- Fisica estilo Sonic/Genesis (unidades de la resolucion interna) ---
  GRAV: 0.30,
  GRAV_CAIDA: 0.42,       // caes mas rapido de lo que subis: se siente mejor
  VEL_MAX: 2.10,
  ACEL: 0.28,
  FRICCION: 0.42,
  ACEL_AIRE: 0.16,
  SALTO: -5.85,
  SALTO_CORTO: -2.45,     // al soltar el boton, corta el salto
  VEL_CAIDA_MAX: 6.5,
  COYOTE: 6,              // frames de gracia tras salir de una plataforma
  BUFFER_SALTO: 7,        // frames de gracia si apretas antes de tocar el piso

  SPRINT: 1.65,           // multiplicador al correr (doble toque)
  VUELO_VEL: 2.6,         // velocidad volando
  VUELO_COSTO: 11,        // Ki por segundo en el aire

  DEBUG: false
};

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function rnd(a, b) { return a + Math.random() * (b - a); }
function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }
function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function signo(v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); }
