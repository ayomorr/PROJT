// Tiny, readable input validation helpers.
//
// We deliberately avoid a heavy validation library: for a project of this size a
// couple of focused helpers keep the code easy to follow (spec: beginner-friendly).
import { HttpError } from './errors.js';

// body() — validate the request body against a rule set and put the cleaned values
// on `req.validBody`. Example:
//   validate({
//     email: [required, isEmail],
//     password: [required, minLen(8)],
//   })
export function validate(rules) {
  return (req, res, next) => {
    const body = req.body || {};
    const errors = [];
    const clean = {};
    if (rules.optional) {
      // If every key is missing/empty, skip validation entirely (used by patch routes).
      const keys = Object.keys(rules).filter((k) => k !== 'optional');
      if (keys.every((k) => body[k] === undefined || body[k] === null || body[k] === '')) {
        req.validBody = {};
        return next();
      }
    }
    for (const [key, chain] of Object.entries(rules)) {
      if (key === 'optional') continue;
      const chains = Array.isArray(chain) ? chain : [chain];
      const value = body[key];
      let optional = false;
      let ok = true;
      for (const rule of chains) {
        if (rule === 'optional') {
          optional = true;
          continue;
        }
        const result = rule(value, body);
        if (result !== true) {
          errors.push(result || `${key} is invalid`);
          ok = false;
          break;
        }
      }
      if (!ok && optional && (value === undefined || value === null || value === '')) {
        // The field is optional and absent — not an error.
        errors.pop();
      } else if (ok) {
        clean[key] = value;
      }
    }
    if (errors.length) return next(new HttpError(400, errors.join(' · ')));
    req.validBody = clean;
    next();
  };
}

// ---- rules ----------------------------------------------------------------

export const required = (v) => (v === undefined || v === null || v === '' ? 'This field is required.' : true);

export const isEmail = (v) => (/^\S+@\S+\.\S+$/.test(v) ? true : 'Enter a valid email address.');

export const minLen = (n) => (v) => (typeof v === 'string' && v.trim().length >= n ? true : `Must be at least ${n} characters.`);

export const isNumber = (v) => (typeof v === 'number' && Number.isFinite(v) ? true : 'Expected a number.');

export const isIntRange = (min, max) => (v) => {
  const n = Number(v);
  if (Number.isNaN(n) || !Number.isInteger(n)) return 'Expected a whole number.';
  if (n < min || n > max) return `Must be between ${min} and ${max}.`;
  return true;
};

export const isBoolean = (v) => (typeof v === 'boolean' ? true : 'Expected true or false.');

export const oneOf = (options) => (v) => (options.includes(v) ? true : 'Invalid choice.');

export const isArrayOfStrings = (v) =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? true : 'Expected a list of strings.';

export const isTimeHHMM = (v) =>
  v === undefined || v === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? true : 'Use HH:MM (24h).';

// email is lowercased before storage.
export const normalizeEmail = (s) => String(s || '').trim().toLowerCase();