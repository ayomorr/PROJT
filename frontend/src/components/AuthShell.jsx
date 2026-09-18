import { Link } from 'react-router-dom';
import { Logo } from '../components/ui.jsx';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative grid min-h-screen place-items-center bg-surface px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/80 to-transparent" aria-hidden="true" />
      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link to="/" aria-label="Back to home">
            <Logo size={44} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
          </div>
        </div>
        <div className="card p-6 sm:p-8">{children}</div>
        {footer && <p className="mt-6 text-center text-sm text-ink-soft">{footer}</p>}
      </div>
    </div>
  );
}