// Finds a map position for AllTrails trails that have no OpenStreetMap line, by looking their names up in
// OpenStreetMap's place search (Nominatim) inside the trail's area. Writes osm/atpins.json:
// { "<AllTrails id>": [lat, lon, how, matched name] }, how = "name" (the trail or its destination) or "place" (its park/area).
import fs from "node:fs";
const W = ms => new Promise(r => setTimeout(r, ms));
const AT = JSON.parse(fs.readFileSync("alltrails.json", "utf8"));
const old = fs.existsSync("osm/atpins.json") ? JSON.parse(fs.readFileSync("osm/atpins.json", "utf8")) : {};
const out = {};
async function look(q, [s, w, n, e]) {
  await W(1100); // Nominatim allows one request a second
  const u = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&bounded=1&viewbox=" + [w, n, e, s].join(",") + "&q=" + encodeURIComponent(q);
  try { const r = await fetch(u, { headers: { "User-Agent": "Switchback trail map (github.com/jixter86/Switchback)" } }); if (!r.ok) { console.log(q, r.status); return null; }
    const j = await r.json(); return j[0] || null; } catch (e) { console.log(q, e.message); return null; } }
const clean = s => s.replace(/\s*\([^)]*\)/g, "").trim();
for (const a of AT.areas) {
  const areaWord = a.name.split(",")[0].replace(/\s*\(.*\)/, "").toLowerCase();
  for (const x of a.trails) {
    if (x.geo) continue;
    if (old[x.id]) { out[x.id] = old[x.id]; continue; }
    const n = clean(x.n), parts = n.split(/\s+(?:via|to|from|and)\s+|\s*[:\-–]\s+/i).map(clean).filter(p => p.length > 3);
    const tries = [[n, "name"], ...parts.filter(p => p !== n).map(p => [p, "name"])];
    if (x.loc && !/^(maui|oahu|hawaii|honolulu|north bend)$/i.test(x.loc) && x.loc.toLowerCase() !== areaWord) tries.push([x.loc, "place"]);
    let hit = null;
    for (const [q, how] of tries) { const r = await look(q, a.bbox); if (r) { hit = [+(+r.lat).toFixed(5), +(+r.lon).toFixed(5), how, r.name || r.display_name.split(",")[0]]; break; } }
    console.log(a.name, "|", x.n, "->", hit ? hit.join(" ") : "none");
    if (hit) out[x.id] = hit;
  } }
fs.writeFileSync("osm/atpins.json", JSON.stringify(out));
console.log("placed", Object.keys(out).length);
