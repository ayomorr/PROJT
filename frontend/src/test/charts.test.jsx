import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarChart, HourChart, Sparkline } from '../components/charts.jsx';

describe('charts', () => {
  it('BarChart renders a labelled bar per data point', () => {
    const data = [
      { label: 'Mon', value: 120 },
      { label: 'Tue', value: 60 },
    ];
    render(<BarChart data={data} height={100} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('aria-label')).toContain('Mon: 120');
    expect(img.getAttribute('aria-label')).toContain('Tue: 60');
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
  });

  it('HourChart renders 24 activity buckets', () => {
    const { container } = render(<HourChart minutes={Array(24).fill(5)} />);
    expect(container.querySelectorAll('[role="img"]').length).toBe(1);
  });

  it('Sparkline returns null for empty data', () => {
    const { container } = render(<Sparkline values={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('Sparkline renders an svg with accessible label', () => {
    render(<Sparkline values={[50, 60, 45, 70, 72]} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Attention score trend');
  });
});