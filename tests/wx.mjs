// Live check: save three North Bend trails, then the Saved tab's hourly weather board.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
pg.on("response", r => { if (r.status() >= 400) console.log("HTTP", r.status(), r.url().slice(0, 160)); });
const step = async (name, fn) => { try { await fn(); console.log("OK", name); } catch (e) { console.log("FAIL", name, e.message.split("\n")[0]); } };
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("${nm(t)}${trailMeta(t)}</th>${dates")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
await step("load", () => pg.goto(url, { waitUntil: "load", timeout: 30000 }));
await step("search", async () => { await pg.fill("#q", "North Bend"); await pg.press("#q", "Enter");
  await pg.waitForSelector("#suggest.show button", { timeout: 15000 }); await pg.click("#suggest button:has-text('Washington')"); });
await step("cards", () => pg.waitForSelector(".card", { timeout: 120000 }));
for (const n of ["Little Si", "Mount Si Trail", "Rattlesnake Ledge"]) await step("save " + n, async () => {
  await pg.click(`.card:has-text('${n}') >> nth=0`); await pg.waitForSelector("[data-list]", { timeout: 10000 });
  await pg.locator("[data-list] >> nth=0").check(); await pg.waitForTimeout(400); await pg.click("#back"); await pg.waitForTimeout(500); });
await step("saved tab", async () => { await pg.click("[data-tab=saved]"); await pg.waitForSelector(".wxc", { timeout: 30000 }); });
console.log("BOARD", (await pg.innerText("#body")).slice(0, 1500).replace(/\n/g, " | "));
await pg.screenshot({ path: "shots/wx1.png" });
await step("pick day 4", async () => { await pg.click(".dayh >> nth=3"); await pg.waitForTimeout(500); });
console.log("DAY4", (await pg.innerText("#body")).slice(0, 700).replace(/\n/g, " | "));
console.log("DAYCELLS", await pg.locator(".wxc").count(), "HOURCELLS", await pg.locator("td.hc").count());
console.log("WEEK TABLE ROWS", await pg.evaluate(() => [...document.querySelectorAll(".wxgrid table:not(.hours) tbody th")].map(th => th.innerText.replace(/\n/g, " | ") + (th.querySelector(".aticon") ? " [AllTrails icon]" : ""))));
console.log("HOURS TABLE ROWS", await pg.evaluate(() => [...document.querySelectorAll("table.hours tbody th")].map(th => th.innerText.replace(/\n/g, " | ") + (th.querySelector(".aticon") ? " [AllTrails icon]" : ""))));
await pg.screenshot({ path: "shots/wx2.png" });
await b.close();
