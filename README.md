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
- **Prompting**: the host controls play/pause, skip to start/end, ±5s nudge, speed, font
  size/family, line height, mirror (horizontal/vertical), segment jumps and per-segment
  highlights. All changes apply on the phone instantly.
- **Scrubbing**: on the host, drag/wheel over the preview or drag the **scrub slider** to move to
  any position (paused). On the phone, **drag the prompter up/down** to scrub — this live-syncs
  back to the host and any co-hosts. A quick tap on the phone toggles the status overlay.

Anyone who opens `/host?code=XXXX` co-hosts the same session — no login, the code is the key.

### Session persistence & expiry

Session state (script, segments, settings, calibration, highlights) lives at `sessions/{code}` in
RTDB and is **independent of any connection**. When every device disconnects, only the per-device
presence entries under `displays/` are removed (via `onDisconnect`); the script and all settings
remain, so reopening the same code within the week resumes exactly where you left off. The
**Clear** button in the Script panel wipes the script deliberately.

**Sessions auto-expire after 1 week of inactivity** (`SESSION_TTL_MS` in `src/lib/types.ts`):

- Each session carries a `lastActive` timestamp. Every host action and a 5-minute heartbeat (host
  **and** display) refresh it, so any session with someone connected never expires.
- When a session is **opened** after being idle longer than the TTL, the app deletes it and shows
  an "expired" message. This is a client-side, on-open check — there is no server timer and no
  world-readable list of sessions, so codes remain the only key.
- Consequence: a stale session is reclaimed the moment anyone reopens it. A session that is never
  reopened stays in storage until someone does (harmless — each is a few KB). To reclaim those too
  without waiting for a reopen, add a scheduled sweep (Vercel Cron or a Firebase Blaze Cloud
  Function) that deletes sessions where `lastActive` is older than the TTL.

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
lastActive   server timestamp — refreshed by heartbeat; drives 1-week expiry
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

- Sessions auto-expire on reopen after 1 week idle; a session nobody reopens lingers in storage
  (harmless, a few KB each). Add a scheduled sweep (Vercel Cron / Blaze function) to reclaim those
  too.
- Rules are open to anyone who knows/guesses a code; fine for internal use, add App Check or
  auth if the URL becomes public.
- No countdown before roll (3-2-1) yet.
- iOS Safari does not support programmatic orientation lock — rotate the phone manually; wake
  lock requires iOS 16.4+.
- Speed is in lines/second (em-based), so it scales naturally with font size.
