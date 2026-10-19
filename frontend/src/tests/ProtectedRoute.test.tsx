import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import * as AuthContextModule from '../auth/AuthContext';

describe('ProtectedRoute Component', () => {
  it('renders children when user is authenticated and role matches', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: '1', name: 'Inspector Roy', email: 'roy@test.local', role: 'INSPECTOR' },
      token: 'jwt-123',
      isAuthenticated: true,
      isLoading: false,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'INSPECTOR']}>
                <div>Protected Secret Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Secret Content')).toBeInTheDocument();
  });

  it('renders access restricted when user role is not allowed', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: '2', name: 'Viewer Bob', email: 'bob@test.local', role: 'VIEWER' },
      token: 'jwt-123',
      isAuthenticated: true,
      isLoading: false,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin-only']}>
        <Routes>
          <Route
            path="/admin-only"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <div>Admin Secret</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(screen.queryByText('Admin Secret')).not.toBeInTheDocument();
  });
});
