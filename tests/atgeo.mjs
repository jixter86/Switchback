// Match every AllTrails listing to OpenStreetMap geometry by name within its area; write tests/atgeo-out.json.
import fs from "fs";
const AT = JSON.parse(fs.readFileSync(process.env.SRC || "tests/at-src.json", "utf8"));
const MIRRORS = ["https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
function dp(pts, tol) { if (pts.length < 3) return pts; const k = Math.cos(pts[0][0] * Math.PI / 180) * 111195, m = 111195;
  const perp = (p, a, b) => { const ax = a[1] * k, ay = a[0] * m, bx = b[1] * k, by = b[0] * m, px = p[1] * k, py = p[0] * m, dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    if (!L) return Math.hypot(px - ax, py - ay); const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
  let md = 0, mi = 0; for (let i = 1; i < pts.length - 1; i++) { const d = perp(pts[i], pts[0], pts[pts.length - 1]); if (d > md) { md = d; mi = i; } }
  return md > tol ? dp(pts.slice(0, mi + 1), tol).slice(0, -1).concat(dp(pts.slice(mi), tol)) : [pts[0], pts[pts.length - 1]]; }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function overpass(q) {
  for (let round = 0; round < 6; round++) for (const m of MIRRORS) {
    try { const r = await fetch(m, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Switchback/1 (github.com/jixter86/Switchback)" }, signal: AbortSignal.timeout(90000) });
      if (r.ok) { const j = await r.json(); if (!j.remark || (j.elements || []).length) return j; } console.log("  mirror", m, r.status); } catch (e) { console.log("  mirror", m, e.message); }
    await sleep(3000);
  }
  throw new Error("all mirrors failed");
}
const atNorm = s => String(s).normalize("NFD").toLowerCase().replace(/\(.*?\)/g, "").replace(/[̀-ͯʻʼ‘’'.]/g, "").replace(/\b(the|trail|trailhead|loop|mount|mt)\b/g, m => m === "mount" || m === "mt" ? "mt" : "").replace(/[^a-z0-9]+/g, " ").trim();
const STOP = new Set(["trail","trails","loop","the","and","to","via","of","from","lower","upper","east","west","north","south","summit","lookout","trailhead","1","2","3"]);
const tok = s => atNorm(s).split(" ").filter(w => w && !STOP.has(w));
const words = s => atNorm(s).split(" ").filter(Boolean);
const ACCEPT = new Set([10014686, 10138885, 10006665, 10006289, 10286920, 10031590, 10003106, 10247498, 10239625, 10238916, 11501983, 10007110, 10003291, 10243411, 10239140, 10689079, 10282130, 10279004, 10253488, 10354942, 10234684, 10784502, 10016392, 10235534, 10018717]);
const out = {}, th = {};
for (const area of AT.areas) {
  const [s, w, n, e] = area.bbox; const pad = 0.03;
  const bb = [s - pad, w - pad, n + pad, e + pad].map(v => v.toFixed(4)).join(",");
  // one query per area: every named path/route; filter by name locally
  const q = `[out:json][timeout:120];(relation["route"~"^(hiking|foot|walking)$"](${bb}););out geom;(way["highway"~"^(path|footway|track|bridleway|steps)$"]["name"](${bb}););out geom;`;
  console.log("AREA", area.name);
  const j = await overpass(q);
  const tj = await overpass(`[out:json][timeout:60];node["highway"="trailhead"](${bb});out;`); th[area.name] = tj.elements.map(x => [+x.lat.toFixed(5), +x.lon.toFixed(5)]);
  const rels = j.elements.filter(x => x.type === "relation"), ways = j.elements.filter(x => x.type === "way");
  // group ways by exact name
  const byName = {}; for (const x of ways) (byName[x.tags.name] = byName[x.tags.name] || []).push(x);
  const cands = [
    ...rels.map(r => ({ o: "r" + r.id, name: r.tags.name || "", segs: (r.members || []).filter(m => m.type === "way" && m.geometry).map(m => m.geometry.filter(Boolean).map(p => [p.lat, p.lon])) })),
    ...Object.entries(byName).map(([name, ws]) => ({ o: "w" + ws.map(x => x.id).join(","), name, segs: ws.map(x => x.geometry.filter(Boolean).map(p => [p.lat, p.lon])) })),
  ].filter(c => c.segs.length);
  for (const t of area.trails) {
    const main = t.n.split(/\s+(?:via|to|from)\s+|:|\(/i)[0];
    const want = tok(t.n), mainT = tok(main);
    let best = null, bs = 0;
    for (const c of cands) { const tk = tok(c.name); if (!tk.length) continue;
      const ov = tk.filter(x => want.includes(x)).length; const mainCov = mainT.filter(x => tk.includes(x)).length / Math.max(mainT.length, 1);
      if (!ov) continue;
      const sc = ov / tk.length + ov / want.length + mainCov + (c.o[0] === "r" ? .2 : 0);
      if (sc > bs) { bs = sc; best = c; } }
    const exact = best && words(best.name).join(" ") === words(t.n).join(" ");
    const ok = best && (ACCEPT.has(t.id) || (exact && !/loop/i.test(t.n)));
    if (ok) out[t.id] = { o: best.o, s: best.segs.map(sg => dp(sg, 5).map(p => [+p[0].toFixed(5), +p[1].toFixed(5)])) };
    if (false) out[t.id] = best ? { n: t.n, osmName: best.name, o: best.o, score: +bs.toFixed(2), exact, pts: best.segs.reduce((a, s) => a + s.length, 0), segs: best.segs } : { n: t.n, none: true };
    console.log(best ? `${bs.toFixed(2)} ${exact ? "EXACT" : "     "} ${t.n}  =>  ${best.name} (${best.o.slice(0, 30)})` : `---- ${t.n}  =>  none`);
  }
}
for (const a of AT.areas) { a.th = th[a.name] || []; for (const t of a.trails) { if (out[t.id]) t.geo = out[t.id]; else delete t.geo; } }
fs.writeFileSync((process.env.OUT || "tests/alltrails-geo.json"), JSON.stringify(AT));
console.log("matched", Object.keys(out).length, "bytes", fs.statSync((process.env.OUT || "tests/alltrails-geo.json")).size);
