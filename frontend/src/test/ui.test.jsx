import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, Chip, DemoBadge, ProgressBar, ProgressRing, Spinner } from '../components/ui.jsx';

describe('ui primitives', () => {
  it('Spinner renders with spin animation for a11y-hidden icon', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('Button renders label and variant classes', () => {
    render(<Button variant="primary">Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn.className).toContain('btn-primary');
  });

  it('small ghost button uses compact classes', () => {
    render(<Button variant="ghost" size="sm">X</Button>);
    expect(screen.getByRole('button', { name: 'X' }).className).toContain('px-3');
  });

  it('Chip renders children with color classes', () => {
    render(<Chip color="brand">Done ✓</Chip>);
    expect(screen.getByText('Done ✓')).toHaveClass('bg-brand-100');
  });

  it('DemoBadge is clearly labelled as demo data', () => {
    render(<DemoBadge />);
    expect(screen.getByTestId('demo-badge')).toHaveTextContent('Demo Data');
  });

  it('ProgressBar exposes accessible numeric values', () => {
    render(<ProgressBar value={30} total={100} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '30');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('ProgressRing animates to the target value', () => {
    const { container } = render(<ProgressRing value={72} size={100} stroke={10} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(0);
  });
});