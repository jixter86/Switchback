// Switchback service worker: keeps the app shell and saved map tiles available offline.
const SHELL="sb-shell-v1", TILES="sb-tiles";
const TILE_HOSTS=/(tile\.opentopomap\.org|tile\.openstreetmap\.org|server\.arcgisonline\.com|tile\.waymarkedtrails\.org)$/;
self.addEventListener("install", e=>{ e.waitUntil(caches.open(SHELL).then(c=>c.add("./")).catch(()=>{})); self.skipWaiting(); });
self.addEventListener("activate", e=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", e=>{
  const req=e.request; if (req.method!=="GET") return;
  const url=new URL(req.url);
  if (url.origin===location.origin){ // app shell: network first, cache fallback
    e.respondWith(fetch(req).then(r=>{ if (r.ok){ const c=r.clone(); caches.open(SHELL).then(x=>x.put(req,c)); } return r; })
      .catch(()=>caches.match(req).then(r=>r||caches.match("./"))));
    return;
  }
  if (TILE_HOSTS.test(url.hostname)){ // map tiles: use a saved copy when there is one
    e.respondWith(caches.open(TILES).then(c=>c.match(req.url)).then(r=>r||fetch(req)));
  }
});
