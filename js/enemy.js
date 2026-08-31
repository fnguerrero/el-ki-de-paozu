// Enemigos. Cada uno tiene una silueta y un comportamiento distinto para que
// se lean de un vistazo: el chiquito salta encima, el de armadura dispara,
// el volador te persigue por arriba.

const PLANTILLAS = {
  // ---------------------------- tropa ----------------------------
  saibaman: {
    nombre: 'SAIBAMAN', hp: 22, dano: 8, vel: 0.75, w: 11, h: 22,
    forma: 'saibaman', exp: 10, ia: 'melee', salta: true, rango: 130
  },
  soldado: {
    nombre: 'SOLDADO', hp: 38, dano: 10, vel: 0.55, w: 12, h: 30,
    forma: 'soldado', exp: 20, ia: 'rango', distancia: 70, cadencia: 80, rango: 165
  },
  velk: {
    nombre: 'VELK', hp: 26, dano: 9, vel: 0.9, w: 12, h: 26,
    forma: 'velk', exp: 16, ia: 'volador', cadencia: 95, rango: 150, vuela: true
  },
  hueco: {
    nombre: 'HUECO', hp: 70, dano: 14, vel: 0.7, w: 12, h: 28,
    forma: 'hueco', exp: 40, ia: 'mixto', distancia: 60, cadencia: 90, rango: 150,
    habilidad: 'division'
  },
  nappa: {
    nombre: 'NAPPA', hp: 180, dano: 18, vel: 0.8, w: 15, h: 38,
    forma: 'nappa', exp: 90, ia: 'melee', salta: true, rango: 170
  },
  raditz: {
    nombre: 'RADITZ', hp: 150, dano: 15, vel: 0.95, w: 14, h: 38,
    forma: 'raditz', exp: 80, ia: 'mixto', distancia: 70, cadencia: 80, rango: 170
  },
  a17: {
    nombre: 'N. 17', hp: 120, dano: 16, vel: 1.1, w: 12, h: 32,
    forma: 'a17', exp: 70, ia: 'mixto', distancia: 75, cadencia: 70, rango: 175
  },
  a19: {
    nombre: 'N. 19', hp: 150, dano: 14, vel: 0.5, w: 14, h: 30,
    forma: 'a19', exp: 70, ia: 'rango', distancia: 85, cadencia: 65, rango: 175,
    habilidad: 'drenaje'
  },
  babidi: {
    nombre: 'BABIDI', hp: 60, dano: 12, vel: 0.6, w: 11, h: 24,
    forma: 'babidi', exp: 45, ia: 'rango', distancia: 95, cadencia: 60, rango: 180
  },

  // Originales: uno por bloque de sagas, para que la tropa no sea siempre
  // la misma cara repintada.
  zarko: {
    nombre: 'ZARKO', hp: 42, dano: 10, vel: 1.25, w: 16, h: 22,
    forma: 'zarko', exp: 35, ia: 'melee', salta: true, rango: 160
  },
  sylph: {
    nombre: 'SYLPH', hp: 45, dano: 11, vel: 0.8, w: 12, h: 28,
    forma: 'sylph', exp: 45, ia: 'volador', cadencia: 80, rango: 165, vuela: true,
    habilidad: 'division'
  },
  kaon: {
    nombre: 'KAON', hp: 130, dano: 18, vel: 0.45, w: 14, h: 34,
    forma: 'kaon', exp: 90, ia: 'rango', distancia: 110, cadencia: 55, rango: 200
  },

  // ---------------------------- jefes ----------------------------
  piccolo: {
    nombre: 'PICCOLO', hp: 260, dano: 12, vel: 1.0, w: 14, h: 36,
    forma: 'piccolo', exp: 150, ia: 'jefe', jefe: true, rango: 999,
    fases: [
      { hp: 1.00, txt: 'ASI QUE VOS SOS EL HIJO DE BARDOCK' },
      { hp: 0.55, txt: 'NO ME ALCANZA CON UN BRAZO' },
      { hp: 0.25, txt: 'ME VOY A ACORDAR DE ESTO, GOKU' }
    ]
  },
  vegeta: {
    nombre: 'VEGETA', hp: 420, dano: 18, vel: 1.25, w: 13, h: 34,
    forma: 'vegeta', exp: 260, ia: 'jefe', jefe: true, rango: 999,
    fases: [
      { hp: 1.00, txt: 'SOY EL PRINCIPE DE LOS SAIYAJIN' },
      { hp: 0.55, txt: 'UN CLASE BAJA NO ME PUEDE GANAR' },
      { hp: 0.22, txt: 'ESTO NO TERMINA ACA, KAKAROTO' }
    ]
  },
  freezer: {
    nombre: 'FREEZER', hp: 650, dano: 24, vel: 1.35, w: 13, h: 34,
    forma: 'freezer', exp: 420, ia: 'jefe', jefe: true, rango: 999,
    fases: [
      { hp: 1.00, txt: 'NI SIQUIERA ESTOY USANDO EL 50%' },
      { hp: 0.60, txt: 'DEJAME MOSTRARTE MI FORMA REAL' },
      { hp: 0.25, txt: 'UN SUPER SAIYAN? ES SOLO UN CUENTO' }
    ]
  },
  cell: {
    nombre: 'CELL', hp: 900, dano: 30, vel: 1.4, w: 15, h: 38,
    forma: 'cell', exp: 620, ia: 'jefe', jefe: true, rango: 999,
    fases: [
      { hp: 1.00, txt: 'BIENVENIDO A MI TORNEO' },
      { hp: 0.55, txt: 'ME REGENERO DESDE UNA SOLA CELULA' },
      { hp: 0.22, txt: 'ME VOY A LLEVAR EL PLANETA CONMIGO' }
    ]
  },
  majinbuu: {
    nombre: 'MAJIN BUU', hp: 1200, dano: 34, vel: 1.1, w: 18, h: 38,
    forma: 'majinbuu', exp: 850, ia: 'jefe', jefe: true, rango: 999,
    fases: [
      { hp: 1.00, txt: 'BUU QUIERE JUGAR' },
      { hp: 0.55, txt: 'BUU TE CONVIERTE EN CARAMELO' },
      { hp: 0.22, txt: 'BUU SE ENOJO' }
    ]
  },
  omega: {
    nombre: 'OMEGA SHENRON', hp: 1500, dano: 38, vel: 1.35, w: 18, h: 42,
    forma: 'omega', exp: 1100, ia: 'jefe', jefe: true, rango: 999,
    fases: [
      { hp: 1.00, txt: 'SOY TODOS LOS DESEOS QUE PIDIERON' },
      { hp: 0.55, txt: 'CADA ESFERA ES UN PECADO SUYO' },
      { hp: 0.22, txt: 'IMPOSIBLE... ESE PELO ES ROJO' }
    ]
  },
  jiren: {
    nombre: 'JIREN', hp: 1900, dano: 44, vel: 1.5, w: 16, h: 40,
    forma: 'jiren', exp: 1500, ia: 'jefe', jefe: true, rango: 999,
    fases: [
      { hp: 1.00, txt: 'LA FUERZA LO ES TODO' },
      { hp: 0.55, txt: 'TU CONFIANZA EN OTROS TE DEBILITA' },
      { hp: 0.22, txt: 'QUE... QUE ES ESA MIRADA PLATEADA' }
    ]
  },
  draken: {
    nombre: 'DRAKEN', hp: 2400, dano: 50, vel: 1.6, w: 15, h: 38,
    forma: 'draken', exp: 2000, ia: 'jefe', jefe: true, rango: 999,
    habilidad: 'copia',
    fases: [
      { hp: 1.00, txt: 'CATALOGO PLANETAS Y DESPUES LOS VENDO' },
      { hp: 0.60, txt: 'YA COPIE TODAS TUS TECNICAS' },
      { hp: 0.30, txt: 'ESTA NO LA TENGO EN EL CATALOGO' },
      { hp: 0.12, txt: 'NO PUEDO VENDER LO QUE NO ENTIENDO' }
    ]
  }
};

