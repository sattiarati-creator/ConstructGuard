import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { authService } from '../services/authService';

const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'LOGGED_IN' : 'LOGGED_OUT'}</span>
      <span data-testid="user-role">{user?.role || 'NONE'}</span>
      <button
        onClick={() => login('admin@constructguard.local', 'Admin@123')}
        data-testid="login-btn"
      >
        Login
      </button>
      <button onClick={() => logout()} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

describe('AuthContext and Provider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides initial logged out state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_OUT');
    expect(screen.getByTestId('user-role')).toHaveTextContent('NONE');
  });

  it('updates state upon successful login and stores token', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      user: {
        id: 'user-admin',
        name: 'Administrator',
        email: 'admin@constructguard.local',
        role: 'ADMIN',
      },
      tokens: {
        accessToken: 'mock-access-token-123',
        refreshToken: 'mock-refresh-token-456',
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    await act(async () => {
      loginBtn.click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_IN');
    expect(screen.getByTestId('user-role')).toHaveTextContent('ADMIN');
    expect(localStorage.getItem('cg_access_token')).toBe('mock-access-token-123');
  });
});
