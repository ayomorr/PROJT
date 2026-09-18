# ScrollGuard

**Scroll less. Live more.**

ScrollGuard is an AI-powered digital-wellbeing application that helps people reduce
unconscious social-media scrolling. It does **not** replace social media and it does
**not** block you unless you choose blocking. It makes you *aware*, then helps you
scroll *intentionally*.

> ScrollGuard doesn't tell you to stop using social media. It helps you use it intentionally.

---

## What's inside

| Folder        | What it is                                                      |
| ------------- | --------------------------------------------------------------- |
| `frontend/`   | React + Vite web app (also installable as a PWA)                |
| `backend/`    | Node.js + Express API with SQLite storage                       |
| `extension/`  | Chrome / Edge / Firefox-style MV3 browser extension             |
| `shared/`     | Shared constants used by frontend, backend and extension        |
| `docs/`       | API docs, database schema, setup & deployment guides            |

---

## Features (MVP)

- Beautiful multi-step **onboarding** that personalizes the dashboard
- **Dashboard** — today's screen time, sessions, longest session, reopens, streak
- **Attention Score** — a simple, non-clinical personal wellbeing metric
- **Deadscroll detector** — gentle, supportive intervention levels (never shaming)
- **"I want to scroll"** — converts unconscious scrolling into intentional usage
- **Guard** — an AI personal digital-wellbeing coach (works offline too)
- **Break alternatives** — personalized "instead of scrolling…" suggestions
- **Daily challenges** with completion tracking
- **Weekly insights** with simple charts
- **Platform breakdown** + per-platform **personal limits** (daily/session/quiet hours)
- **Focus Mode** with countdown timer
- **Admin dashboard** with aggregated analytics
- **Demo mode** (`VITE_DEMO_MODE=true`) — clearly-labeled sample data
- **PWA** — installable, offline fallback
- **Privacy-first design** — your attention data belongs to you

---

## Tech stack

- **Frontend:** React 18, Vite 5, Tailwind CSS 3, React Router 6
- **Backend:** Node.js + Express 4, SQLite (built-in `node:sqlite` — no native builds)
- **Auth:** JWT (httpOnly cookie + bearer token), bcrypt password hashing
- **AI:** OpenAI-compatible API through the backend, with a built-in offline coach fallback
- **Extension:** Manifest V3 (Chrome/Edge/Firefox-compatible architecture)

> **Database note:** the MVP ships with SQLite so the whole project runs with zero external
> services. The schema (see `docs/DATABASE.md`) maps 1:1 to PostgreSQL/MongoDB so you can
> swap the adapter later without redesigning the data model.

---

## Quick start

**Requirements:** Node.js 22.5+ (Node 24 recommended — the project uses the built-in
SQLite module).

```bash
# 1. Install dependencies (root, backend, frontend)
npm run install:all

# 2. Configure environment
copy backend\.env.example backend\.env      # Windows
# cp backend/.env.example backend/.env      # macOS / Linux

# 3. Load demo data (optional but recommended)
npm run seed

# 4. Run everything
npm run dev
```

Then open <http://localhost:5173>.

Demo login (run `npm run seed` first):

```
demo@scrollguard.app
demo1234
```

Admin login (after first backend start, when `ADMIN_BOOTSTRAP=true`):

```
admin@scrollguard.app
ChangeMeAdmin123!   <- change this in backend/.env!
```

---

## The honest-tracking principle

ScrollGuard never fakes cross-platform tracking:

- **Web:** tracking happens through the **browser extension** on supported sites only,
  and only where browser permissions allow.
- **Manual logging:** anything the extension can't see can be logged by hand (2 taps).
- **Android/iOS:** the backend API is designed so a future native app can integrate with
  Apple Screen Time / Android Digital Wellbeing APIs properly.
- The UI always says which platforms are supported and never implies otherwise.

---

## Common commands

```bash
npm run dev            # frontend + backend (dev)
npm run build          # production build of the frontend
npm run start          # start the backend (serves built frontend too)
npm test               # backend + frontend tests
npm run seed           # load demo + challenges data
```

See `docs/SETUP.md` for full instructions and `docs/DEPLOYMENT.md` for production notes.

---

## Privacy

> **Your attention data belongs to you.**

ScrollGuard never:

- requests your social-media passwords
- scrapes private account information
- screenshots or reads your private messages
- bypasses a platform's security or API restrictions

Everything you need to know about what we collect, why, where it's stored, and how to
delete it is in the in-app **Privacy** page and in `docs/DATABASE.md`.

---

## Honest AI

Guard is an AI personal **digital-wellbeing** coach. It will not diagnose addiction or
mental-health conditions, make medical claims, shame you, or pretend to be a therapist.
If you talk about serious distress, it gives a safety-oriented response and encourages
contacting qualified support.