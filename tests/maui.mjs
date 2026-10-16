// Repro: "No trails are showing up near me in Maui" (2026-10-16)
import { chromium } from "playwright";
const url = "https://jixter86.github.io/Switchback/";
const W = ms => new Promise(r => setTimeout(r, ms));
const b = await chromium.launch();
const spots = { Kihei: [20.758, -156.457], Lahaina: [20.878, -156.677], Paia: [20.903, -156.369], Iao: [20.881, -156.545], Hana: [20.758, -155.99] };
async function run(name, ll, preset) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: ll[0], longitude: ll[1], accuracy: 15 }, permissions: ["geolocation"] });
  const pg = await ctx.newPage(); const errs = [], reqs = [];
  pg.on("pageerror", e => errs.push(e.message));
  pg.on("request", r => { if (/interpreter/.test(r.url())) reqs.push(Date.now()); });
  pg.on("response", r => { if (/interpreter/.test(r.url())) reqs.push(r.url().split("/")[2] + " " + r.status()); });
  if (preset) await pg.addInitScript(p => { if (!localStorage.getItem("switchback.v1")) localStorage.setItem("switchback.v1", JSON.stringify(p)); }, preset);
  await pg.goto(url, { waitUntil: "load" });
  const snap = () => pg.evaluate(() => ({ z: map.getZoom(), c: [map.getCenter().lat.toFixed(3), map.getCenter().lng.toFixed(3)], trails: R.trails.length, list: document.querySelectorAll(".card[data-id]").length,
    searching: R.searching, err: R.searchErr, cov: (R.cov || []).length, center: R.center, follow: typeof meFollow !== "undefined" && meFollow, seen: R.seen && [R.seen.getSouth().toFixed(3), R.seen.getNorth().toFixed(3)],
    count: document.querySelector(".count")?.innerText || document.querySelector("#body")?.innerText.slice(0, 160) }));
  for (const t of [5, 20, 45, 90]) { await W(t === 5 ? 5000 : (t - [5, 20, 45, 90][[5, 20, 45, 90].indexOf(t) - 1]) * 1000); console.log(name, preset ? "(was in WA)" : "", t + "s", JSON.stringify(await snap())); }
  console.log(name, "overpass", JSON.stringify(reqs.filter(x => typeof x === "string")), "errs", JSON.stringify(errs));
  await pg.screenshot({ path: `shots/${name}${preset ? "-wa" : ""}.png` });
  await ctx.close();
}
await run("Kihei", spots.Kihei);
await run("Kihei", spots.Kihei, { view: { c: [47.49, -121.77], z: 13 }, locOn: true });
await run("Lahaina", spots.Lahaina);
await run("Iao", spots.Iao);
// raw Overpass counts for the Kihei view, same query shape as the app
const q = s => `[out:json][timeout:25];(relation["route"~"^(hiking|foot|walking)$"](${s}););out tags;(way["highway"~"^(path|footway|track|bridleway)$"]["name"](${s}););out tags;`;
for (const [n, ll] of Object.entries(spots)) {
  const s = [ll[0] - 0.1, ll[1] - 0.15, ll[0] + 0.1, ll[1] + 0.15].join(",");
  try { const r = await fetch("https://maps.mail.ru/osm/tools/overpass/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q(s)) }); const j = await r.json();
    const els = j.elements || []; console.log("RAW", n, "relations", els.filter(e => e.type === "relation").length, "named ways", els.filter(e => e.type === "way").length, "sample", JSON.stringify(els.slice(0, 6).map(e => [e.tags.name, e.tags.highway || e.tags.route, e.tags.footway || "", e.tags.access || "", e.tags.informal || ""])));
  } catch (e) { console.log("RAW", n, "fail", e.message); }
}
await b.close();
