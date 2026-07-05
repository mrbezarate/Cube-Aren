'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Home, LogIn, MessageSquare, Trophy, User, Users, Newspaper, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';

export default function BottomTabBar() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return null;
  }

  const items = isAuthenticated && user
    ? [
        { href: '/', label: 'Главная', icon: Home, exact: true },
        { href: '/tournaments', label: 'Турниры', icon: Trophy },
        { href: '/chat', label: 'Чат', icon: MessageSquare },
        { href: '/friends', label: 'Друзья', icon: Users },
        { href: `/profile/${user.id}`, label: 'Профиль', icon: User, match: '/profile' },
      ]
    : [
        { href: '/', label: 'Главная', icon: Home, exact: true },
        { href: '/tournaments', label: 'Турниры', icon: Trophy },
        { href: '/community', label: 'Комьюнити', icon: Newspaper },
        { href: '/leaderboard', label: 'Рейтинг', icon: BarChart3 },
        { href: '/auth/login', label: 'Войти', icon: LogIn, match: '/auth' },
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border-default bg-bg-primary/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.match || `${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium transition-colors',
                active ? 'text-accent-primary' : 'text-text-tertiary hover:text-text-primary',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
