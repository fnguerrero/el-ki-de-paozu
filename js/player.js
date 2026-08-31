// Goku. Plataformero: fisica con momentum, combo de 3 golpes, patada aerea,
// doble salto con Ki (el vuelo libre se fue: rompia el diseño de niveles).

class Jugador extends Entidad {
  constructor() {
    super({ w: 12, h: 30, hp: 130, hpMax: 130 });
    this.ki = new SistemaKi(this, 100);
    this.pose = 'idle';
    this.coyote = 0;
    this.buffer = 0;
    this.saltosAire = 0;
    this.saltosAireMax = 1;
    this.ataque = null;
    this.comboVentana = 0;
    this.comboIdx = 0;
    this.cdDash = 0;
    this.cargaKi = 0;
    this.cargando = false;
    this.volando = false;
    this.tiempoCargando = 0;
    this.exp = 0;
    this.nivel = 1;
    this.invulnRespawn = 0;
    // Mejoras permanentes que da Shenlong al cumplir un deseo
    this.bonusDano = 0;
    this.bonusVel = 0;
    this.estela = [];      // posiciones viejas, para la estela del dash
    this.guardando = false;
    this.cargaGolpe = 0;
    this.ritmo = 0;        // sube al machacar: acelera los golpes
    this.tUltimoGolpe = 0;
  }

  get forma() { return TRANSFORMACIONES[this.ki.forma]; }

  // Cuanto esta rota la ropa, segun lo golpeado que estes.
  get nivelDano() {
    const r = this.hp / this.hpMax;
    return r > 0.66 ? 0 : (r > 0.33 ? 1 : 2);
  }

  // Reubicar entre sagas: conserva nivel, mejoras y transformaciones.
  reubicar(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.volando = false;
    this.ataque = null;
    this.cargaKi = 0;
    this.tiempoCargando = 0;
    this.stun = 0; this.invuln = 0; this.flash = 0;
    this.ki.revertir(false);
    this.ki.ki = this.ki.kiMax;
    this.pose = 'idle';
  }

  revivir() {
    this.muerto = false;
    this.hp = this.hpMax;
    this.ki.ki = this.ki.kiMax;
    this.ki.agotado = 0;
  }

  // Que colores usar para pintar el sprite segun la transformacion activa.
  aspecto() {
    const f = this.forma;
    const k = this.ki.kaioken > 0;
    return {
      tintas: { P: f.peloPix, p: f.peloPixS, O: f.ojosPix },
      aura: k ? PAL.rojo : (f.auraPix || null),
      auraFuerte: (f.brillo || 0) > .6 || k,
      // Cuanto mas alta la forma, mas grande el aura. El Kaioken suma encima.
      fuerzaAura: (f.brillo || 0) + (k ? 0.45 : 0),
      rayos: !!f.rayos || this.ki.kaioken > 1,
      electricidad: (f.electricidad || 0) + (this.ki.kaioken > 1 ? 0.4 : 0),
      // Pelo largo y cola: capas que se dibujan detras del cuerpo
      melena: f.melena ? { color: f.peloPix, sombra: f.peloPixS, largo: f.melena } : null,
      cola: f.cola ? { color: f.cola, sombra: '#7b241c' } : null
    };
  }

  alTransformar(id) {
    const f = TRANSFORMACIONES[id];
    const nivel = ORDEN_FORMAS.indexOf(id);
    Sonido.transformar(nivel);
    const frases = FRASES.transformar[id];
    if (frases) setTimeout(() => Voz.decir(fraseAlAzar(frases), 'goku', { urgente: true }), 900);
    Sonido.Musica.intensa = id !== 'base';
    if (id === 'base') return;

    // La transformacion es EL momento del juego: se frena el tiempo, tiembla
    // todo y salen ondas desde el cuerpo. Cuanto mas alta la forma, mas dura.
    const color = f.auraPix || PAL.dorado;
    Juego.camaraLenta(70 + nivel * 12, 0.35);
    FX.flashPantalla = 8 + nivel * 2;
    FX.shake = 18 + nivel * 3;
    FX.hitstop = Math.max(FX.hitstop, 10);

    // Ondas expansivas, una atras de otra
    for (let i = 0; i < 5 + nivel; i++) {
      FX.destellos.push({
        x: this.x, y: this.y - 18,
        vida: 26 + i * 7, vidaMax: 26 + i * 7,
        r: 26 + i * 16, color
      });
    }
    // El piso se levanta alrededor
    for (let i = 0; i < 26 + nivel * 5; i++) {
      const a = rnd(0, Math.PI * 2);
      FX.particulas.push({
        x: this.x + Math.cos(a) * rnd(4, 26),
        y: this.y - rnd(0, 6),
        vx: Math.cos(a) * rnd(0.6, 2.4),
        vy: -rnd(1.2, 4.5),
        vida: rndInt(24, 52), color: i % 3 === 0 ? PAL.hueso : color, grav: 0.09
      });
    }
    FX.chispas(this.x, this.y - 20, 30, color);
    FX.chispas(this.x, this.y - 20, 16, PAL.blanco);
  }

