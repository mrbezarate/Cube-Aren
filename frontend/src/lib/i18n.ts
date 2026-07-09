import { usePreferencesStore } from './store/preferences.store';

export const translations = {
  ru: {
    home: 'Главная',
    tournaments: 'Турниры',
    community: 'Сообщество',
    leaderboard: 'Рейтинг',
    chat: 'Чат',
    friends: 'Друзья',
    my_teams: 'Мои команды',
    saved: 'Сохраненное',
    settings: 'Настройки',
    create_tournament: 'Создать турнир',
    login: 'Войти',
    register: 'Регистрация',
    logout: 'Выйти',
    profile: 'Профиль',
    wallet: 'Кошелек',
    preferences: 'Предпочтения',
    loading: 'Загрузка...',
    save: 'Сохранить',
  },
  en: {
    home: 'Home',
    tournaments: 'Tournaments',
    community: 'Community',
    leaderboard: 'Leaderboard',
    chat: 'Chat',
    friends: 'Friends',
    my_teams: 'My Teams',
    saved: 'Saved',
    settings: 'Settings',
    create_tournament: 'Create Tournament',
    login: 'Log In',
    register: 'Register',
    logout: 'Log Out',
    profile: 'Profile',
    wallet: 'Wallet',
    preferences: 'Preferences',
    loading: 'Loading...',
    save: 'Save',
  },
  ua: {
    home: 'Головна',
    tournaments: 'Турніри',
    community: 'Спільнота',
    leaderboard: 'Рейтинг',
    chat: 'Чат',
    friends: 'Друзі',
    my_teams: 'Мої команди',
    saved: 'Збережене',
    settings: 'Налаштування',
    create_tournament: 'Створити турнір',
    login: 'Увійти',
    register: 'Реєстрація',
    logout: 'Вийти',
    profile: 'Профіль',
    wallet: 'Гаманець',
    preferences: 'Налаштування',
    loading: 'Завантаження...',
    save: 'Зберегти',
  },
};

export type TranslationKey = keyof typeof translations.ru;

export function useTranslation() {
  const preferences = usePreferencesStore((state) => state.preferences);
  const lang = preferences?.language || 'ru';

  const t = (key: TranslationKey): string => {
    return translations[lang]?.[key] || translations.ru[key] || key;
  };

  return { t, lang };
}
