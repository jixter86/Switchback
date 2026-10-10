// Live check: the page itself never scrolls; search bar stays put; sheet list still scrolls.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const pg = await ctx.newPage();
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("Page itself never scrolls")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
await pg.goto(url, { waitUntil: "load", timeout: 30000 }); await pg.waitForTimeout(3000);
const sb = () => pg.evaluate(() => ({ y: scrollY, top: Math.round(document.querySelector(".searchbox").getBoundingClientRect().top), font: getComputedStyle(document.querySelector(".searchbox input")).fontSize }));
console.log("START", JSON.stringify(await sb()));
await pg.evaluate(() => { scrollTo(0, 500); document.documentElement.scrollTop = 500; }); await pg.waitForTimeout(300);
console.log("FORCED", JSON.stringify(await sb()));
await pg.fill(".searchbox input", "North Bend"); await pg.keyboard.press("Enter"); await pg.waitForTimeout(25000);
await pg.touchscreen.tap(195, 600);
await pg.evaluate(() => document.activeElement?.blur()); await pg.waitForTimeout(500);
console.log("AFTER SEARCH", JSON.stringify(await sb()));
console.log("LIST", JSON.stringify(await pg.evaluate(() => { const e = document.querySelector(".body"); e.scrollTop = 300; return { scrollable: e.scrollHeight > e.clientHeight, scrollTop: e.scrollTop, pageY: scrollY }; })));
await pg.screenshot({ path: "shots/scroll.png" });
await b.close();
