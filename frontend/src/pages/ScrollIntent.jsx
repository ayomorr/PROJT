import { useState } from 'react';
import * as data from '../lib/data.js';
import { PLATFORMS } from '@shared/platforms.js';
import { Button, Card, Spinner } from '../components/ui.jsx';
import { fmtClock } from '../lib/format.js';

const INTENTS = [
  { id: 'work', icon: '💼', label: 'Work / research', note: 'Okay — use it, then close it.' },
  { id: 'connect', icon: '👋', label: 'Connect with someone', note: 'Reach that one person and stop.' },
  { id: 'relax', icon: '🌴', label: 'Relax / unwind', note: 'Give yourself permission — with a timer.' },
  { id: 'bored', icon: '🥱', label: 'Kill time', note: 'The one we need to make intentional.' },
];

export default function ScrollIntent() {
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState(null);
  const [intent, setIntent] = useState(null);
  const [minutes, setMinutes] = useState(10);
  const [ready, setReady] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const startLive = async () => {
    setError('');
    setBusy(true);
    try {
      // Will be watched as a regular session; in demo mode nothing is really tracked.
      const res = await data.usageApi.startLive(platform);
      setSessionId(res.sessionId || 'demo');
      setReady(true);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Could not start the session.');
    } finally {
      setBusy(false);
    }
  };

  const closeSession = async () => {
    try {
      await data.usageApi.endLive(sessionId);
    } catch {
      // fine either way
    }
    setSessionId(null);
    setReady(false);
    setStep(0);
  };

  if (ready) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">I want to scroll</h1>
          <p className="mt-1 text-sm text-ink-soft">Good on you for being honest about it.</p>
        </header>
        <div className="card p-8 text-center">
          <p className="text-5xl" aria-hidden="true">🧭</p>
          <p className="mt-3 text-lg font-bold text-ink">Enjoy your session — with intention</p>
          <p className="mt-1 text-sm text-ink-soft">
            Timer set to <strong>{minutes} min</strong>. When it rings, take a 2-minute break before deciding whether to continue.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="primary" onClick={closeSession}>I&apos;m done — close it</Button>
            <Button variant="secondary" onClick={() => setReady(false)}>Change plan</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">I want to scroll</h1>
        <p className="mt-1 text-sm text-ink-soft">Before the feed swallows an hour, answer three tiny questions.</p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
      )}

      {step === 0 && (
        <Card className="p-6">
          <h2 className="mb-1 font-bold text-ink">Where do you want to scroll?</h2>
          <p className="mb-4 text-sm text-ink-soft">Pick one — you can always switch apps later.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PLATFORMS.map((p) => (
              <button key={p.id} type="button" onClick={() => { setPlatform(p.id); setStep(1); }}
                className="rounded-2xl border-2 border-ink/10 bg-surface-soft p-4 text-center transition-all hover:border-brand-300 hover:bg-brand-50">
                <span className="block text-2xl" aria-hidden="true">{p.icon}</span>
                <span className="mt-1 block text-xs font-semibold text-ink">{p.name}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="p-6">
          <h2 className="mb-1 font-bold text-ink">{PLATFORMS.find((p) => p.id === platform)?.icon} What's the intent?</h2>
          <p className="mb-4 text-sm text-ink-soft">Naming the goal makes the session intentional instead of accidental.</p>
          <div className="space-y-2.5">
            {INTENTS.map((it) => (
              <button key={it.id} type="button" onClick={() => { setIntent(it.id); setStep(2); }}
                className="flex w-full items-start gap-3 rounded-2xl border-2 border-ink/10 bg-surface-soft px-4 py-3.5 text-left transition-all hover:border-brand-300 hover:bg-brand-50">
                <span className="text-xl" aria-hidden="true">{it.icon}</span>
                <span>
                  <span className="block text-sm font-bold text-ink">{it.label}</span>
                  <span className="block text-xs text-ink-soft">{it.note}</span>
                </span>
              </button>
            ))}
          </div>
          <Button variant="ghost" className="mt-4" onClick={() => setStep(0)}>← Back</Button>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          <h2 className="mb-1 font-bold text-ink">How long do you want it to be?</h2>
          <p className="mb-4 text-sm text-ink-soft">A timer keeps the feed from setting the pace.</p>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 30].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(m)}
                aria-pressed={minutes === m}
                className={`rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                  minutes === m ? 'border-brand-500 bg-brand-100 text-brand-800' : 'border-ink/10 bg-surface-soft text-ink-soft hover:border-brand-300'
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
            <Button variant="primary" onClick={startLive} disabled={busy}>
              {busy ? <Spinner size="sm" light /> : "Let's scroll — mindfully"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-ink-faint">
            Session: {PLATFORMS.find((p) => p.id === platform)?.name} · {INTENTS.find((i) => i.id === intent)?.label} · {minutes} min ({fmtClock(new Date().toISOString())})
          </p>
        </Card>
      )}
    </div>
  );
}