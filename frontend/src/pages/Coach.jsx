import { useEffect, useRef, useState } from 'react';
import * as data from '../lib/data.js';
import { Button, DemoBadge, Chip, Spinner } from '../components/ui.jsx';

const QUICK_PROMPTS = [
  'How did I do this week?',
  'I feel like scrolling right now',
  'I keep staying up late scrolling',
  "Is this an addiction?",
];

function toneLabel(tone) {
  return { supportive: 'Supportive', encouraging: 'Encouraging', gentle: 'Gentle', neutral: 'Balanced' }[tone] || 'Supportive';
}

export default function Coach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || busy) return;
    setInput('');
    setError('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setBusy(true);
    try {
      const res = await data.aiApi.chat(q);
      const reply = res.reply || {};
      setDemo(Boolean(res.demo));
      setMessages((m) => [...m, { role: 'assistant', reply }]);
    } catch (err) {
      setError(err.message || 'Guard could not respond right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Guard — your AI wellbeing coach</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Kind, practical and never judgmental. Ask about your habits, or how to handle a scroll-urge.
        </p>
        {demo && <div className="mt-2"><DemoBadge /></div>}
      </header>

      <div className="card flex max-h-[70vh] flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && !busy && (
            <div className="py-6 text-center">
              <p className="text-4xl" aria-hidden="true">🤖</p>
              <p className="mt-3 font-bold text-ink">Hi, I'm Guard</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
                I read the patterns in your data and help you make small, kind changes. Ask me anything.
              </p>
              <div className="mx-auto mt-5 flex max-w-md flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p} type="button" onClick={() => send(p)}
                    className="chip border-2 border-ink/10 bg-surface-soft font-semibold text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <Message key={i} m={m} />
          ))}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-ink-faint">
              <Spinner className="h-4 w-4" /> Guard is thinking…
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 border-t border-ink/5 p-4"
        >
          <input
            aria-label="Message Guard"
            className="input flex-1"
            placeholder="Tell Guard how you're feeling…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <Button type="submit" variant="primary" disabled={busy || !input.trim()}>Send</Button>
        </form>
      </div>

      <p className="rounded-xl bg-surface-soft px-4 py-3 text-xs text-ink-soft">
        Guard is a wellbeing coach, not a therapist or medical professional. If you're struggling, please reach out to
        a real person you trust or a crisis service — you deserve support, today.
      </p>
    </div>
  );
}

function Message({ m }) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm font-medium text-white">
          {m.text}
        </div>
      </div>
    );
  }
  const r = m.reply || {};
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        <div className="rounded-2xl rounded-bl-sm bg-surface-soft px-4 py-2.5 text-sm leading-relaxed text-ink">
          {r.message || r.text || '—'}
        </div>

        {r.insight && (
          <div className="rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-ink">
            <span className="mb-0.5 block text-xs font-bold uppercase tracking-wide text-brand-700">Insight</span>
            {r.insight}
          </div>
        )}

        {r.suggestedAction && (
          <div className="rounded-xl bg-amber-soft/60 px-4 py-2.5 text-sm text-ink">
            <span className="mb-0.5 block text-xs font-bold uppercase tracking-wide text-amber-700">Suggested next step</span>
            {r.suggestedAction}
          </div>
        )}

        {(r.safety || r.resources) && (
          <div className="rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2">
              <Chip color="rose">Support available 💚</Chip>
              <span className="text-xs font-semibold text-ink-faint">You're not alone</span>
            </div>
            {Array.isArray(r.resources) && r.resources.map((res, i) => (
              <p key={i} className="mt-1 text-sm font-bold text-ink">
                {res.label}: <span className="font-medium text-ink-soft">{res.value}</span>
              </p>
            ))}
          </div>
        )}

        {r.tone && <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{toneLabel(r.tone)}</span>}
      </div>
    </div>
  );
}