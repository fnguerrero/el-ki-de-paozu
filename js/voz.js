// La voz de Goku, con la sintesis de voz del navegador.
//
// Aclaracion honesta: esto NO es la voz del doblaje. Es la voz que tiene
// instalada tu sistema, con el tono subido y la velocidad acelerada para
// acercarse al timbre agudo del personaje. Sin archivos de audio no hay forma
// de tener la voz real, pero al menos habla de verdad en vez de hacer bips.
//
// Todo es opcional: si el navegador no tiene voces, el juego sigue igual.

// Voz de personaje sintetizada.
//
// NO se usa la sintesis de voz del navegador (speechSynthesis): esa lee el
// texto con la voz que tenga instalada el sistema, que en la practica es una
// voz en ingles leyendo castellano. Suena horrible y no se puede corregir
// desde el juego.
//
// En su lugar, lo que hacen los juegos sin doblaje: una nota corta por silaba,
// con el tono siguiendo las vocales del texto. No dice palabras de verdad pero
// se lee como alguien hablando, y encaja con el resto del audio, que tambien
// es todo sintetizado.

const Voz = {
  activa: true,
  lista: true,
  ultima: 0,
  silenciada: false,

  init() { /* no necesita nada: usa el mismo motor que el resto del audio */ },

  // Timbre de cada personaje. `base` es la nota central de su voz.
  PERFILES: {
    goku:    { base: 300, ritmo: 0.062, tipo: 'square',   vol: 0.10 },
    gohan:   { base: 360, ritmo: 0.058, tipo: 'square',   vol: 0.09 },
    aliado:  { base: 250, ritmo: 0.065, tipo: 'triangle', vol: 0.09 },
    villano: { base: 130, ritmo: 0.080, tipo: 'sawtooth', vol: 0.11 },
    dragon:  { base: 80,  ritmo: 0.100, tipo: 'sawtooth', vol: 0.13 }
  },

  // Cuanto sube o baja el tono cada vocal: es lo que da sensacion de palabras.
  VOCALES: { a: 1.00, e: 1.14, i: 1.32, o: 0.90, u: 0.80 },

  decir(texto, quien, opts) {
    if (!this.activa || this.silenciada || !texto) return;
    if (!Sonido.listo || Sonido.silenciado) return;
    const o = opts || {};
    const ahora = performance.now();
    if (!o.urgente && ahora - this.ultima < (o.espera || 1400)) return;
    this.ultima = ahora;

    const p = this.PERFILES[quien] || this.PERFILES.goku;
    const t0 = Sonido.ctx.currentTime;
    const letras = texto.toLowerCase().replace(/[^a-záéíóúñ ]/g, '');

    let i = 0, silaba = 0;
    while (i < letras.length && silaba < 22) {
      const c = letras[i++];
      const v = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' }[c] || c;
      if (!this.VOCALES[v]) continue;

      const cuando = t0 + silaba * p.ritmo * (o.rate ? 1 / o.rate : 1);
      const dur = p.ritmo * 0.85;
      const curva = 1 + Math.sin(silaba * 0.7) * 0.12;
      const freq = p.base * this.VOCALES[v] * curva * (o.pitch || 1);

      try {
        const osc = Sonido.ctx.createOscillator();
        const g = Sonido.ctx.createGain();
        const filtro = Sonido.ctx.createBiquadFilter();
        filtro.type = 'bandpass';
        filtro.frequency.value = freq * 2.6;
        filtro.Q.value = 3;

        osc.type = p.tipo;
        // Cada silaba arranca abajo y sube: es el "ataque" de la voz
        osc.frequency.setValueAtTime(freq * 0.82, cuando);
        osc.frequency.linearRampToValueAtTime(freq, cuando + dur * 0.35);
        osc.frequency.linearRampToValueAtTime(freq * 0.94, cuando + dur);

        g.gain.setValueAtTime(0.0001, cuando);
        g.gain.exponentialRampToValueAtTime(p.vol, cuando + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);

        osc.connect(filtro); filtro.connect(g); g.connect(Sonido.master);
        osc.start(cuando);
        osc.stop(cuando + dur + 0.02);
      } catch (e) { return; }
      silaba++;
    }
  },

  callar() { /* las notas son cortas: no hay nada que cortar */ },

  alternar() {
    this.silenciada = !this.silenciada;
    return this.silenciada;
  }
};

// ---------------------------------------------------------------------------
// Lo que dice en cada situacion. Varias opciones por evento para que no repita
// siempre lo mismo.
// ---------------------------------------------------------------------------
const FRASES = {
  verEnemigo: ['Vamos!', 'Aca vamos', 'Bien, a pelear'],
  verJefe: ['Que Ki enorme', 'Este es fuerte', 'Al fin alguien fuerte',
            'Se siente desde aca'],
  kamehameha: ['Ka me ha me haaa', 'Kame hame haaa'],
  transformar: {
    ssj1: ['Super Saiyan!', 'Esto es un Super Saiyan'],
    ssj2: ['Todavia hay mas!', 'Fase dos!'],
    ssj3: ['Aun no termino!', 'Fase tres!'],
    ssj4: ['Este es mi limite'],
    dios: ['Ki divino'],
    blue: ['Super Saiyan Blue'],
    ui: ['Ultra instinto', 'Mi cuerpo se mueve solo']
  },
  golpeado: ['Ugh', 'Ay', 'Uf'],
  ganar: ['Lo logramos', 'Se termino', 'Buena pelea'],
  perder: ['No puede ser', 'Todavia no'],
  esferas: ['Las siete esferas!', 'Ya estan las siete'],
  cargar: ['Aaah', 'Mas poder', 'Un poco mas'],
  nivel: ['Me siento mas fuerte']
};

function fraseAlAzar(lista) {
  if (!lista || !lista.length) return null;
  return lista[Math.floor(Math.random() * lista.length)];
}
