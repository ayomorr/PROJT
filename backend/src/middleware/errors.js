// Central error handling + not-found. Routes throw or pass errors to `next(err)`,
// and this handler formats them consistently for the frontend.
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(req, res, next) {
  next(new HttpError(404, 'Not found.'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong.';

  if (status === 500) console.error('[scrollguard:error]', err);

  res.status(status).json({ error: message });
}

// In production the backend also serves the built frontend (frontend/dist), so a
// single server hosts the whole product.
export function serveFrontend(app) {
  const dist = path.resolve(repoRoot(), 'frontend', 'dist');
  const indexHtml = path.join(dist, 'index.html');
  if (!fs.existsSync(indexHtml)) return;

  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(indexHtml);
  });
}

function repoRoot() {
  return path.resolve(import.meta.dirname, '..', '..', '..');
}