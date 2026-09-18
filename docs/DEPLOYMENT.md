# ScrollGuard — Deployment Notes

The MVP is a single Node server (API + serving the built frontend). This deploys almost
anywhere: Render, Railway, Fly.io, a VPS, or your own machine.

## Build

```bash
npm run build   # builds frontend/src → frontend/dist
```

## Serve

```bash
npm run start   # backend serves dist/ (if present) + the API on PORT (default 4000)
```

## Environment on the host

Set the same variables as `backend/.env.example`. Frontend `VITE_DEMO_MODE=false` and
`VITE_API_URL=/api` for production builds.

## Recommended extras in production

- Put the service behind **HTTPS** (the PWA + secure cookies require it).
- Terminate TLS at a reverse proxy (Caddy/Nginx) or the platform's load balancer.
- Set `JWT_SECRET` to a long random string and rotate it rarely.
- Point `DATABASE_URL` at a persistent volume path (SQLite file must not live in an
  ephemeral filesystem if you want data to survive restarts).
- Scale-out note: a single SQLite file is per-instance; for multi-replica deployments,
  move to PostgreSQL (the schema maps directly) or run one instance.

## Admin

With `ADMIN_BOOTSTRAP=true` the first server start creates the admin account. Change the
password in production.

## Backups

Copy the SQLite file (and its `-wal`/`-journal` siblings, if any) while the server is
stopped, or use the VFS backup command for a live snapshot.