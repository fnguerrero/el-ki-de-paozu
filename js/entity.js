// Entidades con fisica de plataformas + efectos de impacto.

class Entidad {
  constructor(o) {
    Object.assign(this, {
      x: 0, y: 0,           // x = centro, y = PIES
      vx: 0, vy: 0,
      w: 10, h: 28,
      hp: 10, hpMax: 10,
      facing: 1,
      enSuelo: false,
      muerto: false,
      invuln: 0, flash: 0, stun: 0,
      t: 0,
      pesa: true
    }, o);
  }

  get caja() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }

  // Movimiento con resolucion por ejes contra el tilemap.
  //
  // El eje Y no pregunta "¿la caja se superpone con un tile?" sino
  // "¿los pies CRUZARON el techo de un tile en este frame?". Preguntarlo asi
  // evita el jitter de medio pixel que hacia parpadear enSuelo.
  moverFisica(atravesarPlataformas) {
    const T = CFG.TILE;
    const hw = this.w / 2;

    // --- Eje X ---
    if (this.vx !== 0) {
      const vxAntes = this.vx;
      this.x += this.vx;
      const dir = signo(this.vx);
      const tx = Math.floor((this.x + dir * hw) / T);
      const y0 = Math.floor((this.y - this.h + 2) / T);
      const y1 = Math.floor((this.y - 1) / T);
      for (let ty = y0; ty <= y1; ty++) {
        if (Nivel.solido(tx, ty)) {
          this.x = dir > 0 ? tx * T - hw - 0.01 : (tx + 1) * T + hw + 0.01;
          // Estrellarse contra una pared por un knockback duele extra: premia
          // acorralar al enemigo en vez de pegarle en el medio del campo.
          if (this.stun > 0 && Math.abs(vxAntes) > 3.5) {
            this.golpearContraPared(Math.abs(vxAntes));
          }
          this.vx = 0;
          break;
        }
      }
    }

    // --- Eje Y ---
    const piesAntes = this.y;
    this.y += this.vy;
    this.enSuelo = false;

    const x0 = Math.floor((this.x - hw + 1) / T);
    const x1 = Math.floor((this.x + hw - 1) / T);

    if (this.vy >= 0) {
      const tyA = Math.floor(piesAntes / T);
      const tyB = Math.floor(this.y / T);
      buscar:
      for (let ty = tyA; ty <= tyB; ty++) {
        const techo = ty * T;
        if (techo < piesAntes - 0.001) continue;   // ya venias por debajo
        for (let tx = x0; tx <= x1; tx++) {
          const c = Nivel.tile(tx, ty);
          const esPiso = c === '#' || (c === '=' && !atravesarPlataformas);
          if (esPiso) {
            this.y = techo;
            this.vy = 0;
            this.enSuelo = true;
            break buscar;
          }
        }
      }
    } else {
      const tyTecho = Math.floor((this.y - this.h) / T);
      for (let tx = x0; tx <= x1; tx++) {
        if (Nivel.solido(tx, tyTecho)) {
          this.y = (tyTecho + 1) * T + this.h;
          this.vy = 0;
          break;
        }
      }
    }

    if (this.y > Nivel.alto + 60) this.caidaAlVacio();
  }

  caidaAlVacio() { this.muerto = true; }

  golpearContraPared(fuerza) {
    const extra = Math.round(fuerza * 1.8);
    this.hp -= extra;
    this.flash = 8;
    FX.impacto(this.x, this.y - this.h * 0.5, extra, 0);
    FX.chispas(this.x, this.y - this.h * 0.5, 12, PAL.hueso);
    FX.shake = Math.max(FX.shake, 5);
    Sonido.golpeFuerte();
    if (this.hp <= 0) { this.hp = 0; this.muerto = true; FX.explosion(this.x, this.y - this.h * .5); }
  }

  aplicarGravedad() {
    if (!this.pesa) return;
    const g = this.vy < 0 ? CFG.GRAV : CFG.GRAV_CAIDA;
    this.vy = Math.min(this.vy + g, CFG.VEL_CAIDA_MAX);
  }

  // Sombra en el piso, del tamaño de lo alto que estes: cuanto mas arriba,
  // mas chica y mas tenue. Sin esto no se sabe donde vas a caer.
  dibujarSombra(camx, camy) {
    const T = CFG.TILE;
    const tx = Math.floor(this.x / T);
    let ty = Math.floor(this.y / T);
    while (ty < Nivel.h && !Nivel.solido(tx, ty) && !Nivel.plataforma(tx, ty)) ty++;
    const suelo = ty * T;
    const altura = clamp((suelo - this.y) / 90, 0, 1);
    const w = Math.round((this.w * 0.8) * (1 - altura * 0.55));
    if (w < 2) return;
    Px.elipse(this.x - camx, suelo - camy - 1, w, Math.max(1, Math.round(w * 0.3)),
              altura > 0.5 ? PAL.rocaS : PAL.negro);
  }

  golpear(dano, dirX, opts) {
    opts = opts || {};
    if (this.invuln > 0) return false;
    this.hp -= dano;
    this.flash = 8;
    this.invuln = opts.invuln || 14;
    this.stun = opts.stun || 10;
    this.vx = dirX * (opts.empuje || 2.4);
    this.vy = -(opts.empujeY !== undefined ? opts.empujeY : 1.6);
    FX.impacto(this.x + dirX * 5, this.y - this.h * .6, dano, dirX);
    if (this.hp <= 0) { this.hp = 0; this.muerto = true; FX.explosion(this.x, this.y - this.h * .5); }
    return true;
  }
}

