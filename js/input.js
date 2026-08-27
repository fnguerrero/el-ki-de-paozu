// Teclado. El resto del juego pregunta por ACCIONES, nunca por teclas sueltas,
// asi que cambiar un binding es cambiar una linea de este archivo.
//
// MAPA:
//   flechas      mover
//   ARRIBA       saltar; apretado de nuevo EN EL AIRE, volar
//   ABAJO        volando baja; en el piso te deja caer de una plataforma
//   ESPACIO      golpear
//   ENTER        rafaga de Ki (mantenido y soltado: Kamehameha)
//   SHIFT        cargar Ki
//   X            dash
//   1-8 / F      transformaciones y Kaioken
//   M / P        silenciar y pausa

const Input = {
  _down: {},
  _pressed: {},

  // Si el foco quedo en la barra de direcciones (pasa siempre al abrir la URL
  // y apretar Enter), las teclas no llegan nunca a la pagina y el juego parece
  // colgado. Por eso el canvas se enfoca solo y avisa hasta que lo toques.
  hayFoco: false,

  init() {
    const lienzo = document.getElementById('game');
    if (lienzo) {
      lienzo.setAttribute('tabindex', '0');
      lienzo.style.outline = 'none';
      const tomarFoco = () => {
        try { lienzo.focus({ preventScroll: true }); } catch (e) { lienzo.focus(); }
        Input.hayFoco = true;
      };
      lienzo.addEventListener('mousedown', tomarFoco);
      lienzo.addEventListener('touchstart', tomarFoco, { passive: true });
      addEventListener('click', tomarFoco);
      addEventListener('focus', () => { Input.hayFoco = true; });
      addEventListener('blur', () => { Input.hayFoco = false; Input._down = {}; });
      // Intento inicial: si el navegador lo permite, arranca ya enfocado
      setTimeout(tomarFoco, 0);
    }

    addEventListener('keydown', e => {
      Input.hayFoco = true;
      if (e.repeat) return;
      if (!Input._down[e.code]) Input._pressed[e.code] = true;
      Input._down[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.code)) {
        e.preventDefault();
      }
    });
    addEventListener('keyup', e => { Input._down[e.code] = false; });
    addEventListener('blur', () => { Input._down = {}; });
  },

  _ultimoToque: { dir: 0, frame: -99 },
  _frame: 0,
  _sprint: false,

  held(c) { return !!this._down[c]; },
  pressed(c) { return !!this._pressed[c]; },
  endFrame() {
    // Doble toque de una direccion = correr. Se corta al soltar o cambiar.
    this._frame++;
    const ejeAhora = this.ejeX();
    if (this.pressed('ArrowRight') || this.pressed('KeyD')) this._registrarToque(1);
    if (this.pressed('ArrowLeft') || this.pressed('KeyA')) this._registrarToque(-1);
    if (ejeAhora === 0 || (this._sprint && ejeAhora !== this._ultimoToque.dir)) {
      this._sprint = false;
    }
    this._pressed = {};
  },

  _registrarToque(dir) {
    const u = this._ultimoToque;
    if (u.dir === dir && this._frame - u.frame < 16) this._sprint = true;
    this._ultimoToque = { dir, frame: this._frame };
  },

  corriendo() { return this._sprint; },

  algunaTecla() { return Object.keys(this._pressed).length > 0; },

  // --- Movimiento ---
  ejeX() {
    return (this.held('ArrowRight') || this.held('KeyD') ? 1 : 0)
         - (this.held('ArrowLeft') || this.held('KeyA') ? 1 : 0);
  },
  arriba() { return this.held('ArrowUp') || this.held('KeyW'); },
  abajo()  { return this.held('ArrowDown') || this.held('KeyS'); },

  // Saltar y volar comparten la flecha de arriba: el segundo toque en el aire
  // es el que despega.
  saltarPress() { return this.pressed('ArrowUp') || this.pressed('KeyW'); },
  saltarHold()  { return this.arriba(); },

  // --- Acciones ---
  golpe()   { return this.pressed('Space'); },
  golpeHold() { return this.held('Space'); },
  // Guardia: abajo, parado en el piso. Abajo+salto sigue siendo bajar de una
  // plataforma, asi que no se pisan.
  guardia() { return this.abajo() && !this.saltarHold(); },
  kiHold()  { return this.held('Enter'); },
  cargarKi(){ return this.held('ShiftLeft') || this.held('ShiftRight'); },
  dash()    { return this.pressed('KeyX'); },
  kaioken() { return this.pressed('KeyF'); },

  silenciar() { return this.pressed('KeyM'); },
  pausa()     { return this.pressed('Escape') || this.pressed('KeyP'); },

  // En los menus confirma Enter o espacio; en partida esas teclas hacen otra cosa.
  confirmar() { return this.pressed('Enter') || this.pressed('Space'); }
};
