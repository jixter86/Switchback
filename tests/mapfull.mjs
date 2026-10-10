// Live check: Map/List button hides the panel for a full-screen map and brings it back.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
for (const [w, h, tag] of [[390, 844, "phone"], [1280, 800, "desk"]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 });
  const pg = await ctx.newPage();
  pg.on("pageerror", e => console.log("PAGEERROR", e.message));
  if (tag === "phone") for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("mapFull(")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
  await pg.goto(url, { waitUntil: "load", timeout: 30000 }); await pg.waitForTimeout(3000);
  const info = () => pg.evaluate(() => { const p = document.querySelector("#panel").getBoundingClientRect(); return { full: document.body.classList.contains("mapfull"), btn: document.querySelector("#mapBtn").textContent, panelTop: Math.round(p.top), panelRight: Math.round(p.right), mapW: map.getSize().x }; });
  console.log(tag, "LIST", JSON.stringify(await info()));
  await pg.click("#mapBtn"); await pg.waitForTimeout(800); console.log(tag, "MAP", JSON.stringify(await info())); await pg.screenshot({ path: `shots/${tag}-map.png` });
  await pg.click("#mapBtn"); await pg.waitForTimeout(800); console.log(tag, "BACK", JSON.stringify(await info()));
  await ctx.close();
}
await b.close();
