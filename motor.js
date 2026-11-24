/* ---------------------------------------------------------------------
   MOTOR DEL CALENDARIO DEL ETERNO (364 días)
   Puerto a JavaScript del motor Python — mismas reglas exactas:
   - Año de 364 días = 52 semanas exactas, 4 estaciones de 3 meses.
   - Meses 30-30-31 por estación.
   - Día 1 del año = miércoles sobre/después del equinoccio de primavera.
   - Shabat = cada 7 días, ciclo continuo (sin día suelto).
   - Rosh Hodeshim: 1er día de meses 1,4,7,10 (siempre miércoles).
   - Fiestas de fecha fija, según el documento fuente del ministerio.
--------------------------------------------------------------------- */

// --- 1. Equinoccio de primavera (Meeus, baja precisión, años 1000-3000) ---
const TERMINOS_PERIODICOS = [
  [485, 324.96, 1934.136],
  [203, 337.23, 32964.467],
  [199, 342.08, 20.186],
  [182, 27.85, 445267.112],
  [156, 73.14, 45036.886],
  [136, 171.52, 22518.443],
  [77, 222.54, 65928.934],
  [74, 296.72, 3034.906],
  [70, 243.58, 9037.513],
  [58, 119.81, 33718.147],
  [52, 297.17, 150.678],
  [50, 21.02, 2281.226],
  [45, 247.54, 29929.562],
  [44, 325.15, 31555.956],
  [29, 60.93, 4443.417],
  [18, 155.12, 67555.328],
  [17, 288.79, 4562.452],
  [16, 198.04, 62894.029],
  [14, 199.76, 31436.921],
  [12, 95.39, 14577.848],
  [12, 287.11, 31931.756],
  [12, 320.81, 34777.259],
  [9, 227.73, 1222.114],
  [8, 15.45, 16859.074],
];

function jdAFechaUTC(jd) {
  jd = jd + 0.5;
  const Z = Math.floor(jd);
  const F = jd - Z;
  let A;
  if (Z < 2299161) {
    A = Z;
  } else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const dia = B - D - Math.floor(30.6001 * E) + F;
  const mes = E < 14 ? E - 1 : E - 13;
  const anio = mes > 2 ? C - 4716 : C - 4715;
  // Fecha civil en UTC, sin componente horaria (solo el día calendario)
  return new Date(Date.UTC(anio, mes - 1, Math.floor(dia)));
}

function equinoccioPrimavera(anioGregoriano) {
  const Y = (anioGregoriano - 2000) / 1000.0;
  const jde0 =
    2451623.80984 +
    365242.37404 * Y +
    0.05169 * Y ** 2 -
    0.00411 * Y ** 3 -
    0.00057 * Y ** 4;
  const T = (jde0 - 2451545.0) / 36525.0;
  const W = 35999.373 * T - 2.47;
  const Wr = (W * Math.PI) / 180;
  const deltaLambda = 1 + 0.0334 * Math.cos(Wr) + 0.0007 * Math.cos(2 * Wr);
  let S = 0;
  for (const [A, B, C] of TERMINOS_PERIODICOS) {
    S += A * Math.cos(((B + C * T) * Math.PI) / 180);
  }
  const jde = jde0 + (0.00001 * S) / deltaLambda;
  return jdAFechaUTC(jde);
}

// --- 2. Inicio del año bíblico (día 1 = miércoles sobre/después del equinoccio) ---
function inicioAnoBiblico(anioGregoriano) {
  const eq = equinoccioPrimavera(anioGregoriano);
  const dow = eq.getUTCDay(); // domingo=0 ... sábado=6
  const diasHastaMiercoles = (3 - dow + 7) % 7; // miércoles=3
  const inicio = new Date(eq.getTime());
  inicio.setUTCDate(inicio.getUTCDate() + diasHastaMiercoles);
  return inicio;
}