  // -------------------------------------------------------------------------
  update(dt) {
    this.t += dt;
    if (this.flash > 0) this.flash--;
    if (this.invuln > 0) this.invuln--;
    if (this.cdDash > 0) this.cdDash--;
    if (this.comboVentana > 0) this.comboVentana--; else this.comboIdx = 0;
    // El ritmo de machaque se enfria si dejas de pegar
    if (this.ritmo > 0 && this.t - this.tUltimoGolpe > 0.6) {
      this.ritmo = Math.max(0, this.ritmo - dt * 1.5);
    }

    this.inputTransformar();
    // Guardia: parado y agachado. Reduce el dano a la mitad pero no te deja
    // moverte ni atacar.
    this.guardando = Input.guardia() && this.enSuelo && !this.volando && !this.ataque;
    // Se puede cargar Ki tambien en el aire: volando quedas suspendido
    // cargando, que es la imagen clasica de la serie.
    // Se puede cargar en cualquier lado y en movimiento: caminando, volando o
    // quieto. Moverse mientras cargas te frena, pero no te impide cargar.
    this.cargando = Input.cargarKi() && !this.ataque;
    this.actualizarCarga(dt);
    this.actualizarVuelo(dt);

    // Ozaru: se sale solo cuando se acaba el Ki
    if (this.ki.forma === 'ozaru' && this.ki.ki <= 1) this.salirDeOzaru();
    this.ki.cargando = this.cargando;
    this.ki.update(dt);

    if (this.stun > 0) {
      // Recuperacion: apretar arriba mientras salis despedido corta el
      // knockback y te deja caer de pie. Cuesta un poco de Ki.
      if (Input.saltarPress() && !this.enSuelo && this.ki.ki >= 6) {
        this.ki.ki -= 6;
        this.stun = 0;
        this.vx *= 0.2;
        this.vy = -1.5;
        this.invuln = Math.max(this.invuln, 24);
        FX.chispas(this.x, this.y - 14, 12, PAL.cyan);
        FX.texto(this.x, this.y - 40, 'RECUPERA', PAL.cyan);
        Sonido.swoosh();
      } else {
        this.stun--;
        this.pose = 'hurt';
        this.aplicarGravedad();
        this.moverFisica(false);
        return;
      }
    }

    // La carga del golpe pesado y la cancelacion con dash van aca y no en
    // mover(), porque mover() no se llama mientras hay un ataque en curso.
    if (Input.golpeHold()) {
      this.cargaGolpe++;
      if (this.cargaGolpe === 30) {
        FX.texto(this.x, this.y - 44, 'GOLPE PESADO', PAL.dorado);
        Sonido.cargandoKi(0.8);
      }
      if (this.cargaGolpe > 30 && this.cargaGolpe % 5 === 0) {
        FX.chispas(this.x + this.facing * 10, this.y - 20, 2, PAL.dorado);
      }
    } else {
      if (this.cargaGolpe >= 30) this.iniciarAtaque(true);
      this.cargaGolpe = 0;
    }

    if (this.ataque && Input.dash() && this.cdDash <= 0 && this.ki.gastar(10)) {
      this.ataque = null;
      this.cdDash = 26;
      this.vx = this.facing * 5.4;
      this.invuln = Math.max(this.invuln, 10);
      Sonido.dash();
      FX.chispas(this.x, this.y - 14, 10, this.aspecto().aura || PAL.cyan);
      FX.texto(this.x, this.y - 40, 'CANCEL', PAL.cyan);
    }

    this.actualizarAtaque();
    if (!this.ataque) this.mover();
    else { this.vx *= 0.80; }

    this.disparoKi();
    if (!this.volando) {
      // El Ultra Instinto casi no pesa: se queda flotando entre saltos, como
      // si la gravedad no lo agarrara del todo.
      const gFactor = this.forma.gravedad;
      if (gFactor) {
        const g = (this.vy < 0 ? CFG.GRAV : CFG.GRAV_CAIDA) * gFactor;
        this.vy = Math.min(this.vy + g, CFG.VEL_CAIDA_MAX * 0.45);
      } else {
        this.aplicarGravedad();
      }
    }

    const antesEnSuelo = this.enSuelo;
    const vyAntes = this.vy;
    // Abajo + salto = bajarse de una plataforma; abajo solo = cargar Ki.
    this.moverFisica(Input.abajo() && Input.saltarHold());
    if (!antesEnSuelo && this.enSuelo && !this.volando) {
      const fuerza = clamp(vyAntes / CFG.VEL_CAIDA_MAX, 0, 1);
      FX.polvo(this.x, this.y, fuerza);
      Sonido.aterrizar(fuerza);
      this.saltosAire = 0;
    }

    // Guarda el rastro para la estela del dash
    this.estela.unshift({ x: this.x, y: this.y, pose: this.pose, facing: this.facing });
    if (this.estela.length > 8) this.estela.pop();
    if (this.enSuelo) this.coyote = CFG.COYOTE;
    else if (this.coyote > 0) this.coyote--;

    this.recogerItems();
    this.definirPose();
  }

  // ------------------------------------------------------------------ ozaru
  // La luna llena no se elige: cuando aparece, te agarra. Sos enorme, pegas
  // como un camion y te movés pesado. Dura hasta que se te acaba el Ki.
  entrarEnOzaru() {
    if (this.ki.forma === 'ozaru') return;
    TRANSFORMACIONES.ozaru.desbloqueada = true;
    this.ki.forma = 'ozaru';
    this.ki.kaioken = 0;
    this.ki.ki = this.ki.kiMax;
    this.hp = Math.min(this.hpMax, this.hp + this.hpMax * 0.3);
    // El cuerpo crece: la caja de colision tambien
    this.w = 26; this.h = 62;
    Sonido.grito(1, 1.6);
    Sonido.transformar(6);
    FX.golpeFuerte(this.x, this.y - 30);
    FX.shake = 26;
    FX.flashPantalla = 8;
    UI.mostrar('OZARU', 220);
    UI.decir('LA LUNA... NO PUEDO CONTROLARME', 200);
  }

