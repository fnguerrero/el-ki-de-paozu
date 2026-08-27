// Banco de pruebas: permite verificar el juego sin tocar el teclado.
//
// Existe porque un juego no se puede verificar "mirandolo": hace falta poder
// simular teclas, saltar a una saga, dejar que un bot lo juegue y despues leer
// pixeles concretos de la pantalla.
//
// Todo esto se usa desde la consola del navegador:
//   Test.humo()            -> chequeo general, devuelve la lista de errores
//   Test.saga(2)           -> arranca la saga 3 ya jugable
//   Test.jugar(6000)       -> el bot juega y devuelve como le fue
//   Test.contar('#ffb833') -> cuantos pixeles de ese color hay en pantalla

const Test = {
  // ------------------------------------------------------------- simulacion
  // Avanza n frames con esas teclas apretadas. `pres` son las que ademas
  // cuentan como "recien apretadas" en el primer frame.
  // Espera a que no quede ningun fundido en curso (el fundido congela el
  // update, asi que sin esto las pruebas cuentan frames que no pasan nada).
  esperarFundido(max) {
    let n = 0;
    while (Juego.fundido && n < (max || 60)) { this.frames(1); n++; }
    return n;
  },

  frames(n, teclas, pres) {
    const errores = [];
    for (let i = 0; i < n; i++) {
      Input._down = teclas || {};
      if (i === 0 && pres) Input._pressed = pres;
      try {
        const r = Juego.update(1 / 60);
        Juego.dibujar();
        if (r !== false) Input.endFrame();
      } catch (e) {
        errores.push('frame ' + i + ' [' + Juego.estado + ']: ' + e.message);
        break;
      }
    }
    return errores;
  },

  // Avanza frames SIN tocar el input: sirve para probar con eventos de teclado
  // de verdad (dispatchEvent), donde `frames()` pisaria lo que el navegador
  // dejo en Input._down.
  correr(n) {
    const errores = [];
    for (let i = 0; i < n; i++) {
      try {
        const r = Juego.update(1 / 60);
        Juego.dibujar();
        if (r !== false) Input.endFrame();
      } catch (e) {
        errores.push('frame ' + i + ': ' + e.message);
        break;
      }
    }
    return errores;
  },

  tecla(code, n) {
    const d = {}; d[code] = true;
    return this.frames(n || 1, d, d);
  },

  // Arranca una saga ya jugable, salteando titulo y charla.
  saga(idx) {
    Juego.empezarPartida();
    Juego.cargarSaga(idx || 0);
    Juego.estado = 'juego';
    return Juego.saga.nombre;
  },

  // Todas las formas desbloqueadas, para probar sin jugar 8 niveles.
  todoDesbloqueado() {
    ORDEN_FORMAS.forEach(id => { TRANSFORMACIONES[id].desbloqueada = true; });
    TRANSFORMACIONES.ozaru.desbloqueada = true;
    KAIOKEN.desbloqueadoHasta = 10;
    Juego.jug.ki.kiMax = 400;
    Juego.jug.ki.ki = 400;
  },

  // ------------------------------------------------------------- inspeccion
  px(x, y) {
    const d = Juego.ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
  },

  contar(hex, tol) {
    const t = tol === undefined ? 10 : tol;
    const d = Juego.ctx.getImageData(0, 0, CFG.VW, CFG.VH).data;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i] - r) <= t && Math.abs(d[i + 1] - g) <= t && Math.abs(d[i + 2] - b) <= t) n++;
    }
    return n;
  },

  // Colores distintos que aparecen en una franja: sirve para saber si algo
  // tiene textura o es un rectangulo plano.
  coloresEn(x, y, w, h) {
    const d = Juego.ctx.getImageData(x, y, w, h).data;
    const set = new Set();
    for (let i = 0; i < d.length; i += 4) {
      set.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]);
    }
    return set.size;
  },

  // Cuenta filas totalmente negras: detecta el tramado tipo rejas.
  filasNegras(x, y, w, h) {
    let n = 0;
    for (let fy = y; fy < y + h; fy++) {
      const d = Juego.ctx.getImageData(x, fy, w, 1).data;
      let todasNegras = true;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 30 || d[i + 1] > 30 || d[i + 2] > 30) { todasNegras = false; break; }
      }
      if (todasNegras) n++;
    }
    return n;
  },

  // ------------------------------------------------------------------- bot
  // Juega solo: junta esferas, pelea, carga Ki cuando le hace falta.
  jugar(maxFrames, opts) {
    const o = opts || {};
    const err = [];
    const j = Juego.jug;
    const T = CFG.TILE;
    let maxX = j.x;

    for (let i = 0; i < (maxFrames || 16000); i++) {
      const d = {}, p = {};
      let obj = null, mejor = 1e9;
      (Nivel.esferas || []).forEach(es => {
        if (es.tomada) return;
        const dx = es.x - j.x;
        if (dx < -30 || dx > 170) return;
        if (Math.abs(dx) < mejor) { mejor = Math.abs(dx); obj = es; }
      });
      const cerca = Juego.enemigos.find(e => !e.muerto &&
        Math.abs(e.x - j.x) < 32 && Math.abs(e.y - j.y) < 38);
      const lejos = Juego.enemigos.find(e => !e.muerto && e.activo &&
        Math.abs(e.x - j.x) < 150);
      const cargar = (j.ki.ki < 35 || (j.hp < j.hpMax * 0.5 && !cerca)) && j.enSuelo && !lejos;

      if (cargar) d.ShiftLeft = true;
      else if (cerca) { p.Space = true; d.Space = true; }
      else if (lejos && i % 22 === 0) { p.Enter = true; d.Enter = true; }
      else if (obj) {
        if (obj.x > j.x + 4) d.ArrowRight = true;
        else if (obj.x < j.x - 4) d.ArrowLeft = true;
        const dif = j.y - obj.y;
        if (dif > 20) {
          if (j.enSuelo) { p.ArrowUp = true; d.ArrowUp = true; }
          else if (!j.volando && j.ki.ki > 25) { p.ArrowUp = true; d.ArrowUp = true; }
          else if (j.volando) d.ArrowUp = true;
        } else if (j.volando && dif < -10) d.ArrowDown = true;
      } else {
        d.ArrowRight = true;
        const txA = Math.floor((j.x + 12) / T), ty = Math.floor(j.y / T);
        const hueco = !['#', '='].includes(Nivel.tile(txA, ty)) &&
                      !['#', '='].includes(Nivel.tile(txA, ty + 1));
        const pared = Nivel.solido(txA, ty - 1);
        if ((hueco || pared) && j.enSuelo) { p.ArrowUp = true; d.ArrowUp = true; }
        else if (!j.enSuelo && j.vy < 0) d.ArrowUp = true;
      }

      Input._down = d;
      if (Object.keys(p).length) Input._pressed = p;
      let r;
      try { r = Juego.update(1 / 60); if (!o.sinDibujar) Juego.dibujar(); }
      catch (e) { err.push('f' + i + ': ' + e.message); break; }
      if (r !== false) Input.endFrame();
      if (j.x > maxX) maxX = j.x;
      if (Juego.estado !== 'juego') break;
    }

    return {
      err,
      estado: Juego.estado,
      avance: Math.round(maxX / Nivel.ancho * 100) + '%',
      esferas: Juego.esferas + '/7',
      hp: Math.round(j.hp) + '/' + j.hpMax,
      jefe: Math.round(Juego.jefe.hp) + '/' + Juego.jefe.hpMax
    };
  },

  // ------------------------------------------------------------ capturas
  // Manda lo que hay dibujado ahora al servidor de capturas, que lo guarda
  // como PNG en .nonstop/capturas/. Sirve para mirar el juego cuando el panel
  // del navegador no esta visible.
  //
  //   python tools/servidor_capturas.py     (en otra consola)
  //   Test.capturar('charla')
  capturar(nombre) {
    const png = Juego.buffer.toDataURL('image/png');
    return fetch('http://localhost:8135/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre || 'captura', png })
    }).then(r => r.json()).catch(e => ({ ok: false, error: String(e) }));
  },

  // Dibuja una escena concreta y la captura de una.
  capturarEscena(nombre, fn) {
    fn();
    return this.capturar(nombre);
  },

  // --------------------------------------------------------------- humo
  // Chequeo general: todo lo que tiene que dibujar dibuja, todo lo que tiene
  // que sonar existe, y la campaña entera se puede recorrer.
  humo() {
    const err = [];

    ['titulo', 'intro', 'juego', 'pausa', 'gameover', 'shenlong', 'finsaga', 'final']
      .forEach(e => {
        Juego.estado = e; Juego.tEstado = 1.6;
        try { Juego.dibujar(); } catch (x) { err.push('pantalla ' + e + ': ' + x.message); }
      });
    Juego.estado = 'juego';

    Object.keys(GOKU).forEach(p => {
      try { dibujarMatriz(GOKU[p], 100, 100, 1, null); }
      catch (x) { err.push('sprite goku ' + p + ': ' + x.message); }
    });
    Object.keys(ARTE_ENEMIGOS).forEach(f => {
      Object.keys(ARTE_ENEMIGOS[f]).forEach(pose => {
        try { dibujarMatriz(ARTE_ENEMIGOS[f][pose], 100, 100, 1, null); }
        catch (x) { err.push('sprite ' + f + '.' + pose + ': ' + x.message); }
      });
    });

    Sonido.despertar();
    Object.keys(Sonido).forEach(k => {
      if (typeof Sonido[k] !== 'function') return;
      // `tono` y `ruido` son primitivas internas: necesitan varios argumentos
      // y llamarlas sueltas rompe por parametros invalidos, no por un bug.
      if (['despertar', 'apagar', 'dormir', 'alternarSilencio', 'despertarAudio',
           'tono', 'ruido', 'rafagaAire'].includes(k)) return;
      try { Sonido[k](1); } catch (x) { err.push('sonido ' + k + ': ' + x.message); }
    });

    SAGAS.forEach(s => {
      (s.charla || []).forEach((l, i) => {
        try { UI.charla(s, i, 1.5); } catch (x) { err.push('charla ' + s.id + '/' + i + ': ' + x.message); }
      });
    });

    return {
      errores: err,
      poses: Object.keys(GOKU).length,
      personajes: Object.keys(ARTE_ENEMIGOS).length,
      sagas: SAGAS.length
    };
  },

  // Recorre la campaña entera matando jefes por codigo.
  campana() {
    const err = [];
    Juego.empezarPartida();
    for (let s = 0; s < SAGAS.length; s++) {
      this.frames(40);
      let g = 0;
      while (Juego.estado === 'intro' && g < 90) { this.tecla('Enter', 1); g++; }
      this.esperarFundido();
      if (Juego.estado !== 'juego') { err.push('saga ' + s + ' no arranco: ' + Juego.estado); break; }
      Juego.jefe.hp = 0; Juego.jefe.muerto = true;
      // La saga termina 1.1s despues de que cae el jefe, no en el acto
      this.frames(90);
      this.esperarFundido();
      if (Juego.estado === 'shenlong') { this.frames(230); this.tecla('Enter', 1); }
      if (Juego.estado !== 'finsaga' && Juego.estado !== 'final') {
        err.push('saga ' + s + ': ' + Juego.estado); break;
      }
      this.frames(50); this.tecla('Enter', 1); this.esperarFundido();
    }
    return { err, estadoFinal: Juego.estado };
  }
};
