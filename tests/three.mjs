// "Only 3 trails populate": fresh phone load, let the app search by itself, report what the list shows.
import { chromium } from "playwright";
const url = "https://jixter86.github.io/Switchback/";
const W = ms => new Promise(r => setTimeout(r, ms));
const b = await chromium.launch();
for (const [name, lat, lon] of [["Maui Kahului", 20.889, -156.47], ["Maui Kihei", 20.75, -156.45], ["North Bend", 47.4957, -121.7868], ["Seattle", 47.61, -122.33]]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: lat, longitude: lon }, permissions: ["geolocation"] });
  const pg = await ctx.newPage(); pg.on("pageerror", e => console.log("PAGEERROR", e.message));
  pg.on("console", m => { if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 200)); });
  await pg.goto(url, { waitUntil: "load" });
  for (const s of [8, 20, 40]) {
    await W(s === 8 ? 8000 : s === 20 ? 12000 : 20000);
    const r = await pg.evaluate(() => { const sb = seenBounds(), mb = map.getBounds();
      return { zoom: map.getZoom(), searching: R.searching, err: R.searchErr, trails: R.trails.length, vis: visibleTrails().length, list: listTrails().length, ao: atOnly().length,
        cards: document.querySelectorAll("#panel .tcard").length, count: document.querySelector(".count")?.textContent?.trim().slice(0, 120), seenFrac: +((sb.getNorth() - sb.getSouth()) / (mb.getNorth() - mb.getSouth())).toFixed(2),
        filt: JSON.stringify(R.filt), mf: JSON.stringify(S.mf || {}), panelTop: Math.round(document.querySelector("#panel").getBoundingClientRect().top), cov: R.cov.length,
        drawn: Object.keys(R.lines || {}).length }; });
    console.log(name, s + "s", JSON.stringify(r));
  }
  await pg.screenshot({ path: `shots/three-${name.replace(/ /g, "")}.png` });
  await ctx.close();
}
await b.close();