// Al recibir un golpe el enemigo se pinta entero de blanco un frame.
// Rojo claro, no blanco puro: se lee como "le dolio" y no como un hueco en la
// pantalla, y ademas no se confunde con los destellos de impacto.
const BLANQUEO = (function () {
  const t = {}, c = '#ff9a9a';
  'GgVvCcMmPpSsHRrYAaNnWOK'.split('').forEach(k => { t[k] = c; });
  t.K = '#c0392b';   // el contorno queda mas oscuro para no perder la silueta
  return t;
})();

class Enemigo extends Entidad {
  constructor(tipo, x, y) {
    const p = PLANTILLAS[tipo];
    super({
      x, y, w: p.w, h: p.h,
      hp: p.hp, hpMax: p.hp, facing: -1,
      pesa: !p.vuela
    });
    this.p = p;
    this.tipo = tipo;
    this.activo = false;
    this.cd = rndInt(20, 60);
    this.estado = 'espera';
    this.fase = 0;
    this.yBase = y;
    this.pose = 'idle';
    this.cdGolpe = 0;
    this.bloqueando = false;
    this.cdBloqueo = 0;
  }

  update(dt, jug) {
    this.t += dt;
    if (this.flash > 0) this.flash--;
    if (this.invuln > 0) this.invuln--;
    if (this.cdGolpe > 0) this.cdGolpe--;

    const dx = jug.x - this.x;
    const dAbs = Math.abs(dx);

    // No se activa hasta que lo ves: evita que todo el nivel se mueva a la vez.
    if (!this.activo) {
      if (dAbs < this.p.rango && Math.abs(jug.y - this.y) < 110) this.activo = true;
      else { this.quieto(); return; }
    }

    if (this.stun > 0) {
      this.stun--;
      this.pose = 'hurt';
      if (this.p.vuela) { this.vy *= .9; this.x += this.vx; this.vx *= .9; }
      else { this.aplicarGravedad(); this.moverFisica(false); }
      return;
    }

    this.facing = dx >= 0 ? 1 : -1;
    if (this.cd > 0) this.cd--;
    if (this.cdBloqueo > 0) this.cdBloqueo--;

    // Bloqueo: se cubren un rato cuando los tenes encima. Los jefes lo hacen
    // mas seguido. Mientras bloquean reciben menos y no se aturden.
    if (this.bloqueando) {
      this.bloqueando = this.cdBloqueo > 0;
    } else if (this.cdBloqueo <= 0 && dAbs < 45 && Math.random() < (this.p.jefe ? 0.012 : 0.005)) {
      // Ojo con subir esto: a 60fps una probabilidad alta significa que se
      // cubren casi siempre y las peleas se vuelven eternas.
      this.bloqueando = true;
      this.cdBloqueo = this.p.jefe ? 40 : 26;
    }

    switch (this.p.ia) {
      case 'melee':   this.iaMelee(jug, dx, dAbs); break;
      case 'rango':   this.iaRango(jug, dx, dAbs); break;
      case 'volador': this.iaVolador(jug, dx, dAbs); break;
      case 'jefe':    this.iaJefe(jug, dx, dAbs); break;
    }

    if (!this.p.vuela) {
      this.aplicarGravedad();
      this.moverFisica(false);
      this.pose = this.enSuelo
        ? (Math.abs(this.vx) > .2 ? 'run' : 'idle')
        : (this.vy < 0 ? 'jump' : 'fall');
    } else {
      this.x += this.vx; this.y += this.vy;
      this.vx *= .93; this.vy *= .93;
      this.pose = 'idle';
    }

    this.tocarJugador(jug, dAbs);
  }

