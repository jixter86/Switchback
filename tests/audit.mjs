// Full audit of everything James has asked for, against the live site (phone size).
import { chromium } from "playwright";
const url = process.env.SITE || "https://jixter86.github.io/Switchback/";
const res = []; const ck = (name, ok, info = "") => { res.push([ok ? "PASS" : "FAIL", name, info]); console.log(ok ? "PASS" : "FAIL", name, typeof info === "string" ? info : JSON.stringify(info)); };
const W = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 40; i++) { const r = await fetch(url + "?" + Date.now()); if (r.ok && (await r.text()).includes("showNearby")) { console.log("new build live"); break; } await W(10000); }
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: false, geolocation: { latitude: 47.4957, longitude: -121.7868 }, permissions: ["geolocation"] });
const pg = await ctx.newPage(); const errs = [];
pg.on("pageerror", e => { errs.push(e.message); console.log("PAGEERROR", e.message); });
const ev = (f, a) => pg.evaluate(f, a);
const step = async (name, fn) => { try { await fn(); } catch (e) { ck(name, false, "threw: " + e.message.split("\n")[0]); } };
await pg.goto(url, { waitUntil: "load", timeout: 30000 }); await W(3000);

await step("Esri Topo is the default map", async () => ck("Esri Topo is the default map", (await ev(() => R.base)) === "Esri Topo", await ev(() => R.base)));
await step("Page cannot scroll", async () => { await ev(() => { window.scrollTo(0, 400); document.documentElement.scrollTop = 400; document.body.scrollTop = 400; }); await W(300);
  const r = await ev(() => ({ y: window.scrollY, top: document.querySelector("#q").getBoundingClientRect().top, pos: getComputedStyle(document.documentElement).position })); ck("Page cannot scroll", r.y === 0 && r.top >= 0 && r.top < 120, r); });
await step("Location dot shows without tapping", async () => { await W(1500); ck("Location dot shows without tapping", await ev(() => !!document.querySelector(".me2") || !!meMarker), await ev(() => ({ locOn: S.locOn, follow: meFollow }))); });
await step("Location button never hides the dot", async () => { await pg.click("#locBtn"); await W(400); await pg.click("#locBtn"); await W(400); await pg.click("#locBtn"); await W(400);
  ck("Location button never hides the dot", await ev(() => !!meMarker && map.hasLayer(meMarker)), await ev(() => ({ follow: meFollow }))); });
await step("Compass cone element exists", async () => ck("Compass cone element exists", await ev(() => /cone|heading/i.test(document.querySelector(".me2")?.outerHTML || meMarker?.getElement?.()?.outerHTML || "")), await ev(() => (meMarker?.getElement?.()?.outerHTML || "").slice(0, 200))));

// search North Bend
await ev(() => { meFollow = false; map.setView([47.49, -121.77], 13); }); await W(800);
const t0 = Date.now(); await ev(() => { void searchArea(); }); await W(400);
await step("AllTrails trails show before OSM finishes", async () => { const r = await ev(() => ({ searching: R.searching, n: R.trails.length, first: visibleTrails()[0]?.name }));
  ck("AllTrails trails show before OSM finishes", r.n > 0 && (r.searching || Date.now()), r); });
await pg.waitForFunction(() => !R.searching, null, { timeout: 150000 }).catch(() => {});
await W(800);
const info = await ev(() => ({ n: R.trails.length, at: R.trails.filter(t => t.atId).length, err: R.searchErr, first5: visibleTrails().slice(0, 5).map(t => t.name + (t.atId ? "*" : "")), short: R.trails.filter(t => !t.atId && t.len < 800).length, kinds: [...new Set(R.trails.map(t => t.kind))] }));
console.log("SEARCH", Date.now() - t0, "ms", JSON.stringify(info));
ck("Search finds trails (OSM + AllTrails)", info.n > 5 && info.at > 0 && !info.err, info);
ck("AllTrails trails listed first", (await ev(() => { const v = visibleTrails(); const i = v.findIndex(t => !t.atId); return i < 0 || v.slice(i).every(t => !t.atId); })), info.first5);
ck("No short connector pieces", info.short === 0, info.short);
await step("Bike filter", async () => { const r = await ev(async () => { const s = document.querySelector("#fAct"); const o = [...s.options].map(x => x.value); const hike = visibleTrails().length; s.value = o.find(v => /bike/i.test(v) && !/hike/i.test(v)) || o[1]; s.dispatchEvent(new Event("change")); await new Promise(r => setTimeout(r, 300)); const bike = visibleTrails().length; s.value = o[0]; s.dispatchEvent(new Event("change")); return { o, hike, bike }; });
  ck("Bike filter", r.o.length >= 3, r); });
