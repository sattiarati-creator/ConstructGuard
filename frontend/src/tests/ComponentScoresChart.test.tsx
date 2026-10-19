import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ComponentScoresChart } from '../charts/ComponentScoresChart';

describe('ComponentScoresChart Component', () => {
  it('renders all 5 explainable components and scores', () => {
    render(
      <ComponentScoresChart
        visualScore={80}
        changeScore={70}
        sensorScore={65}
        timeScore={90}
        permitScore={100}
      />
    );

    expect(screen.getByText('Visual (30%)')).toBeInTheDocument();
    expect(screen.getByText('Change (25%)')).toBeInTheDocument();
    expect(screen.getByText('Sensor (20%)')).toBeInTheDocument();
    expect(screen.getByText('Time (15%)')).toBeInTheDocument();
    expect(screen.getByText('Permit (10%)')).toBeInTheDocument();

    expect(screen.getByText('+24.0 pts')).toBeInTheDocument();
    expect(screen.getByText('+17.5 pts')).toBeInTheDocument();
    expect(screen.getByText('+13.0 pts')).toBeInTheDocument();
    expect(screen.getByText('+13.5 pts')).toBeInTheDocument();
    expect(screen.getByText('+10.0 pts')).toBeInTheDocument();
  });
});
