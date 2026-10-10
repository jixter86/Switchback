// Re-check the three audit items that need longer waits.
import { chromium } from "playwright";
const url = "https://jixter86.github.io/Switchback/";
const W = ms => new Promise(r => setTimeout(r, ms));
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
pg.on("pageerror", e => console.log("PAGEERROR", e.message));
const ev = (f, a) => pg.evaluate(f, a);
await pg.goto(url, { waitUntil: "load" }); await W(2500);
await ev(() => { const o = toast; window._toasts = []; toast = m => { _toasts.push((performance.now() / 1000).toFixed(1) + "s " + m); o(m); }; });
await ev(() => map.setView([47.49, -121.77], 13)); await W(500);
await ev(() => searchArea());
console.log("trails", await ev(() => R.trails.length), await ev(() => R.searchErr));
const id = await ev(() => (R.trails.find(t => /little si/i.test(t.name)) || visibleTrails()[0]).id);
if (0) await pg.waitForFunction(() => /elevation profile/i.test(document.querySelector("#panel").innerText) && /°/.test(document.querySelector("#panel .week")?.innerText || ""), null, { timeout: 60000 }).then(() => console.log("PASS details: elevation profile + weather shown")).catch(async () => console.log("FAIL details", await ev(() => document.querySelector("#panel").innerText.slice(0, 1500))));
await ev(() => closeTrail());
const cards = await ev(() => [...document.querySelectorAll("[data-at]")].map(c => [c.dataset.at, atById(+c.dataset.at)?.n]));
console.log("unmatched AllTrails cards", JSON.stringify(cards));
for (const [aid, n] of cards.slice(0, 4)) {
  await ev(() => { closePreview(); closeTrail(true); });
  const t0 = Date.now(); await ev(aid => { R.pvBack=null; document.querySelector(`.atcard[data-at="${aid}"]`)?.click() || openAT(+aid); }, aid);
  await pg.waitForFunction(() => R.pv || R.sel, null, { timeout: 90000 }).catch(() => {});
  console.log(await ev(() => !!(R.pv || R.sel)) ? "PASS" : "FAIL", "openAT", n, "->", await ev(() => pvTrail(R.pv || R.sel?.id)?.name), Date.now() - t0, "ms", JSON.stringify(await ev(() => _toasts.slice(-2))));
}
// stale weather
await ev(() => { const t = R.trails.find(x => /little si/i.test(x.name)) || R.trails[0]; openTrail(t.id); }); await W(800);
await ev(() => { const c = document.querySelector("[data-list]"); c.checked = true; c.dispatchEvent(new Event("change", { bubbles: true })); closeTrail(); setTab("saved"); });
await pg.waitForFunction(() => Object.values(S.saved).some(t => t.hwx), null, { timeout: 60000 }).catch(() => {});
const st = await ev(async () => { for (const t of Object.values(S.saved)) if (t.hwx) t.hwx.at = Date.now() - 2 * 3600e3; R.hwxTry = 0; const was = Math.min(...Object.values(S.saved).filter(t => t.hwx).map(t => t.hwx.at)); refreshStaleWeather(); await new Promise(r => setTimeout(r, 10000)); return { was, now: Math.min(...Object.values(S.saved).filter(t => t.hwx).map(t => t.hwx.at)) }; });
console.log(st.now > st.was ? "PASS" : "FAIL", "stale weather refresh", JSON.stringify(st));
await b.close();
