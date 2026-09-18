// Authentication middleware.
//
// Auth strategy: JWT stored in an httpOnly cookie (safe against XSS) AND optionally
// sent as a `Bearer` token (useful for the browser extension / future native apps).
// Either one is accepted; both identify the same user.
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { findUserById } from '../db.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function authRequired(req, res, next) {
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const user = findUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Account not found. Please log in again.' });
  }
  req.user = user;
  next();
}

export function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

// Extracts the user id from the cookie or the Authorization header. Never throws.
export function resolveUserId(req) {
  const fromCookie = req.cookiesToken;
  if (fromCookie) return safeVerify(fromCookie);
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    if (token) return safeVerify(token);
  }
  return null;
}

function safeVerify(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return payload.sub || null;
  } catch {
    return null;
  }
}

// Helper to read the raw cookie value without a cookie-parser dependency.
export function cookieReader(req, res, next) {
  const header = req.headers.cookie || '';
  const jar = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) jar[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  req.cookiesToken = jar.sg_token || null;
  next();
}