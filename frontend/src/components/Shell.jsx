// App layout: desktop sidebar + mobile bottom navigation (spec: mobile-first).
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useState } from 'react';
import { Logo } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { DEMO_MODE } from '../lib/data.js';
import { InstallPrompt } from './InstallPrompt.jsx';

const TOP_NAV = [
  { to: '/app', label: 'Home', icon: '🏠', end: true },
  { to: '/app/insights', label: 'Insights', icon: '📊' },
  { to: '/app/focus', label: 'Focus', icon: '🎯' },
  { to: '/app/challenges', label: 'Challenges', icon: '🌱' },
  { to: '/app/coach', label: 'Guard', icon: '🤖' },
  { to: '/app/scroll', label: 'I want to scroll', icon: '📱' },
  { to: '/app/platforms', label: 'Platforms', icon: '📈' },
  { to: '/app/limits', label: 'Limits', icon: '⏱️' },
  { to: '/app/profile', label: 'Profile', icon: '👤' },
  { to: '/app/privacy', label: 'Privacy', icon: '🔒' },
];

// The five main destinations shown in the mobile bottom bar (spec section 27).
const BOTTOM_NAV = TOP_NAV.filter((n) => ['Home', 'Insights', 'Focus', 'Challenges', 'Profile'].includes(n.label));

function linkClass({ isActive }) {
  return [
    'relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-semibold transition-colors',
    isActive ? 'text-brand-700' : 'text-ink-faint hover:text-ink',
  ].join(' ');
}

export default function Shell() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      {DEMO_MODE && (
        <div className="bg-amber-soft px-4 py-1.5 text-center text-xs font-semibold text-[#8a5a07]">
          Demo mode — sample data is shown and labeled. Run `npm run seed` and disable VITE_DEMO_MODE for real tracking.
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="safe-top fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-ink/5 bg-surface-card px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 px-2" aria-label="ScrollGuard home">
          <Logo size={34} />
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {TOP_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-brand-50/60 hover:text-ink'
              }`}
            >
              <span aria-hidden="true" className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-ink/5 pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {(user?.name || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user?.name || 'Guest'}</p>
              <p className="truncate text-xs text-ink-faint">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-ink/5 bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/app" aria-label="ScrollGuard home">
          <Logo size={30} showText={false} />
          <span className="sr-only">ScrollGuard</span>
        </Link>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-full bg-surface-soft shadow-card"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </header>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <nav className="absolute right-0 top-0 bottom-0 w-72 space-y-1 overflow-y-auto bg-surface-card p-5 shadow-lift animate-fade-in" aria-label="More">
            <div className="mb-4 flex items-center justify-between">
              <Logo size={28} showText={false} />
              <p className="font-bold">Menu</p>
            </div>
            {TOP_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft'}`}>
                <span aria-hidden="true">{item.icon}</span> {item.label}
              </NavLink>
            ))}
            <div className="pt-6">
              <InstallPrompt compact />
            </div>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="safe-bottom pb-28 lg:ml-60 lg:pb-10">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-surface-card/95 backdrop-blur lg:hidden" aria-label="Bottom navigation">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {BOTTOM_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <span aria-hidden="true" className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}