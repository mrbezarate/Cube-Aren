'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Settings as SettingsIcon, Save, Globe, Palette, Monitor, Gamepad2, Zap } from 'lucide-react';

type Language = 'ru' | 'en' | 'ua';
type Theme = 'dark' | 'light' | 'system';
type ColorAccent = 'purple' | 'blue' | 'green' | 'gold';
type TimeFormat = '24h' | '12h';
type ImageQuality = 'high' | 'medium' | 'low';

interface UserPreferences {
  language: Language;
  theme: Theme;
  colorAccent: ColorAccent;
  timezone: string;
  dateFormat: string;
  timeFormat: TimeFormat;
  hideUninterestingTournaments: boolean;
  showOnlyRegionalTournaments: boolean;
  minPrizePoolFilter: number;
  enableAnimations: boolean;
  autoplayVideos: boolean;
  preloadImages: boolean;
  imageQuality: ImageQuality;
  showAdultContent: boolean;
  filterProfanity: boolean;
  hideSpoilers: boolean;
}

const LANGUAGES = [
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ua', label: 'Українська', flag: '🇺🇦' },
];

const THEMES = [
  { value: 'dark', label: 'Тёмная', icon: '🌙' },
  { value: 'light', label: 'Светлая', icon: '☀️' },
  { value: 'system', label: 'Системная', icon: '💻' },
];

const COLOR_ACCENTS = [
  { value: 'purple', label: 'Фиолетовый', color: '#a855f7' },
  { value: 'blue', label: 'Синий', color: '#3b82f6' },
  { value: 'green', label: 'Зелёный', color: '#10b981' },
  { value: 'gold', label: 'Золотой', color: '#f59e0b' },
];

