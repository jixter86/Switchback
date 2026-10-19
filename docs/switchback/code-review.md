# Switchback code review (2026-10-13)

**Verdict:** The basic design holds up and the app works. The network code is careful: Overpass failover, request batching and rate-limit back-off. The trail geometry and the weather scoring are solid. Most of the weak spots come from features added quickly on top of each other. Code for one feature is spread across the file, the same math appears in several places, and the panel redraws everything on every change. Nothing needs a rewrite. All of it can be fixed in small steps.

Files: `index.html` (about 1,400 lines of app code, about 150 KB of inlined Leaflet, plus CSS), `sw.js` (offline cache) and `alltrails.json`.

## Fixed today (live)

| # | Problem | Fix |
|---|---|---|
| 1 | **Security:** trail names in map tooltips were inserted as raw HTML. A crafted OpenStreetMap name or share link could run script in the app. | Names are now escaped (tested with a malicious share code: nothing ran). |
| 2 | A bad share code or GPX file could save a trail with no coordinates. The Saved tab then crashed on every visit until you erased everything. | Every imported trail is checked first, and bad entries are skipped. |
| 3 | Two searches close together (for example, picking a place twice) could let the older, slower answer overwrite the newer area's trails. | Late answers from an old search are ignored. |
| 4 | AllTrails matching re-ran name cleanup for every trail inside every sort, and again on every GPS fix. It was estimated at about 150-250 ms per fix on an iPhone. | Lookup tables are built once when the AllTrails data loads (50 list builds now take about 1 ms). Trail snapping no longer re-sorts the list. |
| 5 | The whole saved state was written to storage on every map move, including each follow-mode recenter. | Map-position saves are batched and flushed when you leave the app. |
| 6 | The long "how to turn location back on" message disappeared after 3 seconds. | It now stays up for 9 seconds. |
| 7 | Opening a shared trail shorter than 800 m could silently fail to load its map line. | Fixed, and a message now shows if the line can't be found. |

## Worth doing next, ranked

**Update (same day):** items 1-7 below are done and live, along with the duplicate math and dead state from the structure list. All 34 live checks pass. Still open on purpose: moving Leaflet to its own file, renaming the short variable names and fully reordering the sections. They're low value and carry some risk of breaking things.

1. **One location watcher instead of three.** The blue dot, Navigate and Recording each run their own high-accuracy GPS watch. While navigating, every fix is processed twice, which costs battery. Recording also skips the new smoothing. One watcher should feed all three.
2. **Stop full redraws.** `render()` rebuilds the whole panel and every map line for small updates: up to 15 times while climb data fills in, once per finished detail-page job, and on every recording fix. It can wipe text you're typing in Notes and costs CPU. Update only the part that changed.
3. **Recording can be lost.** A hike in progress only lives in memory, so a reload or iOS closing the tab loses it. Cancelling the name prompt still saves it. Save points as you go.
4. **Storage size.** Elevation profiles (up to 300), hourly forecasts and recordings all live in one localStorage blob that can reach 1-2 MB, against a cap of about 5 MB. Move the big caches to IndexedDB, or cap them.
5. **Offline maps.** Unsaving a trail never deletes its tiles, which can be about 10-60 MB each. The app also doesn't ask the browser to keep storage, and Safari can evict it after 7 days unless the app is on the Home Screen. Delete tiles on unsave, request persistent storage, and suggest Add to Home Screen.
6. **Slow start with weak signal.** `sw.js` waits for the network before using the cached app, so with weak signal at a trailhead, startup can hang. Fall back to the cache after about 3 seconds.
7. **Stale weather offline.** Cached forecasts label their first day "Today" even when it's days old. Label days by actual date and show the forecast's age.

## Structure (housekeeping, lower priority)

- The location code (about 130 lines) sits inside the "searching" section. The preview card and AllTrails code sit far from the code that uses them. Suggested order: state → geometry → network → data (OSM + AllTrails) → location → map → views → boot.
- Point-to-line distance math appears three times, with slightly different earth constants. The path-building code appears twice.
- About 14 state fields are created ad hoc instead of declared up front, and a few are dead (`R.layers`, `R.wxOld`, `compassAsked`).
- Moving the unchanging Leaflet library into its own cached file would halve `index.html`. Splitting the app into modules is optional at this size.
- Names are very terse (`R`, `S`, `hk`, `meF`, `hwx`). They're fine for now, but hard for anyone new to follow.
