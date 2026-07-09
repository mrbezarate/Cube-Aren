'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Home, LogIn, MessageSquare, Trophy, User, Users, Newspaper, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { useTranslation } from '@/lib/i18n';

export default function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return null;
  }

  const items = isAuthenticated && user
    ? [
        { href: '/', translationKey: 'home' as const, icon: Home, exact: true },
        { href: '/tournaments', translationKey: 'tournaments' as const, icon: Trophy },
        { href: '/chat', translationKey: 'chat' as const, icon: MessageSquare },
        { href: '/friends', translationKey: 'friends' as const, icon: Users },
        { href: `/profile/${user.id}`, translationKey: 'profile' as const, icon: User, match: '/profile' },
      ]
    : [
        { href: '/', translationKey: 'home' as const, icon: Home, exact: true },
        { href: '/tournaments', translationKey: 'tournaments' as const, icon: Trophy },
        { href: '/community', translationKey: 'community' as const, icon: Newspaper },
        { href: '/leaderboard', translationKey: 'leaderboard' as const, icon: BarChart3 },
        { href: '/auth/login', translationKey: 'login' as const, icon: LogIn, match: '/auth' },
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
              <span className="max-w-full truncate">{t(item.translationKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