// --- 3. Estructura del año ---
const ESTACIONES = ["Primavera", "Verano", "Otoño", "Invierno"];
const DIAS_POR_MES = [30, 30, 31, 30, 30, 31, 30, 30, 31, 30, 30, 31];
const NOMBRES_DIAS_BIBLICO = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Shabat",
];
const NOMBRES_DIAS_ABREV = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SHABAT"];
const MESES_GREGORIANOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const NOMBRES_MESES_BIBLICOS = [
  "Mes 1 · AVIV",
  "Mes 2",
  "Mes 3 · Shavuot / Pacto",
  "Mes 4",
  "Mes 5",
  "Mes 6",
  "Mes 7 · Yom Teruah/ Yom Kipur / Sukot",
  "Mes 8",
  "Mes 9 · Janucá",
  "Mes 10",
  "Mes 11",
  "Mes 12 · Purim / Cosecha",
];

function eventosFijos() {
  const ev = {};
  function agregar(mes, dia, nombre, noLaboral = true) {
    const k = mes + "-" + dia;
    if (!ev[k]) ev[k] = [];
    ev[k].push({ nombre, noLaboral });
  }
  agregar(1, 1, "Rosh Hodesh · Memorial de Noé (el arca reposa)");
  agregar(
    4,
    1,
    "Rosh Hodesh · Memorial de Noé (se cierran las fuentes del abismo)",
  );
  agregar(
    7,
    1,
    "Rosh Hodesh · Memorial de Noé (se abren las fuentes del abismo)",
  );
  agregar(7, 1, "Yom Terua · Día del Toque de Trompetas (Zicron Terua)");
  agregar(
    10,
    1,
    "Rosh Hodesh · Memorial de Noé (aparecen las cumbres de los montes)",
  );
  agregar(1, 14, "Pesaj · Cordero (al caer la noche, martes)", false);
  agregar(1, 15, "Panes sin Levadura · 1er día (Convocación Kadosh)");
  agregar(1, 16, "Panes sin Levadura");
  agregar(1, 17, "Panes sin Levadura");
  agregar(1, 18, "Panes sin Levadura · Shabat semanal");
  agregar(
    1,
    19,
    "Vikurim · Primicias de la Cebada (domingo, tras el Shabat de Matza)",
  );
  agregar(1, 20, "Panes sin Levadura");
  agregar(1, 21, "Panes sin Levadura · Último día (Convocación Kadosh)");
  agregar(3, 8, "Shavuot · Primicias del Trigo · Día del Pacto");
  agregar(4, 26, "Shavuot · Primicias del Vino");
  agregar(6, 15, "Shavuot · Primicias del Aceite");
  for (let d = 16; d <= 20; d++)
    agregar(6, d, "Ofrenda de la lena (Nehemías 10:34)", false);

  agregar(7, 10, "Yom Kipur");
  agregar(7, 15, "Sukot · 1er día (Convocación Kadosh)");
  for (let d = 16; d <= 21; d++) agregar(7, d, "Sukot", false);
  agregar(7, 22, "Sukot · 8vo día / Clausura (Convocación Kadosh)");

  // Janucá · Fiesta de la Dedicación (Yojanán 10:22) — 8 días desde el 25 del mes 9
  // El mes 9 tiene 31 días, así que el 8vo día cae el 1 del mes 10.
  for (let n = 1; n <= 8; n++) {
    const mes = n <= 7 ? 9 : 10;
    const dia = n <= 7 ? 24 + n : 1;
    const nombre =
      n === 1
        ? "Janucá · Fiesta de la Dedicación · 1ª luz"
        : `Janucá · ${n}ª luz`;
    agregar(mes, dia, nombre, false);
  }

  // Purim (Ester 9:17-21) — 14 y 15 del mes 12
  agregar(12, 14, "Purim (Ester 9)", false);
  agregar(12, 15, "Shushán Purim", false);

  agregar(12, 29, "Fiesta de la Cosecha (fin del año agrícola)");
  return ev;
}
const EVENTOS_FIJOS = eventosFijos();

