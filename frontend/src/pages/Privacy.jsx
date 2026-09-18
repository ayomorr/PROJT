import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Card } from '../components/ui.jsx';

const SECTIONS = [
  {
    title: 'Actually, what do you track?',
    body: 'Only time you spend in a browsed feed while a live session is running (browser extension) or sessions you log yourself. We never read content, messages, passwords, or anything private.',
  },
  {
    title: 'No passwords for your social accounts',
    body: 'ScrollGuard can never log into Instagram, TikTok or any platform for you. There is no technical path for us to read your private feeds.',
  },
  {
    title: 'Honesty about mobile',
    body: 'A website cannot silently watch your other apps. Native screen-time tracking for phones requires the future companion app and your explicit permission. Until then, hand-logged sessions are marked as such and never faked.',
  },
  {
    title: 'Where data lives',
    body: 'Sessions live in the database this app runs on, tied only to your account. Analytics are aggregated. Nothing is sold, shared, or used for ads — ever.',
  },
  {
    title: 'Right to delete',
    body: 'Your profile has a one-tap "delete my account & data". It removes your user, all sessions, limits and challenge completions. Export of your own history is on the roadmap.',
  },
  {
    title: 'Being human',
    body: "ScrollGuard's AI coach (Guard) is built to be kind, non-clinical and never prescriptive about health. It is not a therapist. Crisis-related messages route to real support resources.",
  },
];

export default function Privacy() {
  const { isAuthed } = useAuth();
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Privacy</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Short version: your attention data is yours. Long version below.
        </p>
      </header>

      <div className="space-y-3">
        {SECTIONS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="w-full rounded-2xl border border-ink/10 bg-surface-card px-5 py-4 text-left transition-colors hover:border-brand-300"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-bold text-ink">{s.title}</span>
              <span className={`transition-transform ${open === i ? 'rotate-90' : ''}`} aria-hidden="true">›</span>
            </span>
            {open === i && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{s.body}</p>}
          </button>
        ))}
      </div>

      {isAuthed && (
        <Card className="p-6 text-center">
          <p className="font-bold text-ink">Want to remove everything?</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">Deleting your account wipes all sessions and settings.</p>
          <Link to="/app/profile" className="mt-4 inline-block">
            <Button variant="danger">Go to delete controls</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}