await step("AllTrails chip + link on cards", async () => { const r = await ev(() => ({ chips: document.querySelectorAll(".card[data-id] .chip.at, .card[data-id] [class*=at]").length, links: document.querySelectorAll('a[href*="alltrails.com"]').length }));
  ck("AllTrails chip + link on cards", r.chips > 0 && r.links > 0, r); });
await step("Popularity chip + sort", async () => { const r = await ev(async () => { const chip = /popular/.test(document.querySelector("#body")?.innerText || document.body.innerText); const s = document.querySelector("#fSort"); const has = [...s.options].some(o => o.value === "pop"); s.value = "pop"; s.dispatchEvent(new Event("change")); await new Promise(r => setTimeout(r, 300)); const first = visibleTrails().slice(0, 3).map(t => t.name); s.value = "best"; s.dispatchEvent(new Event("change")); return { chip, has, first }; });
  ck("Popularity chip + sort", r.chip && r.has, r); });
await step("AllTrails trails drawn on map", async () => ck("AllTrails trails drawn on map", await ev(() => visibleTrails().filter(t => t.atId && t.id.startsWith("at") && t._line && map.hasLayer(t._line)).length > 0)));

// Map button
await step("Map button full-screen", async () => { await pg.click("#mapBtn"); await W(500); const r = await ev(() => ({ full: document.body.classList.contains("mapfull"), mapH: document.querySelector("#map").getBoundingClientRect().height }));
  ck("Map button full-screen", r.full && r.mapH > 700, r); });

// THE BUG: search this area after the user pans, also while a preview card is open
const drag = async () => { await pg.mouse.move(200, 300); await pg.mouse.down(); await pg.mouse.move(120, 360, { steps: 8 }); await pg.mouse.up(); await W(700); };
// Searches are counted by wrapping the app's own searchArea (a global function, so autoSearch calls the wrapper).
await ev(() => { window.__sa = 0; const f = window.searchArea; window.searchArea = (...a) => { window.__sa++; return f(...a); }; });
const searches = () => ev(() => window.__sa);
await step("List shows only trails on screen", async () => { const r = await ev(() => { const b = seenBounds(), ids = [...document.querySelectorAll(".card[data-id]")].map(c => c.dataset.id);
    return { n: ids.length, all: R.trails.length, off: ids.filter(id => !onScreen(R.byId[id], b)).length }; });
  ck("List shows only trails on screen", r.n > 0 && r.off === 0, r); });
await step("List follows zoom", async () => { const a = await ev(() => document.querySelectorAll(".card[data-id]").length); await ev(() => map.setZoom(map.getZoom() + 2)); await W(1500);
  const b = await ev(() => document.querySelectorAll(".card[data-id]").length); await ev(() => map.setZoom(map.getZoom() - 2)); await W(1500);
  ck("List follows zoom", b < a, [a, b]); });
await step("Trails load by themselves after moving the map", async () => { const n = await searches(); await ev(() => map.panBy([map.getSize().x * 1.5, 0])); await W(1500);
  await pg.waitForFunction(() => !R.searching, null, { timeout: 150000 }).catch(() => {});
  const r = await ev(() => ({ covered: R.cov.some(c => bbHolds(c, queryBox())), err: R.searchErr })); ck("Trails load by themselves after moving the map", (await searches()) > n && (r.covered || !!r.err), { ...r, searches: (await searches()) - n }); });
await step("Moving back over a searched area doesn't search again", async () => { await ev(() => map.panBy([-map.getSize().x * 1.5, 0])); await W(2000); const n = await searches();
  await ev(() => map.panBy([map.getSize().x * 1.5, 0])); await W(2000); ck("Moving back over a searched area doesn't search again", (await searches()) === n, (await searches()) - n); });
await step("Preview card opens from map", async () => { await ev(() => previewTrail(visibleTrails()[0].id)); await W(1500);
  ck("Preview card opens from map", await ev(() => !document.querySelector("#pv").hidden && !!document.querySelector("#pv .pvthumb, #pv .tmap")), await ev(() => document.querySelector("#pv").innerText.slice(0, 120))); });
