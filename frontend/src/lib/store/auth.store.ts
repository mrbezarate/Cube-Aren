import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (token: string | null, refreshToken: string | null) => void;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTokens: (token, refreshToken) => {
    if (token && refreshToken) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('refresh_token', refreshToken);
      set({ token, refreshToken });
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      set({ token: null, refreshToken: null });
    }
  },
  login: (user, token, refreshToken) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    set({
      user,
      token,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
  initialize: () => {
    try {
      const token = localStorage.getItem('auth_token');
      const refreshToken = localStorage.getItem('refresh_token');
      if (token && refreshToken) {
        set({ token, refreshToken, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