function diaDelAnoDesdeMesDia(mes, dia) {
  let acumulado = 0;
  for (let m = 1; m < mes; m++) acumulado += DIAS_POR_MES[m - 1];
  return acumulado + dia;
}
function calcularRangoOmer() {
  let inicio = null,
    fin = null;
  for (const clave in EVENTOS_FIJOS) {
    const [mesStr, diaStr] = clave.split("-");
    const mes = parseInt(mesStr, 10),
      dia = parseInt(diaStr, 10);
    EVENTOS_FIJOS[clave].forEach((e) => {
      if (e.nombre.includes("Vikurim")) inicio = diaDelAnoDesdeMesDia(mes, dia);
      if (e.nombre.includes("Día del Pacto"))
        fin = diaDelAnoDesdeMesDia(mes, dia);
    });
  }
  return { inicio, fin };
}
const RANGO_OMER = calcularRangoOmer();

// Conversión a fecha hebrea (rabínica, Hillel II) vía Intl (ICU), solo referencial
function fechaHebreaTexto(fechaUTC) {
  try {
    const fmt = new Intl.DateTimeFormat("es-u-ca-hebrew", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    const partes = fmt.formatToParts(fechaUTC);
    const dia = partes.find((p) => p.type === "day")?.value || "";
    const mes = partes.find((p) => p.type === "month")?.value || "";
    const anio = partes.find((p) => p.type === "year")?.value || "";
    return `${dia} de ${mes} ${anio}`;
  } catch (e) {
    return "—";
  }
}

function construirAno(anioGregoriano) {
  const inicio = inicioAnoBiblico(anioGregoriano);
  const dias = [];
  let cursor = new Date(inicio.getTime());
  let diaDelAno = 0;
  for (let mesIdx = 1; mesIdx <= 12; mesIdx++) {
    const nDias = DIAS_POR_MES[mesIdx - 1];
    const estacion = ESTACIONES[Math.floor((mesIdx - 1) / 3)];
    for (let diaDelMes = 1; diaDelMes <= nDias; diaDelMes++) {
      diaDelAno++;
      const dow = cursor.getUTCDay(); // domingo=0..sabado=6 -> coincide con nuestro índice bíblico
      const esShabat = dow === 6;
      const clave = mesIdx + "-" + diaDelMes;
      const listaEventos = EVENTOS_FIJOS[clave] || [];
      const nombres = listaEventos.map((e) => e.nombre);
      const noLaboral = esShabat || listaEventos.some((e) => e.noLaboral);
      let omerDia = null;
      if (
        RANGO_OMER.inicio &&
        diaDelAno >= RANGO_OMER.inicio &&
        diaDelAno <= RANGO_OMER.fin
      ) {
        omerDia = diaDelAno - RANGO_OMER.inicio + 1;
      }
      dias.push({
        diaDelAno,
        mes: mesIdx,
        diaDelMes,
        diaSemanaIdx: dow,
        fechaGregoriana: new Date(cursor.getTime()),
        fechaHebreaTexto: fechaHebreaTexto(cursor),
        estacion,
        eventos: nombres,
        esShabat,
        esDiaNoLaboral: noLaboral, omerDia,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return dias;
}

function resumenMoedim(dias) {
  return dias.filter((d) => d.eventos.length > 0);
}

function fechaCorta(f) {
  const dd = String(f.getUTCDate()).padStart(2, "0");
  const mm = String(f.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${f.getUTCFullYear()}`;
}
function fechaLarga(f) {
  return `${f.getUTCDate()} de ${MESES_GREGORIANOS[f.getUTCMonth()]} de ${f.getUTCFullYear()}`;
}

// ---------------------------------------------------------------------
// 4. HORA DE JERUSALÉN, PUESTA DEL SOL Y CUENTAS REGRESIVAS
// ---------------------------------------------------------------------
const ZONA_JERUSALEN = "Asia/Jerusalem";
const LAT_JERUSALEN = 31.7683;
const LON_JERUSALEN = 35.2137;

// Partes de fecha/hora actuales en Jerusalén (sin depender de la zona del celular)
function ahoraEnJerusalen(ahora = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_JERUSALEN,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const p = {};
  fmt.formatToParts(ahora).forEach((x) => (p[x.type] = x.value));
  const anio = +p.year,
    mes = +p.month,
    dia = +p.day;
  const hora = +p.hour,
    minuto = +p.minute,
    segundo = +p.second;
  // Diferencia de Jerusalén con UTC en minutos (2 h invierno / 3 h verano)
  const comoUTC = Date.UTC(anio, mes - 1, dia, hora, minuto, segundo);
  const offsetMin = Math.round((comoUTC - ahora.getTime()) / 60000);
  return {
    anio,
    mes,
    dia,
    hora,
    minuto,
    segundo,
    offsetMin,
    fechaUTC: new Date(Date.UTC(anio, mes - 1, dia)), // fecha civil de Jerusalén
  };
}

// Puesta del sol (algoritmo NOAA simplificado), devuelve minutos UTC del día
function puestaDelSolMinutosUTC(fechaUTC, lat = LAT_JERUSALEN, lon = LON_JERUSALEN) {
  const rad = Math.PI / 180;
  const inicioAnio = Date.UTC(fechaUTC.getUTCFullYear(), 0, 1);
  const n = Math.floor((fechaUTC.getTime() - inicioAnio) / 86400000) + 1;
  const g = ((2 * Math.PI) / 365) * (n - 1 + 0.5);
  const eqTiempo =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  const cosH =
    Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) -
    Math.tan(lat * rad) * Math.tan(decl);
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) / rad;
  return 720 - 4 * (lon - H) - eqTiempo;
}

function puestaDelSolJerusalen(j) {
  const minUTC = puestaDelSolMinutosUTC(j.fechaUTC);
  const minLocal = Math.round(minUTC + j.offsetMin);
  return { hora: Math.floor(minLocal / 60), minuto: minLocal % 60, totalMin: minLocal };
}

function diasEntre(aUTC, bUTC) {
  return Math.round((bUTC.getTime() - aUTC.getTime()) / 86400000);
}

// Busca el día del calendario bíblico que corresponde a una fecha civil
function buscarDiaBiblico(fechaUTC) {
  let anio = fechaUTC.getUTCFullYear();
  if (fechaUTC < inicioAnoBiblico(anio)) anio--;
  const dias = construirAno(anio);
  const idx = diasEntre(dias[0].fechaGregoriana, fechaUTC);
  if (idx < 0 || idx >= dias.length) return null; // posible "semana intercalar" entre años
  return { anio, dia: dias[idx] };
}

// Fiestas principales para las cuentas regresivas
const FIESTAS_PRINCIPALES = [
  { mes: 1, dia: 14, nombre: "Pesaj" },
  { mes: 1, dia: 15, nombre: "Panes sin Levadura" },
  { mes: 1, dia: 19, nombre: "Bikurim · Primicias de la Cebada" },
  { mes: 3, dia: 8, nombre: "Shavuot · Día del Pacto" },
  { mes: 4, dia: 26, nombre: "Primicias del Vino" },
  { mes: 6, dia: 15, nombre: "Primicias del Aceite" },
  { mes: 7, dia: 1, nombre: "Yom Teruá" },
  { mes: 7, dia: 10, nombre: "Yom Kipur" },
  { mes: 7, dia: 15, nombre: "Sukot" },
  { mes: 9, dia: 25, nombre: "Janucá" },
  { mes: 12, dia: 14, nombre: "Purim" },
];

// Próxima ocurrencia (hoy incluido) de un mes/día bíblico, a partir de una fecha civil
function proximaOcurrencia(mes, dia, desdeUTC) {
  let anio = desdeUTC.getUTCFullYear() - 1;
  for (let i = 0; i < 3; i++, anio++) {
    const inicio = inicioAnoBiblico(anio);
    const f = new Date(inicio.getTime());
    f.setUTCDate(f.getUTCDate() + diaDelAnoDesdeMesDia(mes, dia) - 1);
    const faltan = diasEntre(desdeUTC, f);
    if (faltan >= 0) return { fecha: f, faltan, anio };
  }
  return null;
}

function cuentasRegresivas(desdeUTC) {
  return FIESTAS_PRINCIPALES.map((fz) => ({
    ...fz,
    ...proximaOcurrencia(fz.mes, fz.dia, desdeUTC),
  })).sort((a, b) => a.faltan - b.faltan);
}

// Próxima cita designada (cualquier día con evento, hoy excluido)
function proximaCitaDesignada(desdeUTC) {
  let anio = desdeUTC.getUTCFullYear() - 1;
  for (let i = 0; i < 3; i++, anio++) {
    const dias = construirAno(anio);
    for (const d of dias) {
      if (!d.eventos.length) continue;
      const faltan = diasEntre(desdeUTC, d.fechaGregoriana);
      if (faltan > 0) return { dia: d, faltan };
    }
  }
  return null;
}

function textoFaltan(n) {
  if (n === 0) return "¡Es hoy!";
  if (n === 1) return "Falta 1 día";
  return `Faltan ${n} días`;
}

// ---------------------------------------------------------------------
// 5. FICHAS DE LAS FIESTAS (explicación y versículos)
// ---------------------------------------------------------------------
// Se busca por palabra clave dentro del nombre del evento.
const FICHAS_FIESTAS = [
  {
    clave: "Pesaj",
    titulo: "Pesaj · La Pascua",
    texto:
      "Memorial de la liberación de Egipto. Al caer la tarde del día 14 del mes 1 se sacrifica el cordero. Yeshúa es nuestro Cordero de Pesaj.",
    citas: ["Éxodo 12", "Vaicra-Levítico 23:5", "1 Corintios 5:7"],
  },
  {
    clave: "Panes sin Levadura",
    titulo: "Jag HaMatzot · Panes sin Levadura",
    texto:
      "Siete días comiendo pan sin levadura, del 15 al 21 del mes 1. El primero y el último son convocación kadosh.",
    citas: ["Éxodo 12:15-20", "Vaicra-Levítico 23:6-8", "Devarim-Deuteronomio 16:3-8"],
  },
  {
    clave: "Vikurim",
    titulo: "Bikurim · Primicias de la Cebada",
    texto:
      "Se mece la gavilla de las primicias el día después del Shabat de Matzá. Aquí comienza el conteo del Omer: 50 días hasta Shavuot. Yeshúa resucitó como primicia de los que duermen.",
    citas: ["Vaicra-Levítico 23:9-14", "1 Corintios 15:20-23"],
  },
  {
    clave: "Primicias del Trigo",
    titulo: "Shavuot · Primicias del Trigo · Día del Pacto",
    texto:
      "Al terminar el conteo de siete semanas se presentan las primicias del trigo. Es el día en que se renueva el Pacto.",
    citas: ["Vaicra-Levítico 23:15-21", "Éxodo 19", "Jubileos 6:17-21", "Hechos 2:1-4"],
  },
  {
    clave: "Primicias del Vino",
    titulo: "Shavuot · Primicias del Vino",
    texto:
      "Cincuenta días después de Shavuot del trigo se presentan las primicias del vino nuevo.",
    citas: ["Rollo del Templo (11QT) 19-21"],
  },
  {
    clave: "Primicias del Aceite",
    titulo: "Shavuot · Primicias del Aceite",
    texto:
      "Cincuenta días después de las primicias del vino se presentan las primicias del aceite nuevo.",
    citas: ["Rollo del Templo (11QT) 21-22"],
  },
  {
    clave: "Ofrenda de la lena",
    titulo: "Ofrenda de la leña",
    texto:
      "Días en que las tribus traían la leña para el fuego del altar, que no debía apagarse.",
    citas: ["Nehemías 10:34", "Nehemías 13:31", "Rollo del Templo (11QT) 23-25"],
  },
  {
    clave: "Yom Terua",
    titulo: "Yom Teruá · Día del Toque de Trompetas",
    texto:
      "Día de reposo y memorial con toque de shofar, el 1 del mes 7. Comienzan los días solemnes del séptimo mes.",
    citas: ["Vaicra-Levítico 23:23-25", "Bamidbar-Números 29:1-6"],
  },
  {
    clave: "Yom Kipur",
    titulo: "Yom Kipur · Día de la Expiación",
    texto:
      "Día de ayuno y de afligir el alma, el 10 del mes 7. El Sumo Sacerdote entraba al Lugar Santísimo.",
    citas: ["Vaicra-Levítico 16", "Vaicra-Levítico 23:26-32", "Hebreos 9:11-12"],
  },
  {
    clave: "Sukot",
    titulo: "Sukot · Fiesta de los Tabernáculos",
    texto:
      "Siete días habitando en cabañas, del 15 al 21 del mes 7, y el octavo día de clausura (Sheminí Atzéret).",
    citas: ["Vaicra-Levítico 23:33-43", "Devarim-Deuteronomio 16:13-15", "Yojanán-Juan 7:37-39"],
  },
  {
    clave: "Janucá",
    titulo: "Janucá · Fiesta de la Dedicación",
    texto:
      "Ocho días de luz en memoria de la purificación y dedicación del Templo. Yeshúa estuvo en el Templo durante esta fiesta.",
    citas: ["Yojanán-Juan 10:22-23", "1 Macabeos 4:52-59"],
  },
  {
    clave: "Purim",
    titulo: "Purim",
    texto:
      "Memorial de la salvación del pueblo en los días de Ester y Mardoqueo. Se celebra con alegría, banquete y envío de porciones.",
    citas: ["Ester 9:17-32"],
  },
  {
    clave: "Memorial de Noé",
    titulo: "Rosh Hodesh · Memorial de Noé",
    texto:
      "Los cuatro días memoriales que marcan el inicio de cada estación, siempre en miércoles.",
    citas: ["Bereshit-Génesis 7:11", "Bereshit-Génesis 8:4-5", "Jubileos 6:23-29"],
  },
];

const FICHA_SHABAT = {
  titulo: "Shabat",
  texto: "El séptimo día, día de reposo santificado por Adonái desde la creación.",
  citas: ["Bereshit-Génesis 2:2-3", "Éxodo 20:8-11", "Isaías 58:13-14"],
};

function fichasDelDia(d) {
  const fichas = [];
  d.eventos.forEach((ev) => {
    const f = FICHAS_FIESTAS.find((x) => ev.includes(x.clave));
    if (f && !fichas.includes(f)) fichas.push(f);
  });
  if (d.esShabat) fichas.push(FICHA_SHABAT);
  return fichas;
}

// ---------------------------------------------------------------------
// 6. AVISOS (notificaciones) — se usan en la página y en el service worker
// ---------------------------------------------------------------------
function isoFecha(f) {
  return f.toISOString().slice(0, 10);
}

function avisosDeHoy(ahora = new Date()) {
  const j = ahoraEnJerusalen(ahora);
  const hoy = buscarDiaBiblico(j.fechaUTC);
  const manana = buscarDiaBiblico(new Date(j.fechaUTC.getTime() + 86400000));
  const iso = isoFecha(j.fechaUTC);
  const avisos = [];
  if (hoy && hoy.dia.eventos.length) {
    avisos.push({
      clave: "hoy-" + iso,
      titulo: "Hoy: " + hoy.dia.eventos.join(" / "),
      cuerpo: `Mes ${hoy.dia.mes}, día ${hoy.dia.diaDelMes} · Calendario del Eterno`,
    });
  }
  if (manana && manana.dia.eventos.length) {
    avisos.push({
      clave: "manana-" + iso,
      titulo: "Mañana: " + manana.dia.eventos.join(" / "),
      cuerpo: `Mes ${manana.dia.mes}, día ${manana.dia.diaDelMes} · Comienza hoy al ponerse el sol`,
    });
  }
  if (j.fechaUTC.getUTCDay() === 5) {
    const sol = puestaDelSolJerusalen(j);
    const hh = String(sol.hora).padStart(2, "0"),
      mm = String(sol.minuto).padStart(2, "0");
    avisos.push({
      clave: "shabat-" + iso,
      titulo: "Hoy comienza el Shabat",
      cuerpo: `Al ponerse el sol · En Jerusalén: ${hh}:${mm}. ¡Shabat Shalom!`,
    });
  }
  return avisos;
}

// Envía los avisos que todavía no se han enviado (se recuerdan en la caché)
async function enviarAvisosPendientes(registro) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const cache = await caches.open("avisos-enviados");
    for (const a of avisosDeHoy()) {
      const url = "./__aviso/" + a.clave;
      if (await cache.match(url)) continue;
      await registro.showNotification(a.titulo, {
        body: a.cuerpo,
        icon: "icon-192.png",
        badge: "icon-192.png",
        tag: a.clave,
      });
      await cache.put(url, new Response("1"));
    }
  } catch (e) {}
}
