// Landing page — the showcase. Sections: hero, how it works, features, built for
// real life, privacy, testimonials (clearly labelled demo), final CTA, footer.
import { Link } from 'react-router-dom';
import { Button, Chip, Reveal, ProgressRing, DemoBadge, Logo } from '../components/ui.jsx';

const FEATURES = [
  { icon: '🛡️', title: 'Dead-scroll detection', text: 'Notices prolonged sessions and nudges you gently — never shames you.' },
  { icon: '💯', title: 'Attention Score', text: 'A friendly, non-clinical signal of how your attention went today.' },
  { icon: '🤖', title: 'AI wellbeing coach', text: 'Guard reads your own patterns and gives practical, kind suggestions.' },
  { icon: '📊', title: 'Screen-time analytics', text: 'Weekly totals, per-platform breakdowns, and when you scroll most.' },
  { icon: '⏱️', title: 'Custom limits', text: 'Daily, per-session, and quiet-hours boundaries that you control.' },
  { icon: '🎯', title: 'Focus Mode', text: 'A distraction-free countdown that protects your attention on demand.' },
  { icon: '☕', title: 'Break reminders', text: 'Breathe, stretch, drink water — two-minute resets that work.' },
  { icon: '🌱', title: 'Daily challenges', text: 'Tiny, judgment-free wins that build healthier digital routines.' },
  { icon: '🗓️', title: 'Weekly insights', text: 'Understand trends so change feels obvious, not overwhelming.' },
  { icon: '📱', title: 'Cross-platform support', text: 'Web extension tracking and honest integration plans.' },
];

const STEPS = [
  { n: '1', title: 'Connect your supported platforms', text: 'Choose where your attention goes — from TikTok to LinkedIn. The browser extension tracks what it can, honestly.' },
  { n: '2', title: 'Understand your habits', text: 'See real numbers: total time, sessions, longest scrolls, and the hours that pull you in.' },
  { n: '3', title: 'Get intelligent reminders', text: 'Calm, escalating nudges at the right moments — continue, take a break, or reset.' },
  { n: '4', title: 'Build better digital routines', text: 'Set limits, take challenges, and let Guard coach you toward intentional use.' },
];

const PLATFORM_STRIP = ['🎵 TikTok', '📸 Instagram', '▶️ YouTube', '👥 Facebook', '🐦 X', '👽 Reddit', '👻 Snapchat', '💼 LinkedIn'];

const PRIVACY_POINTS = [
  { icon: '🔒', title: 'No passwords, ever', text: 'We never ask for your social-media passwords and never scrape private account information.' },
  { icon: '🩺', title: 'Honest tracking', text: 'A website cannot secretly watch your phone apps. We track what browsers can see and let you log the rest by hand.' },
  { icon: '🗑️', title: 'You can delete everything', text: 'One tap erases your account and every session. What we collect is only what makes the product work.' },
];

const TESTIMONIALS = [
  { quote: 'I stopped losing whole evenings to feeds without feeling like I gave up anything.', name: 'Maya, 24' },
  { quote: 'The wind-down reminder at 10PM changed my sleep more than any screen-time setting ever did.', name: 'Daniel, 31' },
  { quote: 'It never made me feel judged. Just aware. That was enough to change the habit.', name: 'Priya, 27' },
];