// ---------------------------------------------------------------------------

class Proyectil {
  constructor(o) {
    Object.assign(this, {
      x: 0, y: 0, vx: 0, vy: 0, r: 3,
      dano: 5, duenio: 'jugador', color: PAL.cyan,
      vida: 120, muerto: false
    }, o);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (--this.vida <= 0) this.muerto = true;
    if (Nivel.chocaSolido(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2)) {
      this.muerto = true;
      FX.chispas(this.x, this.y, 6, this.color);
    }
  }

  dibujar(camx, camy) {
    const px = this.x - camx, py = this.y - camy;
    Px.disco(px, py, this.r + 1, PAL.blanco);
    Px.disco(px, py, this.r, this.color);
    // Estela
    Px.rect(px - signo(this.vx) * (this.r + 3), py - 1, 3, 2, this.color);
  }
}

// ---------------------------------------------------------------------------
// Efectos. `hitstop` congela el juego unos frames al conectar un golpe:
// es LO que hace que pegar se sienta.

const FX = {
  particulas: [],
  textos: [],
  destellos: [],
  shake: 0,
  hitstop: 0,
  flashPantalla: 0,

  impacto(x, y, dano, dir) {
    if (dir) this.chispasDir(x, y, 8, PAL.blanco, dir);
    else this.chispas(x, y, 8, PAL.blanco);
    this.destellos.push({ x, y, vida: 6, vidaMax: 6, r: 9 });
    this.textos.push({
      x, y: y - 4, txt: String(Math.round(dano)), vida: 34,
      color: dano >= 30 ? PAL.rojo : PAL.dorado,
      // Los golpes grandes se escriben mas grandes
      esc: dano >= 30 ? 2 : 1
    });
    this.hitstop = Math.max(this.hitstop, 4);
    this.shake = Math.max(this.shake, 3);
  },

  golpeFuerte(x, y) {
    this.hitstop = Math.max(this.hitstop, 9);
    this.shake = Math.max(this.shake, 7);
    this.flashPantalla = 3;
    this.destellos.push({ x, y, vida: 10, vidaMax: 10, r: 16 });
  },

  // Chispas que salen hacia donde fue el golpe, en abanico.
  chispasDir(x, y, n, color, dir) {
    for (let i = 0; i < n; i++) {
      const a = rnd(-0.9, 0.9);
      const v = rnd(1.4, 3.6);
      this.particulas.push({
        x, y,
        vx: Math.cos(a) * v * dir, vy: Math.sin(a) * v,
        vida: rndInt(9, 20), color, grav: 0.06
      });
    }
  },

  chispas(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(0.6, 2.4);
      this.particulas.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.4,
        vida: rndInt(10, 22), color, grav: 0.08
      });
    }
  },

  // Estela de vuelo: particulas que salen HACIA ATRAS de donde vas, no un
  // puntito suelto flotando abajo. Cuanto mas rapido volas, mas larga.
  rastroVuelo(x, y, vx, vy, color) {
    const v = Math.hypot(vx, vy);
    const n = v > 1.2 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      // Sale del cuerpo, en direccion contraria al movimiento
      const disp = rnd(-4, 4);
      this.particulas.push({
        x: x + disp, y: y + rnd(-6, 6),
        vx: -vx * rnd(0.3, 0.6) + rnd(-0.2, 0.2),
        vy: -vy * rnd(0.3, 0.6) + rnd(-0.15, 0.15),
        vida: rndInt(8, 16), color, grav: 0
      });
    }
  },

  // Ondas de aire debajo del que flota: es lo que hace que se lea como que
  // se sostiene con Ki y no que esta pegado en el aire.
  sustentacion(x, y, color, t) {
    const fase = (t * 3) % 1;
    this.destellos.push({
      x, y: y + 2 + fase * 5, vida: 7, vidaMax: 7,
      r: 8 + fase * 7, plano: true, color
    });
  },

  // Rayas horizontales que salen del punio: venden la direccion del golpe.
  estela(x, y, dir) {
    for (let i = 0; i < 6; i++) {
      this.particulas.push({
        x: x + dir * (4 + i * 3), y: y + rnd(-5, 5),
        vx: dir * rnd(2.4, 4.6), vy: rnd(-0.25, 0.25),
        vida: rndInt(6, 11), color: PAL.blanco, grav: 0
      });
    }
  },

  // Ki que viene de todos lados y se junta en el cuerpo.
  convergencia(x, y, color, radio) {
    const a = rnd(0, Math.PI * 2);
    const r = radio + rnd(0, 14);
    this.particulas.push({
      x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * .8,
      vx: 0, vy: 0, vida: 40, color, grav: 0,
      hacia: { x: x + rnd(-3, 3), y: y + rnd(-6, 6) }
    });
  },

  // Particula de ambiente: cae despacio y se mece. No interactua con nada.
  ambiente(x, y, color, tipo) {
    const cae = tipo === 'chispas' || tipo === 'estrellas' ? -0.12 : 0.14;
    this.particulas.push({
      x, y, vx: rnd(-0.35, 0.15), vy: cae + rnd(-0.05, 0.05),
      vida: rndInt(180, 320), color, grav: 0,
      mece: tipo !== 'chispas' ? rnd(0.02, 0.06) : 0,
      fase: rnd(0, 6.28)
    });
  },

  // `fuerza` (0..1) sale de la velocidad de caida: aterrizar de un salto
  // grande levanta mucho mas polvo que bajar un escalon.
  polvo(x, y, fuerza) {
    const f = fuerza === undefined ? 0.3 : clamp(fuerza, 0, 1);
    const n = Math.round(3 + f * 12);
    for (let i = 0; i < n; i++) {
      const lado = i % 2 === 0 ? 1 : -1;
      this.particulas.push({
        x: x + rnd(-3, 3), y,
        vx: lado * rnd(0.3, 0.6 + f * 1.8), vy: rnd(-.7 - f, -.1),
        vida: rndInt(8, 16 + f * 10), color: PAL.hueso, grav: 0.03
      });
    }
    // Anillo de polvo cuando la caida fue fuerte
    if (f > 0.55) {
      this.destellos.push({ x, y: y - 2, vida: 9, vidaMax: 9, r: 6 + f * 14, plano: true });
      this.shake = Math.max(this.shake, f * 3);
    }
  },

  // Dos poderes chocando: onda de choque con los dos colores.
  choqueKi(x, y, colorA, colorB) {
    this.chispas(x, y, 10, colorA);
    this.chispas(x, y, 10, colorB);
    this.chispas(x, y, 8, PAL.blanco);
    this.destellos.push({ x, y, vida: 12, vidaMax: 12, r: 16 });
    this.destellos.push({ x, y, vida: 18, vidaMax: 18, r: 24 });
    this.shake = Math.max(this.shake, 5);
    this.hitstop = Math.max(this.hitstop, 3);
  },

  explosion(x, y) {
    Sonido.explosion();
    this.chispas(x, y, 20, PAL.dorado);
    this.chispas(x, y, 12, PAL.rojo);
    this.destellos.push({ x, y, vida: 14, vidaMax: 14, r: 20 });
    this.shake = Math.max(this.shake, 8);
    this.hitstop = Math.max(this.hitstop, 6);
  },

  texto(x, y, txt, color) {
    this.textos.push({ x, y, txt, vida: 50, color: color || PAL.blanco });
  },

  update() {
    if (this.hitstop > 0) { this.hitstop--; return; }
    this.particulas = this.particulas.filter(p => {
      // Si tiene destino, acelera hacia el: es el Ki juntandose en el cuerpo.
      if (p.hacia) {
        const dx = p.hacia.x - p.x, dy = p.hacia.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        p.vx += (dx / d) * 0.42;
        p.vy += (dy / d) * 0.42;
        if (d < 4) return false;
      } else if (p.mece) {
        // Hojas y petalos: caen meciendose en vez de en linea recta
        p.fase += p.mece;
        p.x += Math.sin(p.fase) * 0.4;
      } else {
        p.vy += p.grav;
        p.vx *= .96;
      }
      p.x += p.vx; p.y += p.vy;
      return --p.vida > 0;
    });
    this.textos = this.textos.filter(t => { t.y -= .35; return --t.vida > 0; });
    this.destellos = this.destellos.filter(d => --d.vida > 0);
    if (this.shake > 0) this.shake -= 0.6;
    if (this.shake < 0) this.shake = 0;
    if (this.flashPantalla > 0) this.flashPantalla--;
  },

  dibujar(camx, camy) {
    this.particulas.forEach(p => Px.punto(p.x - camx, p.y - camy, p.color));
    this.destellos.forEach(d => {
      const t = d.vida / d.vidaMax;
      const r = Math.round(d.r * (1 - t) + 2);
      if (d.plano) {
        Px.elipse(d.x - camx, d.y - camy, r, Math.max(1, r * 0.25), d.color || PAL.hueso);
        return;
      }
      Px.aro(d.x - camx, d.y - camy, r, PAL.blanco);
      if (t > .5) Px.aro(d.x - camx, d.y - camy, Math.max(1, r - 3), PAL.dorado);
    });
    this.textos.forEach(t => {
      if (t.esc === 2) {
        // Numero grande: se dibuja 4 veces desplazado, engorda el trazo
        [[0,0],[1,0],[0,1],[1,1]].forEach(o => {
          Texto.dibujar(t.txt, t.x - camx + o[0], t.y - camy + o[1], t.color, { centro: true });
        });
      } else {
        Texto.dibujar(t.txt, t.x - camx, t.y - camy, t.color, { centro: true });
      }
    });
  },

  limpiar() {
    this.particulas = []; this.textos = []; this.destellos = [];
    this.shake = 0; this.hitstop = 0; this.flashPantalla = 0;
  }
};
