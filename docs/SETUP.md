# ScrollGuard — Setup Guide

## 1. Requirements

- **Node.js 22.5 or newer** (Node 24 recommended). The backend uses the built-in
  `node:sqlite` module — there are **no native database builds** and no Docker required.
- npm 9+ (ships with Node).

Verify:

```bash
node --version   # v22.5.0+
npm --version
```

## 2. Install

```bash
npm run install:all
```

This installs the root, backend and frontend packages.

## 3. Environment

```bash
copy backend\.env.example backend\.env      # Windows
cp backend/.env.example backend/.env        # macOS / Linux
```

Open `backend/.env` and at minimum:

- set a long random `JWT_SECRET`
- change `ADMIN_PASSWORD` (used for the bootstrap admin)

Frontend env lives in `frontend/.env` (optional):

```bash
VITE_API_URL=/api        # or http://localhost:4000/api
VITE_DEMO_MODE=true      # enables clearly-labelled sample data for demos
```

## 4. Seed (optional but recommended)

```bash
npm run seed
```

Creates demo data, an admin user, and the challenge library.

## 5. Run in development

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend:  <http://localhost:4000>
- API health check: <http://localhost:4000/api/health>

The Vite dev server proxies `/api` to the backend so the browser never hits CORS issues
in dev.

## 6. Run in production

```bash
npm run build            # build frontend into frontend/dist
npm run start            # backend serves the built frontend + API on :4000
```

See `docs/DEPLOYMENT.md` for hosting notes.

## 7. Tests

```bash
npm test
```

Backend tests use Node's built-in test runner (`node --test`). Frontend tests are Jest
component tests for a few key components.

## 8. The browser extension

See `docs/EXTENSION.md` for how to load it in Chrome/Edge, and how it reports sessions
to the backend.

## Common issues

- **`node:sqlite` not found** → you're on Node < 22.5. Upgrade Node.
- **Port 4000 already in use** → change `PORT` in `backend/.env`.
- **CORS errors in dev** → make sure both processes run via `npm run dev` (Vite proxies
  `/api`), or set `FRONTEND_URL` to the exact origin you use.
- **Demo toggle has no effect** → the frontend reads `VITE_DEMO_MODE` at build time;
  restart the Vite dev server after changing it.

## Error states the app handles explicitly

Loading / empty data / network error / AI unavailable / auth error / invalid input /
extension unavailable / unsupported platform / permission denied. Each screen renders a
friendly message — never a blank screen.