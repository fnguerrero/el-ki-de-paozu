// Sonido sintetizado con Web Audio: ni un solo archivo externo.
// Todo son osciladores y ruido, que es exactamente como sonaban las consolas
// de la epoca.
//
// El navegador no deja sonar nada hasta que el usuario toca una tecla, asi que
// el contexto se crea recien en el primer input (ver despertar()).

// Una escala y un tempo por saga. Las notas son Hz.
const PALETAS_MUSICA = {
  piccolo:   { tempo: 0.135, bajo: [110, 110, 0, 110, 0, 146.8, 0, 130.8, 98, 98, 0, 98, 0, 130.8, 0, 123.5],
               melodia: [440, 0, 523.3, 0, 659.3, 0, 523.3, 0, 587.3, 0, 493.9, 0, 440, 0, 392, 0] },
  saiyajin:  { tempo: 0.122, bajo: [98, 98, 0, 116.5, 0, 130.8, 0, 116.5, 87.3, 87.3, 0, 98, 0, 116.5, 0, 110],
               melodia: [392, 0, 466.2, 0, 523.3, 0, 466.2, 0, 349.2, 0, 392, 0, 466.2, 0, 415.3, 0] },
  namek:     { tempo: 0.145, bajo: [123.5, 0, 123.5, 0, 164.8, 0, 146.8, 0, 110, 0, 110, 0, 146.8, 0, 130.8, 0],
               melodia: [493.9, 0, 587.3, 0, 659.3, 0, 587.3, 0, 523.3, 0, 493.9, 0, 440, 0, 493.9, 0] },
  androides: { tempo: 0.118, bajo: [130.8, 130.8, 0, 130.8, 0, 155.6, 0, 174.6, 116.5, 116.5, 0, 116.5, 0, 146.8, 0, 138.6],
               melodia: [523.3, 0, 622.3, 0, 698.5, 0, 622.3, 0, 587.3, 0, 523.3, 0, 466.2, 0, 523.3, 0] },
  buu:       { tempo: 0.130, bajo: [146.8, 0, 146.8, 174.6, 0, 196, 0, 174.6, 130.8, 0, 130.8, 0, 164.8, 0, 155.6, 0],
               melodia: [587.3, 0, 698.5, 0, 784, 0, 698.5, 0, 622.3, 0, 587.3, 0, 523.3, 0, 587.3, 0] },
  gt:        { tempo: 0.126, bajo: [103.8, 103.8, 0, 103.8, 0, 138.6, 0, 123.5, 92.5, 92.5, 0, 92.5, 0, 123.5, 0, 116.5],
               melodia: [415.3, 0, 493.9, 0, 554.4, 0, 493.9, 0, 466.2, 0, 415.3, 0, 369.99, 0, 415.3, 0] },
  super:     { tempo: 0.112, bajo: [116.5, 116.5, 0, 155.6, 0, 174.6, 0, 155.6, 103.8, 103.8, 0, 138.6, 0, 155.6, 0, 146.8],
               melodia: [466.2, 0, 554.4, 0, 622.3, 0, 698.5, 0, 622.3, 0, 554.4, 0, 466.2, 0, 415.3, 0] },
  vacio:     { tempo: 0.105, bajo: [87.3, 87.3, 0, 87.3, 0, 110, 0, 103.8, 77.8, 77.8, 0, 77.8, 0, 103.8, 0, 92.5],
               melodia: [349.2, 0, 415.3, 0, 466.2, 0, 415.3, 0, 392, 0, 349.2, 0, 311.1, 0, 349.2, 0] }
};

