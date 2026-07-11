'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { usePreferencesStore } from '@/lib/store/preferences.store';
import { UserPreferences } from '@/types';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Settings as SettingsIcon, Save, Globe, Palette, Monitor, Gamepad2, Zap } from 'lucide-react';

type Language = 'ru' | 'en' | 'ua';
type Theme = 'dark' | 'light' | 'system';
type ColorAccent = 'purple' | 'blue' | 'green' | 'gold';
type TimeFormat = '24h' | '12h';
type ImageQuality = 'high' | 'medium' | 'low';

const LANGUAGES = [
  { value: 'ru', label: 'Русский', flag: 'RU' },
  { value: 'en', label: 'English', flag: 'EN' },
  { value: 'ua', label: 'Українська', flag: 'UA' },
];

export default function PreferencesSettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const storePreferences = usePreferencesStore((state) => state.preferences);
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences);
  const loadPreferencesStore = usePreferencesStore((state) => state.loadPreferences);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(storePreferences);

  const THEMES = [
    { value: 'dark', label: t('pref_theme_dark'), icon: '🌙' },
    { value: 'light', label: t('pref_theme_light'), icon: '☀️' },
    { value: 'system', label: t('pref_theme_system'), icon: '💻' },
  ];

  const COLOR_ACCENTS = [
    { value: 'purple', label: t('pref_color_purple'), color: '#a855f7' },
    { value: 'blue', label: t('pref_color_blue'), color: '#3b82f6' },
    { value: 'green', label: t('pref_color_green'), color: '#10b981' },
    { value: 'gold', label: t('pref_color_gold'), color: '#f59e0b' },
  ];

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    const loadData = async () => {
      setLoading(true);
      await loadPreferencesStore();
      setLoading(false);
    };

    loadData();
  }, [user]);

  // Sync state with store on load
  useEffect(() => {
    if (storePreferences) {
      setPreferences(storePreferences);
    }
  }, [storePreferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences(preferences);
      toast.success(t('saved_success'));
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error(t('saved_error'));
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
        <div className="text-white text-center">{t('loading')}</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="font-orbitron font-bold text-xl text-white mb-6 flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-neon-purple" />
        {t('preferences')}
      </h2>

      <div className="space-y-8">
        {/* Interface */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-neon-blue" />
            {t('pref_interface')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-3">
                {t('pref_language')}
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
                    <div className="text-lg font-bold mb-1 text-neon-purple">{lang.flag}</div>
                    <div className="text-sm font-orbitron text-white">{lang.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-3">
                {t('pref_theme')}
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
                {t('pref_color_accent')}
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
            {t('pref_display')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
                {t('pref_timezone')}
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => updatePreference('timezone', e.target.value)}
                className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:border-neon-purple transition-colors"
              >
                <option value="UTC+3">{t('pref_timezone_moscow')}</option>
                <option value="UTC+2">{t('pref_timezone_kiev')}</option>
                <option value="UTC+0">{t('pref_timezone_london')}</option>
                <option value="auto">{t('pref_timezone_auto')}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
                  {t('pref_date_format')}
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
                  {t('pref_time_format')}
                </label>
                <select
                  value={preferences.timeFormat}
                  onChange={(e) => updatePreference('timeFormat', e.target.value as TimeFormat)}
                  className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:border-neon-purple transition-colors"
                >
                  <option value="24h">{t('pref_time_format_24')}</option>
                  <option value="12h">{t('pref_time_format_12')}</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Games */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-neon-blue" />
            {t('pref_games')}
          </h3>
          <div className="space-y-3">
            <PreferenceToggle
              label={t('pref_hide_uninteresting')}
              description={t('pref_hide_uninteresting_desc')}
              checked={preferences.hideUninterestingTournaments}
              onChange={() =>
                updatePreference(
                  'hideUninterestingTournaments',
                  !preferences.hideUninterestingTournaments,
                )
              }
            />
            <PreferenceToggle
              label={t('pref_show_regional')}
              description={t('pref_show_regional_desc')}
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
                {t('pref_min_prize_pool')}
              </label>
              <select
                value={preferences.minPrizePoolFilter}
                onChange={(e) => updatePreference('minPrizePoolFilter', Number(e.target.value))}
                className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:border-neon-purple transition-colors"
              >
                <option value={0}>{t('pref_min_prize_any')}</option>
                <option value={1000}>{t('pref_min_prize_val').replace('{value}', '1,000')}</option>
                <option value={5000}>{t('pref_min_prize_val').replace('{value}', '5,000')}</option>
                <option value={10000}>{t('pref_min_prize_val').replace('{value}', '10,000')}</option>
              </select>
            </div>
          </div>
        </section>

        {/* Performance */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-neon-blue" />
            {t('pref_performance')}
          </h3>
          <div className="space-y-3">
            <PreferenceToggle
              label={t('pref_enable_animations')}
              description={t('pref_enable_animations_desc')}
              checked={preferences.enableAnimations}
              onChange={() => updatePreference('enableAnimations', !preferences.enableAnimations)}
            />
            <PreferenceToggle
              label={t('pref_autoplay_videos')}
              description={t('pref_autoplay_videos_desc')}
              checked={preferences.autoplayVideos}
              onChange={() => updatePreference('autoplayVideos', !preferences.autoplayVideos)}
            />
            <PreferenceToggle
              label={t('pref_preload_images')}
              description={t('pref_preload_images_desc')}
              checked={preferences.preloadImages}
              onChange={() => updatePreference('preloadImages', !preferences.preloadImages)}
            />

            <div className="p-4 bg-white/5 rounded-lg border border-arena-border">
              <label className="block text-sm font-orbitron font-semibold text-white mb-3">
                {t('pref_image_quality')}
              </label>
              <select
                value={preferences.imageQuality}
                onChange={(e) => updatePreference('imageQuality', e.target.value as ImageQuality)}
                className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white focus:outline-none focus:border-neon-purple transition-colors"
              >
                <option value="high">{t('pref_quality_high')}</option>
                <option value="medium">{t('pref_quality_medium')}</option>
                <option value="low">{t('pref_quality_low')}</option>
              </select>
            </div>
          </div>
        </section>

        {/* Content */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4">{t('pref_content')}</h3>
          <div className="space-y-3">
            <PreferenceToggle
              label={t('pref_show_adult')}
              description={t('pref_show_adult_desc')}
              checked={preferences.showAdultContent}
              onChange={() => updatePreference('showAdultContent', !preferences.showAdultContent)}
            />
            <PreferenceToggle
              label={t('pref_filter_profanity')}
              description={t('pref_filter_profanity_desc')}
              checked={preferences.filterProfanity}
              onChange={() => updatePreference('filterProfanity', !preferences.filterProfanity)}
            />
            <PreferenceToggle
              label={t('pref_hide_spoilers')}
              description={t('pref_hide_spoilers_desc')}
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
            {t('save')}
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
