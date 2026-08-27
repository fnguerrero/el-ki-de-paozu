// Sistema de Ki y transformaciones.
// Este es el unico lugar donde se decide cuanto poder tenes en un momento dado.

class SistemaKi {
  constructor(actor, kiMax) {
    this.actor = actor;
    this.kiMax = kiMax;
    this.ki = kiMax;
    this.forma = 'base';
    this.kaioken = 0;            // indice dentro de KAIOKEN.niveles
    this.cargando = false;
    this.agotado = 0;            // segundos de bajon tras quedarse sin Ki
    this.tiempoEnForma = 0;
    this.aviso = null;           // texto flotante para el HUD
  }

  datos() { return TRANSFORMACIONES[this.forma]; }
  datosKaioken() { return KAIOKEN.niveles[this.kaioken]; }

  nombreEstado() {
    const f = this.datos(), k = this.datosKaioken();
    if (this.kaioken > 0) return (f.id === 'base' ? '' : f.nombre + ' + ') + k.nombre;
    return f.nombre;
  }

  // Multiplicadores combinados: forma x kaioken.
  mult() {
    const f = this.datos(), k = this.datosKaioken();
    // Los bonus de los deseos a Shenlong son permanentes y se suman encima.
    const bd = 1 + (this.actor.bonusDano || 0);
    const bv = 1 + (this.actor.bonusVel || 0);
    return {
      dano: f.dano * k.dano * bd,
      vel: f.vel * k.vel * bv,
      def: f.def,
      esquiva: f.esquivaAuto || 0
    };
  }

  drenajeTotal() { return this.datos().drenaje + this.datosKaioken().drenaje; }
  autoDanoTotal() { return this.datos().autoDano + this.datosKaioken().autoDano; }

  puedeActivar(id) {
    const f = TRANSFORMACIONES[id];
    if (!f || !f.desbloqueada) return false;
    if (id === this.forma) return false;
    if (this.agotado > 0) return false;
    return this.ki >= f.costo;
  }

  activar(id) {
    const f = TRANSFORMACIONES[id];
    if (!this.puedeActivar(id)) {
      if (f && f.desbloqueada && this.ki < f.costo) this.aviso = 'SIN KI SUFICIENTE';
      else if (f && !f.desbloqueada) this.aviso = 'NO DOMINAS ESA FORMA';
      return false;
    }
    this.ki -= f.costo;
    this.forma = id;
    this.tiempoEnForma = 0;
    if (this.actor.alTransformar) this.actor.alTransformar(id);
    return true;
  }

  revertir(porAgotamiento) {
    if (this.forma === 'base' && this.kaioken === 0) return;
    this.forma = 'base';
    this.kaioken = 0;
    Sonido.Musica.intensa = false;
    if (porAgotamiento) {
      this.agotado = 2.2;
      this.aviso = 'SIN KI!';
    }
  }

  // Kaioken cicla por los niveles desbloqueados y vuelve a 0.
  ciclarKaioken() {
    if (KAIOKEN.desbloqueadoHasta === 0) { this.aviso = 'NO CONOCES EL KAIOKEN'; return; }
    if (this.agotado > 0) return;
    let n = this.kaioken + 1;
    if (n >= KAIOKEN.niveles.length || KAIOKEN.niveles[n].n > KAIOKEN.desbloqueadoHasta) n = 0;
    this.kaioken = n;
    if (n > 0) { Sonido.transformar(n); Sonido.Musica.intensa = true; }
    this.aviso = n === 0 ? 'KAIOKEN OFF' : KAIOKEN.niveles[n].nombre + '!';
  }

  update(dt) {
    this.tiempoEnForma += dt;
    if (this.agotado > 0) {
      this.agotado -= dt;
      this.ki = Math.min(this.kiMax, this.ki + this.kiMax * .10 * dt);
      return;
    }

    const drenaje = this.drenajeTotal();
    if (drenaje > 0) {
      this.ki -= drenaje * dt;
      const dmg = this.autoDanoTotal();
      if (dmg > 0 && this.actor.hp !== undefined) {
        // El auto-dano nunca te mata: te deja al borde y te obliga a soltar la forma.
        this.actor.hp = Math.max(1, this.actor.hp - dmg * dt);
      }
      if (this.ki <= 0) { this.ki = 0; this.revertir(true); return; }
    } else {
      const regen = this.cargando
        ? this.kiMax * .42
        : this.kiMax * .035 * this.datos().regenKi;
      this.ki = Math.min(this.kiMax, this.ki + regen * dt);
    }

    // Cargar tambien sirve estando transformado: compensa parte del drenaje.
    if (this.cargando && drenaje > 0) {
      this.ki = Math.min(this.kiMax, this.ki + this.kiMax * .30 * dt);
    }
  }

  gastar(cant) {
    if (this.ki < cant) return false;
    this.ki -= cant;
    return true;
  }

  // Devuelve la lista de formas que el jugador puede elegir con las teclas 1..8.
  static formasVisibles() {
    return ORDEN_FORMAS.map(id => TRANSFORMACIONES[id]);
  }
}
