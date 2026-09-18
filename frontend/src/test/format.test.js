import { describe, expect, it } from 'vitest';
import { fmtMinutes, fmtSeconds, fmtClock, fmtDayLabel, fmtDayShort, greeting, plural, titleCase } from '../lib/format.js';

describe('fmtMinutes', () => {
  it('renders minutes and hours-readably', () => {
    expect(fmtMinutes(45)).toBe('45m');
    expect(fmtMinutes(150)).toBe('2h 30m');
    expect(fmtMinutes(90)).toBe('1h 30m');
    expect(fmtMinutes(0)).toBe('0m');
    expect(fmtMinutes(undefined)).toBe('0m');
  });
});

describe('fmtSeconds', () => {
  it('converts seconds to minutes string', () => {
    expect(fmtSeconds(2700)).toBe('45m');
    expect(fmtSeconds(3600)).toBe('1h 00m');
  });
});

describe('fmtClock', () => {
  it('formats an ISO timestamp to a small clock', () => {
    const s = fmtClock('2026-09-18T14:05:00.000Z');
    expect(s).toMatch(/\d{1,2}:\d{2}/);
  });
  it('returns dash for invalid input', () => {
    expect(fmtClock('garbage')).toBe('—');
  });
});

describe('fmtDayLabel', () => {
  it('names today and yesterday', () => {
    expect(fmtDayLabel('2026-09-18', '2026-09-18')).toBe('Today');
    expect(fmtDayLabel('2026-09-17', '2026-09-18')).toBe('Yesterday');
  });
});

describe('fmtDayShort', () => {
  it('returns short weekday', () => {
    expect(fmtDayShort('2026-09-18')).toMatch(/^(Fri|Sat|Sun|Mon|Tue|Wed|Thu)$/);
  });
});

describe('greeting', () => {
  it('always returns a friendly greeting', () => {
    expect(greeting()).toMatch(/^(Good morning|Good afternoon|Good evening|Up bright and early)$/);
  });
});

describe('plural', () => {
  it('pluralizes correctly', () => {
    expect(plural(1, 'session')).toBe('1 session');
    expect(plural(5, 'session')).toBe('5 sessions');
  });
});

describe('titleCase', () => {
  it('title-cases slugs and underscores', () => {
    expect(titleCase('quiet_hours')).toBe('Quiet Hours');
    expect(titleCase('evening')).toBe('Evening');
  });
});