let Sonido = {
  ctx: null,
  roto: false,
  master: null,
  canalMusica: null,
  listo: false,
  silenciado: false,
  musicaOn: true,

  despertar() {
    if (this.listo || this.roto) return;
    // Todo envuelto: si el navegador se niega a dar audio (Firefox con
    // autoplay bloqueado, por ejemplo), el juego tiene que seguir andando
    // igual, mudo. Antes una excepcion aca mataba el frame y el juego
    // quedaba congelado sin que se moviera nada.
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.roto = true; return; }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);

      this.canalMusica = this.ctx.createGain();
      this.canalMusica.gain.value = 0.30;
      this.canalMusica.connect(this.master);

      if (this.ctx.state === 'suspended' && this.ctx.resume) this.ctx.resume();

      this.listo = true;
      this.Musica.iniciar(this);
    } catch (e) {
      this.roto = true;
      this.listo = false;
      if (window.console) console.warn('sin audio:', e);
    }
  },

  alternarSilencio() {
    this.silenciado = !this.silenciado;
    if (this.master) {
      this.master.gain.value = this.silenciado ? 0 : 0.35;
    }
    return this.silenciado;
  },

  // ------------------------------------------------- pestaña en segundo plano
  // El secuenciador vive en un setInterval y el contexto no se entera de que
  // nadie esta mirando: una pestaña olvidada seguia con la musica puesta.
  dormir() {
    if (this.ctx && this.ctx.state === 'running') {
      try { this.ctx.suspend(); } catch (e) { /* nada */ }
    }
  },

  despertarAudio() {
    if (this.ctx && this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch (e) { /* nada */ }
    }
  },

  // Al cerrar la pestaña: cortar de raiz, sin dejar osciladores vivos.
  apagar() {
    if (this.Musica && this.Musica.timer) {
      clearInterval(this.Musica.timer);
      this.Musica.timer = null;
    }
    if (this.ctx) {
      try { this.ctx.close(); } catch (e) { /* nada */ }
      this.ctx = null;
      this.master = null;
      this.canalMusica = null;
      this.listo = false;
    }
  },

  // ------------------------------------------------------------- primitivas
  // Un tono con envolvente. `barrido` mueve la frecuencia hasta otra nota.
  tono(freq, dur, opts) {
    if (!this.listo || this.silenciado) return;
    const o = opts || {};
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = o.tipo || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.barrido) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.barrido), t + dur);
    }
    const vol = o.vol === undefined ? 0.25 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.ataque || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(o.destino || this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },

  // Ruido blanco filtrado: la base de golpes y explosiones.
  ruido(dur, opts) {
    if (!this.listo || this.silenciado) return;
    const o = opts || {};
    const t = this.ctx.currentTime;
    const muestras = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, muestras, this.ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < muestras; i++) datos[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filtro = this.ctx.createBiquadFilter();
    filtro.type = o.tipoFiltro || 'lowpass';
    filtro.frequency.setValueAtTime(o.corte || 1200, t);
    if (o.corteFinal) {
      filtro.frequency.exponentialRampToValueAtTime(Math.max(60, o.corteFinal), t + dur);
    }

    const g = this.ctx.createGain();
    const vol = o.vol === undefined ? 0.3 : o.vol;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(filtro);
    filtro.connect(g);
    g.connect(this.master);
    src.start(t);
  },

  // ---------------------------------------------------------------- efectos
  // Cada tipo de golpe suena distinto: el puno es seco y agudo, la patada
  // tiene mas cuerpo, y el remate del combo es grave y largo.
  golpe(tipo) {
    if (tipo === 'patada') {
      this.ruido(0.13, { corte: 1700, corteFinal: 280, vol: 0.34 });
      this.tono(140, 0.11, { tipo: 'square', barrido: 70, vol: 0.20 });
    } else if (tipo === 'pesado') {
      this.ruido(0.26, { corte: 1400, corteFinal: 130, vol: 0.44 });
      this.tono(95, 0.24, { tipo: 'sawtooth', barrido: 40, vol: 0.26 });
      this.tono(60, 0.30, { tipo: 'triangle', barrido: 30, vol: 0.20 });
    } else {
      this.ruido(0.09, { corte: 2600, corteFinal: 400, vol: 0.32 });
      this.tono(190, 0.07, { tipo: 'square', barrido: 90, vol: 0.16 });
    }
  },

  // Pisada: un golpecito sordo. Cambia apenas de tono para que no sea un
  // metronomo.
  paso() {
    this.ruido(0.05, { corte: 500 + rnd(-120, 120), corteFinal: 180, vol: 0.07 });
  },

  // Caer al piso. `fuerza` (0..1) sale de la velocidad de caida: un saltito
  // suena a nada y una caida larga a golpe seco con polvo.
  aterrizar(fuerza) {
    const f = fuerza === undefined ? 0.4 : clamp(fuerza, 0, 1);
    this.ruido(0.05 + f * 0.13, {
      corte: 900 - f * 400, corteFinal: 120, vol: 0.06 + f * 0.20
    });
    if (f > 0.45) {
      // Solo las caidas fuertes tienen "cuerpo" grave
      this.tono(90 - f * 25, 0.10 + f * 0.10, { tipo: 'triangle', barrido: 35, vol: f * 0.20 });
    }
  },

  // Bloquear un golpe: metalico y corto, para que se distinga de recibirlo.
  guardia() {
    this.ruido(0.07, { tipoFiltro: 'bandpass', corte: 2600, vol: 0.20 });
    this.tono(520, 0.09, { tipo: 'square', barrido: 240, vol: 0.13 });
    this.tono(780, 0.06, { tipo: 'square', barrido: 340, vol: 0.08 });
  },

  golpeFuerte() {
    this.ruido(0.22, { corte: 2200, corteFinal: 160, vol: 0.42 });
    this.tono(120, 0.20, { tipo: 'square', barrido: 45, vol: 0.26 });
    this.tono(70, 0.26, { tipo: 'triangle', barrido: 34, vol: 0.22 });
  },

  rafagaKi() {
    this.tono(880, 0.16, { tipo: 'sine', barrido: 260, vol: 0.20 });
    this.tono(1320, 0.12, { tipo: 'sine', barrido: 400, vol: 0.10 });
  },

  // Se llama repetido mientras cargas: `avance` (0..1) sube el tono, asi se
  // escucha que el Ki se esta juntando de verdad.
  cargandoKi(avance) {
    const a = avance === undefined ? 0 : clamp(avance, 0, 1);
    this.tono(180 + a * 520, 0.13, { tipo: 'triangle', vol: 0.05 + a * 0.05 });
    this.ruido(0.10, { tipoFiltro: 'bandpass', corte: 600 + a * 2200, vol: 0.05 + a * 0.06 });
  },

  // Al llenar la carga: golpe seco y grave.
  kiLleno() {
    this.tono(110, 0.40, { tipo: 'sawtooth', barrido: 320, vol: 0.18 });
    this.ruido(0.35, { corte: 260, corteFinal: 3000, vol: 0.18 });
  },

  kamehameha() {
    // Barrido largo + ruido: se tiene que escuchar "grande"
    this.tono(160, 0.75, { tipo: 'sawtooth', barrido: 900, vol: 0.22 });
    this.tono(320, 0.75, { tipo: 'sine', barrido: 1400, vol: 0.14 });
    this.ruido(0.75, { corte: 400, corteFinal: 3800, vol: 0.20 });
  },

  // La transformacion es el momento importante del juego: acorde ascendente.
  transformar(nivel) {
    const n = nivel || 0;
    const base = 200 * (1 + n * 0.1);
    // Acorde ascendente, una nota atras de la otra
    [0, 0.07, 0.14, 0.22].forEach((retraso, i) => {
      setTimeout(() => {
        this.tono(base * Math.pow(1.5, i), 0.7, {
          tipo: 'sawtooth', barrido: base * Math.pow(1.5, i) * 3, vol: 0.20
        });
      }, retraso * 1000);
    });
    // Barrido de energia subiendo
    this.ruido(1.3, { corte: 200, corteFinal: 7000, vol: 0.30 });
    this.tono(60, 1.3, { tipo: 'triangle', barrido: 420, vol: 0.24 });
    // El grito, que es la mitad del momento
    this.grito(0.7 + n * 0.06, 1.5 + n * 0.12);
    // Y el estallido al terminar de subir
    setTimeout(() => {
      this.ruido(0.5, { corte: 5000, corteFinal: 120, vol: 0.42 });
      this.tono(52, 0.6, { tipo: 'square', barrido: 26, vol: 0.3 });
    }, 900 + n * 60);
  },

  salto() {
    this.tono(330, 0.10, { tipo: 'square', barrido: 640, vol: 0.13 });
  },

  // Despegue: un golpe de aire, no un tono barrido (eso sonaba a pedo).
  vuelo() {
    this.rafagaAire(1.0);
    this.tono(520, 0.16, { tipo: 'triangle', barrido: 900, vol: 0.05 });
  },

  // El viento del vuelo: pulsos cortos de ruido filtrado, cada uno distinto.
  // Un oscilador sostenido acá suena a pedo; ruido en rafagas suena a aire.
  rafagaAire(fuerza) {
    const f = fuerza === undefined ? 1 : fuerza;
    const corte = rnd(700, 1400);
    this.ruido(rnd(0.16, 0.30), {
      tipoFiltro: 'bandpass',
      corte: corte,
      corteFinal: corte * rnd(1.6, 3.2),
      vol: 0.09 * f
    });
  },

  // Se llama sola cada tanto mientras volas.
  vientoVuelo() {
    this.rafagaAire(rnd(0.5, 0.9));
  },

  // El vuelo ahora suena por rafagas (ver vientoVuelo). Esto queda solo para
  // cortar cualquier zumbido que hubiera quedado sonando.
  zumbido(encender) {
    if (!this.listo || encender) return;
    if (this._zumb) {
      const z = this._zumb, t = this.ctx.currentTime;
      this._zumb = null;
      try {
        z.g.gain.cancelScheduledValues(t);
        z.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        z.osc.stop(t + 0.2); z.sub.stop(t + 0.2); z.lfo.stop(t + 0.2);
      } catch (e) { /* nada */ }
    }
  },

  // Corte de aire al hacer un dash o un cambio brusco.
  swoosh() {
    this.ruido(0.16, { tipoFiltro: 'bandpass', corte: 1800, corteFinal: 350, vol: 0.16 });
  },

  // ---------------------------------------------------------------- la voz
  // Curva de distorsion: es lo que convierte un tono limpio en un grito
  // rasgado. Sin esto suena a sirena, por mas formantes que le pongas.
  _curvaDistorsion(cantidad) {
    if (this._curvas && this._curvas[cantidad]) return this._curvas[cantidad];
    const n = 1024;
    const curva = new Float32Array(n);
    const k = cantidad * 60;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curva[i] = ((3 + k) * x * 20 * Math.PI / 180) / (Math.PI + k * Math.abs(x));
    }
    this._curvas = this._curvas || {};
    this._curvas[cantidad] = curva;
    return curva;
  },

  // Grito. Varias capas apiladas: el cuerpo del grito, un coro desafinado
  // encima que lo engorda, un sub grave que lo sostiene y un eco corto que le
  // da tamaño. Es lo que separa un "aaah" de un grito de transformacion.
  grito(intensidad, duracion) {
    if (!this.listo || this.silenciado) return;
    const inten = clamp(intensidad === undefined ? 0.5 : intensidad, 0, 1);
    const dur = duracion || (0.9 + inten * 1.4);
    const t = this.ctx.currentTime;
    const base = 132 + inten * 130;

    const dist = this.ctx.createWaveShaper();
    dist.curve = this._curvaDistorsion(0.45 + inten * 0.55);
    dist.oversample = '4x';

    // Formantes que se abren durante el grito
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass'; f1.Q.value = 5;
    f1.frequency.setValueAtTime(520, t);
    f1.frequency.linearRampToValueAtTime(880, t + dur * 0.45);
    f1.frequency.linearRampToValueAtTime(700, t + dur);

    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass'; f2.Q.value = 7;
    f2.frequency.setValueAtTime(980, t);
    f2.frequency.linearRampToValueAtTime(1600, t + dur * 0.5);

    const f3 = this.ctx.createBiquadFilter();
    f3.type = 'bandpass'; f3.Q.value = 4;
    f3.frequency.value = 2800;

    const mezcla = this.ctx.createGain();
    const g = this.ctx.createGain();
    const pico = 0.24 + inten * 0.30;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico * 0.6, t + 0.06);
    g.gain.exponentialRampToValueAtTime(pico, t + dur * 0.55);
    g.gain.setValueAtTime(pico, t + dur * 0.72);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    // Eco: dos repeticiones cortas. Sin esto el grito suena "chico".
    const eco = this.ctx.createDelay(0.5);
    eco.delayTime.value = 0.14;
    const ecoG = this.ctx.createGain();
    ecoG.gain.value = 0.28 + inten * 0.16;
    eco.connect(ecoG); ecoG.connect(eco);
    ecoG.connect(this.master);

    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    lfo.frequency.setValueAtTime(5, t);
    lfo.frequency.linearRampToValueAtTime(9 + inten * 4, t + dur);
    lfoG.gain.value = base * 0.06;
    lfo.connect(lfoG);

    const oscs = [];
    // Coro: los desafinados son los que engordan la voz
    const capas = [
      [1, 'sawtooth', 1.0, 1.000],
      [1, 'sawtooth', 0.55, 1.012],
      [1, 'square',   0.40, 0.991],
      [2, 'square',   0.35, 1.004],
      [3, 'sawtooth', 0.20, 1.000],
      [0.5, 'triangle', 0.7, 1.000]     // sub: el peso del grito
    ];
    capas.forEach(a => {
      const o = this.ctx.createOscillator();
      const og = this.ctx.createGain();
      o.type = a[1];
      const f0 = base * a[0] * a[3];
      o.frequency.setValueAtTime(f0 * 0.8, t);
      o.frequency.linearRampToValueAtTime(f0 * (1.25 + inten * 0.35), t + dur * 0.4);
      o.frequency.linearRampToValueAtTime(f0 * 0.88, t + dur);
      og.gain.value = a[2];
      lfoG.connect(o.frequency);
      o.connect(og); og.connect(dist);
      oscs.push(o);
    });

    dist.connect(f1); dist.connect(f2); dist.connect(f3);
    f1.connect(mezcla); f2.connect(mezcla); f3.connect(mezcla);
    mezcla.connect(g);
    g.connect(this.master);
    g.connect(eco);

    oscs.forEach(o => { o.start(t); o.stop(t + dur + 0.05); });
    lfo.start(t); lfo.stop(t + dur + 0.05);

    // Aire de garganta y un golpe grave al arrancar
    this.ruido(dur * 0.9, {
      tipoFiltro: 'bandpass', corte: 700, corteFinal: 2200,
      vol: 0.05 + inten * 0.08
    });
    this.tono(70 - inten * 20, 0.5, { tipo: 'triangle', barrido: 40, vol: 0.16 + inten * 0.1 });
  },

  dash() {
    this.ruido(0.14, { corte: 900, corteFinal: 3200, vol: 0.18 });
  },

  // Bip del texto que se va escribiendo. Alterna el tono segun quien habla.
  blip(n) {
    this.tono(620 + ((n || 0) % 2) * 140, 0.035, { tipo: 'square', vol: 0.045 });
  },

  // Choque de poderes: dos frecuencias peleando.
  choque() {
    this.tono(660, 0.22, { tipo: 'sawtooth', barrido: 180, vol: 0.16 });
    this.tono(440, 0.22, { tipo: 'square', barrido: 900, vol: 0.12 });
    this.ruido(0.25, { corte: 2400, corteFinal: 500, vol: 0.22 });
  },

  dano() {
    this.tono(300, 0.20, { tipo: 'square', barrido: 70, vol: 0.24 });
    this.ruido(0.14, { corte: 900, corteFinal: 200, vol: 0.20 });
  },

  item() {
    this.tono(880, 0.08, { tipo: 'square', vol: 0.16 });
    setTimeout(() => this.tono(1320, 0.14, { tipo: 'square', vol: 0.16 }), 70);
  },

  // Cada esfera suena mas aguda que la anterior: se escucha el progreso.
  esfera(n) {
    const base = 523 * Math.pow(1.09, (n || 1) - 1);
    this.tono(base, 0.10, { tipo: 'square', vol: 0.16 });
    setTimeout(() => this.tono(base * 1.5, 0.18, { tipo: 'square', vol: 0.16 }), 80);
  },

  // Invocacion: acorde grave y largo, como un trueno.
  shenlong() {
    this.tono(55, 2.4, { tipo: 'sawtooth', barrido: 110, vol: 0.22 });
    this.tono(82, 2.2, { tipo: 'triangle', barrido: 165, vol: 0.16 });
    this.ruido(2.0, { corte: 200, corteFinal: 1800, vol: 0.20 });
  },

  nivelArriba() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this.tono(f, 0.16, { tipo: 'square', vol: 0.18 }), i * 80);
    });
  },

  explosion() {
    this.ruido(0.45, { corte: 1800, corteFinal: 90, vol: 0.40 });
    this.tono(90, 0.40, { tipo: 'triangle', barrido: 35, vol: 0.24 });
  },

  muerte() {
    this.tono(440, 0.9, { tipo: 'square', barrido: 55, vol: 0.26 });
  },

  victoria() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => {
      setTimeout(() => this.tono(f, 0.28, { tipo: 'square', vol: 0.20 }), i * 130);
    });
  },

  // ----------------------------------------------------------------- musica
  // Secuenciador simple: agenda los proximos pasos con lookahead para que no
  // dependa del framerate del juego.
  Musica: {
    S: null,
    paso: 0,
    proximo: 0,
    tempo: 0.135,           // segundos por paso (16avos)
    timer: null,
    intensa: false,

    // Escala menor: suena a aventura. Notas en Hz.
    BAJO:   [110.0, 110.0, 0, 110.0, 0, 146.8, 0, 130.8,
             98.0, 98.0, 0, 98.0, 0, 130.8, 0, 123.5],
    MELODIA:[440.0, 0, 523.3, 0, 659.3, 0, 523.3, 0,
             587.3, 0, 493.9, 0, 440.0, 0, 392.0, 0],

    // Cada saga suena distinto: su propia escala y su propio tempo.
    // Es lo que hace que Namek no suene igual que la Tierra.
    ambientar(saga) {
      const P = PALETAS_MUSICA[saga.id];
      if (!P) return;
      this.BAJO = P.bajo;
      this.MELODIA = P.melodia;
      this.tempo = P.tempo;
      this.jefe = false;
    },

    // Modo jefe: mas rapido, mas grave y con la melodia en tension.
    modoJefe(activo) {
      if (this.jefe === activo) return;
      this.jefe = activo;
      this.tempoBase = this.tempoBase || this.tempo;
      this.tempo = activo ? this.tempoBase * 0.72 : this.tempoBase;
    },

    iniciar(sonido) {
      this.S = sonido;
      this.proximo = sonido.ctx.currentTime;
      this.paso = 0;
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => this.agendar(), 45);
    },

    agendar() {
      const S = this.S;
      if (!S || !S.listo || !S.musicaOn || S.silenciado) return;
      const ahora = S.ctx.currentTime;
      // Agenda todo lo que entre en los proximos 150ms
      while (this.proximo < ahora + 0.15) {
        this.sonarPaso(this.paso, this.proximo);
        this.proximo += this.tempo;
        this.paso = (this.paso + 1) % 16;
      }
    },

    sonarPaso(paso, cuando) {
      const S = this.S;
      const bajo = this.BAJO[paso];
      if (bajo) this.nota(bajo * (this.jefe ? 0.5 : 1), cuando, 0.16, 'triangle', 0.30);

      const mel = this.MELODIA[paso];
      if (mel) {
        // Con el jefe en pantalla la melodia baja un semitono: suena tensa
        this.nota(mel * (this.jefe ? 0.944 : 1), cuando, 0.13, 'square',
                  this.intensa ? 0.16 : 0.10);
      }
      // Contratiempo solo en modo jefe
      if (this.jefe && paso % 4 === 3) {
        this.percusion(cuando, 150, 0.05, 0.12);
      }

      // Percusion: bombo en 1 y 9, redoblante en 5 y 13
      if (paso % 8 === 0) this.percusion(cuando, 90, 0.12, 0.26);
      if (paso % 8 === 4) this.percusion(cuando, 220, 0.07, 0.16);

      // Cuando estas transformado, entra una capa mas aguda
      if (this.intensa && paso % 4 === 2) {
        this.nota(mel ? mel * 2 : 880, cuando, 0.07, 'square', 0.06);
      }
    },

    nota(freq, cuando, dur, tipo, vol) {
      const S = this.S;
      const osc = S.ctx.createOscillator();
      const g = S.ctx.createGain();
      osc.type = tipo;
      osc.frequency.setValueAtTime(freq, cuando);
      g.gain.setValueAtTime(0.0001, cuando);
      g.gain.exponentialRampToValueAtTime(vol, cuando + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
      osc.connect(g);
      g.connect(S.canalMusica);
      osc.start(cuando);
      osc.stop(cuando + dur + 0.02);
    },

    percusion(cuando, freq, dur, vol) {
      const S = this.S;
      const osc = S.ctx.createOscillator();
      const g = S.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, cuando);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, cuando + dur);
      g.gain.setValueAtTime(vol, cuando);
      g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
      osc.connect(g);
      g.connect(S.canalMusica);
      osc.start(cuando);
      osc.stop(cuando + dur + 0.02);
    }
  }
};

