import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

describe('DisclaimerBanner Component', () => {
  it('displays the official decision support disclaimer verbatim', () => {
    render(<DisclaimerBanner />);
    expect(screen.getByText(/Decision Support System Notice/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /ConstructGuard detects indicators of potentially unauthorized construction and prioritizes sites for human inspection\./i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The system provides decision support, not legal enforcement\./i)
    ).toBeInTheDocument();
  });

  it('renders compact mode properly', () => {
    render(<DisclaimerBanner compact={true} />);
    expect(
      screen.getByText(/Decision support only: ConstructGuard detects indicators/i)
    ).toBeInTheDocument();
  });
});
