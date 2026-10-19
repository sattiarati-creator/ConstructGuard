import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatCard } from '../components/StatCard';

describe('StatCard Component', () => {
  it('renders title and value properly', () => {
    render(
      <StatCard
        title="Active Monitored Sites"
        value={12}
        subtitle="Across municipal zones"
      />
    );
    expect(screen.getByText('Active Monitored Sites')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Across municipal zones')).toBeInTheDocument();
  });

  it('renders critical variant with red styling', () => {
    render(
      <StatCard
        title="Critical Alerts"
        value={3}
        variant="critical"
      />
    );
    const card = screen.getByTestId('stat-card');
    expect(card.className).toContain('border-red-500/30');
  });
});
