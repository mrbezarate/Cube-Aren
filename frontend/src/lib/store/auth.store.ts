import { create } from 'zustand';
import { User } from '@/types';
import { api } from '@/lib/api';

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
  refreshUser: () => Promise<User | null>;
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
    // Store token in cookie for middleware (edge runtime)
    document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
    set({
      user,
      token,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },
  refreshUser: async () => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        return null;
      }

      const user = await api.users.getMe();
      set({ user, isAuthenticated: true });
      return user;
    } catch {
      return null;
    }
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    // Clear cookie
    document.cookie = 'token=; path=/; max-age=0';
    document.cookie = 'refreshToken=; path=/; max-age=0';
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
        document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
        set({ token, refreshToken, isAuthenticated: true, isLoading: true });

        api.users
          .getMe()
          .then((user) => set({ user, isLoading: false }))
          .catch(() => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            document.cookie = 'token=; path=/; max-age=0';
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
