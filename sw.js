/* Offline-Cache mit Versionierung. Netzwerk zuerst (immer beim Server nachfragen, kein veralteter Browser-Cache), ohne Netz aus dem Cache. Neue Versionen übernehmen sofort (ab 3.4). */
const V = "triger-3.4.0";
const F = ["./", "index.html", "style.css", "app.js", "engine.js", "library.js", "xlsx.mini.min.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "triger.svg"];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(F.map(u => new Request(u, { cache: "reload" }))))); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener("message", e => { if (e.data === "skip") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(cache => fetch(e.request, { cache: "no-cache" }).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; })
    .catch(() => cache.match(e.request, { ignoreSearch: true }).then(r => r || cache.match("index.html")))));
});
