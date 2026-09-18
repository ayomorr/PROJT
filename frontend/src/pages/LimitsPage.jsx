import { useState } from 'react';
import * as data from '../lib/data.js';
import { useAsync } from '../lib/useAsync.js';
import { platformById } from '@shared/platforms.js';
import { Button, DemoBadge, EmptyState, Spinner, Card, Toggle, useToast } from '../components/ui.jsx';
import { fmtMinutes } from '../lib/format.js';

export default function LimitsPage() {
  const toast = useToast();
  const { data, loading, error, retry } = useAsync(() => data.limitsApi.list());
  const [editing, setEditing] = useState({}); // { platformId: {daily, session, quietStart, quietEnd} }
  const [busyId, setBusyId] = useState('');

  if (loading) {
    return <div className="grid place-items-center py-32"><Spinner /></div>;
  }
  if (error || !data?.limits) {
    return (
      <EmptyState icon="⏱️" title="Couldn't load your limits"
        text={error?.message || 'Please retry in a moment.'}
        action={<Button variant="primary" onClick={retry}>Try again</Button>} />
    );
  }

  const limits = data.limits || [];
  const global = limits.find((l) => !l.platformId);
  const byPlatform = limits.filter((l) => l.platformId);
  const demo = data.demo;

  const draftFor = (l) => editing[l.platformId || 'global'] || {
    daily: l?.dailyLimitMin != null ? l.dailyLimitMin : '',
    session: l?.sessionLimitMin != null ? l.sessionLimitMin : '',
    quietStart: l?.quietStart || '',
    quietEnd: l?.quietEnd || '',
  };

  const save = async (platformId, l) => {
    const draft = draftFor(l);
    setBusyId(platformId || 'global');
    try {
      const payload = {
        platformId: platformId || 'global',
        ...(draft.daily ? { dailyLimitMin: Number(draft.daily) } : {}),
        ...(draft.session ? { sessionLimitMin: Number(draft.session) } : {}),
        quietStart: draft.quietStart,
        quietEnd: draft.quietEnd,
      };
      if (l) {
        await data.limitsApi.update(l.id, payload);
      } else {
        await data.limitsApi.save(payload);
      }
      setEditing((e) => ({ ...e, [platformId || 'global']: undefined }));
      toast('Limit saved ✓');
      retry();
    } catch (err) {
      toast(err.message || 'Could not save limit.');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (l) => {
    setBusyId(l.platformId || 'global');
    try {
      await data.limitsApi.remove(l.id);
      toast('Limit removed');
      retry();
    } catch (err) {
      toast(err.message || 'Could not remove limit.');
    } finally {
      setBusyId('');
    }
  };

  const setDraft = (key, field, value) => {
    setEditing((e) => ({ ...e, [key]: { ...e[key], [field]: value } }));
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Your limits</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Gentle boundaries you control — nothing is enforced against you, just reminders when you cross a line.
        </p>
        {demo && <div className="mt-2"><DemoBadge /></div>}
      </header>

      {/* Quiet hours (global) */}
      <Card className="p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-ink">Quiet hours 🌙</h2>
            <p className="text-sm text-ink-soft">Less chatter after hours — reminders soften and land differently.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="form-label !mb-0" htmlFor="quietStart">From</label>
          <input id="quietStart" type="time" className="input !w-auto" value={draftFor(global).quietStart || ''}
            onChange={(e) => setDraft('global', 'quietStart', e.target.value)} />
          <label className="form-label !mb-0" htmlFor="quietEnd">To</label>
          <input id="quietEnd" type="time" className="input !w-auto" value={draftFor(global).quietEnd || ''}
            onChange={(e) => setDraft('global', 'quietEnd', e.target.value)} />
          <Button variant="secondary" size="sm" className="ml-auto" disabled={busyId === 'global'} onClick={() => save('global', global)}>
            {busyId === 'global' ? 'Saving…' : global ? 'Save' : 'Set'}
          </Button>
        </div>
      </Card>

      {/* Per-platform limits */}
      <div className="space-y-4">
        <h2 className="font-bold text-ink">Platform limits</h2>
        {byPlatform.map((l) => {
          const meta = platformById(l.platformId) || { name: l.platformId, icon: '🌐' };
          const d = draftFor(l);
          return (
            <Card key={l.id} className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-surface-soft text-xl" aria-hidden="true">{meta.icon}</span>
                  <p className="font-bold text-ink">{meta.name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(l)}>Remove</Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label" htmlFor={`d-${l.id}`}>Daily limit (minutes)</label>
                  <input id={`d-${l.id}`} type="number" min={5} max={720} className="input w-full" value={d.daily ?? ''}
                    onChange={(e) => setDraft(l.platformId, 'daily', e.target.value)} placeholder="e.g. 45" />
                </div>
                <div>
                  <label className="form-label" htmlFor={`s-${l.id}`}>Session limit (minutes)</label>
                  <input id={`s-${l.id}`} type="number" min={5} max={180} className="input w-full" value={d.session ?? ''}
                    onChange={(e) => setDraft(l.platformId, 'session', e.target.value)} placeholder="e.g. 20" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Toggle checked={d.daily || d.session} onChange={(v) => {
                  if (!v) setDraft(l.platformId, 'daily', '');
                }} label="Reminders enabled" />
                <span className="ml-auto text-xs text-ink-faint">You'll be nudged, never locked out.</span>
              </div>
              <div className="mt-4">
                <Button variant="primary" size="sm" disabled={busyId === l.platformId} onClick={() => save(l.platformId, l)}>
                  {busyId === l.platformId ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </Card>
          );
        })}

        {byPlatform.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-3xl" aria-hidden="true">⏱️</p>
            <p className="mt-2 font-bold">No platform limits yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
              Add a limit for your most-used platform — small boundaries are easier to respect than big ones.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}