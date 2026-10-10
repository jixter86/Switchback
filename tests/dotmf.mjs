// Live check: location dot stays on (load + button taps), map filters in Settings.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 47.4957, longitude: -121.7868 }, permissions: ["geolocation"] });
const pg = await ctx.newPage();
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("mapFOn")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
await pg.goto(url, { waitUntil: "load", timeout: 30000 }); await pg.waitForTimeout(3000);
const dot = () => pg.evaluate(() => ({ dot: !!document.querySelector(".me2"), follow: meFollow, btn: document.querySelector("#locBtn").className, locOn: S.locOn }));
console.log("LOAD", JSON.stringify(await dot()));
await pg.click("#locBtn"); await pg.waitForTimeout(400); console.log("TAP1", JSON.stringify(await dot()));
await pg.click("#locBtn"); await pg.waitForTimeout(400); console.log("TAP2", JSON.stringify(await dot()));
await pg.reload(); await pg.waitForTimeout(3000); console.log("RELOAD", JSON.stringify(await dot()));
await pg.evaluate(() => map.setView([47.49, -121.77], 13)); await pg.waitForTimeout(800);
await pg.evaluate(() => searchArea());
await pg.waitForFunction(() => !R.searching, null, { timeout: 150000 }).catch(() => {});
await pg.waitForTimeout(1000);
const n = () => pg.evaluate(() => [visibleTrails().length, trailLayer.getLayers().length / 3]);
console.log("ALL", JSON.stringify(await n()));
await pg.click("#setBtn"); await pg.waitForTimeout(300);
await pg.uncheck("[data-mf=osm]"); await pg.waitForTimeout(300); console.log("ALLTRAILS ONLY", JSON.stringify(await n()), JSON.stringify(await pg.evaluate(() => visibleTrails().map(t => t.name))));
await pg.check("[data-mf=pop]"); await pg.waitForTimeout(300); console.log("POPULAR", JSON.stringify(await n()));
await pg.screenshot({ path: "shots/mf.png" });
await b.close();