// Que el juego no siga sonando cuando nadie lo esta mirando.
document.addEventListener('visibilitychange', function () {
  if (document.hidden) Sonido.dormir(); else Sonido.despertarAudio();
});
window.addEventListener('blur', function () { Sonido.dormir(); });
window.addEventListener('focus', function () { Sonido.despertarAudio(); });
window.addEventListener('pagehide', function () { Sonido.apagar(); });
window.addEventListener('beforeunload', function () { Sonido.apagar(); });

/* ---- señal de silencio entre pestañas ----
   localStorage avisa a las demás pestañas del mismo origen cuando cambia. Una
   página cualquiera de fnguerrero.github.io puede escribir esta marca y todos
   los juegos abiertos se callan solos, sin tener que silenciar el navegador
   entero desde Windows (que también apagaba YouTube). */
(function () {
  function porSenal(e) {
    if (e.key !== 'juegos.silencio') return;
    if (typeof Sonido !== 'undefined') Sonido.apagar();
  }
  window.addEventListener('storage', porSenal);

/* ---- auto-silencio por inactividad ----
   La última red, y la única que no depende de nada externo: ni de que la pestaña
   se oculte, ni del origen, ni de que llegue una señal. Tres minutos sin tocar
   una tecla y el juego se calla; vuelve solo al primer toque. Es lo que evita
   que una pestaña olvidada quede sonando toda la tarde. */
(function () {
  var ESPERA = 3 * 60 * 1000;
  var reloj = null;
  var dormido = false;

  function callar() {
    dormido = true;
    if (typeof Sonido !== 'undefined') Sonido.apagar();
  }

  function reanudar() {
    if (!dormido) return;
    dormido = false;
    if (typeof Sonido !== 'undefined') Sonido.despertarAudio();
  }

  function reiniciar() {
    reanudar();
    if (reloj) clearTimeout(reloj);
    reloj = setTimeout(callar, ESPERA);
  }

  ['keydown', 'pointerdown', 'touchstart', 'wheel'].forEach(function (ev) {
    window.addEventListener(ev, reiniciar, { passive: true });
  });
  reiniciar();
})();


  // Si la marca ya estaba puesta al abrir, no se arranca sonando
  try {
    var marca = parseInt(window.localStorage.getItem('juegos.silencio'), 10);
    if (marca && Date.now() - marca < 4000) { if (typeof Sonido !== 'undefined') Sonido.apagar(); }
  } catch (err) { /* localStorage puede fallar en file:// */ }
})();


