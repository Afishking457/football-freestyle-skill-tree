# Freestyle 130 v3 — Offline football freestyle progression app

An installable static web app (HTML + CSS + JavaScript) with **130 skills** across six disciplines. Works with GitHub Pages without Node.js, frameworks, a database server, accounts, or paid hosting.

## Features

- Interactive 130-skill map, prerequisites, library filters, completed challenges, and a persistent mastery timeline (from v1/v2).
- **Practice timer** with pause/resume and saved timer draft when the page is interrupted; **manual practice log** with notes and duration.
- **Daily quests** automatically checked from real training logs; personalized 20-minute routine drawn from your unlocked/ready skills; focus skill override.
- **Personal-best attempts** per skill, measuring clean landings, consecutive landings, touches, or seconds held.
- **Weekly training goal** (1–7 sessions of at least 5 minutes, Mon–Sun in local time).
- **Six timed challenges**, countdown timer, entered score, personal records and attempt history.
- **Video timeline** in IndexedDB, with side-by-side before/after playback. Video stays on your device; no upload service.
- **Practice minutes chart** (14-day) on Journey, alongside the original mastery-over-time line graph.
- JSON export/import for mastery, mastery history, practice logs, scores, goals, and PB attempts (NOT videos).

## Upload to GitHub Pages

1. Upload all files and the `icons/` folder from **inside** this directory into the root of your GitHub repository.
2. Under **Settings → Pages**, choose **Deploy from a branch → main → /(root)** and save.
3. Open your GitHub Pages URL on your phone using Safari (iOS) or Chrome (Android) and **Add to Home Screen**.
4. If you're upgrading from v2, follow [`UPDATE_GUIDE.md`](UPDATE_GUIDE.md) and export a backup before the upgrade. **Keep the same site URL**.

## Local preview with VS Code

Open this folder in VS Code → use the *Live Server* extension, or run `python -m http.server 8000` then open `http://localhost:8000`. The `standalone.html` file is an alternative self-contained preview (no PWA install). The installed version requires HTTPS or localhost for the service worker.

## Storage details

| Data | Storage | In JSON backup? |
|---|---|---|
| Mastery checkmarks | localStorage `freestyle-130-progress-v1` | Yes |
| Dated mastery timeline | localStorage `freestyle-130-history-v1` | Yes |
| Training, goals, quest inputs, PBs, challenge results | localStorage `freestyle-130-training-v3` | Yes |
| Video clip blobs | IndexedDB `freestyle130-media-v3` | **No** |
| Current timer draft | localStorage `freestyle-130-timer-draft-v3` | No |

**Privacy:** This release runs entirely on the device and has no tracking endpoints or remote database. GitHub hosts only static code. Browser storage is not a permanent backup. Keep the video originals on your phone and export JSON regularly.

### Files

- `index.html` – app layout and screens
- `style.css` – original styling
- `v3.css` – responsive v3 features
- `data.js` – original 130-skill dataset
- `app.js` – original skill tree, history, navigation, and v3 JSON import/export integration
- `training.js` – practice logs, quests, weekly goals, PBs, challenges, and local video storage
- `sw.js` – offline caching; cache bumped for v3
- `manifest.webmanifest`, `icons/` – PWA installation
- `standalone.html` – self-contained preview of the app, without PWA installation

The tricks, ratings and prerequisite links are illustrative learning suggestions, not an official difficulty ranking. Timer and challenge scores are entered by the user; the app cannot verify technique automatically.