  // Recibir un golpe: si esta bloqueando, se come una fraccion y no se aturde.
  golpear(dano, dirX, opts) {
    if (this.bloqueando && !(opts && opts.rompeGuardia)) {
      if (this.invuln > 0) return false;
      this.hp -= dano * 0.3;
      this.invuln = 10;
      this.vx = dirX * 0.8;
      FX.chispas(this.x - dirX * 6, this.y - this.h * 0.6, 8, PAL.cyan);
      FX.texto(this.x, this.y - this.h - 6, 'BLOQUEO', PAL.cyan);
      Sonido.guardia();
      if (this.hp <= 0) { this.hp = 0; this.muerto = true; FX.explosion(this.x, this.y - this.h * .5); }
      return true;
    }
    // Un golpe que rompe guardia la baja de una
    if (opts && opts.rompeGuardia) { this.bloqueando = false; this.cdBloqueo = 70; }
    return super.golpear(dano, dirX, opts);
  }

  quieto() {
    if (this.p.vuela) return;
    this.vx *= .8;
    this.aplicarGravedad();
    this.moverFisica(false);
  }

  iaMelee(jug, dx, dAbs) {
    this.vx += signo(dx) * this.p.vel * .3;
    this.vx = clamp(this.vx, -this.p.vel, this.p.vel);
    // Salta si hay pared adelante o el jugador esta arriba
    const frente = this.x + this.facing * 10;
    const hayPared = Nivel.chocaSolido(frente - 3, this.y - this.h, 6, this.h - 4);
    if (this.enSuelo && this.p.salta && (hayPared || (jug.y < this.y - 20 && dAbs < 50)) && this.cd <= 0) {
      this.vy = -4.2;
      this.cd = 40;
    }
  }