  salirDeOzaru() {
    if (this.ki.forma !== 'ozaru') return;
    this.ki.forma = 'base';
    this.w = 12; this.h = 30;
    FX.chispas(this.x, this.y - 20, 30, PAL.hueso);
    UI.mostrar('VOLVISTE A LA NORMALIDAD', 140);
  }

  // ------------------------------------------------------------------ carga
  actualizarCarga(dt) {
    if (!this.cargando) {
      if (this.tiempoCargando > 0) Sonido.zumbido(false);
      this.tiempoCargando = 0;
      return;
    }
    const antes = this.tiempoCargando;
    this.tiempoCargando += dt;
    const avance = clamp(this.tiempoCargando / 2.2, 0, 1);

    // Cargar es SUBIR de nivel: cuando el Ki llega al tope, pasa a la
    // siguiente transformacion y la barra vuelve a empezar. Asi se encadenan
    // fase 1, 2, 3... sin soltar la tecla.
    if (this.ki.ki >= this.ki.kiMax - 0.5) {
      if (this.subirForma()) {
        this.tiempoCargando = 0;
        // La forma nueva cuesta Ki: la barra arranca de nuevo y hay que
        // volver a llenarla para la siguiente
      } else if (!this.avisoTope) {
        this.avisoTope = true;
        FX.texto(this.x, this.y - 52, 'KI AL MAXIMO', PAL.dorado);
        Sonido.kiLleno();
      }
    } else {
      this.avisoTope = false;
    }

    // Grita mientras carga, cada vez mas fuerte
    if (Math.floor(this.tiempoCargando / 1.2) !== Math.floor(antes / 1.2)) {
      Sonido.grito(0.45 + avance * 0.55, 1.0 + avance * 0.8);
    }

    // Ki convergiendo: mas denso cuanto mas cargas
    const cantidad = 1 + Math.floor(avance * 3);
    for (let i = 0; i < cantidad; i++) {
      this.convergerKi(avance);
    }
    // Temblor y aros: el aire alrededor se sacude
    FX.shake = Math.max(FX.shake, avance * 2.2);
    if (Math.floor(this.tiempoCargando * 6) !== Math.floor(antes * 6)) {
      FX.destellos.push({
        x: this.x, y: this.y - 18, vida: 12, vidaMax: 12, r: 10 + avance * 22
      });
    }
    // Sonido que sube de tono con la carga
    if (Math.floor(this.tiempoCargando * 8) !== Math.floor(antes * 8)) {
      Sonido.cargandoKi(avance);
    }

  }

  // Siguiente fase al llenar el Ki.
  //
  // Si la siguiente forma ya la tenes, te transformas. Si NO la tenes, llenar
  // el Ki la DESPIERTA: cargar al maximo es la forma de subir de fase, que es
  // justo lo que uno espera al mantener la carga apretada. Sin esto, en las
  // primeras sagas cargar no hacia nada porque no habia formas desbloqueadas.
  subirForma() {
    const idx = ORDEN_FORMAS.indexOf(this.ki.forma);

    // 1) Alguna forma que ya tengas y puedas pagar
    for (let i = idx + 1; i < ORDEN_FORMAS.length; i++) {
      const id = ORDEN_FORMAS[i];
      const f = TRANSFORMACIONES[id];
      if (f.desbloqueada && this.ki.ki >= f.costo) {
        this.ki.activar(id);
        FX.flashPantalla = 3;
        return true;
      }
    }

    // 2) Si no, despertar la siguiente que no tengas
    for (let i = idx + 1; i < ORDEN_FORMAS.length; i++) {
      const id = ORDEN_FORMAS[i];
      const f = TRANSFORMACIONES[id];
      if (f.desbloqueada) continue;
      // Solo si el Ki te alcanza para sostenerla
      // Hace falta un techo de Ki comodo para sostener la forma nueva: sin
      // esto se encadenan todas las fases en una sola carga larga.
      if (this.ki.kiMax < f.costo * 2.4) break;
      f.desbloqueada = true;
      Juego.desbloquear(id);
      this.ki.activar(id);
      FX.flashPantalla = 6;
      FX.shake = 14;
      UI.mostrar('NUEVA FASE: ' + f.nombre, 200);
      return true;
    }

    // 3) Si ya no quedan formas, el Kaioken se apila encima
    if (KAIOKEN.desbloqueadoHasta > 0 && this.ki.kaioken === 0) {
      this.ki.ciclarKaioken();
      return true;
    }
    // 4) Y si ni eso, la carga sube el techo de Ki: siempre hay recompensa
    if (this.ki.kiMax < 600) {
      this.ki.kiMax += 20;
      FX.texto(this.x, this.y - 52, 'KI MAXIMO +20', PAL.cyan);
      return true;
    }
    return false;
  }

  convergerKi(avance) {
    const color = this.aspecto().aura || PAL.cyan;
    FX.convergencia(this.x, this.y - 18, color, 26 + avance * 26);
  }

  // ------------------------------------------------------------------ vuelo
  // Despegar es apretar ARRIBA por segunda vez, ya en el aire.
  despegar() {
    if (this.volando) return false;
    if (this.ki.ki <= 12) { this.ki.aviso = 'SIN KI PARA VOLAR'; return false; }
    this.volando = true;
    this.vy = -1.6;
    Sonido.vuelo();
    Sonido.zumbido(true);
    FX.chispas(this.x, this.y - 10, 14, this.aspecto().aura || PAL.cyan);
    FX.destellos.push({ x: this.x, y: this.y - 14, vida: 9, vidaMax: 9, r: 14 });
    return true;
  }

