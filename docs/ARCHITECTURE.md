# ScrollGuard — Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              WEB APP                                │
│   React + Vite (frontend/)  ·  PWA  ·  Tailwind design system       │
│   pages: Landing · Onboarding · Dashboard · Insights · Focus        │
│          Challenges · Coach · Limits · Platforms · Profile · Admin  │
├─────────────────────────────────────────────────────────────────────┤
│                         BROWSER EXTENSION                           │
│   extension/  (Manifest V3, Chrome/Edge/Firefox-compatible)         │
│   - detects visits to supported sites                               │
│   - opens/closes live sessions on the backend API                   │
│   - gentle intervention cards in-page (level 1/2/3)                 │
│   - standalone popup works even with no login                       │
├─────────────────────────────────────────────────────────────────────┤
│                         BACKEND API  (backend/)                    │
│   Node + Express  ·  JWT httpOnly cookie + bearer                   │
│   Middleware: helmet, cors, rate-limit, validation, error handler   │
│   Routes: auth · user · usage · limits · insights · ai · focus      │
│           challenges · admin                                        │
│   Services: attentionScore · insights · aiGuard (offline + LLM)     │
│   Storage:  SQLite via node:sqlite  → maps to PostgreSQL/Mongo      │
├─────────────────────────────────────────────────────────────────────┤
│                 FUTURE NATIVE MOBILE (designed, not faked)          │
│   The API + session model are ready for a native app that uses      │
│   Apple Screen Time / Family Controls or Android Digital Wellbeing  │
│   APIs. A website cannot monitor phone apps — we never fake it.     │
└─────────────────────────────────────────────────────────────────────┘
```

## How a scrolled session is tracked (web)

1. The extension sees the URL match a supported platform (e.g. `tiktok.com`).
2. `background.js` calls `POST /api/usage/session/start { platform }`.
3. The backend returns a `sessionId` and starts a long session.
4. As the tab stays active, the user's limits are checked; when a threshold is crossed
   the backend returns an **intervention level** (`1`, `2`, `3`).
5. The extension (or the web app's dashboard) shows a calm, non-judgmental card.
6. When the tab is closed/hidden or the user idles 60 s, `session/end` commits the
   session, and `daily_stats` is recomputed.

Sessions can also be recorded **manually** (the UI always offers this for platforms the
extension can't see, e.g. native mobile apps).

## Honest boundaries

- The web extension can only observe sites the user visits in a browser. It cannot see
  phone apps, other browsers, or incognito tabs, and we don't claim it can.
- The dashboard labels each session's source (`extension` / `manual`), and the
  extension's supported platforms are shown explicitly in the UI.
- Demo data is always labelled **Demo Data**.

## AI coach design

`POST /api/ai/chat` → server-side `aiGuard`:

1. **Safety gate** — if the user describes distress/self-harm, return a supportive
   safety response immediately (never an LLM guess).
2. **Context** — a deliberately *minimum* privacy-respecting context (totals, platform
   ranking, active period) is attached server-side.
3. **LLM mode** — if `AI_API_KEY` is set, call the OpenAI-compatible endpoint; the key
   never leaves the server.
4. **Offline mode** — otherwise a built-in rule-based coach answers from the same stats.
5. **Validation** — responses are validated into
   `{ message, insight, suggestedAction, tone }` before being returned.

## Design system

Calm health-tech aesthetic: off-white surfaces, deep charcoal ink, teal/green accent,
soft gradients, rounded cards, generous whitespace, subtle motion, reduced-motion
support, WCAG-AA contrast.