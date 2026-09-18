# ScrollGuard — Browser Extension

The extension (`extension/`) is a Manifest V3 extension compatible with Chrome, Edge and
Firefox (Firefox uses `background.service_worker` starting with MV3 support; it works
when loaded temporarily).

## What it does

1. Detects when a tab is on a **supported platform** (see `shared/platforms`).
2. Asks the backend to **open a live session** (`POST /api/usage/session/start`).
3. While the tab is active it tracks active time; after **60 s idle** the session is
   paused; when the tab becomes active again it resumes.
4. When the session exceeds the user's thresholds, the backend returns an intervention
   level; the extension shows a **calm, centered card** in the page (levels 1/2/3,
   "continue / take a break").
5. Popup shows the current session, today's totals from the extension's local store, and
   a link to the dashboard.

## Privacy

- The extension only inspects the tab URL to detect supported platforms.
- It never reads page content, messages, or private data.
- Sessions are committed to the user's own ScrollGuard account.
- If the user isn't logged in to the API, the extension still tracks locally (its own
  8-week store) and encourages logging in to sync.

## Configuration

The extension reads its API base URL from `chrome.storage.sync` (key `apiBaseUrl`),
defaulting to `http://localhost:4000/api`. Persist your choice via `extension/popup`.

## Loading it (unpacked)

1. Open `chrome://extensions` (Edge: `edge://extensions`).
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select the `extension/` folder.

For Firefox: `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → select
`extension/manifest.json`.

## Building a distributable ZIP

```bash
# from the project root
powershell -Command "Compress-Archive -Path .\extension\* -DestinationPath scrollguard-extension.zip -Force"
```

## Supported platforms (matching the web app)

TikTok, Instagram, YouTube, Facebook, X, Reddit, Snapchat, LinkedIn. Add a host pattern
in `extension/manifest.json` `content_scripts.matches` and the domain in
`shared/platforms` to join others.