function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <Chip color="brand" className="mb-3">{eyebrow}</Chip>
      <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-base text-ink-soft">{text}</p>}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="bg-surface text-ink">
      {/* Nav */}
      <header className="safe-top sticky top-0 z-30 border-b border-ink/5 bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Logo size={34} />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-ink-soft md:flex" aria-label="Landing navigation">
            <a href="#how" className="hover:text-brand-700">How it works</a>
            <a href="#features" className="hover:text-brand-700">Features</a>
            <a href="#privacy" className="hover:text-brand-700">Privacy</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost">Log in</Link>
            <Link to="/register"><Button variant="primary">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-gradient-to-b from-brand-50/80 to-transparent" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
          <div className="animate-fade-up">
            <Chip color="brand" className="mb-5">AI-powered digital wellbeing</Chip>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Scroll less.<br />
              <span className="text-gradient">Live more.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              ScrollGuard helps you understand your social-media habits, interrupt endless scrolling,
              and take back control of your attention.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register"><Button variant="primary" className="px-6 py-3 text-base">Start protecting my attention</Button></Link>
              <a href="#how"><Button variant="secondary" className="px-6 py-3 text-base">See how it works</Button></a>
            </div>
            <p className="mt-6 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <span className="font-semibold text-brand-700">Free to start ·</span> Your attention data belongs to you.
            </p>
          </div>

          <HeroMock />
        </div>
      </section>

      {/* Platform strip */}
      <section className="border-y border-ink/5 bg-surface-card/60 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-sm font-semibold text-ink-faint">
          <span className="uppercase tracking-wider text-xs text-ink-faint/70">Works alongside</span>
          {PLATFORM_STRIP.map((p) => (
            <span key={p} className="flex items-center gap-1.5">{p}</span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="How it works" title="Four gentle steps to take control" text="No guilt. No blocking. Just clarity plus a little friendly AI help." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <div className="card h-full">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-brand-100 text-lg font-extrabold text-brand-700">{s.n}</span>
                <h3 className="mb-2 font-bold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-ink-soft">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-surface-soft/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle eyebrow="Features" title="Everything you need to scroll intentionally" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 100}>
                <div className="card h-full transition-shadow hover:shadow-lift">
                  <span className="mb-3 inline-grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl" aria-hidden="true">{f.icon}</span>
                  <h3 className="mb-1.5 font-bold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Built for real life */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <Chip color="brand" className="mb-3">Built for real life</Chip>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">You don't have to quit social media.</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              ScrollGuard never demands total abstinence. It shows you what's actually happening, gives you kind
              reminders at the right moments, and helps you turn unconscious scrolling into choices you make on purpose.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'A gentle nudge, not an angry lecture',
                'Your targets, your rules, your quiet hours',
                'An AI coach that never diagnoses or shames',
                'Privacy-first: your attention data belongs to you',
              ].map((li) => (
                <li key={li} className="flex items-start gap-3 text-sm text-ink-soft">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700" aria-hidden="true">✓</span>
                  {li}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={150}>
            <div className="card space-y-3 shadow-lift">
              <div className="flex items-center justify-between">
                <p className="font-bold">Tonight — what could help?</p>
                <Chip color="amber">Pattern found</Chip>
              </div>
              <p className="rounded-xl bg-brand-50 p-4 text-sm leading-relaxed text-ink-soft">
                🌙 Most of your longer sessions happen between <strong className="text-ink">9 PM – 11 PM</strong>.
                Set a gentle wind-down reminder around 8:45 PM?
              </p>
              <div className="flex gap-2">
                <Button variant="primary" className="flex-1">Set 9 PM wind-down</Button>
                <Button variant="secondary">Not now</Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="border-y border-ink/10 bg-surface-soft/50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="Privacy first"
            title={<span className="text-ink">Your attention data belongs to you.</span>}
            text={<span className="text-ink-soft">Privacy isn't a feature patch — it's the foundation of ScrollGuard.</span>}
          />
          <div className="grid gap-5 md:grid-cols-3">
            {PRIVACY_POINTS.map((p, i) => (
              <Reveal key={p.title} delay={i * 100}>
                <div className="rounded-2xl border border-ink/10 bg-surface-card p-6">
                  <span className="mb-3 inline-grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl" aria-hidden="true">{p.icon}</span>
                  <h3 className="mb-2 font-bold text-ink">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials (demo, clearly marked) */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="What people say" title="Kind words from early testers" />
        <div className="mb-4 flex justify-center"><DemoBadge /></div>
        <p className="mx-auto mb-8 max-w-xl text-center text-sm text-ink-faint">
          These are illustrative, fictional testimonials used for development previews — not real customers.
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="card h-full">
                <div className="mb-3 text-brand-500" aria-hidden="true">★★★★★</div>
                <blockquote className="text-sm leading-relaxed text-ink-soft">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-sm font-bold">{t.name}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-center text-white shadow-lift sm:p-14">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Your attention is yours. Protect it.</h2>
            <p className="mx-auto mt-3 max-w-md text-white/80">
              ScrollGuard doesn't tell you to stop using social media. It helps you use it intentionally.
            </p>
            <Link to="/register" className="mt-8 inline-block">
              <span className="btn bg-white px-8 py-3.5 text-base text-brand-600 shadow hover:shadow-lift">Get started — it's free</span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/5 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-ink-faint sm:flex-row">
          <Logo size={26} />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Footer">
            <Link to="/privacy" className="hover:text-brand-700">Privacy</Link>
            <Link to="/login" className="hover:text-brand-700">Log in</Link>
            <Link to="/register" className="hover:text-brand-700">Sign up</Link>
            <a href="#how" className="hover:text-brand-700">How it works</a>
          </nav>
          <p>© {new Date().getFullYear()} ScrollGuard · Scroll less. Live more.</p>
        </div>
      </footer>
    </div>
  );
}

/* Hero mockup drawn with the real design system so it always matches the product. */
function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-md animate-float">
      <div className="card p-6 shadow-lift">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-soft">Good afternoon</p>
            <p className="text-xl font-extrabold">Let's check in 👋</p>
          </div>
          <Chip color="brand">Today</Chip>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-brand-50 p-4">
            <p className="text-xs font-semibold text-brand-700">Screen time</p>
            <p className="mt-1 text-2xl font-extrabold">2h 18m</p>
            <p className="text-xs text-ink-faint">Target: 1h 30m</p>
          </div>
          <div className="grid place-items-center rounded-2xl bg-surface-card p-2">
            <ProgressRing value={72} size={108} stroke={11} tone="good">
              <div className="text-center">
                <p className="text-xl font-extrabold leading-none">72</p>
                <p className="text-[9px] font-semibold text-ink-faint">Attention</p>
              </div>
            </ProgressRing>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between rounded-xl bg-surface-soft px-4 py-3">
            <span className="text-sm font-semibold">🎵 TikTok — current session</span>
            <span className="text-sm font-bold text-brand-700">18 min</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-soft px-4 py-3">
            <span className="text-sm font-semibold">😌 No break yet</span>
            <span className="text-sm font-bold">Suggested: 2 min</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-rose-500/10 px-4 py-3">
            <span className="text-sm font-semibold">⏳ 9 min until daily target</span>
            <Chip color="rose">Ease up</Chip>
          </div>
        </div>
      </div>
    </div>
  );
}