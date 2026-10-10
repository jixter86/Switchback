// Live check: popularity chips + Most popular sort in North Bend.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("popChip")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
await pg.goto(url, { waitUntil: "load", timeout: 30000 }); await pg.waitForTimeout(2000);
await pg.evaluate(() => map.setView([47.49, -121.77], 13));
await pg.waitForTimeout(800); await pg.click("#areaBtn").catch(() => {}); 
await pg.waitForSelector(".card", { timeout: 90000 }).catch(() => console.log("no cards"));
await pg.waitForTimeout(3000);
await pg.selectOption("#fSort", "pop").catch(e => console.log("sort fail", e.message)); await pg.waitForTimeout(500);
const cards = await pg.$$eval(".card", cs => cs.slice(0, 8).map(c => c.innerText.replace(/\n/g, " | ")));
console.log("CARDS\n" + cards.join("\n"));
console.log("POPCHIPS", await pg.$$eval(".chip.pop", c => c.length));
await pg.screenshot({ path: "shots/pop.png" });
await b.close();
