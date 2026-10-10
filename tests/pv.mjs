// Live check: trail page map preview.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
const step = async (name, fn) => { try { await fn(); console.log("OK", name); } catch (e) { console.log("FAIL", name, e.message.split("\n")[0]); } };
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("pvSlot")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
await step("load", () => pg.goto(url, { waitUntil: "load", timeout: 30000 }));
await step("search", async () => { await pg.fill("#q", "North Bend"); await pg.press("#q", "Enter");
  await pg.waitForSelector("#suggest.show button", { timeout: 15000 }); await pg.click("#suggest button:has-text('Washington')"); });
await step("cards", () => pg.waitForSelector(".card", { timeout: 120000 }));
await step("open Little Si", async () => { await pg.click(".card:has-text('Little Si') >> nth=0"); await pg.waitForTimeout(12000); });
console.log("PREVIEW", await pg.evaluate(() => { const m = document.querySelector("#pvSlot .pvmap"); if (!m) return "missing";
  const t = [...m.querySelectorAll(".leaflet-tile")]; return `${t.filter(x => x.complete && x.naturalWidth > 0).length}/${t.length} tiles, line ${!!m.querySelector("path")}, pins ${m.querySelectorAll(".hlpin").length}, ${m.offsetWidth}x${m.offsetHeight}`; }));
await pg.screenshot({ path: "shots/preview.png" });
await b.close();
