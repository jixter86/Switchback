// Live check: Esri Topo default, offline download, then navigate Little Si with no connection.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 47.4872, longitude: -121.7536 }, permissions: ["geolocation"] });
const pg = await ctx.newPage();
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
const step = async (name, fn) => { try { await fn(); console.log("OK", name); } catch (e) { console.log("FAIL", name, e.message.split("\n")[0]); } };
const tiles = () => pg.evaluate(() => { const t = [...document.querySelectorAll(".leaflet-tile")]; return `${t.filter(x => x.complete && x.naturalWidth > 0).length} of ${t.length} loaded`; });
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("trying a backup server")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
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
// AllTrails listings in Honolulu (online again, fresh page)
await ctx.setOffline(false);
const p2 = await ctx.newPage(); p2.on("pageerror", e => console.log("PAGEERROR2", e.message));
await step("hnl load", () => p2.goto(url, { waitUntil: "load", timeout: 30000 }));
await step("hnl search", async () => { await p2.fill("#q", "Honolulu"); await p2.press("#q", "Enter"); await p2.waitForTimeout(3000);
  if (await p2.locator("#suggest.show button").count()) await p2.click("#suggest button:has-text('Hawaii')"); });
await step("hnl cards", () => p2.waitForSelector(".card", { timeout: 120000 }));
await p2.waitForTimeout(3000);
console.log("HNL", (await p2.innerText("#body")).replace(/\n/g, " | ").slice(0, 3000));
console.log("AT CHIPS", await p2.locator(".card:not(.atcard) .chip.at").count(), "AT ONLY", await p2.locator(".atcard").count());
await p2.screenshot({ path: "shots/hnl.png", fullPage: true });
await b.close();