  actualizarVuelo(dt) {
    if (!this.volando) return;

    // Tocar el piso bajando aterriza solo: no hace falta otra tecla.
    if (this.enSuelo && this.vy >= 0) {
      this.volando = false;
      Sonido.zumbido(false);
      FX.polvo(this.x, this.y);
      return;
    }

    // Volar cuesta Ki todo el tiempo: no podes cruzar el nivel entero por aire.
    // Salvo mientras cargas: ahi el Ki que entra tiene que ganarle al que sale.
    if (!this.cargando) this.ki.ki -= CFG.VUELO_COSTO * dt;
    if (this.ki.ki <= 0) {
      this.ki.ki = 0;
      this.volando = false;
      Sonido.zumbido(false);
      this.ki.aviso = 'SIN KI!';
    }
    // Techo: sin esto se puede volar fuera del nivel y perder de vista a Goku.
    if (this.y < 14) { this.y = 14; this.vy = Math.max(0, this.vy); }

    const color = this.aspecto().aura || PAL.cyan;
    // Estela hacia atras, mas densa cuanto mas rapido vas
    const vel = Math.hypot(this.vx, this.vy);
    if (vel > 0.4 && Math.floor(this.t * 30) % 2 === 0) {
      FX.rastroVuelo(this.x, this.y - 16, this.vx, this.vy, color);
    }
    // Ondas debajo: el Ki que lo sostiene
    if (Math.floor(this.t * 10) % 2 === 0) {
      FX.sustentacion(this.x, this.y, color, this.t);
    }
    // Rafagas de aire cada tanto: el sonido del vuelo
    this.tVuelo = (this.tVuelo || 0) + dt;
    if (this.tVuelo > 0.42) {
      this.tVuelo = 0;
      Sonido.vientoVuelo();
    }
  }

  // ------------------------------------------------------------------ mover
  mover() {
    const m = this.ki.mult();
    // Doble toque en una direccion: corre mas rapido mientras la mantengas.
    const sprint = Input.corriendo() ? CFG.SPRINT : 1;
    const velMax = CFG.VEL_MAX * m.vel * sprint;
    const eje = Input.ejeX();

    // Volando: control libre en las 8 direcciones, sin inercia de piso.
    if (this.volando) {
      // Se puede cargar Ki volando Y seguir desplazandose: mas lento y con
      // mas inercia, pero sin quedar clavado en el aire.
      const cargandoEnAire = this.cargando;
      const v = CFG.VUELO_VEL * m.vel * (cargandoEnAire ? 0.5 : 1);
      const suavidad = cargandoEnAire ? 0.10 : 0.22;
      const ey = (Input.abajo() ? 1 : 0) - (Input.arriba() ? 1 : 0);
      this.vx = lerp(this.vx, eje * v, suavidad);
      this.vy = lerp(this.vy, ey * v, suavidad);
      if (eje) this.facing = eje;

      // Cargando no se ataca ni se dashea: las manos estan ocupadas
      if (cargandoEnAire) return;
      if (Input.dash() && this.cdDash <= 0 && this.ki.gastar(10)) {
        this.cdDash = 26;
        this.vx = this.facing * 6.2;
        this.invuln = Math.max(this.invuln, 10);
        Sonido.dash();
        FX.chispas(this.x, this.y - 14, 10, this.aspecto().aura || PAL.cyan);
      }
      if (Input.golpe()) this.iniciarAtaque();
      return;
    }

    if (this.guardando) {
      this.vx *= 0.7;
    } else if (eje !== 0) {
      // Cargando se camina, pero mas lento: el cuerpo esta juntando Ki
      const frenoCarga = this.cargando ? 0.45 : 1;
      const acel = (this.enSuelo ? CFG.ACEL : CFG.ACEL_AIRE) * m.vel * frenoCarga;
      this.vx += eje * acel;
      this.vx = clamp(this.vx, -velMax * frenoCarga, velMax * frenoCarga);
      this.facing = eje;
      if (this.enSuelo && Math.abs(this.vx) > velMax * .8 && Math.floor(this.t * 12) % 3 === 0) {
        FX.polvo(this.x - this.facing * 4, this.y);
      }
      // Pasos: la cadencia sale de la velocidad, asi que al correr suenan
      // mas seguido.
      if (this.enSuelo && Math.abs(this.vx) > 0.8) {
        this.tPaso = (this.tPaso || 0) + Math.abs(this.vx);
        if (this.tPaso > 26) { this.tPaso = 0; Sonido.paso(); }
      }
      if (Input.corriendo() && this.enSuelo && Math.floor(this.t * 20) % 2 === 0) {
        FX.chispas(this.x - this.facing * 8, this.y - 3, 1,
                   this.aspecto().aura || PAL.hueso);
      }
    } else if (this.enSuelo) {
      // Derrape: si venias a fondo, frenar lleva su tiempo y deja marca. Si
      // ibas despacio, frena en seco como siempre.
      const rapido = Math.abs(this.vx) > CFG.VEL_MAX * 1.15;
      const f = rapido ? CFG.FRICCION * 0.32 : CFG.FRICCION;
      if (Math.abs(this.vx) <= f) this.vx = 0; else this.vx -= signo(this.vx) * f;
      if (rapido && Math.floor(this.t * 30) % 2 === 0) {
        FX.polvo(this.x - signo(this.vx) * 5, this.y, 0.35);
      }
    }

    // --- Salto (con coyote time y buffer) ---
    if (Input.saltarPress()) this.buffer = CFG.BUFFER_SALTO;
    if (this.buffer > 0) this.buffer--;

    if (this.buffer > 0) {
      if (this.coyote > 0) {
        this.saltar(CFG.SALTO);
        this.buffer = 0; this.coyote = 0;
      } else if (this.despegar()) {
        // Segundo toque de ARRIBA, ya en el aire: despega
        this.buffer = 0;
      }
    }
    // Salto variable: si soltas temprano, subis menos
    if (!Input.saltarHold() && this.vy < CFG.SALTO_CORTO) this.vy = CFG.SALTO_CORTO;

    // --- Dash ---
    if (Input.dash() && this.cdDash <= 0 && this.ki.gastar(10)) {
      this.cdDash = 26;
      this.vx = this.facing * 5.4;
      this.vy = 0;
      this.invuln = Math.max(this.invuln, 10);
      Sonido.dash();
      FX.chispas(this.x, this.y - 14, 10, this.aspecto().aura || PAL.cyan);
    }

    // --- Ataques ---
    // El golpe sale al APRETAR, sin demora: la respuesta inmediata es lo que
    // hace que pegar se sienta bien. Mantener apretado ademas carga un golpe
    // pesado que sale al soltar, encima del combo normal.
    if (Input.golpe()) this.iniciarAtaque(false);

  }

