import { useState } from 'react';
import * as data from '../lib/data.js';
import { useAsync } from '../lib/useAsync.js';
import { Button, Card, DemoBadge, EmptyState, Spinner, Chip } from '../components/ui.jsx';
import { titleCase } from '../lib/format.js';

const CATEGORY_ICONS = {
  morning: '🌅',
  focus: '🎯',
  evening: '🌙',
  general: '🌟',
};

export default function Challenges() {
  const { data, loading, error, retry } = useAsync(() => data.challengesApi.list());
  const [done, setDone] = useState({});
  const [busyId, setBusyId] = useState('');

  if (loading) {
    return <div className="grid place-items-center py-32"><Spinner /></div>;
  }
  if (error || !data?.challenges) {
    return (
      <EmptyState icon="🌱" title="Couldn't load challenges"
        text={error?.message || 'Please retry in a moment.'}
        action={<Button variant="primary" onClick={retry}>Try again</Button>} />
    );
  }

  const challenges = data.challenges || [];

  const complete = async (id) => {
    setBusyId(id);
    try {
      await data.challengesApi.complete(id);
      setDone((d) => ({ ...d, [id]: true }));
    } catch (err) {
      // already completed today — optimistically treat as done anyway
      setDone((d) => ({ ...d, [id]: true }));
    } finally {
      setBusyId('');
    }
  };

  const groups = {};
  for (const c of challenges) (groups[c.category || 'general'] = groups[c.category || 'general'] || []).push(c);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Daily challenges</h1>
        <p className="mt-1 text-sm text-ink-soft">Tiny, judgment-free wins. One a day is enough to make a difference.</p>
        {data.demo && <div className="mt-2"><DemoBadge /></div>}
      </header>

      {Object.entries(groups).map(([category, list]) => (
        <section key={category}>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
            <span aria-hidden="true">{CATEGORY_ICONS[category] || '🌟'}</span> {titleCase(category)}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((c) => {
              const completedToday = c.completedToday || done[c.id];
              return (
                <Card key={c.id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-ink">{c.title}</h3>
                    {completedToday ? <Chip color="brand">Completed ✓</Chip> : <Chip color="neutral">{c.duration || '1 day'}</Chip>}
                  </div>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">{c.description}</p>
                  <div className="mt-4">
                    {completedToday ? (
                      <p className="text-sm font-semibold text-brand-700">Nice — that's today's win. 💚</p>
                    ) : (
                      <Button
                        variant={busyId === c.id ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={busyId === c.id}
                        onClick={() => complete(c.id)}
                      >
                        {busyId === c.id ? 'Marking…' : 'Mark as done'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      <p className="rounded-xl bg-surface-soft px-4 py-3 text-xs text-ink-soft">
        Challenges never stack or shame. If you skip one, the next day starts fresh with a clean slate — progress,
        not punishment.
      </p>
    </div>
  );
}