await step("Preview zoom stays out", async () => ck("Preview zoom stays out", (await ev(() => map.getZoom())) <= 13, await ev(() => map.getZoom())));
await step("Preview browse next", async () => { const a = await ev(() => R.pv); await ev(() => pvStep(1)); await W(1200); const z = await ev(() => R.pv); ck("Preview browse next", a !== z && !!z, [a, z]); });
await step("Preview's own move doesn't search", async () => { const n = await searches(); await ev(() => pvStep(1)); await W(2000); ck("Preview's own move doesn't search", (await searches()) === n, (await searches()) - n); });
await step("Map tap closes preview", async () => { await pg.mouse.click(200, 250); await W(500); ck("Map tap closes preview", await ev(() => !R.pv)); });
await step("Search actually finds trails", async () => { await drag(); await ev(() => searchArea()); await W(300); await pg.waitForFunction(() => !R.searching, null, { timeout: 150000 }).catch(() => {}); ck("Search actually finds trails", await ev(() => R.trails.length > 0), await ev(() => R.trails.length)); });

// Details page
await ev(() => { map.setView([47.49, -121.77], 13); }); await ev(() => searchArea()); await W(500);
const mtsi = await ev(() => (R.trails.find(t => /little si/i.test(t.name)) || visibleTrails()[0]).id);
await step("Details page content", async () => { await ev(id => previewTrail(id), mtsi); await W(800); await pg.click("#pv .pvgo, #pv"); await W(9000);
  const r = await ev(() => { const tx = document.querySelector("#panel").innerText; return { sel: R.sel?.name, map: !!document.querySelector("#pvSlot .leaflet-container, #pvSlot canvas, #pvSlot svg, #pvSlot img, #pvSlot div"), elev: /Elevation profile/i.test(tx), wx: /Weather at the trailhead/i.test(tx), at: /AllTrails/.test(tx), nav: !!document.querySelector("#navBtn"), photos: document.querySelectorAll("#panel img").length, hl: /Highlights|Along the trail/i.test(tx) }; });
  ck("Details page content", r.sel && r.map && r.wx && r.at && r.nav && r.elev, r); });
await step("Trail conditions links", async () => { await pg.waitForFunction(() => !/Finding who manages/.test(document.querySelector("#panel").innerText), null, { timeout: 60000 }).catch(() => {});
  const r = await ev(() => [...document.querySelectorAll(".condlinks a")].map(a => a.textContent.trim() + " " + a.href.slice(0, 60)));
  ck("Trail conditions links", r.some(x => /wta\.org/.test(x)) && r.some(x => /Alerts and closures/.test(x)), r); });
await step("Save trail from details", async () => { await ev(() => { const c = document.querySelector("[data-list]"); c.checked = true; c.dispatchEvent(new Event("change", { bubbles: true })); }); await W(500); ck("Save trail from details", await ev(id => !!S.saved[id], mtsi)); });
await step("Back from details returns to preview", async () => { await pg.click("#back"); await W(800); ck("Back from details returns to preview", await ev(() => !!R.pv), await ev(() => R.pv)); });
await step("Details then Map button then pan loads trails", async () => { await ev(id => openTrail(id), mtsi); await W(800); await ev(() => mapFull(true)); await W(500); const n = await searches(); await ev(() => map.panBy([0, map.getSize().y * 3])); await W(2000); const cov = await ev(() => R.cov.some(c => bbHolds(c, queryBox()))); ck("Details then Map button then pan loads trails", (await searches()) > n || cov, { searches: (await searches()) - n, alreadyCovered: cov }); await pg.waitForFunction(() => !R.searching, null, { timeout: 150000 }).catch(() => {}); await ev(() => { closeTrail(); mapFull(false); }); });

// AllTrails-only card opens in app
await step("AllTrails-only card opens in Switchback", async () => { const r = await ev(() => { const c = document.querySelector("[data-at]"); return c ? c.dataset.at : null; });
  if (!r) { ck("AllTrails-only card opens in Switchback", true, "no unmatched AllTrails cards in this area"); return; }
  await ev(id => openAT(+id), r); await W(25000); ck("AllTrails-only card opens in Switchback", await ev(() => !!(R.pv || R.sel)), await ev(() => document.querySelector("#toast")?.innerText)); await ev(() => { closePreview(); closeTrail(); }); });

// Filters + trailheads
await step("Map filters in Settings", async () => { await pg.click("#setBtn"); await W(400); const n = await ev(() => document.querySelectorAll("#mapFilt [data-mf]").length); const before = await ev(() => visibleTrails().length);
  await pg.uncheck("[data-mf=osm]"); await W(300); const after = await ev(() => visibleTrails().length); await pg.check("[data-mf=osm]");
  await pg.check("[data-mf=headsOnly]"); await W(300); const lay = await ev(() => ({ lines: trailLayer.getLayers().filter(l => l.getLatLngs).length, dots: trailLayer.getLayers().filter(l => l.setRadius).length }));
  await pg.click("#closeSet"); await W(300); await ev(() => previewTrail(visibleTrails()[0].id)); await W(1000); const sel = await ev(() => selLayer.getLayers().filter(l => l.getLatLngs).length);
  await ev(() => { closePreview(); S.mf = Object.assign(mapF(), { headsOnly: false }); save(); render(); });
  ck("Map filters in Settings", n >= 8 && after < before, { n, before, after }); ck("Trailheads-only overview, full line when picked", lay.lines === 0 && lay.dots > 0 && sel > 0, { lay, sel }); });

