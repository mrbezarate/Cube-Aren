'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Lock, Shield, Bell, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const SETTINGS_TABS: SettingsTab[] = [
  {
    id: 'profile',
    label: 'Профиль',
    icon: <User className="w-5 h-5" />,
    href: '/settings/profile',
  },
  {
    id: 'privacy',
    label: 'Конфиденциальность',
    icon: <Lock className="w-5 h-5" />,
    href: '/settings/privacy',
  },
  {
    id: 'account',
    label: 'Аккаунт',
    icon: <Shield className="w-5 h-5" />,
    href: '/settings/account',
  },
  {
    id: 'notifications',
    label: 'Уведомления',
    icon: <Bell className="w-5 h-5" />,
    href: '/settings/notifications',
  },
  {
    id: 'preferences',
    label: 'Предпочтения',
    icon: <SettingsIcon className="w-5 h-5" />,
    href: '/settings/preferences',
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-arena-dark py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/profile/${user?.id || ''}`}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-orbitron text-sm">Назад к профилю</span>
            </Link>
          </div>
          <h1 className="font-orbitron font-bold text-2xl text-white">Настройки</h1>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-arena-light border border-arena-border rounded-lg p-2 space-y-1 sticky top-24">
              {SETTINGS_TABS.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${
                        isActive
                          ? 'bg-neon-purple/20 border border-neon-purple text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <span className={isActive ? 'text-neon-purple' : 'text-gray-500'}>
                      {tab.icon}
                    </span>
                    <span className="font-orbitron text-sm font-medium">{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
