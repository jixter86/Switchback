// Live check: Esri Topo default, offline download, then navigate Little Si with no connection.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 47.4872, longitude: -121.7536 }, permissions: ["geolocation"] });
const pg = await ctx.newPage();
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
const step = async (name, fn) => { try { await fn(); console.log("OK", name); } catch (e) { console.log("FAIL", name, e.message.split("\n")[0]); } };
const tiles = () => pg.evaluate(() => { const t = [...document.querySelectorAll(".leaflet-tile")]; return `${t.filter(x => x.complete && x.naturalWidth > 0).length} of ${t.length} loaded`; });
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("Navigate this trail")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
await step("load", () => pg.goto(url, { waitUntil: "load", timeout: 30000 }));
console.log("BASE", await pg.evaluate(() => R.base), await pg.evaluate(() => document.querySelector(".leaflet-tile")?.src));
await step("search", async () => { await pg.fill("#q", "North Bend"); await pg.press("#q", "Enter");
  await pg.waitForSelector("#suggest.show button", { timeout: 15000 }); await pg.click("#suggest button:has-text('Washington')"); });
await step("cards", () => pg.waitForSelector(".card", { timeout: 90000 }));
await step("open Little Si", async () => { await pg.click(".card:has-text('Little Si') >> nth=0"); await pg.waitForTimeout(15000); });
await step("offline save", async () => {
  await pg.locator("[data-list] >> nth=0").check(); await pg.waitForTimeout(500);
  await pg.click("#offBtn"); await pg.waitForFunction(() => /Saved for offline|can't be saved/.test(document.querySelector("#toast")?.innerText || ""), null, { timeout: 180000 });
  console.log("TOAST", await pg.innerText("#toast")); });
await ctx.setOffline(true);
await step("offline reload", () => pg.reload({ waitUntil: "load" }));
await pg.waitForTimeout(2000);
await step("open saved", async () => { await pg.click("[data-tab=saved]"); await pg.waitForTimeout(1000); await pg.click(".card:has-text('Little Si') >> nth=0"); await pg.waitForTimeout(3000); });
await step("navigate", async () => { await pg.click("#navBtn"); await pg.waitForTimeout(4000); });
console.log("NAV1", (await pg.innerText("#nav")).replace(/\n/g, " | "), "ZOOM", await pg.evaluate(() => map.getZoom()), "TILES", await tiles());
await pg.screenshot({ path: "shots/nav1.png" });
await ctx.setGeolocation({ latitude: 47.4905, longitude: -121.7470 }); await pg.waitForTimeout(4000);
console.log("NAV2", (await pg.innerText("#nav")).replace(/\n/g, " | "), "TILES", await tiles());
await ctx.setGeolocation({ latitude: 47.4950, longitude: -121.7350 }); await pg.waitForTimeout(4000);
console.log("NAV3", (await pg.innerText("#nav")).replace(/\n/g, " | "));
await step("zoom in to 18 offline", async () => { await pg.evaluate(() => map.setZoom(18)); await pg.waitForTimeout(3000); });
console.log("Z18 TILES", await tiles());
await pg.screenshot({ path: "shots/nav2.png" });
await b.close();
