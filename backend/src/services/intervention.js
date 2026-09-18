// Smart interruption system — three calm, escalating levels.
//
// The philosophy: never punish. Each level is an invitation, not a judgment.
//   Level 1 — gentle reminder (after the user's preferred session threshold)
//   Level 2 — awareness reminder (planned time vs actual time)
//   Level 3 — reset (very long session, offers a 2-minute reset with Breathe/Stretch/etc.)
import { HttpError } from '../middleware/errors.js';

// Thresholds (in seconds) are derived from the user's target.
export function thresholdSeconds(user, platformLimit) {
  const planned = platformLimit?.sessionLimitMin || user?.troubleLimitMin || 20;
  const minutes = Math.max(5, Number(planned));
  return minutes * 60;
}

// Decide which intervention level applies right now for a live session.
export function interventionLevel({ user, platformLimit, elapsedSec, todayPlatformSec = 0, todayDailyLimitMin = null }) {
  const base = thresholdSeconds(user, platformLimit);
  if (elapsedSec >= base * 2.5) return 3;
  if (elapsedSec >= base * 1.5) return 2;
  if (elapsedSec >= base) return 1;

  // Daily-limit awareness (only shown if a daily limit exists and is being approached).
  if (todayDailyLimitMin && todayPlatformSec > todayDailyLimitMin * 60) return 1;
  return 0; // no reminder needed yet
}

// The message for each level. Uses two placeholders filled in by the caller.
export function reminderForLevel(level, { elapsedMin, plannedMin, platformName, quietHours }) {
  switch (level) {
    case 1:
      return {
        eyebrow: 'A gentle nudge',
        message: quietHours
          ? `It's ${quietHours} — during your quiet hours. You've been here ${elapsedMin} minutes. Still enjoying your scroll?`
          : `Still enjoying your scroll? You've been here for ${elapsedMin} minutes.`,
        buttons: ['Continue', 'Take a break'],
      };
    case 2:
      return {
        eyebrow: 'Worth noticing',
        message: `You planned around ${plannedMin} minutes. You're at ${elapsedMin} right now. No judgment — just curious if you want to continue.`,
        buttons: ['5-minute break', 'Continue'],
      };
    case 3:
      return {
        eyebrow: 'Time for a reset',
        message: `You've been scrolling for ${elapsedMin} minutes. Let's take a quick reset — your attention matters.`,
        buttons: ['Start 2-minute reset', 'Continue'],
        resetOptions: ['Breathe', 'Stretch', 'Drink water', 'Look away from the screen', 'Walk for 2 minutes'],
      };
    default:
      throw new HttpError(500, 'Unknown reminder level.');
  }
}

// Returns true when the current wall-clock time falls inside quiet hours (HH:MM–HH:MM).
export function inQuietHours(now = new Date(), start, end) {
  if (!start || !end || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const s = toMin(start);
  const e = toMin(end);
  if (s === e) return false;
  if (s < e) return mins >= s && mins <= e;
  return mins >= s || mins <= e; // overnight range, e.g. 22:00 → 07:00
}

function toMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function formatQuietHours(start, end) {
  if (!start || !end) return '';
  return `${start} – ${end}`;
}