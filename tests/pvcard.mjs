// Live check: tapping a trail shows a preview card over the map; browse; open details; back.
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("previewTrail")) { console.log("new build live"); break; } await new Promise(r => setTimeout(r, 10000)); }
await pg.goto(url, { waitUntil: "load", timeout: 30000 }); await pg.waitForTimeout(2500);
await pg.evaluate(() => map.setView([47.49, -121.77], 13)); await pg.waitForTimeout(800);
await pg.evaluate(() => searchArea());
await pg.waitForFunction(() => !R.searching, null, { timeout: 150000 }).catch(() => {});
await pg.waitForTimeout(1000);
const st = () => pg.evaluate(() => ({ pv: R.pv && pvTrail(R.pv)?.name, card: !document.querySelector("#pv").hidden, mapFull: document.body.classList.contains("mapfull"), detail: R.sel?.name || null, idx: document.querySelector("#pv .pvnav .note")?.textContent, photo: document.querySelector("#pv .pvphoto.on")?.style.backgroundImage?.slice(0, 70) || null, tiles: [...document.querySelectorAll("#pv .tmap img")].filter(i => i.complete && i.naturalWidth).length }));
await pg.tap(".card[data-id] >> nth=0"); await pg.waitForTimeout(4000);
console.log("TAP CARD", JSON.stringify(await st())); await pg.screenshot({ path: "shots/pv1.png" });
await pg.tap(".pvnext"); await pg.waitForTimeout(3000); console.log("NEXT", JSON.stringify(await st())); await pg.screenshot({ path: "shots/pv2.png" });
await pg.tap(".pvgo"); await pg.waitForTimeout(1500); console.log("DETAILS", JSON.stringify(await st()));
await pg.tap("#back"); await pg.waitForTimeout(1000); console.log("BACK", JSON.stringify(await st()));
await pg.tap(".pvx"); await pg.waitForTimeout(500); console.log("CLOSE", JSON.stringify(await st()));
await b.close();
