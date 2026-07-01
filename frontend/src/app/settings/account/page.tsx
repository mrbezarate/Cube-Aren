'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Shield, Mail, Key, Trash2, Download, Link as LinkIcon, AlertTriangle } from 'lucide-react';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadAccountData();
  }, [user]);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      if (user) {
        setEmail(user.email);
      }
      // TODO: Load 2FA status and connected accounts
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      console.error('Failed to load account data:', error);
      toast.error('Не удалось загрузить данные аккаунта');
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!email || email === user?.email) {
      toast.error('Введите новый email');
      return;
    }
    try {
      const result = await api.account.changeEmail(email);
      toast.success(result.message);
      // Update user in store
      if (user) {
        useAuthStore.getState().setUser({ ...user, email: result.email });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка изменения email');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Заполните все поля');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    try {
      const result = await api.account.changePassword(currentPassword, newPassword);
      toast.success(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка изменения пароля');
    }
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        'Вы уверены? Аккаунт будет удалён через 30 дней. Вы сможете отменить удаление в течение этого времени.',
      )
    ) {
      try {
        const result = await api.account.requestAccountDeletion();
        toast.success(result.message);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Ошибка удаления аккаунта');
      }
    }
  };

  const handleExportData = async () => {
    try {
      const data = await api.account.exportUserData();
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${user?.username}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Данные экспортированы');
    } catch (error: any) {
      toast.error('Ошибка экспорта данных');
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
    <div className="space-y-6">
      {/* Email Settings */}
      <Card className="p-6">
        <h2 className="font-orbitron font-bold text-xl text-white mb-6 flex items-center gap-2">
          <Mail className="w-6 h-6 text-neon-purple" />
          Email
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
              Текущий email
            </label>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-white">{user?.email}</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">✅ Подтверждён</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
              Новый email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="newemail@example.com"
              className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors"
            />
          </div>
          <Button onClick={handleChangeEmail} variant="primary" className="w-full">
            Изменить email
          </Button>
        </div>
      </Card>

      {/* Password */}
      <Card className="p-6">
        <h2 className="font-orbitron font-bold text-xl text-white mb-6 flex items-center gap-2">
          <Key className="w-6 h-6 text-neon-purple" />
          Пароль
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
              Текущий пароль
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
              Новый пароль
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
              Повторите пароль
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors"
            />
          </div>
          <Button onClick={handleChangePassword} variant="primary" className="w-full">
            Изменить пароль
          </Button>
        </div>
      </Card>

      {/* 2FA */}
      <Card className="p-6">
        <h2 className="font-orbitron font-bold text-xl text-white mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-neon-purple" />
          Двухфакторная аутентификация
        </h2>
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-arena-border">
          <div>
            <div className="font-orbitron text-white">2FA {twoFactorEnabled ? 'включена' : 'выключена'}</div>
            <div className="text-xs text-gray-400 mt-1">
              Дополнительная защита вашего аккаунта
            </div>
          </div>
          <Button
            onClick={() => {
              setTwoFactorEnabled(!twoFactorEnabled);
              toast.success(twoFactorEnabled ? '2FA отключена' : '2FA включена');
            }}
            variant={twoFactorEnabled ? 'outline' : 'primary'}
          >
            {twoFactorEnabled ? 'Отключить' : 'Включить'}
          </Button>
        </div>
      </Card>

      {/* Connected Accounts */}
      <Card className="p-6">
        <h2 className="font-orbitron font-bold text-xl text-white mb-6 flex items-center gap-2">
          <LinkIcon className="w-6 h-6 text-neon-purple" />
          Связанные аккаунты
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-arena-border">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔗</div>
              <div>
                <div className="font-orbitron text-white">Google</div>
                <div className="text-xs text-gray-400">Не подключен</div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Подключить
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-arena-border">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎮</div>
              <div>
                <div className="font-orbitron text-white">Discord</div>
                <div className="text-xs text-gray-400">Не подключен</div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Подключить
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-2 border-red-500/30">
        <h2 className="font-orbitron font-bold text-xl text-red-400 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Опасная зона
        </h2>
        <div className="space-y-3">
          <Button
            onClick={handleExportData}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Экспорт данных (GDPR)
          </Button>
          <Button
            onClick={handleDeleteAccount}
            className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Удалить аккаунт
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Аккаунт будет удалён через 30 дней. Вы сможете отменить удаление.
          </p>
        </div>
      </Card>
    </div>
  );
}
