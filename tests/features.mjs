// Live check of highlights, photos/description and offline save on Little Si and Mount Si.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const pg = await ctx.newPage();
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
pg.on("response", r => { if (r.status() >= 400) console.log("HTTP", r.status(), r.url().slice(0, 140)); });
const step = async (name, fn) => { try { await fn(); console.log("OK", name); } catch (e) { console.log("FAIL", name, e.message.split("\n")[0]); } };
// wait for the deploy carrying sw.js
for (let i = 0; i < 30; i++) { const r = await fetch(url + "sw.js?" + Date.now()); if (r.ok) { console.log("sw.js live"); break; } await new Promise(r => setTimeout(r, 10000)); }
await step("load", () => pg.goto(url, { waitUntil: "load", timeout: 30000 }));
await step("search", async () => { await pg.fill("#q", "North Bend"); await pg.press("#q", "Enter");
  await pg.waitForSelector("#suggest.show button", { timeout: 15000 }); await pg.click("#suggest button:has-text('Washington')"); });
await step("cards", () => pg.waitForSelector(".card", { timeout: 60000 }));
for (const name of ["Little Si", "Mount Si Trail", "Rattlesnake Ledge"]) {
  await step("open " + name, async () => { await pg.click(`.card:has-text('${name}') >> nth=0`); await pg.waitForTimeout(25000); });
  console.log("DETAIL", name, (await pg.innerText("#body")).slice(0, 2500).replace(/\n/g, " | "));
  console.log("PHOTOS", await pg.locator(".gallery img").count(), "PINS", await pg.locator(".hlpin").count());
  await pg.screenshot({ path: `shots/${name.replace(/ /g, "_")}.png`, fullPage: true });
  if (name === "Little Si") await step("offline save", async () => {
    await pg.locator("[data-list] >> nth=0").check(); await pg.waitForTimeout(500);
    await pg.click("#offBtn"); await pg.waitForFunction(() => /Saved for offline|can't be saved/.test(document.querySelector("#toast")?.innerText || ""), null, { timeout: 120000 });
    console.log("TOAST", await pg.innerText("#toast"));
    console.log("CACHE", await pg.evaluate(async () => (await (await caches.open("sb-tiles")).keys()).length));
    console.log("SW", await pg.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())));
    // go offline and reload
    await ctx.setOffline(true); await pg.reload({ waitUntil: "load" }).catch(e => console.log("reload err", e.message));
    await pg.waitForTimeout(3000);
    console.log("OFFLINE BODY", (await pg.innerText("body")).slice(0, 600).replace(/\n/g, " | "));
    console.log("OFFLINE TILES", await pg.evaluate(() => [...document.querySelectorAll(".leaflet-tile")].filter(t => t.complete && t.naturalWidth > 0).length));
    await pg.screenshot({ path: "shots/offline.png" });
    await ctx.setOffline(false); await pg.reload({ waitUntil: "load" });
    await step("research", async () => { await pg.fill("#q", "North Bend"); await pg.press("#q", "Enter");
      await pg.waitForSelector("#suggest.show button", { timeout: 15000 }); await pg.click("#suggest button:has-text('Washington')");
      await pg.waitForSelector(".card", { timeout: 60000 }); });
  });
  await step("back", async () => { await pg.click("#back"); await pg.waitForTimeout(1000); });
}
await b.close();
