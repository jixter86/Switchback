// Live check: location dot, follow, recenter, compass cone.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 21.2836, longitude: -157.8287 }, permissions: ["geolocation"] });
const pg = await ctx.newPage();
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("centerVisible")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
await pg.goto(url, { waitUntil: "load", timeout: 30000 }); await pg.waitForTimeout(4000);
const st = () => pg.evaluate(() => ({ watching: meWatch !== null, follow: meFollow, center: [map.getCenter().lat.toFixed(4), map.getCenter().lng.toFixed(4)], zoom: map.getZoom(), btn: document.querySelector("#locBtn").className, dot: !!document.querySelector(".me2"), tiles: [...document.querySelectorAll(".leaflet-tile")].filter(t => t.complete && t.naturalWidth > 0).length }));
console.log("AUTO", JSON.stringify(await st()));
await pg.evaluate(() => dispatchEvent(new DeviceOrientationEvent("deviceorientationabsolute", { alpha: 270, absolute: true }))); await pg.waitForTimeout(300);
console.log("CONE", await pg.evaluate(() => document.querySelector(".mecone")?.style.cssText));
await ctx.setGeolocation({ latitude: 21.2900, longitude: -157.8200 }); await pg.waitForTimeout(3000);
console.log("MOVED", JSON.stringify(await st()));
await pg.mouse.move(195, 300); await pg.mouse.down(); await pg.mouse.move(100, 200, { steps: 5 }); await pg.mouse.up(); await pg.waitForTimeout(500);
console.log("DRAGGED", JSON.stringify(await st()));
await pg.click("#locBtn"); await pg.waitForTimeout(1500); console.log("RECENTER", JSON.stringify(await st()));
await pg.screenshot({ path: "shots/loc.png" });
await b.close();