  saltar(v) {
    this.vy = v;
    FX.polvo(this.x, this.y);
    Sonido.salto();
  }

  // ---------------------------------------------------------------- ataques
  iniciarAtaque(pesado) {
    if (this.ataque && !pesado) return;

    // Machacar acelera: cada golpe encadenado rapido sube el ritmo, y el
    // ritmo acorta la duracion de los ataques. Asi el combo arranca pesado
    // y termina siendo una lluvia de golpes.
    const ahora = this.t;
    if (ahora - this.tUltimoGolpe < 0.55) {
      this.ritmo = Math.min(1, this.ritmo + 0.22);
    } else {
      this.ritmo = 0;
    }
    this.tUltimoGolpe = ahora;
    // 1 = normal, 0.5 = al doble de velocidad
    const vel = 1 - this.ritmo * 0.5;
    if (pesado) {
      // Golpe pesado: lento, pero atraviesa la guardia y manda a volar
      this.ataque = {
        tipo: 'patada', frame: 0, dur: 32, activo: [10, 20],
        golpeados: new Set(), dano: 34, final: true, rompeGuardia: true
      };
      this.vx += this.facing * 1.4;
      return;
    }
    const escalar = (a) => {
      // Se acorta todo junto: duracion y ventana activa, asi el golpe sigue
      // conectando igual pero sale mas rapido.
      a.dur = Math.max(7, Math.round(a.dur * vel));
      a.activo = [
        Math.max(2, Math.round(a.activo[0] * vel)),
        Math.max(4, Math.round(a.activo[1] * vel))
      ];
      return a;
    };

    if (!this.enSuelo) {
      this.ataque = escalar({
        tipo: 'patada', frame: 0, dur: 20, activo: [4, 13],
        golpeados: new Set(), dano: 14, aereo: true
      });
      this.vy = Math.min(this.vy, 1.2);
    } else {
      // La ventana antes de `activo` es la anticipacion: sin esos frames el
      // golpe no se lee, aparece el brazo estirado de la nada.
      const combo = [
        { tipo: 'punch1', dur: 18, activo: [5, 10], dano: 10 },
        { tipo: 'punch2', dur: 19, activo: [5, 11], dano: 12 },
        { tipo: 'patada', dur: 26, activo: [7, 16], dano: 20, final: true }
      ][this.comboIdx];
      this.ataque = escalar(Object.assign({ frame: 0, golpeados: new Set() }, combo));
      this.comboIdx = (this.comboIdx + 1) % 3;
      this.comboVentana = 34;
      this.vx += this.facing * 0.9;
      // Chispas de velocidad cuando ya vas rapido
      if (this.ritmo > 0.5) {
        FX.chispas(this.x + this.facing * 10, this.y - 20, 3,
                   this.aspecto().aura || PAL.blanco);
      }
    }
  }

  actualizarAtaque() {
    const a = this.ataque;
    if (!a) return;
    a.frame++;
    if (a.frame > a.dur) { this.ataque = null; return; }

    if (a.frame >= a.activo[0] && a.frame <= a.activo[1]) {
      const m = this.ki.mult();
      // El desplazamiento de aire crece con la forma: en base el golpe llega
      // hasta donde llega el brazo, en Ultra Instinto barre medio metro mas.
      const fuerzaAire = clamp((m.dano - 1) / 7, 0, 1);
      const alcance = (a.tipo === 'patada' ? 20 : 16) + fuerzaAire * 26;
      const zona = {
        x: this.facing > 0 ? this.x + 3 : this.x - 3 - alcance,
        y: this.y - this.h + (a.tipo === 'patada' && !this.enSuelo ? 8 : 3),
        w: alcance, h: a.tipo === 'patada' ? 14 : 16
      };

      // Onda de aire en el primer frame activo
      if (a.frame === a.activo[0]) {
        FX.ondaAire(this.x + this.facing * 14, this.y - 20, this.facing,
                    fuerzaAire, this.aspecto().aura || PAL.blanco);
        if (fuerzaAire > 0.35) Sonido.swoosh();
      }

      Juego.enemigos.forEach(e => {
        if (e.muerto || a.golpeados.has(e)) return;
        if (!aabb(zona, e.caja)) return;
        a.golpeados.add(e);
        const dano = a.dano * m.dano;
        e.golpear(dano, this.facing, {
          empuje: a.final ? 4.5 : 2.2,
          empujeY: a.final ? 3.2 : 1.2,
          stun: a.final ? 26 : 12
        });
        Sonido.golpe(a.rompeGuardia ? 'pesado' : (a.tipo === 'patada' ? 'patada' : 'puno'));
        // Con el combo rapido el hitstop se acorta: si no, cada impacto
        // congelaba el juego y la lluvia de golpes se sentia lenta.
        if (this.ritmo > 0.4) FX.hitstop = Math.min(FX.hitstop, 2);
        FX.estela(this.x + this.facing * 14, this.y - 20, this.facing);
        if (a.final) {
          Sonido.golpeFuerte();
          FX.golpeFuerte(e.x, e.y - e.h * .5);
          this.ki.ki = Math.min(this.ki.kiMax, this.ki.ki + 4);
        }
        // Rebote al patear en el aire: si conecta, rebotas y podes encadenar
        // otra patada sin tocar el piso.
        if (a.aereo && !this.enSuelo) {
          this.vy = -3.4;
          this.ataque = null;          // corta el ataque para poder repetirlo ya
          FX.chispas(this.x, this.y - 10, 6, this.aspecto().aura || PAL.cyan);
        }
      });
    }
  }