  iaRango(jug, dx, dAbs) {
    const d = this.p.distancia;
    if (dAbs > d + 20) this.vx += signo(dx) * this.p.vel * .3;
    else if (dAbs < d - 20) this.vx -= signo(dx) * this.p.vel * .3;
    else this.vx *= .85;
    this.vx = clamp(this.vx, -this.p.vel, this.p.vel);

    if (this.cd <= 0 && dAbs < 160) {
      this.cd = this.p.cadencia;
      this.disparar(jug);
    }
  }

  iaVolador(jug, dx, dAbs) {
    const objY = jug.y - 34 + Math.sin(this.t * 2) * 12;
    this.vx += signo(dx) * this.p.vel * .22;
    this.vy += signo(objY - this.y) * .12;
    this.vx = clamp(this.vx, -this.p.vel * 1.6, this.p.vel * 1.6);
    this.vy = clamp(this.vy, -1.4, 1.4);
    if (this.cd <= 0 && dAbs < 150) {
      this.cd = this.p.cadencia;
      this.disparar(jug);
    }
  }

  iaJefe(jug, dx, dAbs) {
    // Fases: mensajes al cruzar umbrales de vida
    const ratio = this.hp / this.hpMax;
    while (this.fase < this.p.fases.length - 1 && ratio <= this.p.fases[this.fase + 1].hp) {
      this.fase++;
      Juego.dialogoJefe(this.p.fases[this.fase].txt);
    }

    if (this.cd > 0) {
      // Durante el cooldown sigue moviendose hacia vos
      this.vx += signo(dx) * this.p.vel * .18;
      this.vx = clamp(this.vx, -this.p.vel, this.p.vel);
      return;
    }

    // Cada fase pelea distinto: la 1 tantea, la 2 combina, la 3 se juega
    // entera. Antes era todo al azar y se sentia igual de principio a fin.
    const r = Math.random();
    if (this.fase === 0) {
      if (dAbs > 80 && r < 0.5) { this.cd = 50; this.disparar(jug); }
      else { this.acercarse(dx, 1.0); this.cd = 24; }

    } else if (this.fase === 1) {
      if (dAbs > 90 && r < 0.45) {
        this.embestir();
      } else if (dAbs > 55 && r < 0.75) {
        this.cd = 40; this.disparar(jug);
      } else { this.acercarse(dx, 1.2); this.cd = 18; }

    } else {
      // Fase final: rafagas dobles, embestidas seguidas y salto
      if (r < 0.3) {
        this.cd = 34;
        this.disparar(jug);
        setTimeout(() => { if (!this.muerto) this.disparar(jug); }, 140);
      } else if (r < 0.62) {
        this.embestir();
      } else if (r < 0.78 && this.enSuelo) {
        this.vy = -5.2; this.vx = signo(dx) * this.p.vel * 1.6; this.cd = 42;
      } else { this.acercarse(dx, 1.5); this.cd = 14; }
    }
  }

