// Service worker: app shell en caché y datos con red primero (caché si no hay conexión).
const SHELL = 'briefing-shell-v1.0.0';
const DATA = 'briefing-data';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith('briefing-shell-') && k !== SHELL).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.includes('/data/')) {
    const key = url.origin + url.pathname; // sin ?t= para guardar una sola copia
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(DATA).then(c => c.put(key, copy)); }
        return r;
      }).catch(() => caches.open(DATA).then(c => c.match(key)).then(r => r || Response.error()))
    );
    return;
  }
  // app shell: red primero para recibir mejoras, caché si no hay conexión
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(SHELL).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