  disparoKi() {
    if (Input.kiHold()) {
      this.cargaKi++;
      if (this.cargaKi === 30) { FX.texto(this.x, this.y - 40, 'LISTO', PAL.cyan); Sonido.cargandoKi(); }
      if (this.cargaKi > 30 && this.cargaKi % 6 === 0) {
        FX.chispas(this.x + this.facing * 8, this.y - 16, 2, PAL.cyan);
      }
    } else if (this.cargaKi > 0) {
      if (this.cargaKi >= 30) this.kamehameha();
      else this.rafaga();
      this.cargaKi = 0;
    }
  }

  // Enemigo al que conviene apuntar: el mas cercano hacia donde mirás.
  // Sin esto, pegarle a los voladores es imposible.
  objetivoAuto() {
    let mejor = null, mejorD = 240;
    Juego.enemigos.forEach(e => {
      if (e.muerto || !e.activo) return;
      const dx = e.x - this.x;
      // Solo hacia adelante (con un margen, para no ignorar al que tenes encima)
      if (signo(dx) !== this.facing && Math.abs(dx) > 24) return;
      const dy = (e.y - e.h * .5) - (this.y - 18);
      const d = Math.hypot(dx, dy);
      if (d < mejorD) { mejorD = d; mejor = e; }
    });
    return mejor;
  }

  // Cada transformacion dispara distinto: la base tira una rafaga, SSJ dos,
  // SSJ3 una lluvia, God una lanza rapidisima. Sale de `disparo` en la data.
  rafaga() {
    if (!this.ki.gastar(6)) { this.ki.aviso = 'SIN KI'; return; }
    const m = this.ki.mult();
    const D = this.forma.disparo || { cant: 1, r: 3, vel: 4.6, dano: 1, disp: 0 };
    const obj = this.objetivoAuto();
    const color = this.aspecto().aura || PAL.cyan;

    // Angulo base: al objetivo si hay, si no hacia donde mira
    let ang = this.facing > 0 ? 0 : Math.PI;
    if (obj) {
      ang = Math.atan2((obj.y - obj.h * .5) - (this.y - 16),
                       obj.x - (this.x + this.facing * 8));
    }

    for (let i = 0; i < D.cant; i++) {
      // Los tiros se abren en abanico alrededor del angulo base
      const desvio = D.cant > 1 ? (i - (D.cant - 1) / 2) * D.disp : 0;
      const a = ang + desvio;
      Juego.proyectiles.push(new Proyectil({
        x: this.x + this.facing * 8, y: this.y - 16,
        vx: Math.cos(a) * D.vel, vy: Math.sin(a) * D.vel,
        r: D.r,
        dano: 9 * m.dano * D.dano, duenio: 'jugador',
        dirigido: !!obj,
        color
      }));
    }
    if (D.cant > 1 || D.r > 4) FX.texto(this.x, this.y - 44, D.nombre, color);
    this.vx -= this.facing * .6;
    Sonido.rafagaKi();
    this.poseForzada = 'ki'; this.poseForzadaT = 10;
  }

  kamehameha() {
    if (!this.ki.gastar(25)) { this.ki.aviso = 'SIN KI'; return; }
    const m = this.ki.mult();
    Juego.rayos.push({
      x: this.x + this.facing * 9, y: this.y - 16,
      dir: this.facing, vida: 26, vidaMax: 26,
      alto: 12, dano: 30 * m.dano, golpeados: new Set(),
      color: this.aspecto().aura || PAL.cyan
    });
    this.vx -= this.facing * 2.2;
    Sonido.kamehameha();
    Voz.decir(fraseAlAzar(FRASES.kamehameha), 'goku', { urgente: true, corta: true, rate: 0.85 });
    FX.golpeFuerte(this.x + this.facing * 12, this.y - 16);
    FX.texto(this.x, this.y - 44, 'KAMEHAMEHA', PAL.cyan);
    this.poseForzada = 'ki'; this.poseForzadaT = 26;
  }

  // ------------------------------------------------------------------ varios
  inputTransformar() {
    for (let i = 0; i < ORDEN_FORMAS.length; i++) {
      if (Input.pressed('Digit' + (i + 1))) this.ki.activar(ORDEN_FORMAS[i]);
    }
    if (Input.pressed('Digit0')) this.ki.revertir(false);
    if (Input.kaioken()) this.ki.ciclarKaioken();
  }

