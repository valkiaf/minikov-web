// Service worker de Minikov: permite instalar el juego como app desde el navegador y que arranque sin conexión.
// La página siempre se pide a la red primero (así llega cada versión nueva); los recursos con nombre con huella
// (assets/…) se guardan la primera vez y luego salen de la caché.
const CACHE = 'minikov-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        (await caches.open(CACHE)).put(req, res.clone());
        return res;
      } catch {
        return (await caches.match(req)) ?? (await caches.match('./')) ?? Response.error();
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  })());
});
