import * as data from '../lib/data.js';
import { useAsync } from '../lib/useAsync.js';
import { platformById } from '@shared/platforms.js';
import { Button, DemoBadge, EmptyState, Spinner, Card } from '../components/ui.jsx';
import { fmtMinutes } from '../lib/format.js';

export default function PlatformsPage() {
  const { data: platformsData, loading: loadingP, error: errorP, retry: retryP } = useAsync(() => data.platformsApi.list());
  const { data: insights } = useAsync(() => data.usageApi.insights());
  const { user } = useMaybeAuth();

  if (loadingP) {
    return (
      <div className="grid place-items-center py-32"><Spinner /></div>
    );
  }
  if (errorP || !platformsData?.platforms) {
    return (
      <EmptyState icon="📡" title="Couldn't load platforms"
        text={errorP?.message || 'Please retry in a moment.'}
        action={<Button variant="primary" onClick={retryP}>Try again</Button>} />
    );
  }

  const weekly = insights?.weekly;
  const rank = new Map((weekly?.platformRank || []).map((p) => [p.platformId, p]));
  const tracked = user?.platforms || [];
  const demo = platformsData.demo;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Supported platforms</h1>
        <p className="mt-1 text-sm text-ink-soft text-balance">
          ScrollGuard watches the sites you give it access to and shows honest browser-based stats. It never sees your
          passwords or private content.
        </p>
        {demo && <div className="mt-2"><DemoBadge /></div>}
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {platformsData.platforms.map((p) => {
          const meta = platformById(p.id) || p;
          const weeklyStat = rank.get(p.id);
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-soft text-2xl" aria-hidden="true">{meta.icon}</span>
                  <div>
                    <p className="font-bold text-ink">{meta.name}</p>
                    <p className="text-xs text-ink-faint">{meta.domain}</p>
                  </div>
                </div>
                <span className={`chip ${tracked.includes(p.id) ? 'bg-brand-100 text-brand-800' : 'bg-ink/5 text-ink-soft'}`}>
                  {tracked.includes(p.id) ? 'Tracking' : 'Available'}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3 text-sm">
                <span className="text-ink-soft">Weekly time</span>
                <span className="font-bold text-ink">{weeklyStat ? fmtMinutes(weeklyStat.totalMinutes) : '—'}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="rounded-xl bg-surface-soft px-4 py-3 text-xs text-ink-soft">
        Plan: the browser extension starts a live session when it detects a feed — no third-party trackers, no screen
        recordings, just a count-up you control. Native mobile tracking requires the future companion app and is always
        opt-in; ScrollGuard will never show made-up numbers.
      </p>
    </div>
  );
}

// Demo/user info is optional here: in demo mode user.platforms drives the "Tracking" chips,
// otherwise we default to nothing tracked until a live session happens.
import { useAuth } from '../context/AuthContext.jsx';
function useMaybeAuth() {
  try {
    return useAuth();
  } catch {
    return { user: null };
  }
}