const CACHE = "calendario-eterno-v4";
const ARCHIVOS = [
  "./index.html",
  "./motor.js",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

// El motor del calendario también se usa aquí para calcular los avisos
try {
  importScripts("./motor.js");
} catch (e) {}

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(
        claves
          .filter((k) => k !== CACHE && k !== "avisos-enviados")
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") return;
  evento.respondWith(
    caches.match(evento.request).then((cacheado) => {
      const red = fetch(evento.request)
        .then((respuesta) => {
          if (respuesta && respuesta.status === 200) {
            const copia = respuesta.clone();
            caches.open(CACHE).then((cache) => cache.put(evento.request, copia));
          }
          return respuesta;
        })
        .catch(() => cacheado);
      return cacheado || red;
    })
  );
});

// Revisión periódica en segundo plano (Chrome Android con la app instalada)
self.addEventListener("periodicsync", (evento) => {
  if (evento.tag === "avisos-calendario" && typeof enviarAvisosPendientes === "function") {
    evento.waitUntil(enviarAvisosPendientes(self.registration));
  }
});

// Al tocar la notificación, abrir la app
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  evento.waitUntil(
    self.clients.matchAll({ type: "window" }).then((ventanas) => {
      if (ventanas.length) return ventanas[0].focus();
      return self.clients.openWindow("./index.html");
    })
  );
});
