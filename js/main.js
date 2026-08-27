// Bucle principal y campaña.
//
// La partida es una seguidilla de sagas (data/sagas.js). En cada una hay 7
// esferas del dragon escondidas: juntarlas antes de matar al jefe invoca a
// Shenlong, que te concede el deseo de esa saga. Al terminarla desbloqueas una
// transformacion y pasas a la siguiente.
//
// Todo se dibuja en un canvas interno de 480x270 y se escala x2 sin suavizado.

const Juego = {
  estado: 'titulo',     // titulo intro juego pausa gameover shenlong finsaga final
  jug: null,
  enemigos: [],
  proyectiles: [],
  rayos: [],
  bajas: 0,
  esferas: 0,
  sagaIdx: 0,
  t: 0,
  tEstado: 0,
  formaDespertada: false,

  get saga() { return SAGAS[this.sagaIdx]; },

  init() {
    const visible = document.getElementById('game');
    visible.width = CFG.VW * CFG.ESCALA;
    visible.height = CFG.VH * CFG.ESCALA;
    this.ctxVis = visible.getContext('2d');
    this.ctxVis.imageSmoothingEnabled = false;

    const off = document.createElement('canvas');
    off.width = CFG.VW; off.height = CFG.VH;
    this.buffer = off;
    this.ctx = off.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    Px.ctx = this.ctx;

    Input.init();
    Voz.init();
    // Si el sistema no tiene voces en español, la voz suena rara leyendo
    // castellano: se avisa una vez y se puede apagar con M.
    setTimeout(() => {
      if (Voz.lista && Voz.sinEspanol) {
        UI.mostrar('SIN VOZ EN ESPANOL INSTALADA - M PARA SILENCIAR', 260);
      }
    }, 2500);
    this.jug = new Jugador();
    this.cargarSaga(0);

    let acumulado = 0, ultimo = performance.now();
    const paso = 1000 / 60;
    const loop = (ahora) => {
      acumulado += Math.min(100, ahora - ultimo);
      ultimo = ahora;
      while (acumulado >= paso) {
        // update devuelve false durante el hitstop: ahi NO se consume el input,
        // si no las teclas de esos frames se perderian y el juego se sentiria
        // trabado justo despues de cada golpe fuerte.
        try {
          if (this.update(1 / 60) !== false) Input.endFrame();
        } catch (e) {
          // Un error en un frame no puede congelar la partida entera: se
          // anota, se sigue, y si se repite se muestra en pantalla.
          this.registrarError(e);
          Input.endFrame();
        }
        acumulado -= paso;
      }
      try { this.dibujar(); } catch (e) { this.registrarError(e); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  // Un error suelto no tiene que matar el juego, pero tampoco puede quedar
  // invisible: se cuenta y a partir de unos cuantos se avisa en pantalla.
  registrarError(e) {
    this.errores = (this.errores || 0) + 1;
    this.ultimoError = (e && e.message) ? e.message : String(e);
    if (this.errores <= 3 && window.console) console.error('[juego]', e);
  },

  // ------------------------------------------------------------------ sagas
  cargarSaga(idx) {
    this.sagaIdx = clamp(idx, 0, SAGAS.length - 1);
    const saga = this.saga;
    this.esferas = 0;
    this.bajas = 0;
    this.formaDespertada = false;
    this.lineaCharla = 0;
    this.tMuerteJefe = 0;
    this.ozaruHecho = false;
    this.hayLuna = false;
    this.jefeAnunciado = false;
    this.lineaDicha = -1;

    Nivel.cargar(saga);
    this.jug.reubicar(Nivel.inicio.x, Nivel.inicio.y);
    this.enemigos = Nivel.spawns.map(s => new Enemigo(s.tipo, s.x, s.y));
    this.jefe = new Enemigo(saga.jefe, Nivel.jefePos.x, Nivel.jefePos.y);
    this.enemigos.push(this.jefe);

    this.proyectiles = [];
    this.rayos = [];
    Sonido.Musica.intensa = false;
    Sonido.Musica.ambientar(saga);
    Nivel.cam.x = 0; Nivel.cam.y = 0;
    FX.limpiar();
    UI.aviso = null; UI.dialogo = null;
    this.tEstado = 0;
  },

  // Reintento tras morir: mismo nivel, sin perder lo aprendido.
  reintentar() {
    const cp = Nivel.checkpoint;
    const usarCheckpoint = cp && cp.tocado;
    const pos = usarCheckpoint ? { x: cp.x, y: cp.y } : null;
    this.cargarSaga(this.sagaIdx);
    if (pos) {
      // Volver al checkpoint conserva las esferas que ya habias juntado hasta
      // ahi, si no perder al final del nivel castiga demasiado.
      Nivel.checkpoint.tocado = true;
      this.jug.reubicar(pos.x, pos.y);
      Nivel.esferas.forEach(es => { if (es.x < pos.x) { es.tomada = true; this.esferas++; } });
      UI.mostrar('DESDE EL CHECKPOINT', 130);
    }
    this.jug.revivir();
    this.estado = 'juego';
  },

  empezarPartida(desde) {
    const idx = desde || 0;
    // Partida nueva: se arranca con lo que corresponde a esa saga, no de cero
    // si elegiste una avanzada.
    ORDEN_FORMAS.forEach(id => {
      if (id !== 'base') TRANSFORMACIONES[id].desbloqueada = false;
    });
    TRANSFORMACIONES.ozaru.desbloqueada = false;
    KAIOKEN.desbloqueadoHasta = 0;
    this.jug = new Jugador();

    // Todo lo que dan las sagas anteriores ya lo tenes
    for (let i = 0; i < idx; i++) {
      this.desbloquear(SAGAS[i].desbloquea);
      if (SAGAS[i].desbloqueaExtra) this.desbloquear(SAGAS[i].desbloqueaExtra);
      const b = SAGAS[i].bonus || {};
      if (b.hpMax) this.jug.hpMax += b.hpMax;
      if (b.kiMax) this.jug.ki.kiMax += b.kiMax;
      this.jug.nivel++;
    }
    this.jug.hp = this.jug.hpMax;
    this.jug.ki.ki = this.jug.ki.kiMax;

    this.cargarSaga(idx);
    this.estado = 'intro';
  },

  terminarSaga() {
    const saga = this.saga;
    // La transformacion de la saga queda desbloqueada si no la despertaste ya
    this.desbloquear(saga.desbloquea);
    if (saga.desbloqueaExtra) this.desbloquear(saga.desbloqueaExtra);
    Progreso.guardarSaga(this.sagaIdx);
    if (this.esferas >= 7) {
      Sonido.shenlong();
      this.estado = 'shenlong';
    } else {
      Sonido.victoria();
      this.estado = 'finsaga';
    }
    this.tEstado = 0;
  },

  desbloquear(id) {
    if (!id) return;
    if (id === 'kaioken') { KAIOKEN.desbloqueadoHasta = Math.max(KAIOKEN.desbloqueadoHasta, 1); return; }
    if (id === 'kaioken3') { KAIOKEN.desbloqueadoHasta = Math.max(KAIOKEN.desbloqueadoHasta, 3); return; }
    if (TRANSFORMACIONES[id]) TRANSFORMACIONES[id].desbloqueada = true;
  },

  nombreDesbloqueo(id) {
    if (id === 'kaioken') return 'KAIOKEN';
    if (id === 'kaioken3') return 'KAIOKEN X3';
    return TRANSFORMACIONES[id] ? TRANSFORMACIONES[id].nombre : id;
  },

  concederDeseo() {
    const b = this.saga.bonus || {};
    const j = this.jug;
    if (b.hpMax) { j.hpMax += b.hpMax; j.hp = j.hpMax; }
    if (b.kiMax) { j.ki.kiMax += b.kiMax; j.ki.ki = j.ki.kiMax; }
    if (b.dano) j.bonusDano += b.dano;
    if (b.vel) j.bonusVel += b.vel;
  },

  siguienteSaga() {
    if (this.sagaIdx >= SAGAS.length - 1) {
      this.estado = 'final';
      this.tEstado = 0;
      Sonido.victoria();
      return;
    }
    this.cargarSaga(this.sagaIdx + 1);
    this.jug.revivir();
    this.estado = 'intro';
  },

  dialogoJefe(txt) {
    UI.decir(txt, 160);
    Voz.decir(txt, 'villano', { urgente: true, corta: true });
  },

  // Cambio de pantalla con fundido: `luego` corre cuando la pantalla esta
  // toda negra, asi el salto no se ve.
  fundir(luego) {
    this.fundido = { t: 0, fase: 'sale', luego };
  },

  actualizarFundido(dt) {
    const f = this.fundido;
    if (!f) return;
    f.t += dt;
    if (f.fase === 'sale' && f.t >= 0.28) {
      f.fase = 'entra'; f.t = 0;
      if (f.luego) f.luego();
    } else if (f.fase === 'entra' && f.t >= 0.28) {
      this.fundido = null;
    }
  },

  dibujarFundido() {
    const f = this.fundido;
    if (!f) return;
    const p = clamp(f.t / 0.28, 0, 1);
    const cubierto = f.fase === 'sale' ? p : 1 - p;
    // Se tapa por bandas: mas barato que un alpha y queda mas de la epoca
    const filas = Math.round(CFG.VH * cubierto);
    for (let y = 0; y < filas; y++) {
      if (y % 2 === 0 || cubierto > 0.75) Px.rect(0, y, CFG.VW, 1, PAL.negro);
    }
    if (cubierto >= 0.98) Px.rect(0, 0, CFG.VW, CFG.VH, PAL.negro);
  },

  // -------------------------------------------------------------------------
  update(dt) {
    this.t += dt;
    this.tEstado += dt;
    this.actualizarFundido(dt);
    if (this.fundido) return;

    if (Input.algunaTecla()) Sonido.despertar();
    if (Input.silenciar()) {
      const m = Sonido.alternarSilencio();
      Voz.silenciada = m;
      if (m) Voz.callar();
      UI.mostrar(m ? 'SONIDO OFF' : 'SONIDO ON', 90);
    }

    switch (this.estado) {
      case 'titulo': {
        // Se puede elegir cualquier saga ya superada en una partida anterior
        const tope = Progreso.sagaMaxima();
        if (tope > 0) {
          if (Input.pressed('ArrowRight') || Input.pressed('KeyD')) {
            this.sagaElegida = Math.min(tope, (this.sagaElegida || 0) + 1);
          }
          if (Input.pressed('ArrowLeft') || Input.pressed('KeyA')) {
            this.sagaElegida = Math.max(0, (this.sagaElegida || 0) - 1);
          }
        }
        if (Input.confirmar()) this.fundir(() => this.empezarPartida(this.sagaElegida || 0));
        return;
      }

      case 'intro': {
        const charla = this.saga.charla;
        // Cada linea de la charla la dice el personaje que habla
        if (this.lineaDicha !== this.lineaCharla) {
          this.lineaDicha = this.lineaCharla;
          const quien = charla[this.lineaCharla][0];
          const perfil = quien === 'goku' ? 'goku'
                       : (['piccolo', 'vegeta'].includes(quien) ? 'villano' : 'aliado');
          Voz.decir(charla[this.lineaCharla][1], perfil, { corta: true, urgente: true });
        }
        const texto = charla[this.lineaCharla][1];
        const escritas = Math.floor(this.tEstado * 34);
        // Un bip cada par de letras, como los juegos de la epoca
        if (escritas <= texto.length && Math.floor(this.tEstado * 34) % 3 === 0
            && Math.floor((this.tEstado - 1 / 60) * 34) % 3 !== 0) {
          Sonido.blip(this.lineaCharla);
        }
        if (Input.confirmar()) {
          if (escritas < texto.length) {
            // Primer ENTER: termina de escribir la linea de una
            this.tEstado = texto.length / 34 + 0.05;
          } else if (this.lineaCharla < charla.length - 1) {
            this.lineaCharla++;
            this.tEstado = 0;
          } else {
            this.fundir(() => {
              this.estado = 'juego';
              UI.mostrar(this.saga.lugar, 130);
            });
          }
        }
        return;
      }

      case 'gameover':
        if (Input.confirmar() && this.tEstado > 0.6) this.fundir(() => this.reintentar());
        return;

      case 'shenlong':
        // La animacion corre sola; al final se concede el deseo.
        if (this.tEstado > 3.2 && Input.confirmar()) {
          this.concederDeseo();
          this.estado = 'finsaga';
          this.tEstado = 0;
        }
        return;

      case 'finsaga':
        if (Input.confirmar() && this.tEstado > 0.6) this.fundir(() => this.siguienteSaga());
        return;

      case 'final':
        if (Input.confirmar() && this.tEstado > 1.2) { this.estado = 'titulo'; this.tEstado = 0; }
        return;
    }

    if (Input.pausa()) { this.estado = this.estado === 'pausa' ? 'juego' : 'pausa'; }
    if (this.estado === 'pausa') return;

    UI.update();

    if (FX.hitstop > 0) { FX.update(); return false; }
    FX.update();

    const jug = this.jug;
    jug.update(dt);
    this.enemigos.forEach(e => { if (!e.muerto) e.update(dt, jug); });

    this.actualizarProyectiles(jug);
    this.actualizarRayos();

    this.enemigos.forEach(e => {
      if (e.muerto && !e.contado) {
        e.contado = true;
        this.bajas++;
        jug.ganarExp(e.p.exp);
        // Matar cura un poco: premia pelear en vez de correr de largo
        jug.hp = Math.min(jug.hpMax, jug.hp + 6);
        // Y suelta una chispa de Ki en el lugar, para recoger
        Nivel.items.push({
          tipo: 'ki', x: e.x, y: e.y - 12, tomado: false, suelto: true
        });
      }
    });

    this.eventoDespertar();
    this.eventoLunaLlena();
    // La musica cambia cuando el jefe entra en escena
    const jefeEnEscena = this.jefe.activo && !this.jefe.muerto;
    Sonido.Musica.modoJefe(jefeEnEscena);
    if (jefeEnEscena && !this.jefeAnunciado) {
      this.jefeAnunciado = true;
      Voz.decir(fraseAlAzar(FRASES.verJefe), 'goku', { urgente: true });
    }
    Nivel.actualizarCamara(jug, dt);

    // Si los dos caen en el mismo frame, gana el jugador: el jefe ya estaba
    // muerto cuando llego el ultimo golpe.
    //
    // El corte es por tiempo desde la muerte, no por "no quedan particulas":
    // desde que hay particulas de ambiente permanentes, esa condicion no se
    // cumplia nunca y la saga no terminaba.
    if (this.jefe.muerto) {
      this.tMuerteJefe = (this.tMuerteJefe || 0) + dt;
      if (this.tMuerteJefe > 1.1) {
        Sonido.Musica.intensa = false;
        Sonido.zumbido(false);
        Voz.decir(fraseAlAzar(FRASES.ganar), 'goku', { urgente: true });
        this.terminarSaga();
      }
      return;
    }
    if (jug.muerto) {
      this.estado = 'gameover';
      this.tEstado = 0;
      Sonido.Musica.intensa = false;
      Sonido.zumbido(false);
      Sonido.muerte();
      Voz.decir(fraseAlAzar(FRASES.perder), 'goku', { urgente: true, corta: true });
      return;
    }
  },

  // El despertar: la forma de la saga no se compra ni se elige, aparece cuando
  // estas por perder. Es el momento de la serie que vale la pena copiar.
  eventoDespertar() {
    if (this.formaDespertada || this.jefe.muerto || !this.jefe.activo) return;
    const jug = this.jug;
    const id = this.saga.desbloquea;
    if (!id) return;
    const yaLaTenia = (id === 'kaioken' && KAIOKEN.desbloqueadoHasta >= 1)
                   || (id === 'kaioken3' && KAIOKEN.desbloqueadoHasta >= 3)
                   || (TRANSFORMACIONES[id] && TRANSFORMACIONES[id].desbloqueada);
    if (yaLaTenia) { this.formaDespertada = true; return; }

    const jefeBajo = this.jefe.hp / this.jefe.hpMax <= 0.25;
    const enPeligro = jug.hp < jug.hpMax * 0.3;
    if (!jefeBajo && !enPeligro) return;

    this.formaDespertada = true;
    this.desbloquear(id);
    jug.hp = Math.max(jug.hp, jug.hpMax * 0.55);
    jug.ki.kiMax += 20;
    jug.ki.ki = jug.ki.kiMax;
    if (TRANSFORMACIONES[id]) jug.ki.activar(id);
    else { jug.ki.ciclarKaioken(); }
    FX.golpeFuerte(jug.x, jug.y - 16);
    FX.shake = 16;
    FX.flashPantalla = 6;
    UI.mostrar(this.nombreDesbloqueo(id), 200);
  },

  // Un poder contra otro poder: se chocan y se anulan. Si uno es MUY superior
  // se lo lleva puesto y sigue, pero debilitado.
  chocarProyectiles() {
    const props = this.proyectiles;
    for (let i = 0; i < props.length; i++) {
      const a = props[i];
      if (a.muerto || a.duenio !== 'jugador') continue;
      for (let k = 0; k < props.length; k++) {
        const b = props[k];
        if (b.muerto || b.duenio === 'jugador') continue;
        if (dist(a.x, a.y, b.x, b.y) > a.r + b.r + 3) continue;

        const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        FX.choqueKi(cx, cy, a.color, b.color);
        Sonido.choque();
        if (a.dano > b.dano * 2) {
          a.dano -= b.dano;            // lo atraviesa, pero pierde fuerza
          a.r = Math.max(2, a.r - 1);
          b.muerto = true;
        } else if (b.dano > a.dano * 2) {
          b.dano -= a.dano;
          b.r = Math.max(2, b.r - 1);
          a.muerto = true;
        } else {
          a.muerto = true;
          b.muerto = true;
        }
        break;
      }
    }
  },

  // Luna llena: en la saga que la tiene, al pasar la mitad del nivel sale la
  // luna y Goku se convierte en Ozaru.
  eventoLunaLlena() {
    if (!this.saga.lunaLlena || this.ozaruHecho) return;
    if (this.jug.x < Nivel.ancho * 0.45) return;
    this.ozaruHecho = true;
    this.hayLuna = true;
    this.jug.entrarEnOzaru();
  },

  actualizarProyectiles(jug) {
    this.chocarProyectiles();
    this.proyectiles = this.proyectiles.filter(p => {
      p.update();
      if (p.muerto) return false;
      if (p.duenio === 'jugador') {
        for (const e of this.enemigos) {
          if (e.muerto) continue;
          if (aabb({ x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 }, e.caja)) {
            e.golpear(p.dano, signo(p.vx) || 1, { empuje: 2, stun: 10 });
            return false;
          }
        }
      } else if (aabb({ x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 }, jug.caja)) {
        jug.recibirGolpe(p.dano, signo(p.vx) || 1);
        return false;
      }
      return true;
    });
  },

  actualizarRayos() {
    this.rayos = this.rayos.filter(r => {
      r.vida--;
      const largo = 260;
      const caja = {
        x: r.dir > 0 ? r.x : r.x - largo,
        y: r.y - r.alto / 2, w: largo, h: r.alto
      };
      this.enemigos.forEach(e => {
        if (e.muerto || r.golpeados.has(e)) return;
        if (aabb(caja, e.caja)) {
          r.golpeados.add(e);
          e.golpear(r.dano, r.dir, { empuje: 5, empujeY: 2, stun: 30 });
          FX.golpeFuerte(e.x, e.y - e.h * .5);
        }
      });
      return r.vida > 0;
    });
  },

  // -------------------------------------------------------------------------
  dibujar() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CFG.VW, CFG.VH);

    switch (this.estado) {
      case 'titulo':   UI.titulo(this.t); break;
      case 'intro':    UI.charla(this.saga, this.lineaCharla, this.tEstado); break;
      case 'gameover': UI.gameOver(this.tEstado); break;
      case 'shenlong': this.dibujarPartida(); UI.shenlong(this.saga, this.tEstado); break;
      case 'finsaga':  UI.finSaga(this.saga, this.jug, this.esferas, this.tEstado); break;
      case 'final':    UI.final(this.jug, this.tEstado); break;
      case 'pausa':    this.dibujarPartida(); UI.pausa(); break;
      default:         this.dibujarPartida();
    }

    // Aviso de foco: sin esto el juego parece roto cuando en realidad las
    // teclas se las esta comiendo la barra de direcciones.
    if (!Input.hayFoco && this.t > 1.2) {
      const txt = 'HACE CLIC EN LA PANTALLA PARA JUGAR';
      const w = Texto.ancho(txt) + 16;
      const y = 4;
      if (Math.floor(this.t * 2) % 2 === 0) {
        Px.rect((CFG.VW - w) / 2 - 1, y - 1, w + 2, 15, PAL.dorado);
      }
      Px.rect((CFG.VW - w) / 2, y, w, 13, PAL.contorno);
      Texto.dibujar(txt, CFG.VW / 2, y + 3, PAL.blanco, { centro: true });
    }

    if (this.errores > 5) {
      Px.rect(0, 0, CFG.VW, 9, PAL.rojoS);
      Texto.dibujar('ERROR: ' + String(this.ultimoError).slice(0, 60), 4, 1, PAL.blanco);
    }
    this.dibujarFundido();
    this.ctxVis.imageSmoothingEnabled = false;
    this.ctxVis.drawImage(this.buffer, 0, 0, CFG.VW * CFG.ESCALA, CFG.VH * CFG.ESCALA);
  },

  dibujarPartida() {
    const sh = FX.shake;
    const camx = Math.round(Nivel.cam.x + (sh > 0 ? rnd(-sh, sh) : 0));
    const camy = Math.round(Nivel.cam.y + (sh > 0 ? rnd(-sh, sh) : 0));

    Nivel.dibujarFondo();
    Nivel.dibujar();

    this.rayos.forEach(r => this.dibujarRayo(r, camx, camy));
    this.enemigos.forEach(e => { if (!e.muerto) e.dibujar(camx, camy); });
    this.proyectiles.forEach(p => p.dibujar(camx, camy));
    this.jug.dibujar(camx, camy);
    FX.dibujar(camx, camy);

    if (FX.flashPantalla > 0) Px.rect(0, 0, CFG.VW, CFG.VH, PAL.blanco);

    UI.hud(this.jug, this.esferas, this.saga);
    if (!this.jefe.muerto && this.jefe.activo) UI.barraJefe(this.jefe);
    UI.overlays();
  },

  dibujarRayo(r, camx, camy) {
    const largo = 260;
    const x = (r.dir > 0 ? r.x : r.x - largo) - camx;
    const y = r.y - camy;
    const t = r.vida / r.vidaMax;
    const alto = Math.max(2, Math.round(r.alto * (t > .8 ? (1 - t) * 5 : t)));
    Px.rect(x, y - alto / 2, largo, alto, r.color);
    Px.rect(x, y - alto / 2 + 1, largo, Math.max(1, alto - 2), PAL.blanco);
    Px.disco(r.x - camx, y, alto, r.color);
    Px.disco(r.x - camx, y, Math.max(1, alto - 2), PAL.blanco);
  }
};

addEventListener('load', () => Juego.init());
