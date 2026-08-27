// LA CAMPAÑA: la serie entera, muy resumida.
//
// La idea no es contar la historia textual sino que cada saga sea un nivel con
// su jefe, su paleta y su recompensa. Lo que hila todo son las esferas del
// dragon: hay 7 escondidas en cada nivel y juntarlas invoca a Shenlong.
//
// Cada saga define:
//   tema        colores del cielo y del terreno (para que no se repitan)
//   jefe        id en PLANTILLAS (enemy.js)
//   tropa       enemigos comunes que aparecen en ese nivel
//   desbloquea  transformacion que te deja al terminarla
//   intro       la historia, en 3 lineas
//   deseo       lo que pedis a Shenlong si juntaste las 7 esferas

const SAGAS = [
  {
    id: 'piccolo',
    nombre: 'EL DEMONIO PICCOLO',
    lugar: 'MONTANA PAOZU',
    tema: { cielo: ['#3b6ea5', '#7fb2d9', '#c9e6f0'], tierra: '#8a5a3b', tierraS: '#5d3a25', pasto: '#5aa84f', pastoS: '#3d7d3a' },
    jefe: 'piccolo',
    tropa: ['saibaman', 'soldado', 'saibaman'],
    desbloquea: 'kaioken',
    charla: [
      ['krilin', 'GOKU! SENTISTE ESE KI?'],
      ['goku', 'SI. VIENE DE LA TORRE, Y ES ENORME'],
      ['krilin', 'ES PICCOLO. BAJO A BUSCARTE'],
      ['goku', 'JE. HACE RATO QUE NO PELEO EN SERIO'],
      ['krilin', 'NO TE RIAS! ESTE TE PUEDE MATAR'],
      ['goku', 'POR ESO MISMO VOY. ESPERAME ACA']
    ],
    deseo: 'QUE MI CUERPO AGUANTE MAS CASTIGO',
    bonus: { hpMax: 40 }
  },
  {
    id: 'saiyajin',
    nombre: 'LLEGAN LOS SAIYAJIN',
    lugar: 'YERMO DEL ESTE',
    tema: { cielo: ['#5a4a72', '#8a7aa0', '#c2b4cc'], tierra: '#6b5a4a', tierraS: '#3f342a', pasto: '#7d7a52', pastoS: '#56542f' },
    jefe: 'vegeta',
    tropa: ['zarko', 'saibaman', 'nappa'],
    desbloquea: 'kaioken3',
    charla: [
      ['piccolo', 'DOS NAVES. Y NO VIENEN A SALUDAR'],
      ['goku', 'SON COMO YO... SAIYAJIN'],
      ['piccolo', 'BUSCAN LAS ESFERAS PARA VIVIR PARA SIEMPRE'],
      ['goku', 'ENTONCES HAY QUE JUNTARLAS PRIMERO'],
      ['piccolo', 'ODIO DECIRLO, PERO SOLO NO TE ALCANZA'],
      ['goku', 'ENTONCES VENI CONMIGO']
    ],
    deseo: 'QUE MI KI SE RECUPERE MAS RAPIDO',
    bonus: { kiMax: 30 }
  },
  {
    id: 'namek',
    nombre: 'EL PLANETA NAMEK',
    lugar: 'NAMEKUSEIN',
    tema: { cielo: ['#2f7a5a', '#6bbf95', '#c4ecd6'], tierra: '#5a7a4a', tierraS: '#33482b', pasto: '#7fc45a', pastoS: '#4f8a38' },
    jefe: 'freezer',
    tropa: ['soldado', 'sylph', 'velk'],
    desbloquea: 'ssj1',
    charla: [
      ['bulma', 'ESTE PLANETA TIENE SUS PROPIAS SIETE ESFERAS'],
      ['goku', 'Y FREEZER YA ESTA ACA BUSCANDOLAS'],
      ['bulma', 'EL RADAR MARCA LAS SIETE. ANDA'],
      ['goku', 'BULMA... ESTE TIPO ES DE OTRO NIVEL'],
      ['bulma', 'ENTONCES SUBI DE NIVEL VOS']
    ],
    deseo: 'QUE MIS GOLPES DUELAN MAS',
    bonus: { dano: 0.15 }
  },
  {
    id: 'androides',
    nombre: 'LOS ANDROIDES',
    lugar: 'CIUDAD DEL SUR',
    tema: { cielo: ['#4a4a6b', '#8a8aa8', '#cfcfe0'], tierra: '#6a6a72', tierraS: '#3f3f47', pasto: '#8a8a95', pastoS: '#5c5c66' },
    jefe: 'cell',
    tropa: ['a17', 'a19', 'sylph'],
    desbloquea: 'ssj2',
    charla: [
      ['trunks', 'VENGO DEL FUTURO. ESCUCHAME BIEN'],
      ['goku', 'DEL FUTURO?'],
      ['trunks', 'EN MI EPOCA LOS ANDROIDES MATARON A TODOS'],
      ['goku', 'ENTONCES LOS PARAMOS ACA'],
      ['trunks', 'HAY ALGO PEOR. ALGO QUE LOS ABSORBE'],
      ['goku', 'CELL. LO SENTI RECIEN']
    ],
    deseo: 'QUE APRENDA A MOVERME MAS RAPIDO',
    bonus: { vel: 0.12 }
  },
  {
    id: 'buu',
    nombre: 'MAJIN BUU',
    lugar: 'RUINAS DEL TEMPLO',
    tema: { cielo: ['#7a3a5a', '#c47a95', '#f0c4d6'], tierra: '#8a6a5a', tierraS: '#54402f', pasto: '#c48a9a', pastoS: '#8a5a6a' },
    jefe: 'majinbuu',
    tropa: ['babidi', 'sylph', 'velk'],
    desbloquea: 'ssj3',
    charla: [
      ['gohan', 'PAPA, UN HECHICERO DESPERTO ALGO'],
      ['goku', 'LO SIENTO. NO PARECE UN KI NORMAL'],
      ['gohan', 'BORRO UNA CIUDAD ENTERA. COMO UN JUEGO'],
      ['goku', 'ESTA VEZ NO ALCANZA CON LO QUE TENGO'],
      ['gohan', 'ENTONCES PELEAMOS LOS DOS'],
      ['goku', 'ESA ES LA ACTITUD, GOHAN']
    ],
    deseo: 'QUE VUELVAN TODOS LOS QUE BUU BORRO',
    bonus: { hpMax: 50 }
  },
  {
    id: 'gt',
    nombre: 'LAS ESFERAS OSCURAS',
    lugar: 'TIERRA DEVASTADA',
    tema: { cielo: ['#5a2a2a', '#a05a4a', '#e0a48a'], tierra: '#7a4a3a', tierraS: '#452720', pasto: '#a05a3a', pastoS: '#6b3a26' },
    jefe: 'omega',
    tropa: ['kaon', 'babidi', 'velk'],
    desbloquea: 'ssj4',
    charla: [
      ['pan', 'ABUELO! LAS ESFERAS ESTAN NEGRAS'],
      ['goku', 'TANTOS DESEOS TERMINARON ENVENENANDOLAS'],
      ['pan', 'Y DE ADENTRO SALIO UN DRAGON'],
      ['goku', 'ESE DRAGON NOS ODIA. Y TIENE RAZON'],
      ['pan', 'PODES GANARLE?'],
      ['goku', 'NO ASI. TENGO QUE DOMINAR AL MONO']
    ],
    deseo: 'QUE PUEDA CONTROLAR AL OZARU',
    bonus: { kiMax: 40 },
    // En esta saga sale la luna llena: al mirarla, Goku se transforma en Ozaru.
    lunaLlena: true
  },
  {
    id: 'super',
    nombre: 'EL TORNEO DEL PODER',
    lugar: 'EL VACIO NULO',
    tema: { cielo: ['#2a2a5a', '#5a5aa0', '#a8a8e0'], tierra: '#4a4a7a', tierraS: '#2a2a4a', pasto: '#6a6ab0', pastoS: '#42427a' },
    jefe: 'jiren',
    tropa: ['kaon', 'a17', 'velk'],
    desbloquea: 'dios',
    desbloqueaExtra: 'blue',
    charla: [
      ['vegeta', 'DOCE UNIVERSOS. UN SOLO GANADOR'],
      ['goku', 'Y EL QUE PIERDE DESAPARECE'],
      ['vegeta', 'DEL OTRO LADO ESTA JIREN. NUNCA CAYO'],
      ['goku', 'ENTONCES VA A SER UNA BUENA PELEA'],
      ['vegeta', 'NO SE TE OCURRA PERDER, KAKAROTO'],
      ['goku', 'TRANQUILO, VEGETA']
    ],
    deseo: 'QUE MI CUERPO SE MUEVA SIN PENSAR',
    bonus: { dano: 0.2 }
  },
  {
    id: 'vacio',
    nombre: 'EL CAZADOR DE MUNDOS',
    lugar: 'FILO DEL UNIVERSO',
    tema: { cielo: ['#1a1030', '#3a2450', '#6b4a80'], tierra: '#3a2a4a', tierraS: '#1f1529', pasto: '#5a3a70', pastoS: '#3a2450' },
    jefe: 'draken',
    tropa: ['hueco', 'kaon', 'sylph'],
    desbloquea: 'ui',
    // El capitulo que no esta en la serie.
    original: true,
    charla: [
      ['piccolo', 'ALGO ESTUVO MIRANDO TODAS ESAS PELEAS'],
      ['goku', 'LO SIENTO. ESTA AL BORDE DEL UNIVERSO'],
      ['piccolo', 'SE HACE LLAMAR DRAKEN. CATALOGA PLANETAS'],
      ['goku', 'Y DESPUES LOS VENDE'],
      ['piccolo', 'YA COPIO TODAS LAS TECNICAS QUE TE VIO USAR'],
      ['goku', 'TODAS NO. ME QUEDA UNA POR APRENDER']
    ],
    deseo: 'QUE EL UNIVERSO VUELVA A ESTAR ENTERO',
    bonus: { hpMax: 60, kiMax: 40 },
    final: true
  }
];

