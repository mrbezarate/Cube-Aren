import { create } from 'zustand';
import { UserPreferences } from '@/types';
import { api } from '@/lib/api';

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'ru',
  theme: 'dark',
  colorAccent: 'purple',
  timezone: 'UTC+3',
  dateFormat: 'DD.MM.YYYY',
  timeFormat: '24h',
  hideUninterestingTournaments: false,
  showOnlyRegionalTournaments: false,
  minPrizePoolFilter: 0,
  enableAnimations: true,
  autoplayVideos: true,
  preloadImages: true,
  imageQuality: 'high',
  showAdultContent: false,
  filterProfanity: false,
  hideSpoilers: true,
};

interface PreferencesState {
  preferences: UserPreferences;
  isLoading: boolean;
  initializePreferences: () => void;
  loadPreferences: () => Promise<void>;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
}

export function applyPreferences(prefs: UserPreferences) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // 1. Theme
  const isDark = prefs.theme === 'dark' || 
    (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDark) {
    root.classList.remove('light');
  } else {
    root.classList.add('light');
  }

  // 2. Color Accent
  let primaryRGB = '99, 102, 241'; // Purple default (#6366f1)
  let hoverRGB = '129, 140, 248';  // (#818cf8)
  
  if (prefs.colorAccent === 'blue') {
    primaryRGB = '59, 130, 246';   // #3b82f6
    hoverRGB = '96, 165, 250';    // #60a5fa
  } else if (prefs.colorAccent === 'green') {
    primaryRGB = '16, 185, 129';   // #10b981
    hoverRGB = '52, 211, 153';    // #34d399
  } else if (prefs.colorAccent === 'gold') {
    primaryRGB = '245, 158, 11';   // #f59e0b
    hoverRGB = '251, 191, 36';    // #fbbf24
  }

  root.style.setProperty('--accent-primary-rgb', primaryRGB);
  root.style.setProperty('--accent-primary-hover-rgb', hoverRGB);

  // 3. Language setting
  root.setAttribute('lang', prefs.language);
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: DEFAULT_PREFERENCES,
  isLoading: false,

  initializePreferences: () => {
    if (typeof window === 'undefined') return;

    try {
      // Preload synchronously from localStorage to prevent flash
      const cached = localStorage.getItem('user_preferences');
      if (cached) {
        const parsed = JSON.parse(cached) as UserPreferences;
        const merged = { ...DEFAULT_PREFERENCES, ...parsed };
        set({ preferences: merged });
        applyPreferences(merged);
      } else {
        applyPreferences(DEFAULT_PREFERENCES);
      }
    } catch (e) {
      console.error('Failed to initialize local preferences:', e);
      applyPreferences(DEFAULT_PREFERENCES);
    }
  },

  loadPreferences: async () => {
    try {
      set({ isLoading: true });
      const apiPrefs = await api.settings.getUserPreferences();
      if (apiPrefs) {
        const merged = { ...DEFAULT_PREFERENCES, ...apiPrefs };
        set({ preferences: merged, isLoading: false });
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_preferences', JSON.stringify(merged));
          applyPreferences(merged);
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load preferences from API:', error);
      set({ isLoading: false });
    }
  },

  updatePreferences: async (newPreferences) => {
    const updated = { ...get().preferences, ...newPreferences };
    set({ preferences: updated });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_preferences', JSON.stringify(updated));
      applyPreferences(updated);
    }

    try {
      await api.settings.updateUserPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to sync updated preferences to backend:', error);
    }
  },
}));
