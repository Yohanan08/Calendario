/* ---------------------------------------------------------------------
   INTERFAZ — Calendario del Eterno (app móvil / PWA)
--------------------------------------------------------------------- */
document.getElementById("logoHeader").src = LOGO_B64;
document.getElementById("logoFooter").src = LOGO_B64;

const HOY = new Date();
// Año gregoriano "ancla" con el que se calcula el año bíblico que contiene hoy,
// si hoy ya pasó el inicio de año de ESTE año gregoriano, seguimos en ese año bíblico;
// si no, el año bíblico vigente empezó el año gregoriano anterior.
function anioBiblicoVigente() {
  const inicioEste = inicioAnoBiblico(HOY.getUTCFullYear());
  if (HOY >= inicioEste) return HOY.getUTCFullYear();
  return HOY.getUTCFullYear() - 1;
}

const estado = {
  anio: anioBiblicoVigente(),
  dias: null,
  mes: 1,
  vista: "mes",
};

function cargarAno(anio) {
  estado.anio = anio;
  estado.dias = construirAno(anio);
  // situar el mes actual en el mes que contiene hoy, si el año elegido es el vigente
  const inicioA = estado.dias[0].fechaGregoriana;
  const finA = estado.dias[estado.dias.length - 1].fechaGregoriana;
  if (HOY >= inicioA && HOY <= finA) {
    const hoyEnDias = estado.dias.find(d =>
      d.fechaGregoriana.getUTCFullYear() === HOY.getUTCFullYear() &&
      d.fechaGregoriana.getUTCMonth() === HOY.getUTCMonth() &&
      d.fechaGregoriana.getUTCDate() === HOY.getUTCDate());
    estado.mes = hoyEnDias ? hoyEnDias.mes : 1;
  } else {
    estado.mes = 1;
  }
}
cargarAno(estado.anio);

function opcionesAnio() {
  const base = anioBiblicoVigente();
  const opciones = [];
  for (let a = base - 1; a <= base + 5; a++) {
    const ini = inicioAnoBiblico(a);
    const fin = new Date(ini.getTime());
    fin.setUTCDate(fin.getUTCDate() + 363);
    opciones.push({ anio: a, etiqueta: `${a} — ${a + 1}  (${fechaCorta(ini)} a ${fechaCorta(fin)})` });
  }
  return opciones;
}

function cambiarTab(tab) {
  estado.vista = tab;
  document.querySelectorAll("nav.tabs button").forEach(b => {
    b.classList.toggle("activo", b.dataset.tab === tab);
  });
  render();
}
document.querySelectorAll("nav.tabs button").forEach(b => {
  b.addEventListener("click", () => cambiarTab(b.dataset.tab));
});

document.getElementById("btnPDF").addEventListener("click", () => {
  mostrarToast("Generando PDF…");
  setTimeout(generarPDF, 60);
});

function mostrarToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// ------------------------------------------------------------------
// RENDER
// ------------------------------------------------------------------
function render() {
  const main = document.getElementById("main");
  main.innerHTML = "";
  if (estado.vista === "mes") main.appendChild(vistaMes());
  else if (estado.vista === "resumen") main.appendChild(vistaResumen());
  else if (estado.vista === "advertencia") main.appendChild(vistaAdvertencia());
  else if (estado.vista === "fuentes") main.appendChild(vistaFuentes());
}

