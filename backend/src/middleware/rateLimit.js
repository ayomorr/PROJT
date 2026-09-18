// Lightweight in-memory rate limiter.
//
// Protects the API against obvious abuse without adding an external dependency. Uses
// the client IP as the key; an in-memory store is fine for a single-instance MVP.
// Swap for Redis/express-rate-limit on a distributed deployment.
import { HttpError } from './errors.js';

const buckets = new Map();

export function rateLimit({ windowMs = 60_000, max = 120, skip }) {
  return (req, res, next) => {
    if (skip && skip(req)) return next();
    const key = req.ip || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    // Keep the map small — drop entries that have reset a while ago.
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (now > b.resetAt + windowMs * 10) buckets.delete(k);
    }

    if (bucket.count > max) {
      return next(new HttpError(429, 'Too many requests. Please slow down and try again shortly.'));
    }
    next();
  };
}

// Stricter limiter for auth endpoints (login brute-force protection).
export const strictRateLimit = rateLimit({ windowMs: 60_000, max: 20 });

// Test helper: wipe rate-limit state (an in-memory map lives across resetDatabase).
export function clearRateLimitBuckets() {
  buckets.clear();
}