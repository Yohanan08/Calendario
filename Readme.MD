# Calendario del Eterno — 364 días
### Ministerio Yeshúa — La Torá Viviente

Aplicación web (PWA, instalable en celular) que calcula y muestra el calendario
bíblico de **364 días** descrito en Bereshit-Génesis, el Libro de Enoc, el
Libro de los Jubileos y el Rollo del Templo, tal como lo conservaron los judíos
de Qumrán (esenios). Es un calendario **solar**, no lunar.

Basada en el documento *«Estudio con respecto al Calendario del Eterno»* del
Ministerio Yeshúa — La Torá Viviente.

---

## 1. ¿Qué hace esta app?

- Calcula automáticamente, para cualquier año, el **Día 1 / Mes 1 (Aviv)**:
  el miércoles que cae sobre o inmediatamente después del equinoccio de
  primavera (el paso del sol por la "Gran Puerta", Enoc 72).
- Construye el año completo de **364 días / 52 semanas exactas**, en
  4 estaciones de 3 meses (30-30-31 días cada una).
- Marca el **Shabat** (cada 7 días, ciclo continuo, sin días sueltos).
- Marca los **4 Rosh Hodeshim** (Memorial de Noé — Jubileos 6:23-26): 1° de
  los meses 1, 4, 7 y 10, siempre en miércoles.
- Marca todas las **Fiestas de fecha fija**: Pésaj, Panes sin Levadura,
  las 4 Primicias/Shavuot (cebada, trigo/Día del Pacto, vino, aceite),
  la Ofrenda de la leña, Yom Kipur, Sukot y la Fiesta de la Cosecha.
- Muestra, junto a cada día bíblico, su equivalente en el **calendario
  romano/gregoriano** y en el **calendario hebreo rabínico actual (Hillel
  II)** — solo como referencia de ubicación en el tiempo, para que nadie
  se pierda al comparar con otros calendarios.
- Genera y descarga un **PDF completo** (portada, resumen de fiestas y las
  12 páginas mensuales) directamente desde el teléfono, sin conexión.
- Funciona **sin internet** una vez instalada (Service Worker / caché).
- **Se actualiza sola cada año**: el cálculo se rehace en vivo con la fecha
  del propio dispositivo, así que nunca queda desactualizada ni requiere
  tocar el código para pasar de un año bíblico al siguiente.

---

## 2. Estructura de archivos

```
index.html          — interfaz de la app (usa colores/logo del ministerio)
motor.js             — motor de cálculo del calendario (equinoccio, año, fiestas)
app.js                — lógica de navegación, renderizado y exportación a PDF
manifest.json        — metadatos de instalación como PWA
service-worker.js    — caché offline
icon-192.png / icon-512.png — íconos de la app
```

`motor.js` es el corazón del proyecto: si algún día se corrige o amplía una
regla del calendario, ese es el único archivo que hay que tocar.

---

## 3. Cómo desplegarla (Vercel — recomendado)

1. Sube estos archivos, tal cual, a un repositorio de GitHub (todos en la
   raíz del repo, sin carpetas intermedias).
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa ese
   repositorio.
3. No necesita build command ni framework: es HTML/JS estático. Deploy.
4. Abre la URL que te da Vercel (ej. `calendario-eterno.vercel.app`) desde
   el celular.

### Instalar en el celular (una vez desplegada)
- **Android / Chrome:** menú ⋮ → *"Añadir a pantalla de inicio"* (o aparece
  el aviso de instalar automáticamente).
- **iPhone / Safari:** botón compartir ⬆ → *"Añadir a pantalla de inicio"*.

Después de instalarla, funciona como cualquier otra app: ícono propio,
pantalla completa, y sin necesidad de internet para consultarla o generar
el PDF.

---

## 4. Cómo usarla

| Pestaña | Qué muestra |
|---|---|
| **Mes** | Cuadrícula del mes bíblico actual: día bíblico, fecha romana, fecha hebrea (Hillel) y nombre de la fiesta si aplica. Flechas ‹ › para cambiar de mes; selector arriba para cambiar de año bíblico. |
| **Resumen del año** | Las 4 estaciones y la tabla completa de todas las fiestas del año elegido. |
| **Advertencia** | El fundamento del calendario y la advertencia de Jubileos 6:28-33. |
| **Fuentes** | Bibliografía y cómo instalar la app. |

El botón **"Descargar PDF"** (fijo abajo) genera el calendario completo del
año bíblico seleccionado, listo para imprimir o compartir.

---

## 5. Fuentes utilizadas

- Torá / Bereshit-Génesis (Septuaginta y Texto Masorético)
- Libro de Enoc (texto etíope), caps. 72 y 81
- Libro de los Jubileos, caps. 1, 2, 6, 14, 15, 16, 22, 28, 29, 44
- Rollo del Templo y Miqsat Ma'ase HaTorá (manuscritos de Qumrán)
- Vaicra-Levítico 23; Bamidbar-Números 9 y 28; Devarim-Deuteronomio 16
- Evangelios de Matityah-Mateo, Markos-Marcos, Hilel-Lucas y Yojanan-Juan
- Nehemías 10 y 13; Ezequiel 46; Amós 8; Zacarías 7; 2 Crónicas 31

---

## 6. Notas técnicas

- El equinoccio de primavera se calcula con el algoritmo astronómico de
  baja precisión de Jean Meeus (*Astronomical Algorithms*, cap. 27),
  válido para los años 1000–3000 — no depende de tablas ni de internet.
- La fecha hebrea rabínica (Hillel II) se obtiene con la API nativa
  `Intl.DateTimeFormat` del navegador (calendario `hebrew`), disponible en
  Chrome, Safari y Firefox modernos. Es solo referencial.
- No se usa ninguna librería externa salvo **jsPDF** (cdnjs.cloudflare.com),
  cargada solo para generar el PDF.

---

**Am Israel Jai** — Editor: Yohanan Ben Israel