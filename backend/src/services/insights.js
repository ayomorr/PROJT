// Weekly insights + the "one thing I noticed" pattern detector.
//
// All values here are computed from the user's own committed sessions. This is the
// brain behind the dashboard summary cards and the AI coach's context.
import { getSessionsBetween, getDailyStatsBetween, dateKey, addDays } from '../db.js';

function dayRange(daysAgo) {
  const end = dateKey(Date.now());
  return { start: addDays(end, -daysAgo), end };
}

function isoStartOfDay(daysAgo) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}

export function computeWeekly(userId) {
  const today = dateKey(Date.now());
  const weekStart = isoStartOfDay(6);
  const prevWeekStart = isoStartOfDay(13);
  const weekEnd = new Date(Date.now() + 60 * 60 * 24 * 1000).toISOString();

  const sessions = getSessionsBetween(userId, weekStart, weekEnd);
  const prevSessions = getSessionsBetween(userId, prevWeekStart, weekStart);

  const totalSeconds = sumSessions(sessions);
  const prevTotalSeconds = sumSessions(prevSessions);
  const deltaSeconds = totalSeconds - prevTotalSeconds;

  const hourly = new Array(24).fill(0);
  for (const s of sessions) {
    const hour = new Date(s.startTime).getHours();
    hourly[hour] += Math.max(s.duration, 0) / 60; // minutes attribution
  }

  const platformRank = rankPlatforms(sessions);

  const daily = getDailyStatsBetween(userId, dayRange(6).start, today).map((d) => ({
    date: d.date,
    totalMinutes: Math.round(d.totalSeconds / 60),
    sessions: d.sessions,
    attentionScore: d.attentionScore,
  }));

  const attentionNow = daily.length ? (daily.find((x) => x.date === today) || daily[daily.length - 1]).attentionScore : 100;

  return {
    range: { from: dayRange(6).start, to: today },
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
    deltaSeconds,
    deltaMinutes: Math.round(deltaSeconds / 60),
    sessions: sessions.length,
    avgSessionSeconds: sessions.length ? Math.round(totalSeconds / sessions.length) : 0,
    longestSession: Math.max(...sessions.map((s) => s.duration), 0),
    mostActiveHour: hourly.indexOf(Math.max(...hourly)),
    hourlyMinutes: hourly,
    platformRank,
    daily,
    attentionScore: attentionNow,
  };
}

function sumSessions(sessions) {
  return sessions.reduce((acc, s) => acc + Math.max(s.duration || 0, 0), 0);
}

function rankPlatforms(sessions) {
  const byId = new Map();
  for (const s of sessions) {
    const id = s.platformId || 'other';
    const e = byId.get(id) || { platformId: id, totalSeconds: 0, sessions: 0 };
    e.totalSeconds += Math.max(s.duration || 0, 0);
    e.sessions += 1;
    byId.set(id, e);
  }
  return [...byId.values()].sort((a, b) => b.totalSeconds - a.totalSeconds).map((e) => ({
    platformId: e.platformId,
    totalMinutes: Math.round(e.totalSeconds / 60),
    sessions: e.sessions,
  }));
}

// "One pattern I noticed" — picks the single most useful observation for today's card.
export function detectPattern(userId) {
  const weekly = computeWeekly(userId);

  // 1. Night-heavy pattern (quiet hours / after 22:00..24:00).
  const lateMinutes = weekly.hourlyMinutes.slice(21, 24).reduce((a, b) => a + b, 0);
  const allMinutes = weekly.hourlyMinutes.reduce((a, b) => a + b, 0);
  if (allMinutes > 0 && lateMinutes / allMinutes > 0.45) {
    return {
      emoji: '🌙',
      text: `Most of your long sessions happen between ${pad(weekly.mostActiveHour)} and ${pad(Math.min(23, weekly.mostActiveHour + 2))}.`,
      tag: 'night',
      action: 'Set a wind-down reminder',
    };
  }

  // 2. Reopening pattern.
  if (weekly.sessions >= 14) {
    return {
      emoji: '🔁',
      text: `You opened social media ${weekly.sessions} times this week. Many of those were short check-ins that stretched on.`,
      tag: 'reopens',
      action: 'Try the "I want to scroll" flow',
    };
  }

  // 3. One platform dominating.
  if (weekly.platformRank.length) {
    const top = weekly.platformRank[0];
    const total = weekly.platformRank.reduce((a, b) => a + b.totalMinutes, 0);
    if (top.totalMinutes / Math.max(total, 1) > 0.6) {
      return {
        emoji: '📊',
        text: `${top.platformId} accounts for a large share of your weekly time. A daily limit there could help.`,
        tag: 'platform',
        action: 'Set a limit',
      };
    }
  }

  // 4. Growth signal (always encouraging).
  if (weekly.deltaMinutes <= -10) {
    return {
      emoji: '🌱',
      text: `You reduced your weekly scrolling by ${Math.abs(weekly.deltaMinutes)} minutes compared with last week. That's real progress.`,
      tag: 'growth',
      action: 'Keep the streak going',
    };
  }

  return {
    emoji: '💡',
    text: `Your longest sessions tend to start around ${pad(Math.max(0, weekly.mostActiveHour))}. What usually triggers them?`,
    tag: 'general',
    action: 'Ask Guard',
  };
}

function pad(n) {
  const h = Math.floor((n + 24) % 24);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${suffix}`;
}