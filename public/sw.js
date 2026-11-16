/* ═══════════════════════════════════════════════════════════
   MovilDrink · service worker
   Hace que la app abra sin internet.

   Vite le pone un hash al nombre de cada archivo compilado
   (index-a1b2c3.js), así que NO se puede precargar una lista fija:
   cambiaría en cada build. En vez de eso, se cachea el esqueleto y
   luego todo lo demás se guarda a medida que se pide.

   Los datos (productos, pedidos) viven en localStorage, no aquí.
   ═══════════════════════════════════════════════════════════ */

const CACHE = 'movildrink-v1'

// Sólo lo que tiene nombre estable y garantizado.
const ESQUELETO = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) =>
        // Uno por uno: si falta un icono, la instalación no se cae entera.
        Promise.all(
          ESQUELETO.map((url) =>
            cache.add(url).catch((err) => console.warn('[sw] sin cachear', url, err))
          )
        )
      )
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== location.origin) return   // no tocamos wa.me ni nada externo

  // Navegación: red primero (para recibir versiones nuevas), y si no hay
  // señal, el index guardado.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    )
    return
  }

  // El catálogo publicado va SIEMPRE a la red primero: si el vendedor
  // republica precios, servirlos viejos aunque sea una sola visita
  // significaría cobrar de menos. Sólo se cae a la caché sin internet.
  if (url.pathname.endsWith('/catalogo.json')) {
    e.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const copia = resp.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
          }
          return resp
        })
        .catch(() => caches.match(req))
    )
    return
  }

  // Resto de recursos: sirve de caché al instante y refresca por detrás.
  e.respondWith(
    caches.match(req).then((cacheado) => {
      const red = fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copia = resp.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
          }
          return resp
        })
        .catch(() => cacheado)
      return cacheado || red
    })
  )
})