// Nombres de las 7 esferas, para el HUD y la invocacion.
// Que flota en el aire en cada saga. Es lo que hace que un nivel se sienta
// otro lugar aunque el terreno sea el mismo.
const AMBIENTE = {
  piccolo:   { tipo: 'hojas',   color: '#7fc45a', cada: 26 },
  saiyajin:  { tipo: 'polvo',   color: '#b0a074', cada: 18 },
  namek:     { tipo: 'esporas', color: '#c4ecd6', cada: 22 },
  androides: { tipo: 'chispas', color: '#cfcfe0', cada: 30 },
  buu:       { tipo: 'petalos', color: '#f0c4d6', cada: 24 },
  gt:        { tipo: 'ceniza',  color: '#a05a4a', cada: 14 },
  super:     { tipo: 'estrellas', color: '#a8a8e0', cada: 28 },
  vacio:     { tipo: 'chispas', color: '#a56ee0', cada: 20 }
};

const ESFERAS = ['1 ESTRELLA', '2 ESTRELLAS', '3 ESTRELLAS', '4 ESTRELLAS',
                 '5 ESTRELLAS', '6 ESTRELLAS', '7 ESTRELLAS'];

// Aliados que aparecen al empezar cada saga y tiran una linea. Puro cameo.
const CAMEOS = {
  piccolo:   { quien: 'KRILIN',  txt: 'GOKU, ESE KI ES ENORME. NO VAYAS SOLO' },
  saiyajin:  { quien: 'PICCOLO', txt: 'ODIO DECIRLO PERO TE VOY A AYUDAR' },
  namek:     { quien: 'BULMA',   txt: 'EL RADAR MARCA SIETE. ANDA A BUSCARLAS' },
  androides: { quien: 'TRUNKS',  txt: 'EN MI FUTURO ESTO TERMINA MUY MAL' },
  buu:       { quien: 'GOHAN',   txt: 'PAPA, ESTA VEZ PELEAMOS LOS DOS' },
  gt:        { quien: 'PAN',     txt: 'ABUELO, LAS ESFERAS ESTAN NEGRAS' },
  super:     { quien: 'VEGETA',  txt: 'NO SE TE OCURRA PERDER, KAKAROTO' },
  vacio:     { quien: 'PICCOLO', txt: 'ESTE NO PELEA POR ORGULLO. PELEA POR PLATA' }
};