// Envuelve todos los metodos de Sonido en try/catch. El audio es un adorno:
// que falle no puede frenar la partida. Se hace aca, una sola vez, en vez de
// repetir try/catch en cada efecto.
(function blindarAudio() {
  Object.keys(Sonido).forEach(k => {
    const fn = Sonido[k];
    if (typeof fn !== 'function' || k === 'despertar') return;
    Sonido[k] = function () {
      try { return fn.apply(this, arguments); }
      catch (e) { return undefined; }
    };
  });
  Object.keys(Sonido.Musica).forEach(k => {
    const fn = Sonido.Musica[k];
    if (typeof fn !== 'function') return;
    Sonido.Musica[k] = function () {
      try { return fn.apply(this, arguments); }
      catch (e) { return undefined; }
    };
  });

  // Y el caso que ya rompio una partida: pedirle a Sonido un efecto que no
  // existe. Antes tiraba "Sonido.X is not a function" y cortaba la funcion que
  // lo llamaba a la mitad, dejando al jugador sin poder volar porque la linea
  // de abajo nunca corria. Ahora un efecto que falta simplemente no suena, y
  // queda avisado en la consola una sola vez para poder escribirlo.
  const avisados = {};
  Sonido = new Proxy(Sonido, {
    get(obj, prop) {
      if (prop in obj) return obj[prop];
      if (typeof prop !== 'string' || prop.startsWith('_')) return undefined;
      if (!avisados[prop]) {
        avisados[prop] = true;
        console.warn('[audio] falta el efecto Sonido.' + prop + '(): no suena nada');
      }
      return function () { return undefined; };
    }
  });
})();
