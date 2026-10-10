// Live check: AllTrails trails appear on the map after a search and open/save in Switchback.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("mergeAT")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
await pg.goto(url, { waitUntil: "load", timeout: 30000 }); await pg.waitForTimeout(2500);
for (const [c, z, pick] of [[[47.49, -121.77], 13, "Rattlesnake Ledge Trail"], [[21.27, -157.80], 13, "Diamond Head Crater (Lēʻahi) Summit Trail"]]) {
  await pg.evaluate(([c, z]) => { closeTrail(true); map.setView(c, z); }, [c, z]); await pg.waitForTimeout(800);
  await pg.evaluate(() => searchArea());
  await pg.waitForFunction(() => !R.searching, null, { timeout: 150000 }).catch(() => {});
  await pg.waitForTimeout(1000);
  console.log("ERR", await pg.evaluate(() => R.searchErr));
  console.log("AT ON MAP", JSON.stringify(await pg.evaluate(() => R.trails.filter(t => t.atId).map(t => t.name))));
  console.log("AT-ONLY LIST", await pg.$$eval(".atcard", c => c.length));
  const id = await pg.evaluate(n => R.trails.find(t => t.name === n)?.id, pick);
  if (id) { await pg.evaluate(id => openTrail(id), id); await pg.waitForTimeout(1500);
    console.log("OPENED", await pg.evaluate(() => [R.sel.name, Math.round(R.sel.len), R.sel.headSrc]));
    await pg.evaluate(() => document.querySelector("[data-list]").click()); await pg.waitForTimeout(300);
    console.log("SAVED", JSON.stringify(await pg.evaluate(() => Object.values(S.saved).map(x => [x.name, x.atId]))));
    await pg.screenshot({ path: `shots/atmap-${c[0]}.png` });
  } else console.log("NOT FOUND", pick);
}
await b.close();
