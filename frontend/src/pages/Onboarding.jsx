import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner, Logo } from '../components/ui.jsx';
import * as data from '../lib/data.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PLATFORMS } from '@shared/platforms.js';

const GOAL_OPTIONS = [
  { id: 'reduce-time', icon: '🕰️', label: 'Reduce overall social-media time' },
  { id: 'stop-scrolling', icon: '🔁', label: 'Stop endless scrolling sessions' },
  { id: 'sleep', icon: '🌙', label: 'Get better sleep' },
  { id: 'focus', icon: '🎯', label: 'Increase deep work & focus' },
];

const TIMES = [
  { id: 'Morning', icon: '🌅', label: 'Morning' },
  { id: 'Midday', icon: '☀️', label: 'Midday' },
  { id: 'Afternoon', icon: '🌤️', label: 'Afternoon' },
  { id: 'Evening', icon: '🌆', label: 'Evening' },
  { id: 'Before sleeping', icon: '🌙', label: 'Before sleeping' },
];

const STEP_TITLES = ['Your goals', 'Your platforms', 'Daily time target', 'When you scroll'];

function ToggleChip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition-all ${
        selected ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-soft' : 'border-ink/10 bg-surface-soft text-ink-soft hover:border-brand-300'
      }`}
    >
      {children}
    </button>
  );
}

function StepDots({ step }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`Step ${step + 1} of 4`}>
      {STEP_TITLES.map((_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-brand-600' : 'w-1.5 bg-ink/15'}`} />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const { refresh } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(90);
  const [scrollTimes, setScrollTimes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = (list, setList) => (id) =>
    setList((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const canNext = step === 0 ? goals.length > 0 : step === 1 ? platforms.length > 0 : step === 2 ? dailyGoal >= 10 : true;

  const finish = async () => {
    setError('');
    setBusy(true);
    try {
      await data.userApi.update({ goals, platforms, dailyGoal, scrollTimes });
      await refresh();
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong saving your preferences.');
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="mb-6 flex justify-center"><Logo size={36} /></div>

        <div className="card p-6 sm:p-8">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-700">
            Step {step + 1} of 4
          </p>
          <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-ink">{STEP_TITLES[step]}</h1>

          {error && (
            <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
          )}

          {step === 0 && (
            <div className="space-y-2.5">
              <p className="mb-3 text-sm text-ink-soft">What matters most to you right now? Choose any that fit.</p>
              {GOAL_OPTIONS.map((g) => (
                <ToggleChip key={g.id} selected={goals.includes(g.id)} onClick={() => toggle(goals, setGoals)(g.id)}>
                  <span className="mr-2" aria-hidden="true">{g.icon}</span> {g.label}
                </ToggleChip>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2.5">
              <p className="mb-3 text-sm text-ink-soft">Pick the platforms you want to keep an eye on.</p>
              {PLATFORMS.map((p) => (
                <ToggleChip key={p.id} selected={platforms.includes(p.id)} onClick={() => toggle(platforms, setPlatforms)(p.id)}>
                  <span className="mr-2" aria-hidden="true">{p.icon}</span> {p.name}
                </ToggleChip>
              ))}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-6 text-sm text-ink-soft">A target that feels achievable beats an extreme one. You can change it anytime.</p>
              <input
                type="range" min={15} max={300} step={5} value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full accent-brand-600" aria-label="Daily time target in minutes"
              />
              <div className="mt-3 flex items-end justify-between text-sm">
                <span className="text-ink-faint">15 min</span>
                <p className="text-center">
                  <span className="block text-4xl font-extrabold text-brand-700">{dailyGoal}</span>
                  <span className="text-ink-soft">minutes per day</span>
                </p>
                <span className="text-ink-faint">5 h</span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-4 text-sm text-ink-soft">When do you tend to scroll the most? We'll tailor reminders around these.</p>
              <div className="flex flex-wrap gap-2">
                {TIMES.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => toggle(scrollTimes, setScrollTimes)(t.id)}
                    aria-pressed={scrollTimes.includes(t.id)}
                    className={`rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                      scrollTimes.includes(t.id)
                        ? 'border-brand-500 bg-brand-100 text-brand-800'
                        : 'border-ink/10 bg-surface-soft text-ink-soft hover:border-brand-300'
                    }`}
                  >
                    <span className="mr-1.5" aria-hidden="true">{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
              {scrollTimes.length === 0 && (
                <p className="mt-3 text-xs text-ink-faint">You can skip this — Guard will learn from your data anyway.</p>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || busy}>
              Back
            </Button>
            {step < 3 ? (
              <Button variant="primary" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={finish} disabled={busy}>
                {busy ? <Spinner size="sm" light /> : 'Start protecting my attention'}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4"><StepDots step={step} /></div>
      </div>
    </div>
  );
}