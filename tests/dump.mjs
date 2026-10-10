// Searches North Bend, WA on the live site and dumps every trail found (after climb loads) as JSON.
import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
await pg.goto("https://jixter86.github.io/Switchback/", { waitUntil: "load" });
await pg.fill("#q", "North Bend"); await pg.press("#q", "Enter");
await pg.waitForSelector("#suggest.show button", { timeout: 15000 });
await pg.click("#suggest button:has-text('Washington')");
await pg.waitForSelector(".card", { timeout: 90000 });
await pg.waitForTimeout(25000);
for (const act of ["hike", "bike"]) { await pg.selectOption("#fAct", act); await pg.waitForTimeout(500);
  console.log("LIST " + act + ": " + (await pg.innerText(".count")) + " :: " + (await pg.$$eval(".card .nm", e => e.map(x => x.textContent.trim()).join(" | ")))); }
await pg.selectOption("#fAct", "hike");
const out = await pg.evaluate(() => { const bb = map.getBounds();
  return { center: R.center, view: [bb.getSouth(), bb.getWest(), bb.getNorth(), bb.getEast()],
    trails: R.trails.map(t => ({ name: t.name, osm: (t.osm?.t||"") + (t.osm?.ids?.[0]||""), mi: +((t.loop ? t.len : t.len*2)/1609.344).toFixed(1), loop: t.loop,
      gainFt: t.elev ? Math.round((t.elev.gain + (t.loop ? 0 : t.elev.loss))*3.28084) : null, diff: difficulty(t), kind: t.kind, head: t.head.map(x => +x.toFixed(5)), awayMi: +(fd(R.center, t.head)/1609.344).toFixed(1) })) }; });
console.log("DUMP " + JSON.stringify(out));
await b.close();
