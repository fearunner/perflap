/* Offline-Cache mit Versionierung. Netzwerk zuerst, ohne Netz aus dem Cache. Neue Version wartet, bis die App "Neu laden" anbietet. */
const V = "triger-3.3.0";
const F = ["./", "index.html", "style.css", "app.js", "engine.js", "library.js", "xlsx.mini.min.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "triger.svg"];
self.addEventListener("install", e => e.waitUntil(caches.open(V).then(c => c.addAll(F))));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener("message", e => { if (e.data === "skip") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(cache => fetch(e.request).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; })
    .catch(() => cache.match(e.request, { ignoreSearch: true }).then(r => r || cache.match("index.html")))));
});
