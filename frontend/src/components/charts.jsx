// Small dependency-free SVG charts used across the dashboard and insights.
// Designed to stay legible on small screens and honour prefers-reduced-motion.
import { useEffect, useState } from 'react';

const REDUCED = typeof window === 'undefined' ? false : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function charge(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* ---------------------------------------------------------------- BarChart
 * data: [{ label, value, color? }]  values in minutes.
 */
export function BarChart({ data, height = 140, suffix = '' }) {
  const [progress, setProgress] = useState(REDUCED ? 1 : 0);

  useEffect(() => {
    if (REDUCED) {
      setProgress(1);
      return;
    }
    const raf = requestAnimationFrame(() => setProgress(1));
    return () => cancelAnimationFrame(raf);
  }, [data]);

  const max = Math.max(...data.map((d) => d.value), 1);
  const reduced = REDUCED;
  void reduced;

  return (
    <div className="w-full" role="img" aria-label={data.map((d) => `${d.label}: ${d.value}${suffix}`).join(', ')}>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * height;
          return (
            <div key={i} className="group flex flex-1 flex-col items-center gap-1.5" title={`${d.label}: ${d.value}${suffix}`}>
              <span className="text-[10px] font-semibold text-ink-soft opacity-0 transition-opacity group-hover:opacity-100">
                {d.value}{suffix}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-700 ease-calm group-hover:opacity-80"
                style={{
                  height: `${h * progress}px`,
                  backgroundColor: d.color || '#8379E8',
                  opacity: d.value === 0 ? 0.18 : 1,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5 sm:gap-2">
        {data.map((d, i) => (
          <span key={i} className="flex-1 truncate text-center text-[10px] text-ink-faint">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- HourChart (24h activity) */
export function HourChart({ minutes = [], height = 120 }) {
  const hours = minutes.length ? minutes : Array(24).fill(0);
  const max = Math.max(...hours, 1);
  const [progress, setProgress] = useState(REDUCED ? 1 : 0);
  useEffect(() => {
    if (REDUCED) return setProgress(1);
    requestAnimationFrame(() => setProgress(1));
  }, [minutes]);

  return (
    <div role="img" aria-label="Usage by hour of day">
      <div className="flex items-end gap-[2px]" style={{ height }} aria-hidden="true">
        {hours.map((v, i) => (
          <div key={i} className="flex-1 rounded-t-sm bg-brand-200/70 transition-all duration-700 ease-calm" style={{ height: `${(v / max) * height * progress}px`, backgroundColor: v ? '#968FF0' : '#232C39' }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-faint" aria-hidden="true">
        <span>12a</span>
        <span>6a</span>
        <span>12p</span>
        <span>6p</span>
        <span>12a</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Donut (platform share) */
export function Donut({ slices, size = 180, thickness = 26 }) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const R = (size - thickness) / 2;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const [progress, setProgress] = useState(REDUCED ? 1 : 0);
  useEffect(() => {
    if (REDUCED) return setProgress(1);
    const raf = requestAnimationFrame(() => setProgress(1));
    return () => cancelAnimationFrame(raf);
  }, [slices]);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={slices.map((s) => `${s.label}: ${s.value} minutes`).join(', ')}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#232C39" strokeWidth={thickness} />
        {slices.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * C * progress;
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(dash - 2, 0)} ${C}`}
              strokeDashoffset={-offset * C * progress}
              strokeLinecap="round"
            />
          );
          offset += frac;
          return seg;
        })}
      </svg>
      <div className="absolute grid place-items-center">
        <span className="text-2xl font-extrabold text-ink">{(total).toFixed(0)}<span className="text-sm font-semibold text-ink-faint">m</span></span>
        <span className="text-[10px] text-ink-faint">this week</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Sparkline (score trend) */
export function Sparkline({ values = [], color = '#6D5AE6', height = 56, fill = true }) {
  if (!values.length) return null;
  const min = Math.min(...values) * 0.9;
  const max = Math.max(...values) * 1.05 + 0.0001;
  const w = 120;
  const h = height;
  const pts = values.map((v, i) => [i * (w / (values.length - 1)), h - ((v - min) / (max - min)) * h]);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14" preserveAspectRatio="none" role="img" aria-label="Attention score trend">
      {fill && <path d={area} fill={color} opacity="0.12" />}
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill={color} />
    </svg>
  );
}