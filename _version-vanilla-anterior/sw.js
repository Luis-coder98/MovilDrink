/* ═══════════════════════════════════════════════════════════
   MovilDrink · sw.js
   Service worker: guarda la app en caché para que abra sin
   internet. Los datos (productos, pedidos) viven en
   localStorage, no aquí.

   Al publicar cambios sube CACHE_VERSION para que los
   dispositivos descarguen la versión nueva.
   ═══════════════════════════════════════════════════════════ */

var CACHE_VERSION = 'movildrink-v1';

var ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/config.js',
  './js/store.js',
  './js/ui.js',
  './js/checkout.js',
  './js/admin.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      // addAll falla entero si un archivo falta; los agregamos uno por uno
      // para que un icono ausente no rompa la instalación.
      return Promise.all(ARCHIVOS.map(function (url) {
        return cache.add(url).catch(function (err) {
          console.warn('[sw] no se pudo cachear', url, err);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.map(function (k) {
        if (k !== CACHE_VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;

  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== location.origin) return;   // no tocamos wa.me ni nada externo

  // Navegación: intenta la red y cae al index cacheado si no hay señal.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Recursos: sirve de la caché y refresca en segundo plano.
  e.respondWith(
    caches.match(req).then(function (cacheado) {
      var red = fetch(req).then(function (resp) {
        if (resp && resp.status === 200) {
          var copia = resp.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(req, copia); });
        }
        return resp;
      }).catch(function () { return cacheado; });
      return cacheado || red;
    })
  );
});
