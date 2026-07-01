'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Bell, Save, Mail, Smartphone, MonitorSmartphone } from 'lucide-react';

interface NotificationSettings {
  // Email
  emailNewTournament: boolean;
  emailTournamentStart: boolean;
  emailBetResult: boolean;
  emailTeamRequest: boolean;
  emailTeamInvite: boolean;
  emailNewMessage: boolean;
  emailWeeklyDigest: boolean;
  emailMarketing: boolean;
  // Push
  pushNewMessage: boolean;
  pushNewFollower: boolean;
  pushTournamentStart: boolean;
  pushBetResult: boolean;
  pushTeamRequest: boolean;
  // In-app
  inAppShowBadges: boolean;
  inAppShowRequests: boolean;
  inAppShowNotifications: boolean;
}

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNewTournament: true,
    emailTournamentStart: true,
    emailBetResult: true,
    emailTeamRequest: true,
    emailTeamInvite: true,
    emailNewMessage: false,
    emailWeeklyDigest: true,
    emailMarketing: false,
    pushNewMessage: true,
    pushNewFollower: true,
    pushTournamentStart: true,
    pushBetResult: true,
    pushTeamRequest: true,
    inAppShowBadges: true,
    inAppShowRequests: true,
    inAppShowNotifications: true,
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
      const data = await api.settings.getNotificationSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      toast.error('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.settings.updateNotificationSettings(settings);
      toast.success('Настройки уведомлений обновлены!');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings({ ...settings, [key]: !settings[key] });
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
        <Bell className="w-6 h-6 text-neon-purple" />
        Уведомления
      </h2>

      <div className="space-y-8">
        {/* Email Notifications */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-neon-blue" />
            Email уведомления
          </h3>
          <div className="space-y-3">
            <NotificationToggle
              label="Новый турнир в любимых играх"
              description="Уведомления о новых турнирах в ваших любимых играх"
              checked={settings.emailNewTournament}
              onChange={() => toggleSetting('emailNewTournament')}
            />
            <NotificationToggle
              label="Турнир скоро начнётся"
              description="Напоминание за 1 час до начала турнира"
              checked={settings.emailTournamentStart}
              onChange={() => toggleSetting('emailTournamentStart')}
            />
            <NotificationToggle
              label="Результаты ставки"
              description="Когда ваша ставка выиграла или проиграла"
              checked={settings.emailBetResult}
              onChange={() => toggleSetting('emailBetResult')}
            />
            <NotificationToggle
              label="Заявка в команду"
              description="Новая заявка на вступление в вашу команду"
              checked={settings.emailTeamRequest}
              onChange={() => toggleSetting('emailTeamRequest')}
            />
            <NotificationToggle
              label="Приглашение в команду"
              description="Вас пригласили в команду"
              checked={settings.emailTeamInvite}
              onChange={() => toggleSetting('emailTeamInvite')}
            />
            <NotificationToggle
              label="Новое сообщение"
              description="Если не читали сообщение 24 часа"
              checked={settings.emailNewMessage}
              onChange={() => toggleSetting('emailNewMessage')}
            />
            <NotificationToggle
              label="Еженедельная рассылка"
              description="Топ турниры недели"
              checked={settings.emailWeeklyDigest}
              onChange={() => toggleSetting('emailWeeklyDigest')}
            />
            <NotificationToggle
              label="Маркетинговые предложения"
              description="Новости и специальные предложения"
              checked={settings.emailMarketing}
              onChange={() => toggleSetting('emailMarketing')}
            />
          </div>
        </section>

        {/* Push Notifications */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-neon-blue" />
            Push уведомления
          </h3>
          <div className="space-y-3">
            <NotificationToggle
              label="Новое сообщение в чате"
              description="Мгновенные уведомления о новых сообщениях"
              checked={settings.pushNewMessage}
              onChange={() => toggleSetting('pushNewMessage')}
            />
            <NotificationToggle
              label="Кто-то подписался на вас"
              description="Новый подписчик"
              checked={settings.pushNewFollower}
              onChange={() => toggleSetting('pushNewFollower')}
            />
            <NotificationToggle
              label="Турнир начался"
              description="Ваш турнир начался"
              checked={settings.pushTournamentStart}
              onChange={() => toggleSetting('pushTournamentStart')}
            />
            <NotificationToggle
              label="Ставка выиграла/проиграла"
              description="Результаты вашей ставки"
              checked={settings.pushBetResult}
              onChange={() => toggleSetting('pushBetResult')}
            />
            <NotificationToggle
              label="Новая заявка в команду"
              description="Для капитанов команд"
              checked={settings.pushTeamRequest}
              onChange={() => toggleSetting('pushTeamRequest')}
            />
          </div>
        </section>

        {/* In-App Notifications */}
        <section>
          <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center gap-2">
            <MonitorSmartphone className="w-5 h-5 text-neon-blue" />
            В приложении
          </h3>
          <div className="space-y-3">
            <NotificationToggle
              label="Показывать badge на новых сообщениях"
              description="Красный индикатор непрочитанных сообщений"
              checked={settings.inAppShowBadges}
              onChange={() => toggleSetting('inAppShowBadges')}
            />
            <NotificationToggle
              label="Показывать badge на входящих запросах"
              description="Индикатор новых запросов в друзья и команды"
              checked={settings.inAppShowRequests}
              onChange={() => toggleSetting('inAppShowRequests')}
            />
            <NotificationToggle
              label="Уведомления в навбаре (колокольчик)"
              description="Показывать иконку уведомлений в навигации"
              checked={settings.inAppShowNotifications}
              onChange={() => toggleSetting('inAppShowNotifications')}
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

function NotificationToggle({
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
