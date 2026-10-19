# Switchback vs AllTrails (iPhone app): independent comparison

Reviewed 2026-10-18. Switchback source: `/home/claude/switchback/index.html` (CSS lines 678-1036, markup 1038-1127, app script 1137-2969), `sw.js`, `alltrails.json` (3 areas: North Bend WA 20 trails, Honolulu 28, Maui 113).
Screenshots (390x844 @2x, mocked network, served over http://127.0.0.1 so `alltrails.json` loads) are in this folder: `01-…` to `31-…png`. Scripts: `r.py`, `r2.py`.
The mock affects some content. The forecast dates are in the past, so the trailhead weather shows "unavailable". Highlights are empty, and the land-manager lookup returns the mock's trail names ("Alerts and closures: Main St"). None of that is counted as a Switchback bug.

AllTrails reference: current app (tabs Explore / Saved / Navigate / Activity(Community) / Profile). Help-center pages consulted: "Understanding the AllTrails App", "AllTrails Base membership", "Benefits of premium membership", "Map types, overlays and extras", "Using the Navigate feature", plus the June 2026 "newest tools" press release and the May 2025 Peak launch coverage. Sources are at the end.

---

## 1. Screen-by-screen table

| Area | AllTrails | Switchback (what I saw) | Verdict |
|---|---|---|---|
| **Tab bar** | 5 tabs: Explore, Saved, Navigate, Activity/Community, Profile | 4 tabs: Explore, Saved, Navigate, Profile (1062-1067; `01`) | partial (no Activity/Community tab) |
| **Onboarding** | Sign-up/login, activity preferences, location permission primer, optional Plus pitch | None. Location is requested on load without a primer (1842-1846). No first-run screens | missing (minus the upsell) |
| **Account / sync** | Account, cloud sync across devices, web | Everything is in localStorage. Backup is a JSON file (2322-2336) | missing (needs server) |
| **Explore: search** | One search box for trails, parks and cities, with recent searches and typed suggestions (trails first) | Searches places only, via Open-Meteo geocoding (1300-1306, 1722-1733). Typing "Rattlesnake Ledge" suggests only "North Bend" (`02`). No trail or park name search, no recents | partial |
| **Explore: home / discovery** | Curated sections ("Trails near you", popular, lists, parks), last-viewed trail suggestion | No discovery feed. The list is "trails on the map", or "Find a trail" when there is no area (1903; `31`) | missing |
| **Explore: filter chips** | Horizontal pill row; full-screen filter sheet | Pill row (`03`) plus a centred modal (`07`,`08`). Filters: sort, activity (hike/bike/both), difficulty, length buckets, gain buckets, rating, route type, attractions, suitability (1660-1669) | partial: buckets instead of range sliders. Activities limited to 3 (AT has about 15). No "distance away", trail traffic, completed/not completed or "show closed" filters |
| **Explore: trail cards** | Photo carousel (swipe), heart, name, park, difficulty, rating **with review count**, length, est. time | Map thumbnail (Wikimedia photo when found), heart, name, place, distance, difficulty, ★ rating (AT areas only, **no count**), length, gain, est. time (1879-1890; `04`) | partial |
| **"More on AllTrails" cards** | n/a | AT trails without geometry show as grey "Tap to find it on the map" boxes (2671-2675; `05`) | rough |
| **Explore: map** | Map/List toggle, trail pins at every zoom (clustered), polylines when zoomed in, "Search this area", layers, 3D, locate | Map/List toggle (`09`). Polylines coloured by difficulty plus a trailhead dot. **Nothing loads below zoom 10** (1529, 1537; `31`). "Search trails in this area" button exists but is never shown (only `.remove("show")`, 1538/1863/1949). Auto-search on pan instead | partial |
| **Map preview card** | Tap trail: bottom card with photo, stats, swipe between results | Card with thumbnail, chips, stats, prev/next and swipe (2799-2848; `11`) | match (but stats disagree with trail page: see bugs) |
| **Bottom sheet** | Draggable sheet with snap points | Handle is a **button that cycles** peek/half/full on tap. No drag (1851) | partial |
| **Map layers: base** | AllTrails, Satellite, Terrain, Road, OSM, OCM, USGS Topo, IGN, OS GB | OpenTopo, Street (OSM), Topo (Esri), Satellite (Esri) (1418-1423; `10`) | partial (no own outdoor style; Esri/OSM tiles fine) |
| **Map layers: overlays** | Personal heatmap, US wildfires, community heatmap, precipitation, temperature, fall foliage, snow depth, ground conditions, public/private lands, slope angle, HD terrain | Waymarked hiking routes, rain radar (RainViewer), wildfires (NIFC), light pollution (NASA) (1439-1444) | partial (4 of about 12; no slope, public lands, snow, personal heatmap) |
| **Map extras** | Surface type, waypoints, nearby trails, POIs, distance markers | Trail POIs ("highlights") on the open trail only (2417-2420). The rest is missing | partial |
| **3D map** | 3D terrain view (Plus) | None | missing |
| **Trail page: hero** | Full-width photo carousel, photo count | Small non-interactive Leaflet map (2525-2544; `12`). Photos are a Wikimedia strip further down, often empty | partial |
| **Trail page: header + actions** | Name, difficulty, ★ rating (n reviews), park; actions Navigate, Directions, Save, Download, Share, "…" (print, suggest edit, send to device) | Name, difficulty, ★ rating (no count), AT chip, place; Navigate, Directions, Save, Download, Share (1993-2000; `12`) | match-ish (no review count, no overflow menu) |
| **Trail page: stats + description** | Length, elev gain, route type, est. time; templated description | Length, gain, est. time; templated description copying AT's wording (2001-2007, 2082-2091); tag chips | match |
| **Trail page: elevation profile** | Interactive chart linked to map | SVG profile, drag cursor moves a dot on the main map (2103-2124; `13-trail-0`) | match (only one-way profile for out-and-backs) |
| **Trail page: weather/conditions** | Weather; Plus "Trail Conditions": hourly grid along trail, 15 weather factors, ground conditions, snow depth, bugs, AQI | 7-day daily forecast, sunrise/sunset, US AQI (2022-2031); links to WTA, AT reviews and land-manager alerts (2747-2779) | partial |
| **Trail page: reviews/photos/activities tabs** | Community reviews with rating breakdown, photos tab, recent activities, "Verified completed" | Personal 1-5 stars + notes + date, stored locally (2033-2038). No community content | missing (AT's own content is off-limits. A Switchback community needs a server) |
| **Trail page: waypoints/POIs** | Curated waypoints (viewpoints, water, campsites) with photos | OSM POIs within 150-500 m listed with distance "at 1.2 mi" (2363-2416) | partial |
| **Trail page: getting there / parking** | Directions; parking info | Trailhead coords, its source, Google/Apple Maps links, copy, OSRM drive time from a set home (2016-2020) | match |
| **Trail page: nearby trails** | Carousel | Carousel with map thumbnails (2056-2058; `13-trail-3`) | match |
| **Trail page: visitation / busy times** | Busy/quiet by time (Plus) | Only AT's static traffic word for AT-listed trails (2669) | missing (AT data off-limits) |
| **Trail page: print map** | Printable map with scale/grid (Plus) | None | missing |
| **Trail page: GPX / send to watch** | Export GPX; send to Garmin/COROS | GPX download (2059, 2312) | partial |
| **Custom routes / route planner** | Draw route, snap to trails, smart routing (shorter/flatter/scenic), edit existing trail | None | missing |
| **Navigate: start** | Full-screen map with Start; pick activity type; follow a trail or record freely | "Navigate" on a trail page starts following and recording at once (2872-2886). The Navigate tab is a text page with "Record without a trail" (2231-2261; `17`) | partial |
| **Navigate: in-activity UI** | Map with traveled line (blue) over route (green); bottom drawer with time, distance, elevation, pace; pause/finish; add photo/waypoint | Top banner with progress ("x done, y left"), elevation, next POI, off-trail state (2919-2938; `15`,`16`). Time/distance/gain only on the Navigate tab (`17`). No pace. No pause on the map screen. Recorded line is drawn (2287) | partial |
| **Wrong-turn alerts** | Off-route notification (Plus), works locked | Off-trail and back-on tones, 60 s reminders (2905-2918). Screen must be on; no vibration on iPhone web | partial (web limits) |
| **Background / lock-screen tracking** | Yes | No. Wake Lock keeps the screen on (1177-1178, 2870). Capacitor plan is noted in the Device layer | needs native app |
| **Live share (Lifeline)** | Real-time location sharing link | None | missing (needs server) |
| **Activity summary / detail** | Summary screen after finish; activity page with map, stats, splits, elevation chart, photos; edit | Finish uses `prompt()`/`confirm()` (2298-2300, 2889-2892). Activities list shows only Map / GPX / Delete (2246-2248). No detail page | missing |
| **Saved: lists** | Default + custom lists, cover photos, map of a list, reorder/rename, share, follow others' lists, privacy | Want to go, Completed, custom lists; create, delete, share code, show on map (2141-2163; `19`). No rename, no reorder, no cover image | partial |
| **Saved: downloaded maps** | "Maps" section listing offline trails/parks/areas, sizes | Only an "Offline" chip on cards and a tile count in Settings (2348). No list of downloads | partial |
| **Offline maps** | Offline trails, offline parks, custom offline areas, auto-download of 5 recent trails | Per-trail tile download z11-17 into Cache Storage, with SW serving tiles (2479-2513, sw.js) | partial (no areas or parks, no auto-download) |
| **Saved: activities & custom routes** | In Saved | Activities live in the Navigate tab. No custom routes | partial |
| **Saved: trailhead weather board** | none | Hourly "hike score" grid across saved trails (2546-2634) | extra (Switchback only) |
| **Profile** | Avatar, name, stats by period (year/month, all-time), activities, photos, reviews, completed trails, badges/achievements, followers, personal heatmap | Totals: completed count, distance/climb on completed trails, saved count, recording totals, your reviews, completed list (2208-2228; `20`) | partial (no avatar or name, no period charts, badges or heatmap) |
| **Activity / Community tab** | Feed of nearby and followed activity | None | missing (needs server) |
| **Settings** | Account, units, privacy, notifications, Navigate prefs (auto-pause, audio cues), connected apps (Health, Garmin), dark mode | Map trail filters, off-trail sound, units, home location, offline delete, backup/restore, erase (1089-1127; `21`) | partial |
| **Dark mode** | Yes | Yes for UI chrome (691-695; `23`). Map tiles stay light | match |
| **Widgets / Watch / Health** | iOS widgets, Apple Watch app, Apple Health | None | needs native app |
| **Outdoor Lens, Trip/Route Assistant** | Camera plant ID; AI itinerary (Peak/Plus) | None | missing (low priority) |

---

## 2. Gaps ranked by how much a user notices them

Feasibility key: **Static** = buildable in a static web app with free data. **Server** = needs a backend or account. **Native** = needs the Capacitor app. **Off-limits** = AllTrails' own content.

1. **Search doesn't find trails or parks.** AllTrails' main entry point is typing a trail name. Switchback only geocodes places (1300-1306, 1722-1733). `02-search-trailname.png` shows "Rattlesnake Ledge" suggesting only North Bend.
   Static: search loaded trails and `alltrails.json` names locally; add Overpass name search (the `openAT` regex search at 2711-2725 already does it); add Nominatim/Photon for parks; keep recents in localStorage.
2. **No photos on most trails.** AT cards and the trail-page hero are photo carousels. Switchback shows a topo thumbnail unless Wikimedia has a geotagged JPEG within 1.5 km (2792-2797). The hero is a small static map (2525; `04`, `12`). "More on AllTrails" cards are grey placeholders (`05`).
   Static (Wikimedia/Mapillary, limited coverage). AT photos are off-limits. User-added photos need a server for sharing, or stay local.
3. **No community reviews, review counts or activity feed.** The trail page has only your own stars and notes (2033-2038). Cards show ★ without a count. There is no Activity tab.
   AT reviews are off-limits. A Switchback community needs a server. The rating count from the connector data could be shown if the connector returns it (it isn't in `alltrails.json`).
4. **Ratings, difficulty and tags exist only in 3 AT areas.** Everywhere else, difficulty is a length/climb heuristic (1258-1263). Attractions are guessed from the trail name (1637-1639). The rating filter matches only AT trails (1685).
   Off-limits to copy AT wholesale. Static: improve with OSM `sac_scale`, POIs along the trail (already loaded as highlights) feeding the attraction filters, and DEM slope.
5. **Navigate screen is not AllTrails' recording screen.** There is no full-screen "Start" map, and no bottom stats drawer (time, distance, pace, elevation) on the map. Pause/Finish are only on the Navigate tab (`15`-`17`). Finishing uses `prompt()`/`confirm()` (2298, 2891). There is no summary screen and no activity detail page (2246-2248).
   Static.
6. **Bottom sheet can't be dragged.** The handle cycles sizes on tap (1851). AllTrails' sheet follows the finger and snaps. This affects every screen.
   Static.
7. **No custom route builder or route planning (Peak).** Nothing in the code.
   Static-ish: draw on map plus snap-to-trail routing over the loaded OSM graph in the browser, or free BRouter/GraphHopper public endpoints; DEM for profile.
8. **Offline is per-trail only.** No offline areas or parks, no auto-download of recent trails, no "Downloaded maps" list (2479-2520). Offline also doesn't cover search, because trails come from live Overpass.
   Static (Cache Storage limits on iOS around 1 GB and eviction risk). Robust offline needs Native.
9. **Nothing on the map below zoom 10, and no clustering.** AllTrails shows trail pins when zoomed out. Switchback returns early (1529, 1537), so a zoomed-out map is empty with "Find a trail" (`31`). Only AT trails are pre-known.
   Static for AT areas. For OSM it needs a pre-built trail index (static file per region) or a server.
10. **No 3D terrain.** Static: MapLibre GL with free terrain-RGB DEM tiles (e.g. AWS Terrain Tiles). This means replacing Leaflet or adding a 3D view.
11. **Map overlays are thinner.** No slope angle, public lands, snow depth, precipitation/temperature, personal heatmap or surface type. There are no waypoints/POIs on the main map (only on an open trail).
    Static: slope from DEM, PAD-US public lands tiles, NOAA/Open-Meteo weather layers, personal heatmap from `S.recs`. Community heatmap is off-limits (Strava's heatmap needs login).
12. **No accounts, sync or multi-device.** localStorage only, plus a manual backup file (1119, 2322). iOS Safari can evict storage after 7 days of non-use for non-installed sites.
    Server (or iCloud via Native).
13. **No background or lock-screen tracking.** Recording and off-trail alerts stop when the screen locks (1105, 2236). No vibration on iPhone.
    Native (Device layer is ready at 1169-1203).
14. **No live share / Lifeline.** Server.
15. **No onboarding.** Location is requested immediately with no primer (1842). There is no units/activity preference step. The empty state is minimal (`30`, `31`).
    Static.
16. **Filters are coarser than AT's.** Fixed buckets instead of sliders (1649). 3 activities vs about 15. No "distance away", completed/not completed, traffic or "closed" filters.
    Static (traffic: off-limits beyond the connector's `tf`).
17. **Profile is thin.** No avatar or name, no year/month charts, no badges/achievements, no photos, no personal heatmap or map of everything hiked (2208-2228).
    Static (local).
18. **Trail page misses AllTrails sections.** No photo/review tabs, no curated waypoints with photos, no print map, no "…" menu (suggest edit is the OSM link, 2050). Trail Conditions is daily, not an hourly along-trail grid (2022-2031). No busy-times info.
    Static for print (`window.print` with map), hourly conditions (Open-Meteo hourly is already fetched for Saved, 2559) and snow depth (Open-Meteo `snow_depth`). Busy times are off-limits.
19. **Saved lists are basic.** No rename, reorder, cover photo or privacy. You can't follow other people's lists. Activities and downloaded maps aren't in Saved.
    Static except following (Server).
20. **No widgets, Apple Watch, Health, Garmin/COROS.** Native. Garmin also needs an API partnership.
21. **No Outdoor Lens or AI trip assistant.** These are low value. A trip assistant would need a server or LLM.

Things where Switchback is at parity or better (credit given only where seen):
- Map/List toggle and preview-card swiping (`09`, `11`)
- Draggable elevation-profile cursor (2115-2124)
- Off-trail tones
- GPX import and export
- Share codes
- Drive time
- AQI
- Rain radar, wildfire and light-pollution overlays
- Saved-trail hourly weather "hike score" board, which AllTrails doesn't have

---

## 3. Bugs and rough edges

1. **Saved trails never get their elevation stored (real bug).** At line 1963, the statement that should update the saved copy is inside a `//` comment on the same line:
   `S.elev[t.id]=t.elev; ... // saved trails keep their own copy if (S.saved[t.id]) S.saved[t.id].elev=t.elev; save();`
   So `S.saved[id].elev` stays null if you saved before the climb loaded, and `save()` isn't called. I verified this: saved a trail, ran `computeElev`, got `savedElev:false, liveElev:true` (`r2.py`). Effects:
   - Offline trail page has no profile.
   - Profile's "Climbed on completed trails" undercounts OSM trails (2210).
   - The `S.elev` cache isn't persisted until some other save.
2. **Preview card shows different numbers from the list card and trail page.** `drawPreview` (2815-2823) uses OSM geometry (`t.len`, `t.elev`, `estHours`), not `tinfo()`. Two cases I saw:
   - Rattlesnake Ledge: preview "3.8 mi round trip, ↗1,179 ft". Card and trail page show AllTrails' 5.5 mi, 1,463 ft (`r2.py` output).
   - Mount Si: preview "7.8 mi, ↗1,204 ft" vs page "7.6 mi, 3,136 ft" (`11` vs `12`).
3. **Est. time doesn't match the displayed gain.** When AT has no `m`, `tinfo` uses `estHours(t)` from OSM DEM climb while showing AT's gain (1647). The list card's estimate jumps from 2h59m to 3h39m once the DEM loads (`04` vs `19`).
4. **The Navigate banner covers other screens.** `#nav` (z-index 30, 880) stays on top across Saved and Profile and hides the top of the sheet (`19`, `20`). It also hides the zoom-in button when the subtitle wraps to 2 lines. `margin-top:96px` (882) is too small (`16`).
5. **"x mi to the trailhead" is shown in red off-trail styling.** `isOff` is set even beyond 1500 m (2905-2909) (`16`). Because `offAt` is never set in that path, the 60-second off-trail reminder (`Date.now()-undefined` is NaN) never fires if you start navigating away from the trail and then reach it off-route.
6. **Settings button uses the same sliders icon as the Filters pill** (1048 vs `FILTER_IC` 1677). Users will tap it expecting filters (`01`).
7. **AllTrails data won't load in the planned Capacitor app.** `fetch("alltrails.json")` only runs when `location.protocol` is `http(s)` (2650). Capacitor iOS serves from `capacitor://localhost` by default.
8. **Deleting a custom list leaks offline tiles.** It deletes `S.saved[id]` without `dropOfflineTiles` (2159). `toggleList` does call it (2134).
9. **"Search trails in this area" button is dead code.** It is never shown, and below zoom 10 the map silently shows nothing (`31`).
10. **Peek sheet keeps the list scroll position**, so peek shows half a card instead of the "N trails" header (`06`).
11. **Leaflet attribution and scale bar show at the top when the sheet is full**, poking out behind the search bar (`04`, `12`). The floating Map button covers each card's stats line (`01`, `03`, `23`).
12. **Native `prompt()`/`confirm()` chains.** Ending Navigate can raise 2 confirms in a row (2889-2892). Naming a hike uses `prompt()` (2298). Copy falls back to `prompt()` (2317).
13. **Hidden side effects.**
    - Tapping a star marks the trail Completed (2070-2071).
    - Tapping Download silently adds the trail to "Want to go" (2068).
14. **The location button shows the active (blue) state before any fix or permission** (`30`, `31`; `meState` at 1760 keys on `meWatch`, not on a fix).
15. **Trail-page hero map is not interactive.** Tapping it collapses the sheet with a toast (2537). AllTrails opens a full-screen trail map.
16. **Elevation-gain filter drops trails whose climb hasn't loaded yet** (1653). Results change as data streams in. This is disclosed in the UI but feels unstable.
17. **Filters and layers are centred modal dialogs** (`07`, `10`), not bottom sheets as on iPhone. The "Settings" link in the layers sheet is unstyled browser-blue (`10`).

## Sources
- [Understanding the AllTrails App](https://support.alltrails.com/hc/en-us/articles/44409942124052-Understanding-the-AllTrails-App)
- [AllTrails Base membership](https://support.alltrails.com/hc/en-us/articles/37202982202900-AllTrails-Base-membership)
- [Benefits of AllTrails premium membership](https://support.alltrails.com/hc/en-us/articles/43589223013652-The-benefits-of-AllTrails-premium-membership)
- [AllTrails map types, overlays and extras](https://support.alltrails.com/hc/en-us/articles/37228180990228-AllTrails-map-types-overlays-and-extras)
- [Using the Navigate feature](https://support.alltrails.com/hc/en-us/articles/37228358315668-Using-the-Navigate-feature)
- [AllTrails: Our newest tools for the trail (June 2026)](https://www.alltrails.com/press/our-newest-tools-for-the-trail)
- [Advnture: AllTrails biggest update in a decade (May 2025)](https://www.advnture.com/hiking/youll-always-be-a-step-ahead-alltrails-rolls-out-biggest-update-in-over-a-decade-with-6-new-features-heres-what-were-most-excited-about)