  acercarse(dx, mult) {
    this.vx += signo(dx) * this.p.vel * 0.35 * (mult || 1);
    this.vx = clamp(this.vx, -this.p.vel * mult, this.p.vel * mult);
  }

  embestir() {
    this.vx = this.facing * 3.9;
    this.vy = -1.5;
    this.cd = 62;
    FX.chispas(this.x, this.y - 10, 8, PAL.hueso);
    Sonido.swoosh();
  }

  disparar(jug) {
    const dx = jug.x - this.x, dy = (jug.y - 16) - (this.y - this.h * .6);
    const d = Math.hypot(dx, dy) || 1;
    const vel = this.p.jefe ? 3.0 : 2.2;
    Juego.proyectiles.push(new Proyectil({
      x: this.x + this.facing * 8, y: this.y - this.h * .6,
      vx: dx / d * vel, vy: dy / d * vel,
      r: this.p.jefe ? 4 : 3,
      dano: this.p.dano, duenio: 'enemigo',
      color: this.p.jefe ? PAL.violeta : PAL.rojo
    }));
    this.pose = 'ki';
  }

  tocarJugador(jug, dAbs) {
    // En Ultra Instinto el cuerpo lo atraviesa: no hay golpe por contacto.
    if (jug.forma && jug.forma.atraviesa) return;
    if (this.cdGolpe > 0 || jug.invuln > 0 || jug.muerto) return;
    if (dAbs < (this.w + jug.w) / 2 + 2 && Math.abs(jug.y - this.y) < this.h) {
      this.cdGolpe = 40;
      jug.recibirGolpe(this.p.dano, signo(jug.x - this.x) || 1);
    }
  }

  dibujar(camx, camy) {
    this.dibujarSombra(camx, camy);
    if (this.flash > 0 && Math.floor(this.t * 40) % 2 === 0) {
      // Frame en blanco al recibir: se lee al instante que le pegaste
      dibujarEnemigoArt({
        x: this.x - camx, y: this.y - camy, facing: this.facing,
        pose: this.pose, t: this.t, forma: this.p.forma,
        tintas: BLANQUEO
      });
    } else {
      dibujarEnemigoArt({
        x: this.x - camx, y: this.y - camy, facing: this.facing,
        pose: this.pose, t: this.t, forma: this.p.forma,
        aura: this.p.jefe ? PAL.violeta : null
      });
    }

    // Escudo visible mientras bloquea
    if (this.bloqueando) {
      const px = Math.round(this.x - camx), py = Math.round(this.y - camy - this.h * 0.55);
      Px.aro(px + this.facing * 5, py, Math.round(this.h * 0.42), PAL.cyan);
      Px.aro(px + this.facing * 5, py, Math.round(this.h * 0.42) - 1, PAL.blanco);
    }

    // Barra de vida chica (los jefes usan la barra grande de arriba)
    if (!this.p.jefe && this.hp < this.hpMax) {
      const w = 14, px = Math.round(this.x - camx - w / 2), py = Math.round(this.y - camy - this.h - 5);
      Px.rect(px - 1, py - 1, w + 2, 4, PAL.contorno);
      Px.rect(px, py, w, 2, PAL.rojoS);
      Px.rect(px, py, Math.round(w * clamp(this.hp / this.hpMax, 0, 1)), 2, PAL.rojo);
    }
  }
}
