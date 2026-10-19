# Switchback vs AllTrails (updated 2026-10-18)

Switchback now copies AllTrails' layout and features. It has no ads, no "Plus" upsells and no paywalls.

## Now built like AllTrails

| AllTrails | Switchback |
|---|---|
| Bottom tabs: Explore, Saved, Navigate, Profile | The same four tabs. Community is left out (see below). |
| Explore: search bar, filter pills, full Filters sheet | The same. Filters cover activity, difficulty, length, elevation gain, rating, route type, attractions (waterfall, views, lake, river, beach, forest, wildflowers, wildlife, cave, historic site, hot springs), suitability (dog, kid, wheelchair and stroller friendly, paved) and sort order. |
| Photo trail cards with a heart to save | The same. The picture is a topo map of the trail. It's replaced by a nearby Wikimedia photo when there is one. |
| Map / List toggle | The same. |
| Map layers: map types plus overlays | Map types: Topo, OpenTopo, Street, Satellite. Overlays: rain radar, wildfires (US), light pollution, marked hiking routes. |
| Trail page: photo, difficulty, rating, location | The same, with the trail map as the main picture. |
| Buttons: Navigate, Directions, Save, Download, Share | The same five. |
| Length, elevation gain, estimated time | The same. Uses AllTrails' numbers when the trail is an AllTrails trail. |
| Description and tag chips | A description in AllTrails' style, written from the trail's data, plus activity and feature tags. |
| Waypoints, weather, elevation profile, photos | Highlights along the trail, a 7-day forecast plus current air quality, the elevation profile, and Wikimedia photos. |
| Reviews | Your own star rating, notes and date hiked, kept on your phone. |
| Nearby trails | The same, as a row of cards. |
| Save to lists, create lists | The same, with a list sheet like AllTrails'. |
| Offline maps, Navigate with off-route alerts | The same. Navigate also records your hike, and finishing marks the trail completed. |
| Profile: stats, completed trails, activities, reviews | The same. |

## Still different, and why

- **Recent reviews and photos from other hikers.** This is AllTrails' own content, and copying it is ruled out. Switchback links to AllTrails and to trip-report sites instead.
- **AllTrails data only covers North Bend, Waikiki and Maui.** Ratings, tags and AllTrails' lengths exist only for areas you've asked me to add. Name a place to add it.
- **Community tab (friends, feed, leaderboards).** Left out. It needs accounts and a server.
- **Accounts and sync.** Your data lives on your phone; use Settings → Save backup file. A Supabase sign-in is ready to add once you send the project URL and anon key.
- **Lifeline (live location sharing) and 3D maps.** These need a server and paid map data.
- **Heatmap of where people hike.** There's no free data source for it.
- **GPS with the screen locked, lock-screen alerts, Apple Watch.** These need the native iPhone app (Capacitor), which is the planned next step.
