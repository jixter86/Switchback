// Live check: tapping AllTrails-only trails opens them in Switchback (North Bend + Honolulu).
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("openAT")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
await pg.goto(url, { waitUntil: "load", timeout: 30000 }); await pg.waitForTimeout(2000);
for (const [c, z] of [[[47.49, -121.77], 13], [[21.29, -157.80], 13]]) {
  await pg.evaluate(([c, z]) => { closeTrail(true); map.setView(c, z); }, [c, z]); await pg.waitForTimeout(800);
  await pg.evaluate(() => searchArea());
  await pg.waitForFunction(() => !R.searching, null, { timeout: 120000 }).catch(() => {});
  await pg.waitForTimeout(1500);
  const ids = await pg.$$eval(".atcard[data-at]", cs => cs.map(c => [c.dataset.at, c.querySelector(".nm").textContent]));
  console.log("AT-only", ids.length, JSON.stringify(ids.slice(0, 12)));
  let ok = 0, fail = [];
  for (const [id, name] of ids.slice(0, 6)) {
    await pg.evaluate(() => { if (R.sel) closeTrail(); });
    await pg.evaluate(id => openAT(+id), id).catch(e => console.log("err", e.message));
    await pg.waitForTimeout(1000);
    const sel = await pg.evaluate(() => R.sel ? [R.sel.name, R.sel.id, Math.round(R.sel.len)] : null);
    if (sel) ok++; else fail.push([name, await pg.inner_text("#toast")]);
    console.log("OPEN", name, "->", JSON.stringify(sel));
  }
  console.log("RESULT", ok, "opened;", JSON.stringify(fail));
  await pg.screenshot({ path: `shots/at-${z}-${c[0]}.png` });
}
await b.close();
