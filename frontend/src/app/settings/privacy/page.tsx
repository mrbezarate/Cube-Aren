'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Lock, Save, Eye, EyeOff, Shield, Trash2 } from 'lucide-react';

type PrivacyLevel = 'everyone' | 'friends' | 'nobody';
type ProfileVisibility = 'public' | 'friends' | 'private';

interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  canMessageMe: PrivacyLevel;
  canSeeStats: PrivacyLevel;
  canSeeFriends: PrivacyLevel;
  canInviteToTeam: PrivacyLevel;
  showOnlineStatus: PrivacyLevel;
  showProfileVisitors: boolean;
  showTournamentHistory: boolean;
}

const PRIVACY_LEVELS = [
  { value: 'everyone', label: 'Все', icon: '🌐' },
  { value: 'friends', label: 'Друзья', icon: '👥' },
  { value: 'nobody', label: 'Никто', icon: '🚫' },
];

const PROFILE_VISIBILITY_OPTIONS = [
  {
    value: 'public',
    label: 'Публичный',
    description: 'Все могут видеть ваш профиль',
    icon: '✅',
  },
  {
    value: 'friends',
    label: 'Только друзья',
    description: 'Только взаимные подписки видят профиль',
    icon: '🔒',
  },
  {
    value: 'private',
    label: 'Приватный',
    description: 'Никто не видит, кроме вас',
    icon: '🔒',
  },
];

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    canMessageMe: 'everyone',
    canSeeStats: 'everyone',
    canSeeFriends: 'everyone',
    canInviteToTeam: 'everyone',
    showOnlineStatus: 'everyone',
    showProfileVisitors: true,
    showTournamentHistory: true,
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.settings.getPrivacySettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      toast.error('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await api.settings.updatePrivacySettings(settings);
      toast.success('Настройки конфиденциальности обновлены!');
    } catch (error: any) {
      console.error('Failed to update privacy settings:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleClearVisitors = async () => {
    if (confirm('Вы уверены, что хотите очистить историю посещений профиля?')) {
      try {
        await api.settings.clearProfileVisitorsHistory();
        toast.success('История посещений очищена');
      } catch (error) {
        toast.error('Ошибка очистки истории');
      }
    }
  };

  const handleClearTournamentHistory = async () => {
    if (confirm('Вы уверены, что хотите очистить историю просмотренных турниров?')) {
      try {
        await api.settings.clearTournamentHistory();
        toast.success('История турниров очищена');
      } catch (error) {
        toast.error('Ошибка очистки истории');
      }
    }
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
        <Lock className="w-6 h-6 text-neon-purple" />
        Конфиденциальность
      </h2>

      <div className="space-y-8">
        {/* Profile Visibility */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-neon-blue" />
            Видимость профиля
          </h3>
          <div className="space-y-3">
            {PROFILE_VISIBILITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setSettings({ ...settings, profileVisibility: option.value as ProfileVisibility })
                }
                className={`
                  w-full p-4 rounded-lg border-2 transition-all text-left
                  ${
                    settings.profileVisibility === option.value
                      ? 'border-neon-purple bg-neon-purple/10'
                      : 'border-arena-border bg-white/5 hover:border-neon-purple/50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-orbitron font-semibold text-white">{option.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{option.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Who Can Settings */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-neon-blue" />
            Кто может
          </h3>
          <div className="space-y-4">
            <PrivacyOption
              label="Писать мне в чат"
              value={settings.canMessageMe}
              onChange={(value) => setSettings({ ...settings, canMessageMe: value })}
            />
            <PrivacyOption
              label="Видеть мою статистику"
              value={settings.canSeeStats}
              onChange={(value) => setSettings({ ...settings, canSeeStats: value })}
            />
            <PrivacyOption
              label="Видеть моих друзей"
              value={settings.canSeeFriends}
              onChange={(value) => setSettings({ ...settings, canSeeFriends: value })}
            />
            <PrivacyOption
              label="Приглашать в команду"
              value={settings.canInviteToTeam}
              onChange={(value) => setSettings({ ...settings, canInviteToTeam: value })}
            />
            <PrivacyOption
              label="Видеть когда я онлайн"
              value={settings.showOnlineStatus}
              onChange={(value) => setSettings({ ...settings, showOnlineStatus: value })}
            />
          </div>
        </section>

        {/* History */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4">История</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-arena-border">
              <div className="flex-1">
                <div className="font-orbitron text-white text-sm">
                  Показывать историю посещений профиля
                </div>
                <div className="text-xs text-gray-400 mt-1">Только вы можете видеть кто посещал ваш профиль</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showProfileVisitors}
                  onChange={(e) =>
                    setSettings({ ...settings, showProfileVisitors: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-purple"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-arena-border">
              <div className="flex-1">
                <div className="font-orbitron text-white text-sm">
                  Показывать историю просмотренных турниров
                </div>
                <div className="text-xs text-gray-400 mt-1">Ваша история просмотров турниров</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showTournamentHistory}
                  onChange={(e) =>
                    setSettings({ ...settings, showTournamentHistory: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-purple"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={handleClearVisitors}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Очистить историю посещений
              </Button>
              <Button
                onClick={handleClearTournamentHistory}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Очистить историю турниров
              </Button>
            </div>
          </div>
        </section>

        {/* Blocked Users */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4">Заблокированные пользователи</h3>
          <div className="p-4 bg-white/5 rounded-lg border border-arena-border text-center text-gray-400 text-sm">
            У вас нет заблокированных пользователей
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Заблокированные пользователи не могут писать вам, видеть профиль или приглашать в команды
          </p>
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

function PrivacyOption({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PrivacyLevel;
  onChange: (value: PrivacyLevel) => void;
}) {
  return (
    <div className="p-4 bg-white/5 rounded-lg border border-arena-border">
      <div className="font-orbitron text-white text-sm mb-3">{label}</div>
      <div className="grid grid-cols-3 gap-2">
        {PRIVACY_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => onChange(level.value as PrivacyLevel)}
            className={`
              p-2 rounded-lg border-2 transition-all text-center
              ${
                value === level.value
                  ? 'border-neon-blue bg-neon-blue/10'
                  : 'border-arena-border bg-white/5 hover:border-neon-blue/50'
              }
            `}
          >
            <div className="text-lg mb-1">{level.icon}</div>
            <div className="text-xs font-orbitron text-white">{level.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
