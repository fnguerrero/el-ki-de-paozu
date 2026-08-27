// Guardado del progreso en el navegador.
//
// Guarda lo minimo que hace falta para no tener que rejugar todo: hasta que
// saga llegaste y cuantas esferas juntaste en cada una. Las transformaciones
// no se guardan porque se deducen de las sagas superadas.
//
// Todo esta envuelto en try/catch: en una ventana privada o con las cookies
// bloqueadas, localStorage tira excepcion y el juego tiene que seguir andando
// igual, sin guardar.

const Progreso = {
  CLAVE: 'dragonball_paozu_v1',

  leer() {
    try {
      const crudo = localStorage.getItem(this.CLAVE);
      if (!crudo) return { sagas: [], esferas: {} };
      const d = JSON.parse(crudo);
      return {
        sagas: Array.isArray(d.sagas) ? d.sagas : [],
        esferas: d.esferas && typeof d.esferas === 'object' ? d.esferas : {}
      };
    } catch (e) {
      return { sagas: [], esferas: {} };
    }
  },

  escribir(datos) {
    try {
      localStorage.setItem(this.CLAVE, JSON.stringify(datos));
      return true;
    } catch (e) {
      return false;
    }
  },

  // Marca una saga como superada y guarda cuantas esferas juntaste ahi.
  guardarSaga(idx) {
    const d = this.leer();
    const id = SAGAS[idx].id;
    if (!d.sagas.includes(id)) d.sagas.push(id);
    const previas = d.esferas[id] || 0;
    d.esferas[id] = Math.max(previas, Juego.esferas);
    return this.escribir(d);
  },

  superada(idx) {
    return this.leer().sagas.includes(SAGAS[idx].id);
  },

  esferasDe(idx) {
    return this.leer().esferas[SAGAS[idx].id] || 0;
  },

  // Hasta que saga se puede elegir en el titulo: la siguiente a la ultima
  // superada, sin pasarse del final.
  sagaMaxima() {
    const d = this.leer();
    let max = 0;
    SAGAS.forEach((s, i) => {
      if (d.sagas.includes(s.id)) max = Math.max(max, i + 1);
    });
    return Math.min(max, SAGAS.length - 1);
  },

  total() {
    const d = this.leer();
    return {
      sagas: d.sagas.length,
      esferas: Object.values(d.esferas).reduce((a, b) => a + b, 0)
    };
  },

  borrar() {
    try { localStorage.removeItem(this.CLAVE); return true; }
    catch (e) { return false; }
  }
};