  recibirGolpe(dano, dirX, opts) {
    if (this.invuln > 0 || this.muerto) return;
    const m = this.ki.mult();
    if (m.esquiva > 0 && Math.random() < m.esquiva) {
      // Esquivar en Ultra Instinto es el momento lindo: el tiempo se frena,
      // el cuerpo se corre solo y queda una silueta atras.
      this.esquivar(dirX);
      return;
    }
    // La guardia parte el dano al medio y te deja casi sin aturdimiento
    const factorGuardia = this.guardando ? 0.5 : 1;
    const recibido = (dano / m.def) * factorGuardia;
    this.hp -= recibido;
    this.flash = 10;
    this.invuln = 50;
    this.stun = this.guardando ? 5 : 16;
    if (this.guardando) {
      FX.chispas(this.x + dirX * 8, this.y - 16, 8, PAL.cyan);
      FX.texto(this.x, this.y - 40, 'GUARDIA', PAL.cyan);
      Sonido.guardia();
    }
    this.ataque = null;
    this.vx = dirX * 2.6;
    this.vy = -2.2;
    FX.impacto(this.x, this.y - 16, recibido, dirX);
    FX.shake = 6;
    Sonido.dano();
    // Grito corto solo si el golpe fue fuerte de verdad
    if (recibido > this.hpMax * 0.12) {
      Sonido.grito(0.35, 0.4);
      Voz.decir(fraseAlAzar(FRASES.golpeado), 'goku', { espera: 2600, corta: true });
    }
    if (this.hp <= 0) { this.hp = 0; this.muerto = true; }
  }

  // El cuerpo se mueve solo: se corre del golpe, deja estela y frena el
  // tiempo un instante para que se vea.
  esquivar(dirX) {
    const color = this.aspecto().aura || PAL.blanco;
    this.invuln = 18;
    // Se aparta del golpe, hacia el lado contrario y un poco hacia arriba
    this.vx += -dirX * 2.2;
    this.vy = -1.4;
    Juego.camaraLenta(16, 0.22);
    FX.texto(this.x, this.y - 44, 'ESQUIVA', color);
    FX.chispas(this.x, this.y - 16, 10, color);
    // Silueta que queda donde estaba
    FX.destellos.push({ x: this.x, y: this.y - 16, vida: 14, vidaMax: 14, r: 14, color });
    Sonido.swoosh();
  }

  caidaAlVacio() {
    this.hp -= 25;
    if (this.hp <= 0) { this.hp = 0; this.muerto = true; return; }
    this.x = Nivel.inicio.x; this.y = Nivel.inicio.y;
    this.vx = 0; this.vy = 0;
    this.invuln = 60;
    FX.texto(this.x, this.y - 40, 'UF!', PAL.rojo);
  }

  recogerItems() {
    // Esferas del dragon
    Nivel.esferas.forEach(es => {
      if (es.tomada) return;
      if (dist(this.x, this.y - 14, es.x, es.y) < 14) {
        es.tomada = true;
        Juego.esferas++;
        this.hp = Math.min(this.hpMax, this.hp + 10);
        Sonido.esfera(Juego.esferas);
        FX.chispas(es.x, es.y, 18, '#ffb833');
        FX.destellos.push({ x: es.x, y: es.y, vida: 14, vidaMax: 14, r: 18 });
        FX.texto(es.x, es.y - 10, ESFERAS[es.num - 1], '#ffb833');
        if (Juego.esferas >= 7) {
          UI.mostrar('LAS SIETE ESFERAS! VENCE AL JEFE', 220);
          Voz.decir(fraseAlAzar(FRASES.esferas), 'goku', { urgente: true });
        }
      }
    });

    Nivel.items.forEach(it => {
      if (it.tomado) return;
      if (dist(this.x, this.y - 14, it.x, it.y) >= 12) return;
      it.tomado = true;
      Sonido.item();
      if (it.tipo === 'vida') {
        const cura = Math.round(this.hpMax * 0.25);
        this.hp = Math.min(this.hpMax, this.hp + cura);
        FX.chispas(it.x, it.y, 10, PAL.rojo);
        FX.texto(it.x, it.y - 6, '+' + cura + ' VIDA', PAL.rojo);
      } else {
        this.ki.ki = Math.min(this.ki.kiMax, this.ki.ki + 30);
        FX.chispas(it.x, it.y, 10, PAL.cyan);
        FX.texto(it.x, it.y - 6, '+30 KI', PAL.cyan);
      }
    });

    // Checkpoint
    const cp = Nivel.checkpoint;
    if (cp && !cp.tocado && Math.abs(this.x - cp.x) < 20 && Math.abs(this.y - cp.y) < 40) {
      cp.tocado = true;
      Sonido.nivelArriba();
      FX.chispas(cp.x, cp.y - 20, 16, PAL.dorado);
      UI.mostrar('CHECKPOINT', 120);
    }
  }

  ganarExp(n) {
    this.exp += n;
    if (this.exp >= this.nivel * 60) {
      this.exp -= this.nivel * 60;
      this.nivel++;
      this.hpMax += 15; this.hp = this.hpMax;
      this.ki.kiMax += 10; this.ki.ki = this.ki.kiMax;
      Sonido.nivelArriba();
      Voz.decir(fraseAlAzar(FRASES.nivel), 'goku', { espera: 5000 });
      FX.texto(this.x, this.y - 44, 'NIVEL ' + this.nivel, PAL.dorado);
    }
  }

