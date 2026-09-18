import { Link } from 'react-router-dom';
import * as data from '../lib/data.js';
import { platformById } from '@shared/platforms.js';
import { useAsync } from '../lib/useAsync.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Spinner, Chip, DemoBadge, ProgressRing, ProgressBar, EmptyState, useToast } from '../components/ui.jsx';
import { fmtMinutes, fmtSeconds, fmtClock, greeting, plural } from '../lib/format.js';
import { useState } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [dismissed, setDismissed] = useState(false);
  const { data: today, loading, error, retry } = useAsync(() => data.usageApi.today());
  const { data: insights } = useAsync(() => data.usageApi.insights(), []);

  const demo = today?.demo;

  const longest = today?.longestSession || 0;
  const longestMin = Math.round(longest / 60);
  const opens = today?.sessionCount ?? today?.reopens ?? 0;

  // Build the "wow moment" sentence: e.g., "You've opened social media 9 times today;
  // your longest scroll was ~31 minutes."
  const hasSessions = Array.isArray(today?.sessions) && today.sessions.length > 0;
  let longestWindow = null;
  if (hasSessions) {
    const long = today.sessions.reduce((a, s) => (s.duration > a.duration ? s : a), today.sessions[0]);
    if (long && long.duration > 0) {
      longestWindow = {
        mins: Math.round(long.duration / 60),
        from: fmtClock(long.startTime),
        to: fmtClock(long.endTime || long.startTime),
      };
    }
  }

  const pattern = insights?.pattern;

  if (loading) {
    return (
      <div className="grid place-items-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-ink-soft">Checking in with your attention…</p>
        </div>
      </div>
    );
  }

  if (error || !today) {
    return (
      <EmptyState
        icon="📵"
        title="Couldn't load your today stats"
        text={error?.message || 'Please retry in a moment.'}
        action={<Button variant="primary" onClick={retry}>Try again</Button>}
      />
    );
  }

  const attention = today.attentionScore ?? 100;
  const tone = attention >= 70 ? 'good' : attention >= 45 ? 'mid' : 'low';
  const goalMin = today.goalMinutes || user?.dailyGoal || 90;
  const usedMin = today.totalMinutes ?? Math.round((today.totalSeconds || 0) / 60);

  return (
    <div className="space-y-6">
      {demo && <DemoBadge />}

      {/* Greeting + attention score */}
      <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-ink-soft">{greeting()}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Let's check in 👋
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span className="font-bold text-ink">{opens}</span>
            {plural(opens, 'opening')} today, longest
            <span className="font-bold text-ink">{longestWindow ? ` ${longestWindow.mins} min` : ` ${longestMin} min`}</span>
            {longestWindow && <>— from {longestWindow.from} to {longestWindow.to}</>}
          </p>
        </div>
        <div className="shrink-0 self-center sm:self-auto">
          <ProgressRing value={attention} size={128} stroke={12} tone={tone}>
            <div className="text-center">
              <p className="text-3xl font-extrabold leading-none">{attention}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-ink-faint">Attention score</p>
            </div>
          </ProgressRing>
        </div>
      </div>

      {/* Screen-time vs goal */}
      <div className="card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-ink">Today's screen time</h2>
          <span className="text-sm font-semibold text-ink-soft">{fmtMinutes(usedMin)} of {fmtMinutes(goalMin)} goal</span>
        </div>
        <ProgressBar value={usedMin} total={goalMin} fillColor={usedMin <= goalMin ? '#6D5AE6' : '#E8735A'} />
        {usedMin > goalMin && (
          <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">
            You're past your target — this is your cue to gently close a tab. No guilt, just a nudge. 💚
          </p>
        )}
      </div>

      {/* Pattern notice (the wow-moment nudge) */}
      {pattern && !dismissed && (
        <div className="card border-l-4 !border-l-brand-500 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Chip color="brand">{pattern.emoji || '✨'} Pattern found</Chip>
                {demo && <DemoBadge />}
              </div>
              <p className="text-sm leading-relaxed text-ink-soft">{pattern.text}</p>
            </div>
            <button
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-ink/5 hover:text-ink"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss notice"
            >
              ✕
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/app/limits">
              <Button variant="primary" size="sm">{pattern.action || 'Set a wind-down reminder'}</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setDismissed(true)}>Not now</Button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/app/focus" className="card group p-5 transition-shadow hover:shadow-lift">
          <span className="text-2xl" aria-hidden="true">🎯</span>
          <h3 className="mt-2 font-bold">Start Focus Mode</h3>
          <p className="mt-1 text-sm text-ink-soft">A distraction-free countdown for what matters.</p>
        </Link>
        <Link to="/app/scroll" className="card group p-5 transition-shadow hover:shadow-lift">
          <span className="text-2xl" aria-hidden="true">📱</span>
          <h3 className="mt-2 font-bold">I want to scroll</h3>
          <p className="mt-1 text-sm text-ink-soft">Make that next opening intentional.</p>
        </Link>
        <Link to="/app/challenges" className="card group p-5 transition-shadow hover:shadow-lift">
          <span className="text-2xl" aria-hidden="true">🌱</span>
          <h3 className="mt-2 font-bold">Daily challenge</h3>
          <p className="mt-1 text-sm text-ink-soft">Today's tiny win is one tap away.</p>
        </Link>
      </div>

      {/* Top platforms */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-ink">Most used today</h2>
          <Link to="/app/platforms" className="text-sm font-semibold text-brand-700 hover:underline">View all platforms →</Link>
        </div>
        <div className="space-y-3">
          {today?.perPlatform?.slice?.(0, 4).map((p) => {
            const meta = platformById(p.platformId) || { icon: '🌐', name: (p.platformId || 'app').toUpperCase() };
            const pct = usedMin > 0 ? Math.round((p.totalSeconds / 60 / usedMin) * 100) : 0;
            return (
              <div key={p.platformId} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-soft text-lg" aria-hidden="true">{meta.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{meta.name}</p>
                    <p className="text-sm font-bold text-ink">{fmtSeconds(p.totalSeconds)}</p>
                  </div>
                  <ProgressBar value={p.totalSeconds} total={Math.max(1, usedMin * 60)} />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-semibold text-ink-faint">{pct}%</span>
              </div>
            );
          })}
          {!today?.perPlatform?.length && (
            <p className="text-sm text-ink-soft">No sessions logged yet today. Give yourself credit for a clear feed. ✨</p>
          )}
        </div>
      </div>
    </div>
  );
}