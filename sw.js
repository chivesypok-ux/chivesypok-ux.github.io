// Офлайн-кэш: приложение целиком кэшируется при первом открытии.
// Чтобы выпустить новую версию, увеличьте число в VERSION.
const VERSION = 'games-v6';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// кэш сначала, в фоне обновляем (новая версия подхватится при следующем открытии)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { net.catch(() => {}); return hit; }
    const r = await net; if (r) return r;
    if (req.mode === 'navigate') return (await c.match('index.html')) || new Response('Нет сети', { status: 503 });
    return new Response('', { status: 504 });
  }));
});
