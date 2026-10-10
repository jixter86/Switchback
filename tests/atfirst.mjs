// Live check: AllTrails trails appear before OpenStreetMap answers; trailheads-only overview.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("atLayer")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
await pg.goto(url, { waitUntil: "load", timeout: 30000 }); await pg.waitForTimeout(2500);
await pg.evaluate(() => map.setView([47.49, -121.77], 13)); await pg.waitForTimeout(800);
const t0 = Date.now();
await pg.evaluate(() => { void searchArea(); });
await pg.waitForTimeout(300);
console.log("AT 300ms", JSON.stringify(await pg.evaluate(() => ({ searching: R.searching, n: R.trails.length, first: visibleTrails().slice(0, 4).map(t => t.name), note: document.querySelector(".count")?.textContent }))));
await pg.waitForFunction(() => !R.searching, null, { timeout: 150000 }).catch(() => {});
console.log("OSM done after", Date.now() - t0, "ms", JSON.stringify(await pg.evaluate(() => ({ n: R.trails.length, at: R.trails.filter(t => t.id.startsWith("at")).length, first: visibleTrails().slice(0, 10).map(t => t.name), err: R.searchErr }))));
await pg.evaluate(() => { S.mf = Object.assign(mapF(), { headsOnly: true }); save(); render(); }); await pg.waitForTimeout(300);
const lay = () => pg.evaluate(() => ({ lines: trailLayer.getLayers().filter(l => l.getLatLngs).length, dots: trailLayer.getLayers().filter(l => l.setRadius).length, sel: selLayer.getLayers().filter(l => l.getLatLngs).length }));
console.log("HEADS", JSON.stringify(await lay()));
await pg.evaluate(() => previewTrail(visibleTrails()[0].id)); await pg.waitForTimeout(1200);
console.log("PICKED", JSON.stringify(await lay()), await pg.evaluate(() => pvTrail(R.pv).name));
await pg.screenshot({ path: "shots/heads.png" });
await b.close();
