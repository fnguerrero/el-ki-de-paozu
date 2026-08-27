// La voz de Goku, con la sintesis de voz del navegador.
//
// Aclaracion honesta: esto NO es la voz del doblaje. Es la voz que tiene
// instalada tu sistema, con el tono subido y la velocidad acelerada para
// acercarse al timbre agudo del personaje. Sin archivos de audio no hay forma
// de tener la voz real, pero al menos habla de verdad en vez de hacer bips.
//
// Todo es opcional: si el navegador no tiene voces, el juego sigue igual.

const Voz = {
  activa: true,
  lista: false,
  vozEs: null,
  ultima: 0,
  silenciada: false,

  init() {
    if (!('speechSynthesis' in window)) return;
    const cargar = () => {
      const voces = window.speechSynthesis.getVoices();
      if (!voces || !voces.length) return;
      // Preferimos una voz en español; si no hay, cualquiera sirve
      const enEspanol = voces.filter(v => /^es([-_]|$)/i.test(v.lang));
      // Preferimos voz femenina en español: el timbre de Goku en el anime es
      // agudo, y con pitch alto una voz masculina suena a dibujito roto.
      this.vozEs = enEspanol.find(v => /female|mujer|helena|sabina|paulina|laura|monica/i.test(v.name))
                || enEspanol[0]
                || voces[0];
      this.sinEspanol = enEspanol.length === 0;
      this.lista = true;
    };
    cargar();
    window.speechSynthesis.onvoiceschanged = cargar;
  },

  // `quien` cambia el timbre: goku agudo y rapido, los villanos graves.
  PERFILES: {
    goku:    { pitch: 1.75, rate: 1.15, vol: 0.9 },
    gohan:   { pitch: 1.9,  rate: 1.2,  vol: 0.85 },
    aliado:  { pitch: 1.3,  rate: 1.05, vol: 0.8 },
    villano: { pitch: 0.55, rate: 0.9,  vol: 0.9 },
    dragon:  { pitch: 0.3,  rate: 0.75, vol: 1.0 }
  },

  decir(texto, quien, opts) {
    if (!this.lista || !this.activa || this.silenciada || !texto) return;
    const o = opts || {};
    const ahora = performance.now();
    // No pisar una linea con otra ni hablar encima de si mismo
    if (!o.urgente && ahora - this.ultima < (o.espera || 1400)) return;
    this.ultima = ahora;

    try {
      if (o.corta) window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      const p = this.PERFILES[quien] || this.PERFILES.goku;
      if (this.vozEs) u.voice = this.vozEs;
      u.lang = (this.vozEs && this.vozEs.lang) || 'es-AR';
      u.pitch = clamp(p.pitch * (o.pitch || 1), 0, 2);
      u.rate = clamp(p.rate * (o.rate || 1), 0.1, 10);
      u.volume = p.vol;
      window.speechSynthesis.speak(u);
    } catch (e) { /* sin voz, el juego sigue igual */ }
  },

  callar() {
    try { window.speechSynthesis.cancel(); } catch (e) { /* nada */ }
  },

  alternar() {
    this.silenciada = !this.silenciada;
    if (this.silenciada) this.callar();
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
