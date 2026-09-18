import * as data from '../lib/data.js';
import { useAsync } from '../lib/useAsync.js';
import { platformById } from '@shared/platforms.js';
import { Button, Card, DemoBadge, EmptyState, Spinner } from '../components/ui.jsx';
import { fmtMinutes, fmtSeconds, titleCase, plural } from '../lib/format.js';

export default function Admin() {
  const { data, loading, error, retry } = useAsync(() => data.adminApi.stats());

  if (loading) {
    return <div className="grid place-items-center py-32"><Spinner /></div>;
  }
  if (error || !data) {
    return (
      <EmptyState icon="🛡️" title="Couldn't load admin stats"
        text={error?.message || 'Please retry in a moment.'}
        action={<Button variant="primary" onClick={retry}>Try again</Button>} />
    );
  }

  const s = data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Admin overview</h1>
        <p className="mt-1 text-sm text-ink-soft">Aggregated, non-personal metrics. No individual user data here.</p>
        {s.demo && <div className="mt-2"><DemoBadge /></div>}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="👥" label="Total users" value={s.totalUsers?.toLocaleString?.() ?? '—'} />
        <StatCard icon="🟢" label="Active (7d)" value={s.activeUsers7d?.toLocaleString?.() ?? '—'} />
        <StatCard icon="🖥️" label="Sessions today" value={(s.sessionsToday || 0).toLocaleString()} />
        <StatCard icon="⏱️" label="Time today" value={s.timeTodaySeconds ? fmtSeconds(s.timeTodaySeconds) : '—'} />
      </div>

      <Card className="p-6">
        <h2 className="mb-1 font-bold text-ink">Platform distribution (this week)</h2>
        <p className="mb-4 text-sm text-ink-soft">{plural(s.sessionsWeek || 0, 'session')} total</p>
        <div className="space-y-3">
          {(s.platformDistribution || []).map((p) => {
            const meta = platformById(p.platformId) || { name: titleCase(p.platformId), icon: '🌐', color: '#8379E8' };
            const total = (s.platformDistribution || []).reduce((a, b) => a + (b.sessions || 0), 0);
            const pct = total > 0 ? Math.round(((p.sessions || 0) / total) * 100) : 0;
            return (
              <div key={p.platformId} className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-soft text-base" aria-hidden="true">{meta.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-semibold text-ink">{meta.name}</span>
                    <span className="text-ink-soft">{p.sessions?.toLocaleString?.() ?? 0} · {fmtMinutes(p.totalMinutes || 0)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-bold text-ink">Feature usage (past week)</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat icon="🎯" label="Focus sessions" value={(s.featureUsage?.focusSessionsWeek || 0).toLocaleString()} />
          <MiniStat icon="💬" label="Reminders sent" value={(s.featureUsage?.remindersWeek || 0).toLocaleString()} />
          <MiniStat icon="⏱️" label="Limits configured" value={(s.featureUsage?.limitsSet || 0).toLocaleString()} />
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        <span className="text-base" aria-hidden="true">{icon}</span> {label}
      </div>
      <p className="mt-1.5 text-2xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-4">
      <p className="text-sm text-ink-soft"><span aria-hidden="true">{icon}</span> {label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink">{value}</p>
    </div>
  );
}