// Finds a map position for AllTrails trails that have no OpenStreetMap line, by looking their names up in
// OpenStreetMap's place search (Nominatim) inside the trail's area. Writes osm/atpins.json:
// { "<AllTrails id>": [lat, lon, how, matched name] }, how = "name" (the trail or its destination) or "place" (its park/area).
import fs from "node:fs";
const W = ms => new Promise(r => setTimeout(r, ms));
const AT = JSON.parse(fs.readFileSync("alltrails.json", "utf8"));
const out = {};
async function look(q, [s, w, n, e]) {
  await W(1100); // Nominatim allows one request a second
  const u = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&bounded=1&viewbox=" + [w, n, e, s].join(",") + "&q=" + encodeURIComponent(q);
  try { const r = await fetch(u, { headers: { "User-Agent": "Switchback trail map (github.com/jixter86/Switchback)" } }); if (!r.ok) { console.log(q, r.status); return null; }
    const j = await r.json(); return j.find(h => !(h.category === "highway" && !/^(path|footway|track|bridleway|steps|pedestrian)$/.test(h.type)) && h.addresstype !== "road") || null; } catch (e) { console.log(q, e.message); return null; } }
const clean = s => s.replace(/\s*[([][^)\]]*[)\]]/g, "").trim();
const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ʻ'‘’`]/g, "").toLowerCase();
const STOP = new Set(["trail", "trails", "loop", "the", "and", "to", "via", "of", "from", "beach", "park", "walk", "path", "lower", "upper", "road", "north", "south", "east", "west", "point", "falls", "bay", "valley", "ridge", "mount", "lookout"]);
const toks = s => norm(s).split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP.has(w));
// A name hit must share a distinctive word with what was searched ("Halalai'i Trail" is not "Halalai Street").
const sameName = (q, hit) => { const a = toks(q), b = new Set(toks(hit)); return a.some(w => b.has(w)); };
for (const a of AT.areas) {
  const areaWord = a.name.split(",")[0].replace(/\s*\(.*\)/, "").toLowerCase();
  for (const x of a.trails) {
    if (x.geo) continue;
    const n = clean(x.n), parts = n.split(/\s+(?:via|to|from|and)\s+|\s*[:\-–]\s+/i).map(clean).filter(p => p.length > 3);
    const tries = [[n, "name"], ...parts.filter(p => p !== n).map(p => [p, "name"])];
    for (const [q] of tries.slice()) { const q2 = norm(q).replace(/\s+trail$/, ""); if (q2 !== q.toLowerCase()) tries.push([q2, "name"]); }
    if (x.loc && !/^(maui|oahu|hawaii|honolulu|north bend)$/i.test(x.loc) && x.loc.toLowerCase() !== areaWord) tries.push([x.loc, "place"]);
    let hit = null;
    for (const [q, how] of tries) { const r = await look(q, a.bbox); if (r && (how === "place" || sameName(q, r.name || r.display_name.split(",")[0]))) { hit = [+(+r.lat).toFixed(5), +(+r.lon).toFixed(5), how, r.name || r.display_name.split(",")[0]]; break; } }
    console.log(a.name, "|", x.n, "->", hit ? hit.join(" ") : "none");
    if (hit) out[x.id] = hit;
  } }
fs.writeFileSync("osm/atpins.json", JSON.stringify(out));
console.log("placed", Object.keys(out).length);