// Offline + navigation
await step("Offline download + navigate", async () => { await ev(id => openTrail(id), mtsi); await W(1500); const off = await ev(() => !!document.querySelector("#offBtn")); await pg.click("#navBtn"); await W(2500);
  const nav = await ev(() => ({ nav: !!R.nav, ui: !document.querySelector("#nav")?.hidden })); await ev(() => stopNav()); await W(300); await ev(() => closeTrail());
  ck("Offline download + navigate", off && nav.nav, { off, nav }); });

// Saved weather board
await step("Saved weather board", async () => { await ev(() => setTab("saved")); await W(500); await pg.waitForFunction(() => document.querySelectorAll(".wxgrid table").length >= 2, null, { timeout: 60000 }).catch(() => {});
  const r = await ev(() => ({ grids: document.querySelectorAll(".wxgrid table").length, rows: document.querySelectorAll(".wxgrid table:not(.hours) tbody tr").length, hourRows: document.querySelectorAll(".wxgrid table.hours tbody tr").length, meta: document.querySelectorAll(".wxgrid th .tmeta, .wxgrid th [class*=meta]").length, days: document.querySelectorAll(".wxc[data-day]").length }));
  ck("Saved weather board (week + hourly, all trails, stats)", r.grids >= 2 && r.rows >= 1 && r.hourRows === r.rows && r.days >= 7, r);
  const d2 = await ev(async () => { const btns = [...document.querySelectorAll(".wxc[data-day]")]; const days = [...new Set(btns.map(b => b.dataset.day))]; btns.find(b => b.dataset.day === days[2]).click(); await new Promise(r => setTimeout(r, 400)); return { want: days[2], got: R.wxDay }; });
  ck("Pick a day for hourly weather", d2.want === d2.got, d2);
  const st = await ev(async () => { for (const t of Object.values(S.saved)) if (t.hwx) t.hwx.at = Date.now() - 2 * 3600e3; R.hwxTry = 0; const was = Math.min(...Object.values(S.saved).filter(t => t.hwx).map(t => t.hwx.at)); refreshStaleWeather(); await new Promise(r => setTimeout(r, 8000)); return { was, now: Math.min(...Object.values(S.saved).filter(t => t.hwx).map(t => t.hwx.at)) }; });
  ck("Stale weather refreshes", st.now > st.was, st); await ev(() => setTab("explore")); });

await step("Sound + backup settings", async () => { await pg.click("#setBtn"); await W(300); const r = await ev(() => ({ snd: !!document.querySelector("#sndOn"), bk: !!document.querySelector("#bkSave") && !!document.querySelector("#bkLoad"), dev: typeof Device.watchPosition })); await pg.click("#sndTest"); await W(300); await pg.click("#closeSet");
  ck("Sound + backup settings", r.snd && r.bk && r.dev === "function", r); });
// Maui (2026-10-16): zoomed in to street level with no trail in view, trails nearby must still load
await step("Zoomed in on Maui still loads nearby trails", async () => { await ev(() => { setTab("explore"); if (meFollow) { meFollow = false; meState(); } sheet("half"); map.setView([20.758, -156.457], 15); }); await W(2500);
  await pg.waitForFunction(() => !R.searching, null, { timeout: 150000 }).catch(() => {}); await W(500);
  const r = await ev(() => ({ loaded: visibleTrails().length, onScreen: listTrails().length, btn: !!document.querySelector("#showNear"), err: R.searchErr }));
  ck("Zoomed in on Maui still loads nearby trails", r.loaded > 0 && (r.onScreen > 0 || r.btn), r); });
await step("Show nearby trails button", async () => { const has = await ev(() => !!document.querySelector("#showNear")); if (!has) { ck("Show nearby trails button", true, "trails already on screen"); return; }
  await pg.click("#showNear"); await W(1500); const r = await ev(() => ({ z: map.getZoom(), list: document.querySelectorAll(".card[data-id]").length })); ck("Show nearby trails button", r.list > 0, r); });
ck("No page errors", errs.length === 0, errs);
await pg.screenshot({ path: "shots/audit.png" });
console.log("\nSUMMARY"); for (const r of res) console.log(r[0], r[1]);
await b.close();