function selectorAnioEl() {
  const div = document.createElement("div");
  div.className = "selector-anio";
  const sel = document.createElement("select");
  opcionesAnio().forEach(o => {
    const opt = document.createElement("option");
    opt.value = o.anio;
    opt.textContent = o.etiqueta;
    if (o.anio === estado.anio) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener("change", () => {
    cargarAno(parseInt(sel.value, 10));
    render();
  });
  div.appendChild(sel);
  return div;
}

function vistaMes() {
  const wrap = document.createElement("div");
  wrap.appendChild(selectorAnioEl());

  const card = document.createElement("div");
  card.className = "card";

  const diasMes = estado.dias.filter(d => d.mes === estado.mes);
  const primero = diasMes[0], ultimo = diasMes[diasMes.length - 1];

  const nav = document.createElement("div");
  nav.className = "nav-mes";
  const btnPrev = document.createElement("button");
  btnPrev.textContent = "‹";
  btnPrev.addEventListener("click", () => {
    estado.mes = estado.mes === 1 ? 12 : estado.mes - 1;
    render();
  });
  const btnNext = document.createElement("button");
  btnNext.textContent = "›";
  btnNext.addEventListener("click", () => {
    estado.mes = estado.mes === 12 ? 1 : estado.mes + 1;
    render();
  });
  const titulo = document.createElement("div");
  titulo.className = "titulo-mes";
  titulo.innerHTML = `<h2>${NOMBRES_MESES_BIBLICOS[estado.mes - 1]}</h2>
    <span>${primero.estacion} · ${fechaCorta(primero.fechaGregoriana)} – ${fechaCorta(ultimo.fechaGregoriana)}</span>`;
  nav.appendChild(btnPrev); nav.appendChild(titulo); nav.appendChild(btnNext);
  card.appendChild(nav);

  const grid = document.createElement("div");
  grid.className = "grid7";
  NOMBRES_DIAS_ABREV.forEach(n => {
    const c = document.createElement("div");
    c.className = "cab"; c.textContent = n;
    grid.appendChild(c);
  });
  for (let i = 0; i < primero.diaSemanaIdx; i++) {
    const vac = document.createElement("div");
    vac.className = "dia vacio";
    grid.appendChild(vac);
  }
  diasMes.forEach(d => {
    const el = document.createElement("div");
    el.className = "dia" + (d.esShabat ? " shabat" : "") + (d.eventos.length ? " festivo" : "");
    let html = `<span class="num">${d.diaDelMes}</span>`;
    html += `<span class="greg">${fechaCorta(d.fechaGregoriana)}</span>`;
    html += `<span class="heb">${d.fechaHebreaTexto.split(" ").slice(0, 3).join(" ")}</span>`;
    if (d.eventos.length) {
      let nombre = d.eventos[0];
      if (nombre.length > 26) nombre = nombre.slice(0, 24) + "…";
      html += `<span class="evt">${nombre}</span>`;
    }
    el.innerHTML = html;
    grid.appendChild(el);
  });
  card.appendChild(grid);
  wrap.appendChild(card);

  // eventos del mes
  const eventosMes = diasMes.filter(d => d.eventos.length);
  if (eventosMes.length) {
    const card2 = document.createElement("div");
    card2.className = "card";
    card2.innerHTML = `<h3 class="titulo-seccion">Días señalados de este mes</h3>`;
    const lista = document.createElement("div");
    lista.className = "lista-eventos";
    eventosMes.forEach(d => {
      const row = document.createElement("div");
      row.className = "evento-row";
      row.innerHTML = `<div class="fecha">${d.diaDelMes}</div>
        <div class="detalle">
          <div class="nombre">${d.eventos.join(" / ")}</div>
          <div class="sub">${NOMBRES_DIAS_BIBLICO[d.diaSemanaIdx]} · Romano: ${fechaCorta(d.fechaGregoriana)} · Hillel: ${d.fechaHebreaTexto}</div>
        </div>`;
      lista.appendChild(row);
    });
    card2.appendChild(lista);
    wrap.appendChild(card2);
  }
  return wrap;
}

function vistaResumen() {
  const wrap = document.createElement("div");
  wrap.appendChild(selectorAnioEl());

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h3 class="titulo-seccion">Estaciones</h3>`;
  const tabla = document.createElement("table");
  tabla.className = "tabla-estaciones";
  tabla.innerHTML = `<tr><th>Estación</th><th>Meses</th><th>Días</th></tr>` +
    ESTACIONES.map((e, i) => `<tr><td>${e}</td><td>Mes ${i * 3 + 1}, ${i * 3 + 2}, ${i * 3 + 3}</td><td>91 (30+30+31)</td></tr>`).join("");
  card.appendChild(tabla);
  card.innerHTML += `<p class="texto">Los 4 Rosh Hodeshim (Memorial de Noé) marcan el inicio de cada estación
    y caen siempre en <b>miércoles</b>: 1° del mes 1, 1° del mes 4, 1° del mes 7 y 1° del mes 10.</p>`;
  wrap.appendChild(card);

  const card2 = document.createElement("div");
  card2.className = "card";
  card2.innerHTML = `<h3 class="titulo-seccion">Fiestas y días señalados del año</h3>`;
  const lista = document.createElement("div");
  lista.className = "lista-eventos";
  resumenMoedim(estado.dias).forEach(d => {
    const row = document.createElement("div");
    row.className = "evento-row";
    row.innerHTML = `<div class="fecha">M${d.mes}·${d.diaDelMes}</div>
      <div class="detalle">
        <div class="nombre">${d.eventos.join(" / ")}</div>
        <div class="sub">${NOMBRES_DIAS_BIBLICO[d.diaSemanaIdx]} · Romano: ${fechaCorta(d.fechaGregoriana)} · Hillel: ${d.fechaHebreaTexto}</div>
      </div>`;
    lista.appendChild(row);
  });
  card2.appendChild(lista);
  wrap.appendChild(card2);
  return wrap;
}

function vistaAdvertencia() {
  const wrap = document.createElement("div");
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h3 class="titulo-seccion">Fundamento del calendario</h3>
    <p class="texto">Este calendario sigue el Calendario de Adonái descrito en Bereshit-Génesis, el Libro
    de Enoc, el Libro de los Jubileos y el Rollo del Templo, tal como lo conservaron los judíos de Qumrán
    (esenios). Es un calendario <b>solar</b>, no lunar: el sol —no la luna— marca el comienzo del año, de
    los meses y de las estaciones. El primer día del primer mes (Aviv) cae siempre en <b>miércoles</b>,
    el día en que fueron creados el sol, la luna y las estrellas (Bereshit-Génesis 1:14-19), inmediatamente
    después de que el sol entra por la "Gran Puerta" (el equinoccio de primavera). Por ser un año de 364
    días exactos (52 semanas), ninguna Fiesta de Adonái cae jamás en Shabat, y cada Fiesta cae, año tras
    año, en el mismo día bíblico y en el mismo día de la semana.</p>
    <div class="advertencia-box">
      <h4>ADVERTENCIA — Jubileos 6:28-33</h4>
      <p>Adonái ordenó a los hijos de Israel guardar los años conforme a esta cuenta de <b>364 días</b>,
      sin cambiar sus tiempos, sus días ni sus fiestas. Advierte que quienes lo descuiden "se olvidarán
      de las cabezas de los meses, las estaciones y los Shabatot", confundirán "el día del testimonio"
      con un día detestable y una fiesta con un día inmundo, guiándose en cambio por observaciones de la
      luna que se adelanta unos 10 días cada año respecto al sol. La instrucción es clara: guardar
      fielmente los 364 días, sin añadir ni quitar, "porque después de tu muerte tus hijos [les]
      molestarán... y por eso les irá mal."</p>
    </div>
    <p class="texto" style="margin-top:10px;">Nota de referencia: junto a cada fecha bíblica se indica su
    equivalente en el calendario civil / romano (gregoriano) y en el calendario hebreo rabínico actual
    (Hillel II), únicamente como referencia de ubicación en el tiempo — no como el calendario a seguir
    para las Fiestas.</p>
  `;
  wrap.appendChild(card);
  return wrap;
}

function vistaFuentes() {
  const wrap = document.createElement("div");
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h3 class="titulo-seccion">Fuentes y material de estudio</h3>
    <p class="texto">Basado en «Estudio con respecto al Calendario del Eterno», Ministerio Yeshúa —
    La Torá Viviente.</p>
    <ul class="fuentes">
      <li>Torá / Bereshit-Génesis (Septuaginta y Texto Masorético)</li>
      <li>Libro de Enoc (texto etíope), caps. 72 y 81</li>
      <li>Libro de los Jubileos, caps. 1, 2, 6, 14, 15, 16, 22, 28, 29, 44</li>
      <li>Rollo del Templo y Miqsat Ma'ase HaTorá (manuscritos de Qumrán)</li>
      <li>Vaicra-Levítico 23; Bamidbar-Números 9 y 28; Devarim-Deuteronomio 16</li>
      <li>Evangelios de Matityah-Mateo, Markos-Marcos, Hilel-Lucas y Yojanan-Juan</li>
      <li>Nehemías 10 y 13; Ezequiel 46; Amós 8; Zacarías 7; 2 Crónicas 31</li>
    </ul>
    <p class="texto">Am Israel Jai — Editor: Yohanan Ben Israel<br>Contacto: yohanan082706@gmail.com</p>
    <div class="instalar-box">
      <b>Cómo instalar esta app en tu celular:</b><br>
      Android (Chrome): menú ⋮ → "Añadir a pantalla de inicio".<br>
      iPhone (Safari): botón compartir ⬆ → "Añadir a pantalla de inicio".<br>
      Así queda como un ícono más en tu teléfono, funciona sin conexión y puedes generar el PDF
      mensual en cualquier momento.
    </div>
  `;
  wrap.appendChild(card);
  return wrap;
}

// ------------------------------------------------------------------
// EXPORTAR A PDF (jsPDF) — cubre portada, resumen y las 12 páginas mensuales
// ------------------------------------------------------------------
function generarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const NAVY = [11, 26, 48], GOLD = [191, 161, 95], GOLDLIGHT = [233, 223, 200], ROJO = [122, 31, 31];
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  function marco(tituloDerecha) {
    doc.setFillColor(...NAVY); doc.rect(0, 0, W, 32, "F");
    doc.setTextColor(...GOLD); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text("YESHÚA — LA TORÁ VIVIENTE", 20, 20);
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(tituloDerecha || "Calendario del Eterno · 364 días", W - 20, 20, { align: "right" });

    doc.setFillColor(...NAVY); doc.rect(0, H - 34, W, 34, "F");
    try { doc.addImage(LOGO_B64, "PNG", W / 2 - 70, H - 27, 140, 140 * (171 / 1280)); } catch (e) {}
    doc.setTextColor(...GOLD); doc.setFontSize(6.5);
    doc.text("bibliatoraviviente@gmail.com", W / 2, H - 8, { align: "center" });
  }

  function nuevaPagina(titulo) { doc.addPage(); marco(titulo); }

  // ---- Portada ----
  marco();
  let y = 70;
  try { doc.addImage(LOGO_B64, "PNG", W / 2 - 110, y, 220, 220 * (171 / 1280)); y += 220 * (171 / 1280) + 20; } catch (e) { y += 20; }
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(24);
  doc.text("CALENDARIO DEL ETERNO", W / 2, y, { align: "center" }); y += 20;
  doc.setTextColor(...GOLD); doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  doc.text("Año bíblico de 364 días · según Génesis, Enoc, Jubileos y el Rollo del Templo", W / 2, y, { align: "center" });
  y += 26;

  const dias = estado.dias;
  const inicio = dias[0].fechaGregoriana, fin = dias[dias.length - 1].fechaGregoriana;
  const eq = equinoccioPrimavera(estado.anio);
  const filasInfo = [
    ["Equinoccio de primavera (Gran Puerta)", fechaLarga(eq)],
    ["Día 1 / Mes 1 (Aviv) — miércoles", fechaLarga(inicio)],
    ["Último día del año (Mes 12, día 31)", fechaLarga(fin)],
    ["Duración", "364 días · 52 semanas exactas · 4 estaciones"],
  ];
  doc.setFontSize(9.5);
  filasInfo.forEach(([a, b]) => {
    doc.setFillColor(...GOLDLIGHT); doc.rect(40, y, 260, 22, "F");
    doc.setDrawColor(...GOLD); doc.rect(40, y, 260, 22); doc.rect(300, y, 232, 22);
    doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold");
    doc.text(a, 46, y + 14, { maxWidth: 250 });
    doc.setFont("helvetica", "normal"); doc.text(b, 306, y + 14);
    y += 22;
  });
  y += 18;
  doc.setTextColor(40, 40, 40); doc.setFont("helvetica", "normal"); doc.setFontSize(9.3);
  const introTxt = "Calendario solar (no lunar) de Adonai: el sol marca el inicio del año, los meses y las " +
    "estaciones. El primer día del primer mes (Aviv) cae siempre en miércoles, inmediatamente después del " +
    "paso del sol por la \"Gran Puerta\" (equinoccio de primavera). Al ser un año de 364 días exactos (52 " +
    "semanas), ninguna Fiesta cae jamás en Shabat, y cada Fiesta cae siempre en el mismo día de la semana.";
  const introLines = doc.splitTextToSize(introTxt, W - 80);
  doc.text(introLines, 40, y); y += introLines.length * 12 + 14;

  doc.setTextColor(...ROJO); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
  doc.text("ADVERTENCIA — Jubileos 6:28-33", 40, y); y += 14;
  doc.setTextColor(70, 30, 30); doc.setFont("helvetica", "italic"); doc.setFontSize(8.6);
  const advTxt = "Adonai ordeno guardar los anios conforme a esta cuenta de 364 dias, sin cambiar tiempos, " +
    "dias ni fiestas. Quienes lo descuiden olvidaran las cabezas de los meses, las estaciones y los " +
    "Shabatot, y confundiran el dia santo con un dia inmundo, guiandose por la luna que se adelanta unos " +
    "10 dias cada anio. La instruccion es guardar fielmente los 364 dias, sin anadir ni quitar.";
  const advLines = doc.splitTextToSize(advTxt, W - 80);
  doc.text(advLines, 40, y);

  // ---- Resumen: tabla de moedim ----
  nuevaPagina();
  y = 55;
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("Fiestas y Días Señalados del Año", 40, y); y += 18;
  const cols = [40, 250, 330, 410, 500];
  const encab = ["Fiesta / Día", "Mes-Día", "Día semana", "Fecha romana", "Fecha hebrea"];
  function filaEncabezado() {
    doc.setFillColor(...NAVY); doc.rect(40, y, W - 80, 16, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(7.6);
    encab.forEach((t, i) => doc.text(t, cols[i], y + 11));
    y += 16;
  }
  filaEncabezado();
  let filaPar = false;
  resumenMoedim(dias).forEach(d => {
    if (y > H - 60) { nuevaPagina(); y = 55; filaEncabezado(); }
    doc.setFillColor(filaPar ? 255 : 233, filaPar ? 255 : 223, filaPar ? 255 : 200);
    doc.rect(40, y, W - 80, 15, "F");
    doc.setDrawColor(...GOLD); doc.rect(40, y, W - 80, 15);
    doc.setTextColor(40, 40, 40); doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    let nombre = d.eventos.join(" / ");
    if (nombre.length > 42) nombre = nombre.slice(0, 40) + "…";
    doc.text(nombre, cols[0], y + 10);
    doc.text(`M${d.mes}-${d.diaDelMes}`, cols[1], y + 10);
    doc.text(NOMBRES_DIAS_BIBLICO[d.diaSemanaIdx], cols[2], y + 10);
    doc.text(fechaCorta(d.fechaGregoriana), cols[3], y + 10);
    doc.text(d.fechaHebreaTexto, cols[4], y + 10, { maxWidth: 90 });
    y += 15;
    filaPar = !filaPar;
  });

  // ---- 12 páginas mensuales ----
  for (let mesIdx = 1; mesIdx <= 12; mesIdx++) {
    nuevaPagina();
    const diasMes = dias.filter(d => d.mes === mesIdx);
    const primero = diasMes[0], ultimo = diasMes[diasMes.length - 1];
    y = 55;
    doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(17);
    doc.text(NOMBRES_MESES_BIBLICOS[mesIdx - 1], W / 2, y, { align: "center" }); y += 16;
    doc.setTextColor(...GOLD); doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
    doc.text(`${primero.estacion} · ${fechaLarga(primero.fechaGregoriana)} — ${fechaLarga(ultimo.fechaGregoriana)}`,
      W / 2, y, { align: "center" }); y += 18;

    const colW = (W - 80) / 7;
    const rowH = 48;
    doc.setFillColor(...NAVY); doc.rect(40, y, W - 80, 16, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
    NOMBRES_DIAS_ABREV.forEach((n, i) => doc.text(n, 40 + i * colW + colW / 2, y + 11, { align: "center" }));
    y += 16;

    let col = primero.diaSemanaIdx;
    let x = 40 + col * colW;
    // celdas vacías iniciales
    for (let i = 0; i < col; i++) {
      doc.setDrawColor(...GOLD); doc.rect(40 + i * colW, y, colW, rowH);
    }
    diasMes.forEach(d => {
      const cx = 40 + col * colW;
      doc.setFillColor(d.esShabat ? 233 : 255, d.esShabat ? 223 : 255, d.esShabat ? 200 : 255);
      doc.rect(cx, y, colW, rowH, "F");
      doc.setDrawColor(...GOLD); doc.rect(cx, y, colW, rowH);
      doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
      doc.text(String(d.diaDelMes), cx + 3, y + 10);
      doc.setTextColor(110, 110, 110); doc.setFont("helvetica", "normal"); doc.setFontSize(5.6);
      doc.text(fechaCorta(d.fechaGregoriana), cx + 3, y + 18);
      doc.setTextColor(140, 115, 56); doc.setFontSize(5.4);
      doc.text(d.fechaHebreaTexto.split(" ").slice(0, 2).join(" "), cx + 3, y + 25, { maxWidth: colW - 6 });
      if (d.eventos.length) {
        doc.setTextColor(...ROJO); doc.setFont("helvetica", "bold"); doc.setFontSize(5.3);
        let nombre = d.eventos[0];
        const lines = doc.splitTextToSize(nombre, colW - 6);
        doc.text(lines.slice(0, 2), cx + 3, y + 33);
      }
      col++;
      if (col === 7) { col = 0; y += rowH; }
    });
    if (col !== 0) y += rowH;
    y += 14;

    const eventosMes = diasMes.filter(d => d.eventos.length);
    if (eventosMes.length && y < H - 80) {
      doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
      doc.text("Días señalados de este mes", 40, y); y += 12;
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.3); doc.setTextColor(40, 40, 40);
      eventosMes.forEach(d => {
        if (y > H - 45) return;
        const linea = `Día ${d.diaDelMes} (${NOMBRES_DIAS_BIBLICO[d.diaSemanaIdx]}, ${fechaCorta(d.fechaGregoriana)}): ${d.eventos.join(" / ")}`;
        const lns = doc.splitTextToSize(linea, W - 80);
        doc.text(lns, 40, y);
        y += lns.length * 9 + 3;
      });
    }
  }

  // ---- Fuentes ----
  nuevaPagina();
  y = 55;
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("Fuentes y Material de Estudio", 40, y); y += 20;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(40, 40, 40);
  const fuentes = [
    "Torá / Bereshit-Génesis (Septuaginta y Texto Masorético)",
    "Libro de Enoc (texto etíope), caps. 72 y 81",
    "Libro de los Jubileos, caps. 1, 2, 6, 14, 15, 16, 22, 28, 29, 44",
    "Rollo del Templo y Miqsat Ma'ase HaTorá (manuscritos de Qumrán)",
    "Vaicra-Levítico 23; Bamidbar-Números 9 y 28; Devarim-Deuteronomio 16",
    "Evangelios de Matityah-Mateo, Markos-Marcos, Hilel-Lucas y Yojanan-Juan",
    "Nehemías 10 y 13; Ezequiel 46; Amós 8; Zacarías 7; 2 Crónicas 31",
  ];
  fuentes.forEach(f => { doc.text("• " + f, 40, y); y += 14; });
  y += 20;
  doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  doc.text("Am Israel Jai — Editor: Yohanan Ben Israel", W / 2, y, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  doc.text("yohanan082706@gmail.com", W / 2, y + 12, { align: "center" });

  doc.save(`Calendario_del_Eterno_${estado.anio}-${estado.anio + 1}.pdf`);
  mostrarToast("PDF descargado ✓");
}

render();

// registrar service worker (si el archivo se sirve desde https)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
