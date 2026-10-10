import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskBadge } from '../components/RiskBadge';

describe('RiskBadge Component', () => {
  it('renders CRITICAL risk badge with score', () => {
    render(<RiskBadge level="CRITICAL" score={85.4} />);
    const badge = screen.getByTestId('risk-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('CRITICAL');
    expect(badge).toHaveTextContent('(85.4)');
    expect(badge.className).toContain('text-red-400');
  });

  it('renders HIGH risk badge', () => {
    render(<RiskBadge level="HIGH" score={65} />);
    const badge = screen.getByTestId('risk-badge');
    expect(badge).toHaveTextContent('HIGH');
    expect(badge).toHaveTextContent('(65.0)');
    expect(badge.className).toContain('text-orange-400');
  });

  it('renders MEDIUM risk badge', () => {
    render(<RiskBadge level="MEDIUM" score={45} />);
    const badge = screen.getByTestId('risk-badge');
    expect(badge).toHaveTextContent('MEDIUM');
    expect(badge.className).toContain('text-amber-400');
  });

  it('renders LOW risk badge without score when showScore is false', () => {
    render(<RiskBadge level="LOW" score={15} showScore={false} />);
    const badge = screen.getByTestId('risk-badge');
    expect(badge).toHaveTextContent('LOW');
    expect(badge).not.toHaveTextContent('15');
    expect(badge.className).toContain('text-emerald-400');
  });
});
