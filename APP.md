# Turning Switchback into a phone app

Switchback is written so it can be wrapped as an iPhone/Android app with [Capacitor](https://capacitorjs.com) without a rewrite. The web version stays as it is; the app loads the same `index.html`.

## The one place to change: `Device` in index.html

Every phone feature (GPS, keeping the screen on, vibration, sounds, notifications, files, sharing) goes through the `Device` object near the top of the script. Nothing else in the app calls those browser APIs. For the app, rewrite only these functions:

| Device function | Web today | App plugin |
|---|---|---|
| `watchPosition(onFix, onErr)` returns a stop function | `navigator.geolocation.watchPosition` (stops when the screen locks) | `@capacitor-community/background-geolocation`: keeps tracking in your pocket. Convert its location to `{ coords:{ latitude, longitude, accuracy, altitude, speed, heading }, timestamp }`. |
| `getPosition()` | `getCurrentPosition` | `@capacitor/geolocation` |
| `keepAwake()` | Screen Wake Lock | `@capacitor-community/keep-awake` (optional once background GPS works) |
| `buzz(pattern)` | `navigator.vibrate` (iPhone ignores it) | `@capacitor/haptics` |
| `tone(notes)` / `unlockSound()` | Web Audio | Works as is |
| `notify(title, body)` | Web Notification (unreliable) | `@capacitor/local-notifications`: lock-screen off-trail alerts |
| `saveFile(name, text, type)` / `pickFile(accept)` | Share sheet / download, file input | `@capacitor/filesystem` + `@capacitor/share` |
| `shareText(title, text, url)` | `navigator.share` | `@capacitor/share` |
| `copyText(text)` | Clipboard API | `@capacitor/clipboard` |

`Device.isApp` is true inside the app; share links already point at the public site (`PUBLIC_URL`) when running as an app.

## Other notes

- **Storage:** app data is in `localStorage` under `switchback.v1` (and `switchback.v1.rec` for a recording in progress). It works in the app's web view. The backup file format (Settings → Save backup file) is the same in both, so you can move your data from the website to the app.
- **Offline tiles:** `sw.js` caches map tiles. Service workers don't run in Capacitor's iOS web view, so the app version needs tile caching through `@capacitor/filesystem` instead. `saveOffline()` and `tileList()` already build the list of tiles to fetch.
- **Compass:** iPhone's compass permission prompt (`DeviceOrientationEvent.requestPermission`) works the same in the app.
- **Steps:** `npm i @capacitor/core @capacitor/cli`, `npx cap init Switchback com.jixter86.switchback --web-dir .`, `npx cap add ios`, then open in Xcode (needs a Mac and an Apple Developer account to install on a phone).
