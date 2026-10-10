import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AlertSeverityBadge, AlertStatusBadge } from '../components/AlertBadge';

describe('AlertBadge Components', () => {
  it('renders severity badge with correct styling', () => {
    render(<AlertSeverityBadge severity="CRITICAL" />);
    const badge = screen.getByTestId('alert-severity-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('CRITICAL');
    expect(badge.className).toContain('text-red-400');
  });

  it('renders status badge with correct text', () => {
    const { rerender } = render(<AlertStatusBadge status="OPEN" />);
    let badge = screen.getByTestId('alert-status-badge');
    expect(badge).toHaveTextContent('OPEN');

    rerender(<AlertStatusBadge status="RESOLVED" />);
    badge = screen.getByTestId('alert-status-badge');
    expect(badge).toHaveTextContent('RESOLVED');
  });
});
