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
  "Mes 7 · Yom Kipur / Sukot",
  "Mes 8",
  "Mes 9",
  "Mes 10",
  "Mes 11",
  "Mes 12 · Cosecha",
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
