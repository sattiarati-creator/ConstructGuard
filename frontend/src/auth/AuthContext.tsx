import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  login: (emailOrCreds: string | { email: string; password: string }, maybePassword?: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: UserRole }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cg_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cg_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('cg_access_token');
      if (savedToken) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          localStorage.setItem('cg_user', JSON.stringify(profile));
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('cg_access_token');
          localStorage.removeItem('cg_refresh_token');
          localStorage.removeItem('cg_user');
        }
      }
      setIsLoading(false);
    };

    verifySession();
  }, []);

  const login = async (
    emailOrCreds: string | { email: string; password: string },
    maybePassword?: string
  ) => {
    setIsLoading(true);
    try {
      const credentials =
        typeof emailOrCreds === 'string'
          ? { email: emailOrCreds, password: maybePassword || '' }
          : emailOrCreds;
      const data = await authService.login(credentials);
      setUser(data.user);
      setToken(data.tokens.accessToken);
      localStorage.setItem('cg_user', JSON.stringify(data.user));
      localStorage.setItem('cg_access_token', data.tokens.accessToken);
      if (data.tokens.refreshToken) {
        localStorage.setItem('cg_refresh_token', data.tokens.refreshToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; role?: UserRole }) => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      setUser(res.user);
      setToken(res.tokens.accessToken);
      localStorage.setItem('cg_user', JSON.stringify(res.user));
      localStorage.setItem('cg_access_token', res.tokens.accessToken);
      if (res.tokens.refreshToken) {
        localStorage.setItem('cg_refresh_token', res.tokens.refreshToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        loading: isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
