import * as data from '../lib/data.js';
import { useAsync } from '../lib/useAsync.js';
import { platformById } from '@shared/platforms.js';
import { Button, Card, DemoBadge, EmptyState, Spinner, Chip } from '../components/ui.jsx';
import { BarChart, HourChart, Donut, Sparkline } from '../components/charts.jsx';
import { fmtMinutes, fmtSeconds, plural, titleCase } from '../lib/format.js';

export default function Insights() {
  const { data, loading, error, retry } = useAsync(() => data.usageApi.insights());

  if (loading) {
    return (
      <div className="grid place-items-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-ink-soft">Reading your patterns…</p>
        </div>
      </div>
    );
  }
  if (error || !data?.weekly) {
    return (
      <EmptyState
        icon="📊"
        title="Couldn't load your insights"
        text={error?.message || 'Please retry in a moment.'}
        action={<Button variant="primary" onClick={retry}>Try again</Button>}
      />
    );
  }

  const w = data.weekly;
  const demo = data.demo || w.demo;
  const scoreTrend = w.daily?.map((d) => d.attentionScore).filter((n) => typeof n === 'number') || [];
  const platformShare = (w.platformRank || []).map((p) => {
    const meta = platformById(p.platformId) || { name: p.platformId, color: '#8379E8' };
    return { label: meta.name, value: p.totalMinutes, color: meta.color };
  });
  const peakHour = `${w.mostActiveHour}:00`;
  const deltaDir = w.deltaMinutes < 0 ? 'down' : 'up';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Last week, at a glance</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {fmtMinutes(w.totalMinutes)} total · {plural(w.sessions, 'session')} · avg {fmtMinutes(Math.round((w.avgSessionSeconds || 0) / 60))} each
        </p>
        {demo && <div className="mt-2"><DemoBadge /></div>}
      </header>

      {/* Headline stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="⏱️" label="Total this week" value={fmtMinutes(w.totalMinutes)} sub={w.deltaMinutes ? `${Math.abs(w.deltaMinutes)} min ${deltaDir} vs last week` : 'steady vs last week'} tone={w.deltaMinutes < 0 ? 'good' : 'warn'} />
        <StatCard icon="🔁" label="Total sessions" value={w.sessions ?? '—'} sub={`longest ${fmtMinutes(Math.round((w.longestSession || 0) / 60))}`} />
        <StatCard icon="🕰️" label="Most active hour" value={`${peakHour}`} sub={`your busiest time to scroll`} />
        <StatCard icon="💯" label="Attention score" value={String(w.attentionScore ?? '—')} sub="this week" tone={w.attentionScore >= 70 ? 'good' : w.attentionScore >= 45 ? 'warn' : 'bad'} />
      </div>

      {/* Pattern callout */}
      {data.pattern && (
        <div className="card border-l-4 !border-l-brand-500 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Chip color="brand">{data.pattern.emoji || '✨'} Pattern found</Chip>
          </div>
          <p className="mt-2 text-lg font-bold text-ink">{data.pattern.text}</p>
          <p className="mt-1 text-sm text-ink-soft">{data.pattern.action ? <span className="font-semibold text-brand-700">Suggested next step:</span> : ''} {data.pattern.action || 'Explore the articles and tips below to get started.'}</p>
        </div>
      )}

      {/* Daily minutes */}
      <Card className="p-6">
        <h2 className="mb-4 font-bold text-ink">Daily screen time</h2>
        <BarChart
          height={150}
          suffix="m"
          data={(w.daily || []).map((d) => ({
            label: new Date(`${d.date}T00:00:00`).toLocaleDateString([], { weekday: 'short' }),
            value: d.totalMinutes,
          }))}
        />
      </Card>

      {/* Score trend + hourly */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-ink">Attention score trend</h2>
          {scoreTrend.length ? <Sparkline values={scoreTrend} /> : <p className="text-sm text-ink-soft">Not enough data yet.</p>}
          <div className="mt-2 flex justify-between text-xs text-ink-faint">
            {w.daily?.map((d) => (
              <span key={d.date}>{new Date(`${d.date}T00:00:00`).toLocaleDateString([], { weekday: 'narrow' })}</span>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-ink">Most active hours</h2>
          <HourChart minutes={w.hourlyMinutes || []} height={110} />
        </Card>
      </div>

      {/* Platform share + rank */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-ink">Where your time goes</h2>
          {platformShare.length ? <Donut slices={platformShare} /> : <p className="text-sm text-ink-soft">No platform data yet.</p>}
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-ink">Platform rankings</h2>
          <ul className="space-y-3">
            {(w.platformRank || []).map((p, i) => {
              const meta = platformById(p.platformId) || { name: titleCase(p.platformId), icon: '🌐' };
              return (
                <li key={p.platformId} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className="w-5 text-sm font-extrabold text-ink-faint">{i + 1}</span>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-soft text-lg" aria-hidden="true">{meta.icon}</span>
                    <span className="font-semibold">{meta.name}</span>
                  </span>
                  <span className="text-sm font-bold text-ink">{fmtMinutes(p.totalMinutes)}</span>
                </li>
              );
            })}
            {!w.platformRank?.length && <li className="text-sm text-ink-soft">No platform activity this week.</li>}
          </ul>
        </Card>
      </div>

      <p className="rounded-xl bg-surface-soft px-4 py-3 text-xs text-ink-soft">
        Insights are informational — they describe patterns, they don't diagnose anything. If numbers ever feel heavy,
        remember your goal is intention, not perfection. 💚
      </p>
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone = 'neutral' }) {
  const accent = {
    good: 'text-brand-700',
    warn: 'text-amber-700',
    bad: 'text-rose-600',
    neutral: 'text-ink',
  }[tone];
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        <span className="text-base" aria-hidden="true">{icon}</span> {label}
      </div>
      <p className={`mt-1.5 text-2xl font-extrabold ${accent}`}>{value}</p>
      <p className="mt-0.5 text-xs text-ink-faint">{sub}</p>
    </div>
  );
}