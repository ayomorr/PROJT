import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as data from '../lib/data.js';
import { Button, Card } from '../components/ui.jsx';
import { fmtClock } from '../lib/format.js';

const PRESETS = [10, 25, 50];
const PRESET_LABELS = { 10: 'Quick reset', 25: 'Deep work', 50: 'Extended' };

export default function FocusMode() {
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState(25);
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [focusId, setFocusId] = useState(null);
  const [leftS, setLeftS] = useState(25 * 60);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  // Tick down while running.
  useEffect(() => {
    if (!running || complete) return;
    timerRef.current = setInterval(() => setLeftS((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timerRef.current);
  }, [running, complete]);

  // Natural completion.
  useEffect(() => {
    if (running && leftS === 0 && !complete) {
      setComplete(true);
      setRunning(false);
      endFocus(focusId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftS, running]);

  const endFocus = async (id) => {
    if (!id) return;
    try {
      await data.focusApi.end(id);
    } catch {
      // Non-fatal — local UI should still clear.
    }
  };

  const start = async () => {
    setError('');
    setStarting(true);
    try {
      const res = await data.focusApi.start(minutes, []);
      setFocusId(res.focus?.id || `focus-local-${Date.now()}`);
      setLeftS(minutes * 60);
      setComplete(false);
      setRunning(true);
    } catch (err) {
      setError(err.message || 'Could not start focus session.');
    } finally {
      setStarting(false);
    }
  };

  const quitEarly = async () => {
    if (!confirm('End focus early?')) return;
    setEnding(true);
    await endFocus(focusId);
    setRunning(false);
    setComplete(false);
    setEnding(false);
    navigate('/app');
  };

  const finishNow = async () => {
    setEnding(true);
    await endFocus(focusId);
    setRunning(false);
    setComplete(true);
    setEnding(false);
  };

  const mm = String(Math.floor(leftS / 60)).padStart(2, '0');
  const ss = String(leftS % 60).padStart(2, '0');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Focus Mode</h1>
        <p className="mt-1 text-sm text-ink-soft">Claim a block of time and let the countdown keep you honest.</p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
      )}

      {!running ? (
        <>
          <Card className="p-6">
            <label className="form-label" htmlFor="focusLength">Focus length</label>
            <div className="grid grid-cols-3 gap-3">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMinutes(p)}
                  className={`rounded-2xl border-2 px-4 py-4 text-center transition-all ${
                    minutes === p ? 'border-brand-500 bg-brand-50' : 'border-ink/10 bg-surface-soft hover:border-brand-300'
                  }`}
                >
                  <span className="block text-2xl font-extrabold text-ink">{p}</span>
                  <span className="mt-1 block text-xs font-semibold text-ink-soft">{PRESET_LABELS[p]}</span>
                </button>
              ))}
            </div>
            <Button variant="primary" className="mt-4" onClick={start} disabled={starting}>
              {starting ? 'Starting…' : `Start ${minutes}-minute focus`}
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 font-bold text-ink">What stays protected during Focus</h2>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>🛡️ New scrolling sessions on your tracked platforms</li>
              <li>📵 Distracting tabs — nothing is blocked, you just choose to stay</li>
              <li>🌙 Your attention score gets a clear block of intention</li>
            </ul>
          </Card>

          <p className="rounded-xl bg-surface-soft px-4 py-3 text-xs text-ink-soft">
            Pro tip: pair Focus Mode with "I want to scroll" — when a scroll-urge hits, open ScrollGuard first. 📱 → 📖
          </p>
        </>
      ) : (
        <div className="card p-8 text-center">
          {complete ? (
            <>
              <p className="text-5xl" aria-hidden="true">🎉</p>
              <p className="mt-3 text-lg font-bold text-ink">Focus complete — great work!</p>
              <p className="mt-1 text-sm text-ink-soft">You protected {minutes} minutes today. That adds up.</p>
              <Button variant="primary" className="mt-6" onClick={() => navigate('/app')}>Back to dashboard</Button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-brand-700">In flow</p>
              <p className="mt-4 select-none text-[4.5rem] font-extrabold tabular-nums leading-none tracking-tight text-ink sm:text-7xl">
                {mm}<span className="text-ink-faint">:</span>{ss}
              </p>
              <p className="mt-2 text-sm text-ink-soft">Started {fmtClock(new Date().toISOString())} — you're in the zone.</p>

              <div className="mx-auto mt-6 max-w-sm space-y-2 text-left">
                <Suggestion icon="📵" text="One task, one tab. That's it." />
                <Suggestion icon="💧" text="When the timer ends, take a proper break." />
              </div>

              <div className="mt-8 flex justify-center gap-3">
                <Button variant="primary" onClick={finishNow} disabled={ending}>
                  {ending ? 'Finishing…' : "I'm done"}
                </Button>
                <Button variant="ghost" onClick={quitEarly} disabled={ending}>End early</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Suggestion({ icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-surface-soft px-3 py-2 text-sm text-ink-soft">
      <span aria-hidden="true">{icon}</span> {text}
    </div>
  );
}