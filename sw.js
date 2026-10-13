// Switchback service worker: keeps the app shell and saved map tiles available offline.
const SHELL="sb-shell-v2", TILES="sb-tiles"; // TILES must match TILE_CACHE in index.html
const TILE_HOSTS=/(tile\.opentopomap\.org|tile\.openstreetmap\.org|server\.arcgisonline\.com|tile\.waymarkedtrails\.org)$/;
self.addEventListener("install", e=>{ e.waitUntil(caches.open(SHELL).then(c=>c.addAll(["./","alltrails.json"])).catch(()=>{})); self.skipWaiting(); });
self.addEventListener("activate", e=>{ e.waitUntil(caches.keys()
  .then(ks=>Promise.all(ks.filter(k=>k.startsWith("sb-shell-") && k!==SHELL).map(k=>caches.delete(k))))
  .then(()=>self.clients.claim())); });
self.addEventListener("fetch", e=>{
  const req=e.request; if (req.method!=="GET") return;
  const url=new URL(req.url);
  if (url.origin===location.origin){
    // App shell: the network wins when it answers, so new versions arrive right away. On weak signal
    // (a trailhead with one bar) the saved copy is used after 3 s instead of waiting for the network to give up.
    const net=fetch(req).then(r=>{ if (r.ok){ const c=r.clone(); caches.open(SHELL).then(x=>x.put(req,c)); } return r; });
    const cached=()=>caches.match(req, { ignoreSearch:true }).then(r=>r||caches.match("./"));
    e.respondWith(new Promise(resolve=>{
      let done=false; const give=r=>{ if (!done && r){ done=true; resolve(r); } };
      const t=setTimeout(()=>cached().then(give), 3000);
      net.then(r=>{ clearTimeout(t); give(r); }).catch(()=>{ clearTimeout(t); cached().then(r=>{ if (r) give(r); else if (!done){ done=true; resolve(Response.error()); } }); });
    }));
    e.waitUntil(net.catch(()=>{}));
    return;
  }
  if (TILE_HOSTS.test(url.hostname)){ // map tiles: use a saved copy when there is one
    e.respondWith(caches.open(TILES).then(c=>c.match(req.url)).then(r=>r||fetch(req)));
  }
});