export default function PreferencesSettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
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
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await api.settings.getUserPreferences();
      setPreferences(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.settings.updateUserPreferences(preferences);
      toast.success('Предпочтения обновлены!');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => {
    setPreferences({ ...preferences, [key]: value });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-white text-center">Загрузка...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="font-orbitron font-bold text-xl text-white mb-6 flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-neon-purple" />
        Предпочтения
      </h2>

      <div className="space-y-8">
        {/* Interface */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-neon-blue" />
            Интерфейс
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-3">
                Язык
              </label>
              <div className="grid grid-cols-3 gap-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => updatePreference('language', lang.value as Language)}
                    className={`
                      p-3 rounded-lg border-2 transition-all
                      ${
                        preferences.language === lang.value
                          ? 'border-neon-purple bg-neon-purple/10'
                          : 'border-arena-border bg-white/5 hover:border-neon-purple/50'
                      }
                    `}
                  >
                    <div className="text-2xl mb-1">{lang.flag}</div>
                    <div className="text-sm font-orbitron text-white">{lang.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-3">
                Тема
              </label>
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => updatePreference('theme', theme.value as Theme)}
                    className={`
                      p-3 rounded-lg border-2 transition-all
                      ${
                        preferences.theme === theme.value
                          ? 'border-neon-purple bg-neon-purple/10'
                          : 'border-arena-border bg-white/5 hover:border-neon-purple/50'
                      }
                    `}
                  >
                    <div className="text-2xl mb-1">{theme.icon}</div>
                    <div className="text-sm font-orbitron text-white">{theme.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-3">
                Цветовой акцент
              </label>
              <div className="grid grid-cols-4 gap-3">
                {COLOR_ACCENTS.map((accent) => (
                  <button
                    key={accent.value}
                    onClick={() => updatePreference('colorAccent', accent.value as ColorAccent)}
                    className={`
                      p-3 rounded-lg border-2 transition-all
                      ${
                        preferences.colorAccent === accent.value
                          ? 'border-neon-purple bg-neon-purple/10'
                          : 'border-arena-border bg-white/5 hover:border-neon-purple/50'
                      }
                    `}
                  >
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: accent.color }}
                    />
                    <div className="text-xs font-orbitron text-white">{accent.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Display */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-neon-blue" />
            Отображение
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
                Часовой пояс
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => updatePreference('timezone', e.target.value)}
                className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:border-neon-purple transition-colors"
              >
                <option value="UTC+3">UTC+3 (Москва)</option>
                <option value="UTC+2">UTC+2 (Киев)</option>
                <option value="UTC+0">UTC+0 (Лондон)</option>
                <option value="auto">Автоопределение</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
                  Формат даты
                </label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => updatePreference('dateFormat', e.target.value)}
                  className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:border-neon-purple transition-colors"
                >
                  <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
                  Формат времени
                </label>
                <select
                  value={preferences.timeFormat}
                  onChange={(e) => updatePreference('timeFormat', e.target.value as TimeFormat)}
                  className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:border-neon-purple transition-colors"
                >
                  <option value="24h">24-часовой</option>
                  <option value="12h">12-часовой (AM/PM)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Games */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-neon-blue" />
            Игры
          </h3>
          <div className="space-y-3">
            <PreferenceToggle
              label="Скрывать неинтересные турниры"
              description="Автоматически скрывать турниры в играх которые вам не интересны"
              checked={preferences.hideUninterestingTournaments}
              onChange={() =>
                updatePreference(
                  'hideUninterestingTournaments',
                  !preferences.hideUninterestingTournaments,
                )
              }
            />
            <PreferenceToggle
              label="Показывать только региональные турниры"
              description="Фильтровать турниры по вашему региону"
              checked={preferences.showOnlyRegionalTournaments}
              onChange={() =>
                updatePreference(
                  'showOnlyRegionalTournaments',
                  !preferences.showOnlyRegionalTournaments,
                )
              }
            />

            <div className="p-4 bg-white/5 rounded-lg border border-arena-border">
              <label className="block text-sm font-orbitron font-semibold text-white mb-3">
                Минимальный призовой фонд
              </label>
              <select
                value={preferences.minPrizePoolFilter}
                onChange={(e) => updatePreference('minPrizePoolFilter', Number(e.target.value))}
                className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:border-neon-purple transition-colors"
              >
                <option value={0}>Любой</option>
                <option value={1000}>от 1,000₽</option>
                <option value={5000}>от 5,000₽</option>
                <option value={10000}>от 10,000₽</option>
              </select>
            </div>
          </div>
        </section>

        {/* Performance */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-neon-blue" />
            Производительность
          </h3>
          <div className="space-y-3">
            <PreferenceToggle
              label="Включить анимации"
              description="Плавные переходы и анимации"
              checked={preferences.enableAnimations}
              onChange={() => updatePreference('enableAnimations', !preferences.enableAnimations)}
            />
            <PreferenceToggle
              label="Автовоспроизведение видео"
              description="Автоматически воспроизводить видео контент"
              checked={preferences.autoplayVideos}
              onChange={() => updatePreference('autoplayVideos', !preferences.autoplayVideos)}
            />
            <PreferenceToggle
              label="Предзагрузка изображений"
              description="Загружать изображения заранее для быстрого отображения"
              checked={preferences.preloadImages}
              onChange={() => updatePreference('preloadImages', !preferences.preloadImages)}
            />

            <div className="p-4 bg-white/5 rounded-lg border border-arena-border">
              <label className="block text-sm font-orbitron font-semibold text-white mb-3">
                Качество изображений
              </label>
              <select
                value={preferences.imageQuality}
                onChange={(e) => updatePreference('imageQuality', e.target.value as ImageQuality)}
                className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:border-neon-purple transition-colors"
              >
                <option value="high">Высокое</option>
                <option value="medium">Среднее</option>
                <option value="low">Низкое</option>
              </select>
            </div>
          </div>
        </section>

        {/* Content */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4">Контент</h3>
          <div className="space-y-3">
            <PreferenceToggle
              label="Показывать контент для взрослых (18+)"
              description="Отображать контент с возрастным ограничением"
              checked={preferences.showAdultContent}
              onChange={() => updatePreference('showAdultContent', !preferences.showAdultContent)}
            />
            <PreferenceToggle
              label="Фильтровать нецензурную лексику"
              description="Заменять нецензурные слова в чате"
              checked={preferences.filterProfanity}
              onChange={() => updatePreference('filterProfanity', !preferences.filterProfanity)}
            />
            <PreferenceToggle
              label="Скрывать спойлеры автоматически"
              description="Автоматически скрывать спойлеры в обсуждениях"
              checked={preferences.hideSpoilers}
              onChange={() => updatePreference('hideSpoilers', !preferences.hideSpoilers)}
            />
          </div>
        </section>

        {/* Save Button */}
        <div className="pt-4 border-t border-arena-border">
          <Button
            onClick={handleSave}
            loading={saving}
            variant="primary"
            className="w-full py-3 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Сохранить изменения
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-arena-border">
      <div className="flex-1 pr-4">
        <div className="font-orbitron text-white text-sm">{label}</div>
        {description && <div className="text-xs text-gray-400 mt-1">{description}</div>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-purple"></div>
      </label>
    </div>
  );
}
