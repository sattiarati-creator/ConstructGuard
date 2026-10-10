import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Navbar } from '../components/Navbar';
import * as AuthContextModule from '../auth/AuthContext';

describe('Navbar Component', () => {
  it('displays ConstructGuard brand and live telemetry state', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: '1', name: 'Commander Admin', email: 'admin@constructguard.local', role: 'ADMIN' },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<Navbar isConnected={true} />);

    expect(screen.getByText(/ConstructGuard/i)).toBeInTheDocument();
    expect(screen.getByText('Telemetry Live')).toBeInTheDocument();
    expect(screen.getByText('Commander Admin')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });
});
