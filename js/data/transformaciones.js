// EL CORAZON DEL JUEGO. Todo el balance de poder vive aca y en ningun otro lado.
//
//   costo     Ki que cuesta activarla, de golpe
//   drenaje   Ki por segundo mientras esta activa
//   dano/vel/def   multiplicadores
//   autoDano  HP por segundo que te saca a vos (Kaioken, SSJ3, SSJ4)
//   regenKi   multiplicador de la regeneracion natural
//
// La regla: cuanto mas fuerte la forma, MENOS tiempo la podes sostener.
// SSJ3 y Ultra Instinto son ventanas de segundos, no estados permanentes.

const TRANSFORMACIONES = {
  base: {
    id: 'base', nombre: 'BASE', costo: 0, drenaje: 0,
    dano: 1, vel: 1, def: 1, autoDano: 0, regenKi: 1,
    peloEstilo: 'goku', peloPix: PAL.pelo, peloPixS: PAL.peloS,
    ojosPix: PAL.negro, auraPix: null, brillo: 0,
    desbloqueada: true,
    disparo: { nombre: 'RAFAGA', cant: 1, r: 3, vel: 4.6, dano: 1, disp: 0 },
    desc: 'Sin transformar. El Ki se recupera al maximo.'
  },

  ssj1: {
    id: 'ssj1', nombre: 'SUPER SAIYAN', costo: 25, drenaje: 4.5,
    dano: 2.4, vel: 1.35, def: 1.35, autoDano: 0, regenKi: .55,
    peloEstilo: 'ssj', peloPix: PAL.dorado, peloPixS: PAL.doradoS,
    ojosPix: PAL.cyan, auraPix: PAL.dorado, brillo: .55, rayos: true,
    desbloqueada: false,
    disparo: { nombre: 'DOBLE RAFAGA', cant: 2, r: 3, vel: 5.2, dano: 0.6, disp: 0.10 },
    desc: 'La leyenda. Sostenible: el caballo de batalla de todo el juego.'
  },

  ssj2: {
    id: 'ssj2', nombre: 'SUPER SAIYAN 2', costo: 45, drenaje: 9,
    dano: 3.6, vel: 1.55, def: 1.5, autoDano: 0, regenKi: .35,
    peloEstilo: 'ssj', peloPix: PAL.dorado, peloPixS: PAL.doradoS,
    ojosPix: PAL.cyan, auraPix: PAL.doradoL, brillo: .8, rayos: true,
    desbloqueada: false,
    disparo: { nombre: 'TRIPLE', cant: 3, r: 3, vel: 5.6, dano: 0.5, disp: 0.16 },
    desc: 'Mas punzante y con electricidad. El doble de drenaje que SSJ.'
  },

  ssj3: {
    id: 'ssj3', nombre: 'SUPER SAIYAN 3', costo: 70, drenaje: 20,
    dano: 5.5, vel: 1.75, def: 1.6, autoDano: 2.5, regenKi: .12,
    peloEstilo: 'ssj3', peloPix: PAL.dorado, peloPixS: PAL.doradoS,
    ojosPix: PAL.cyan, auraPix: PAL.doradoL, brillo: 1, rayos: true,
    desbloqueada: false,
    disparo: { nombre: 'LLUVIA', cant: 5, r: 2, vel: 6.0, dano: 0.4, disp: 0.30 },
    desc: 'Devastador y suicida: te come el Ki y la vida. Ventanas de 5 segundos.'
  },

  ssj4: {
    id: 'ssj4', nombre: 'SUPER SAIYAN 4', costo: 80, drenaje: 14,
    dano: 6.5, vel: 1.85, def: 2.0, autoDano: 1.2, regenKi: .2,
    peloEstilo: 'ssj4', peloPix: PAL.pelo, peloPixS: PAL.peloS,
    ojosPix: PAL.dorado, auraPix: PAL.rojo, brillo: .9, rayos: true,
    desbloqueada: false, requiere: 'ozaru',
    disparo: { nombre: 'ZARPAZO', cant: 1, r: 7, vel: 4.2, dano: 2.2, disp: 0 },
    desc: 'Solo tras dominar el Ozaru. Pelaje rojo, control total.'
  },

  dios: {
    id: 'dios', nombre: 'SSJ GOD', costo: 60, drenaje: 8,
    dano: 5.0, vel: 1.95, def: 1.8, autoDano: 0, regenKi: .6,
    peloEstilo: 'goku', peloPix: PAL.rojo, peloPixS: PAL.rojoS,
    ojosPix: PAL.rojo, auraPix: PAL.rojo, brillo: .7, rayos: true,
    desbloqueada: false,
    disparo: { nombre: 'LANZA DIVINA', cant: 1, r: 5, vel: 8.0, dano: 2.6, disp: 0 },
    desc: 'Ki divino: poco drenaje y mucha regeneracion. La forma eficiente.'
  },

  blue: {
    id: 'blue', nombre: 'SSJ BLUE', costo: 75, drenaje: 13,
    dano: 6.8, vel: 2.0, def: 1.9, autoDano: 0, regenKi: .3,
    peloEstilo: 'ssj', peloPix: PAL.cyan, peloPixS: '#1f7fa8',
    ojosPix: PAL.cyan, auraPix: PAL.cyan, brillo: 1, rayos: true,
    desbloqueada: false, requiere: 'dios',
    disparo: { nombre: 'KIENZAN', cant: 2, r: 5, vel: 7.0, dano: 1.8, disp: 0.22 },
    desc: 'Ki divino en forma Super Saiyan. Control absoluto, costo enorme.'
  },

  ui: {
    id: 'ui', nombre: 'ULTRA INSTINTO', costo: 95, drenaje: 26,
    dano: 8.0, vel: 2.2, def: 2.4, autoDano: 0, regenKi: 0,
    esquivaAuto: .55,
    peloEstilo: 'goku', peloPix: '#e8eaf6', peloPixS: '#a8b0c8',
    ojosPix: '#c0c8e0', auraPix: '#dfe6ff', brillo: 1.2, rayos: true,
    desbloqueada: false,
    disparo: { nombre: 'ROMPE ESPACIO', cant: 4, r: 4, vel: 9.0, dano: 1.4, disp: 0.12 },
    desc: 'Esquiva sola el 55% de los golpes. Dura lo que dure el Ki.'
  },

  ozaru: {
    id: 'ozaru', nombre: 'OZARU', costo: 0, drenaje: 6,
    dano: 7.0, vel: .75, def: 3.0, autoDano: 0, regenKi: .4,
    peloEstilo: 'ozaru', peloPix: '#4a3524', peloPixS: '#2a1d13',
    ojosPix: PAL.rojo, auraPix: '#8d6e63', brillo: .4,
    escala: 3.2, especial: true, descontrol: true,
    desbloqueada: false,
    disparo: { nombre: 'ALIENTO', cant: 1, r: 10, vel: 3.4, dano: 3.2, disp: 0 },
    desc: 'Mono gigante: daño brutal, lento y sin puntería. Evento, no eleccion.'
  }
};

// Orden del selector, teclas 1..8. Ozaru queda afuera a proposito.
const ORDEN_FORMAS = ['base', 'ssj1', 'ssj2', 'ssj3', 'ssj4', 'dios', 'blue', 'ui'];

// Kaioken NO es una forma: es un multiplicador que se APILA sobre la forma
// activa. Por eso puede multiplicar a un SSJ Blue, y por eso te cuesta vida.
const KAIOKEN = {
  niveles: [
    { n: 0,  nombre: '',            dano: 1,   vel: 1,    autoDano: 0,   drenaje: 0 },
    { n: 1,  nombre: 'KAIOKEN',     dano: 1.5, vel: 1.30, autoDano: 1.5, drenaje: 5 },
    { n: 3,  nombre: 'KAIOKEN X3',  dano: 2.2, vel: 1.50, autoDano: 4.0, drenaje: 11 },
    { n: 10, nombre: 'KAIOKEN X10', dano: 3.4, vel: 1.80, autoDano: 9.0, drenaje: 22 }
  ],
  desbloqueadoHasta: 0
};
