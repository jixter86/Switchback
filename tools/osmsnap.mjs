// Stores OpenStreetMap trails for every area in alltrails.json as osm/<slug>.json, so the app has
// the trails even when the public Overpass servers are busy. Run by .github/workflows/osm-snapshot.yml.
import fs from "node:fs";
const MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
const W = ms => new Promise(r => setTimeout(r, ms));
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Same query as searchArea() in index.html, over a whole area.
const query = ([s, w, n, e]) => { const bb = [s, w, n, e].join(","), gb = [s - 0.05, w - 0.05, n + 0.05, e + 0.05].join(",");
  return `[out:json][timeout:180][maxsize:536870912];
(relation["route"~"^(hiking|foot|walking)$"](${bb}););
out geom(${gb});
(way["highway"~"^(path|footway|track|bridleway)$"]["name"](${bb}););
out geom(${gb});
node["highway"="trailhead"](${bb});
out;
nwr["amenity"="parking"](${bb});
out center;`; };
async function fetchQ(q) {
  for (let round = 0; round < 6; round++) for (const u of MIRRORS) {
    try { const r = await fetch(u, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Switchback trail snapshot (github.com/jixter86/Switchback)" }, signal: AbortSignal.timeout(240000) });
      if (!r.ok) { console.log(u, r.status); continue; }
      const j = await r.json(); if (j.remark && !(j.elements || []).length) { console.log(u, j.remark); continue; }
      console.log(u, "ok", j.elements.length); return j; }
    catch (e) { console.log(u, e.message); }
    await W(5000 * (round + 1)); }
  throw new Error("every mirror failed"); }
const KEEP = /^(name|ref|route|highway|sac_scale|surface|access|foot|footway|area|motor_vehicle|motorcycle|atv|dog|wheelchair|amenity|network|operator|bicycle|mtb.*|trail_visibility|description|website|wikipedia|wikidata|roundtrip|distance|incline)$/;
const tags = t => { if (!t) return t; const o = {}; for (const k in t) if (KEEP.test(k)) o[k] = t[k]; return o; };
const pt = p => p && { lat: +p.lat.toFixed(5), lon: +p.lon.toFixed(5) };
const AT = JSON.parse(fs.readFileSync("alltrails.json", "utf8")); const index = [];
fs.mkdirSync("osm", { recursive: true });
for (const a of AT.areas) {
  const file = "osm/" + slug(a.name) + ".json";
  try { const j = await fetchQ(query(a.bbox));
    const el = j.elements.map(e => { const o = { type: e.type, id: e.id, tags: tags(e.tags) };
      if (e.lat != null) Object.assign(o, pt(e)); if (e.center) o.center = pt(e.center);
      if (e.geometry) o.geometry = e.geometry.map(pt);
      if (e.members) o.members = e.members.filter(m => m.type === "way").map(m => ({ type: "way", ref: m.ref, role: m.role, geometry: (m.geometry || []).map(pt) }));
      return o; });
    fs.writeFileSync(file, JSON.stringify({ at: new Date().toISOString().slice(0, 10), bbox: a.bbox, elements: el }));
    console.log(a.name, el.length, "elements", fs.statSync(file).size, "bytes"); }
  catch (e) { console.log(a.name, "FAILED", e.message); }
  if (fs.existsSync(file)) { const j = JSON.parse(fs.readFileSync(file, "utf8")); index.push({ name: a.name, bbox: a.bbox, file, at: j.at }); }
  await W(10000); }
fs.writeFileSync("osm/index.json", JSON.stringify(index));
