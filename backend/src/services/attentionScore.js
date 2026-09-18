// Attention Score — a friendly, non-clinical personal wellbeing metric (0–100).
//
// IMPORTANT DESIGN RULE: this is a gentle nudge, never a verdict. The score starts at
// 100 and every factor can only lower it a little. We refuse to ever score 0, and we
// add a small "recovery" bonus so improvement always feels achievable.

// factors is an object of the current day's numbers:
//   totalSeconds, sessions, longestSession, reopens,
//   withinGoal (bool), nightSeconds (seconds after quiet start / after 11pm if unknown),
//   breaksTaken (count of times the user chose "take a break")
// limits context:
//   dailyGoalMin (from user)
export function computeAttentionScore(factors, { dailyGoalMin = 90 } = {}) {
  const minutes = factors.totalSeconds / 60;
  const goal = dailyGoalMin || 90;

  let score = 100;

  // 1. Sticking to the daily goal matters most.
  if (minutes > goal) {
    const overPct = (minutes - goal) / goal;
    score -= Math.min(25, overPct * 35);
  }

  // 2. A high session count means a lot of opening and closing.
  score -= Math.min(15, Math.max(0, factors.sessions - 3) * 1.5);

  // 3. Repeated reopenings (open-again shortly after closing).
  score -= Math.min(10, Math.max(0, (factors.reopens || 0) - 2) * 1.2);

  // 4. Endless long sessions.
  if (factors.longestSession > 60 * 45) {
    score -= Math.min(15, ((factors.longestSession - 2700) / 2700) * 16);
  }

  // 5. Night scrolling.
  const nightMin = (factors.nightSeconds || 0) / 60;
  score -= Math.min(15, nightMin * 0.35);

  // 6. Small reward for choosing breaks.
  score += Math.min(5, (factors.breaksTaken || 0) * 1.5);

  // Never present a "zero / failure" score — the least we show is 12.
  return Math.max(12, Math.min(100, Math.round(score)));
}

export function scoreColor(score) {
  if (score >= 80) return 'good';      // calm teal
  if (score >= 55) return 'mid';       // warm amber
  return 'low';                        // soft coral
}

export function scoreLabel(score) {
  if (score >= 85) return 'Beautifully balanced';
  if (score >= 70) return 'Doing well';
  if (score >= 55) return 'A bit scattered';
  if (score >= 35) return 'Needs a gentle reset';
  return 'Today was a hard one';
}