  definirPose() {
    if (this.poseForzadaT > 0) { this.poseForzadaT--; this.pose = this.poseForzada; return; }
    if (this.ataque) {
      const a = this.ataque;
      // Antes de que el golpe sea activo se ve la carga: eso es lo que hace
      // que se lea como una pina y no como un brazo que aparece estirado.
      this.pose = (a.tipo === 'patada')
        ? 'patada'
        : (a.frame < a.activo[0] ? 'punch_prep' : 'punch');
      return;
    }
    if (this.guardando) { this.pose = 'charge'; return; }
    // Cargando quieto se ve la pose de carga; cargando en movimiento se ve
    // caminar, porque si no parece que se desliza.
    if (this.cargando && Math.abs(this.vx) < 0.3) { this.pose = 'charge'; return; }
    if (this.volando) {
      if (this.cargando) { this.pose = 'charge'; return; }
      
      // Yendo a fondo el cuerpo se acuesta y va de punta; flotando o
      // maniobrando despacio, queda vertical con los brazos sueltos.
      this.pose = Math.abs(this.vx) > 1.5 ? 'vuelaRapido' : 'vuela';
      return;
    }
    if (!this.enSuelo) { this.pose = this.vy < 0 ? 'jump' : 'fall'; return; }
    this.pose = Math.abs(this.vx) > 0.35 ? 'run' : 'idle';
  }

  dibujar(camx, camy) {
    // La sombra y la estela van ANTES del parpadeo de invulnerabilidad: son
    // rastros, no el cuerpo. Si no, el dash (que da invulnerabilidad) nunca
    // llegaba a dibujar su propia estela.
    this.dibujarSombra(camx, camy);
    const dejaEstela = this.cdDash > 14 || (Input.corriendo() && Math.abs(this.vx) > 2.6);
    if (dejaEstela) {
      for (let i = this.estela.length - 1; i >= 1; i -= 2) {
        const e = this.estela[i];
        dibujarMatriz(matrizPose(e.pose, this.t, this.nivelDano),
                      e.x - camx, e.y - camy, e.facing, TINTA_APAGADA);
      }
    }

    // Parpadeo de invulnerabilidad
    if (this.invuln > 0 && this.stun <= 0 && Math.floor(this.t * 30) % 2 === 0) return;
    const a = this.aspecto();

    // Columna de Ki mientras cargas: crece con el tiempo que llevas apretando.
    if (this.cargando) {
      const av = clamp(this.tiempoCargando / 2.2, 0, 1);
      const color = a.aura || PAL.cyan;
      const px = Math.round(this.x - camx), py = Math.round(this.y - camy);
      const w = Math.round(6 + av * 12);
      const alto = Math.round(20 + av * 90);
      for (let i = 0; i < alto; i += 2) {
        const t = i / alto;
        const ww = Math.max(1, Math.round(w * (1 - t * 0.75)));
        if ((i + Math.floor(this.t * 40)) % 6 < 4) {
          Px.rect(px - ww / 2, py - 6 - i, ww, 2, t < .35 ? PAL.blanco : color);
        }
      }
      Px.elipse(px, py - 2, Math.round(10 + av * 12), Math.round(3 + av * 3), color);
      const pulso = Math.floor(this.t * 16) % 2;
      Px.aro(px, py - 18, Math.round(12 + av * 16 + pulso * 2), color);
    }

    const tembl = this.cargando ? Math.round(rnd(-1, 1) * clamp(this.tiempoCargando, 0, 1.6)) : 0;
    // De Ozaru el sprite se dibuja al doble: es un mono gigante
    if (this.ki.forma === 'ozaru') {
      dibujarMatrizEscala(matrizPose(this.pose, this.t, this.nivelDano),
                          this.x - camx, this.y - camy, this.facing,
                          { S: '#4a3524', s: '#2a1d13', N: '#5a3a24', n: '#3a2416',
                            A: '#4a3524', a: '#2a1d13', P: '#2a1d13', W: '#ffcf3f',
                            O: '#e0384f' }, 2);
      if (a.aura) dibujarAura(this.x - camx, this.y - camy, a.aura, true, this.t, 1.2);
      return;
    }

    dibujarPeleador({
      x: this.x - camx + tembl, y: this.y - camy,
      facing: this.facing, pose: this.pose, t: this.t,
      tintas: a.tintas,
      dano: this.nivelDano,
      aura: (this.cargando || this.volando) ? (a.aura || PAL.cyan) : a.aura,
      // Volando siempre hay aura, aunque estes en base: si no, se ve a Goku
      // flotando pegado en el aire sin ninguna razon visible.
      auraFuerte: a.auraFuerte || (this.cargando && this.tiempoCargando > 1),
      // Cargar hace crecer el aura hasta el doble
      fuerzaAura: a.fuerzaAura + (this.cargando ? clamp(this.tiempoCargando / 1.6, 0, 1) * 0.9 : 0)
                              + (this.volando ? 0.25 : 0),
      rayos: a.rayos || (this.cargando && this.tiempoCargando > 1.4),
      electricidad: a.electricidad + (this.cargando ? 0.5 : 0),
      melena: a.melena, cola: a.cola
    });

    // Esfera de carga del Kamehameha
    if (this.cargaKi > 6) {
      const r = Math.min(7, 1 + this.cargaKi / 6);
      const px = this.x - camx + this.facing * 11, py = this.y - camy - 18;
      Px.disco(px, py, r, a.aura || PAL.cyan);
      Px.disco(px, py, Math.max(1, r - 2), PAL.blanco);
    }
  }
}
