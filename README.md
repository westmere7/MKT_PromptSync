# RMIT PromptSync

Remote-controlled teleprompter for phone-and-mirror rigs. The phone sits in the teleprompter and
only displays; a host device (desktop or second phone) controls everything live: script, scroll
speed, font size, current segment, and highlights — no more pulling the phone out of the rig
between takes.

## How it works

- **Host** opens `/host` → **New session** → gets a 4-letter code (e.g. `CBHU`) and a **QR code**.
- **Phone** opens `/display` and either **scans the QR** (which deep-links to
  `/display?code=CBHU` and auto-connects) or types the 4-letter code. The host header shows a
  green "display connected" status.
- **Calibration**: on first connect the phone starts in calibration mode. Drag the top and bottom
  bars so they frame exactly what is visible through the mirror, then tap **Save calibration**.
  The desktop preview then shows precisely the text band the talent can see.
- **Prompting**: the host controls play/pause, speed, font size/family, line height, mirror flip,
  segment jumps and per-segment highlights. All changes apply on the phone instantly.

Anyone who opens `/host?code=XXXX` co-hosts the same session — no login, the code is the key.

### Session persistence

Session state (script, segments, settings, calibration, highlights) lives at `sessions/{code}` in
RTDB and is **independent of any connection**. When every device disconnects, only the per-device
presence entries under `displays/` are removed (via `onDisconnect`); the script and all settings
remain, so reopening the same code resumes exactly where you left off.

**Sessions never auto-expire** — a script stays until you remove it with the **Clear** button in
the Script panel. There is no TTL and no world-readable list of sessions, so codes remain the only
key. (Trade-off: sessions that are created and never cleared accumulate in the database. For an
internal tool this is negligible; if you ever want automatic cleanup, add a scheduled Cloud
Function that deletes old sessions by `createdAt`.)

### Sync model

The host never streams scroll positions. It writes a compact playback anchor
(`anchorEm` + `anchorTime` + `speed`) to Firebase Realtime Database; every device computes the
current position locally each animation frame against the shared Firebase **server clock**
(`.info/serverTimeOffset`). Result: 60 fps scrolling on the phone, an in-sync desktop preview, and
almost no network traffic while rolling.

The desktop preview reproduces the phone's exact line wrapping by rendering the script at the same
width **in em units** as the phone (phone width ÷ font size), scaled to fit the preview pane. This
is also how segment jumps know each segment's scroll offset.

## Tech stack

| Layer      | Choice                              | Why                                                       |
| ---------- | ----------------------------------- | --------------------------------------------------------- |
| Framework  | Next.js 15 (App Router) + React 19  | One repo, two routes, zero-config Vercel deploys           |
| Styling    | Tailwind CSS v4                     | Fast to iterate, touch-friendly utilities                  |
| Realtime   | Firebase **Realtime Database**      | Lower latency than Firestore, `onDisconnect` presence, server clock offset |
| Hosting    | Vercel                              | Static/client app, no server code needed                   |

## Setup

### 1. Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com) (Analytics not needed).
2. **Build → Realtime Database → Create database** (pick the region closest to your shoots).
3. In the **Rules** tab, paste the contents of [`database.rules.json`](./database.rules.json) and publish.
4. **Project settings → General → Your apps → Add web app**, copy the SDK config values.

### 2. Local dev

```bash
cp .env.local.example .env.local   # then fill in the Firebase values
npm install
npm run dev
```

Open `http://localhost:3000` on the desktop and on the phone (same LAN, use the machine's LAN IP).
Note: fullscreen + wake-lock work best over HTTPS; on plain LAN HTTP some phone browsers restrict
them, so for real shoots use the deployed URL.

### 3. Deploy (Vercel)

Import the GitHub repo in Vercel, add the same `NEXT_PUBLIC_FIREBASE_*` variables under
**Project → Settings → Environment Variables**, deploy. No other configuration needed. The QR
codes automatically use the deployed origin, so scanning them opens the deployed `/display` page.

## Data model (`sessions/{CODE}` in RTDB)

```
createdAt    server timestamp
mode         'calibrate' | 'prompt'
script       raw script text
segments[]   { id, name, text, highlighted?, highlights?[{start,end}] }  — parsed from the script
settings     { fontSize(px), speed(em/s), lineHeight, fontFamily, mirror, highlightColor }
playback     { playing, anchorEm, anchorTime, segmentIndex }
calibration  { top, bottom }                          — fractions of the phone screen height
displays{}   { w, h, dpr, joinedAt } per connected phone — removed automatically on disconnect
```

## Script format

```
# Intro
Lines under a heading belong to that segment.

# Talking point 2
Without any # headings, each blank-line-separated paragraph becomes its own segment.
```

## Known limits / roadmap

- Sessions never auto-expire; they persist until cleared manually. Add a scheduled cleanup job if
  you want old sessions reclaimed automatically.
- Rules are open to anyone who knows/guesses a code; fine for internal use, add App Check or
  auth if the URL becomes public.
- No countdown before roll (3-2-1) yet.
- iOS Safari does not support programmatic orientation lock — rotate the phone manually; wake
  lock requires iOS 16.4+.
- Speed is in lines/second (em-based), so it scales naturally with font size.
