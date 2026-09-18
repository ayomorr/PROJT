// Core UI primitives. Everything here is deliberately tiny, typed-free and consistent
// with the CSS component classes in index.css. Keep additions here DRY.
import { createContext, useContext, useEffect, useRef, useState } from 'react';

/* ---------------------------------------------------------------- Spinner */
export function Spinner({ className = 'h-6 w-6' }) {
  return (
    <svg className={`animate-spin text-brand-500 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------- Button */
export function Button({ variant = 'primary', size, fullWidth = false, className = '', ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  };
  const sizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
  };
  return (
    <button
      className={[
        variants[variant],
        size ? sizes[size] : '',
        fullWidth ? 'w-full justify-center' : '',
        className,
      ].join(' ')}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------- Input */
export function Input({ className = '', ...props }) {
  return <input className={`input ${className}`} {...props} />;
}

/* ---------------------------------------------------------------- Card */
export function Card({ className = '', children, ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- Badge / chip */
export function Chip({ color = 'neutral', children, className = '', ...props }) {
  const colors = {
    neutral: 'bg-ink/5 text-ink-soft',
    brand: 'bg-brand-100 text-brand-800',
    amber: 'bg-amber-soft text-[#8a5a07]',
    coral: 'bg-coral-soft text-coral',
    rose: 'bg-rose-50 text-rose-700',
  };
  return <span className={`chip ${colors[color]} ${className}`} {...props}>{children}</span>;
}

/* ---------------------------------------------------------------- Demo badge */
// Shown whenever the underlying data came from demo mode — a visible, honest label.
export function DemoBadge({ className = '' }) {
  return (
    <Chip color="amber" className={className} data-testid="demo-badge">
      <span aria-hidden="true">◆</span> Demo Data
    </Chip>
  );
}

/* ---------------------------------------------------------------- Logo */
export function Logo({ size = 36, showText = true, light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        className="grid place-items-center rounded-[28%] text-white font-extrabold"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg,#8379e8,#5b47d9)',
          fontSize: size * 0.52,
          boxShadow: '0 4px 14px rgba(91,71,217,0.35)',
        }}
        aria-hidden="true"
      >
        S
      </span>
      {showText && (
        <span className={`font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`} style={{ fontSize: size * 0.42 }}>
          ScrollGuard
        </span>
      )}
    </span>
  );
}

/* ---------------------------------------------------------------- Progress bar */
export function ProgressBar({ value, total, className = '', fillColor = '#6D5AE6' }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-ink/10 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <div className="h-full rounded-full transition-all duration-700 ease-calm" style={{ width: `${pct}%`, backgroundColor: fillColor }} />
    </div>
  );
}

/* ---------------------------------------------------------------- Progress ring (attention score) */
export function ProgressRing({ value, size = 140, stroke = 12, children, tone = 'mid' }) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [offset, setOffset] = useState(size * Math.PI);
  const R = (size - stroke) / 2;
  const C = 2 * Math.PI * R;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(100, value));
    if (reduced) {
      setDisplay(target);
      setOffset(C - (target / 100) * C);
      return;
    }
    let raf;
    const start = performance.now();
    const dur = 900;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = target * eased;
      setDisplay(v);
      setOffset(C - (v / 100) * C);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, C, reduced]);

  const toneColor = { good: '#31A56E', mid: '#F2A93B', low: '#E8735A' }[tone] || '#6D5AE6';

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Attention score ${Math.round(value)} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={R} stroke="#232C39" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          stroke={toneColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: reduced ? 'none' : 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children ? children : <span className="text-4xl font-extrabold">{Math.round(display)}</span>}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- Empty / Error states */
export function EmptyState({ icon = '🌿', title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center animate-fade-in">
      <span className="text-4xl" aria-hidden="true">{icon}</span>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {text && <p className="max-w-sm text-sm text-ink-soft">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", retry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center animate-fade-in" role="alert">
      <span className="text-4xl" aria-hidden="true">🫥</span>
      <h3 className="text-lg font-bold text-ink">That didn't quite work</h3>
      <p className="max-w-sm text-sm text-ink-soft">{message}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Toggle */
export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 ${
        checked ? 'bg-brand-500' : 'bg-ink/15'
      } disabled:opacity-50`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

/* ---------------------------------------------------------------- Modal */
export function Modal({ open, onClose, title, children, wide = false }) {
  const panelRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} card animate-pop max-h-[85vh] overflow-y-auto shadow-lift`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1" aria-label="Close dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Toast system */
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (message, type = 'info') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  };
  const value = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  };
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-pop flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lift ${
              t.type === 'error' ? 'bg-coral' : t.type === 'success' ? 'bg-brand-600' : 'bg-surface-soft'
            }`}
          >
            <span aria-hidden="true">{t.type === 'error' ? '⚠️' : t.type === 'success' ? '✓' : '💡'}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ---------------------------------------------------------------- Entrance reveal (respects reduced motion) */
export function Reveal({ children, delay = 0, className = '' }) {
  const { ref, inView } = useInViewOnce();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView || reduced ? 1 : 0,
        transform: inView || reduced ? 'none' : 'translateY(12px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function useInViewOnce() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        obs.disconnect();
      }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}