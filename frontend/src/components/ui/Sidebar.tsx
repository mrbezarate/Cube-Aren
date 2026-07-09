'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  Bookmark,
  Home,
  MessageSquare,
  PlusCircle,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { useTranslation } from '@/lib/i18n';

const NAV_ITEMS = [
  { href: '/', translationKey: 'home' as const, icon: Home, exact: true },
  { href: '/chat', translationKey: 'chat' as const, icon: MessageSquare },
  { href: '/friends', translationKey: 'friends' as const, icon: Users },
  { href: '/teams', translationKey: 'my_teams' as const, icon: Shield },
  { href: '/saved', translationKey: 'saved' as const, icon: Bookmark },
  { href: '/settings/profile', translationKey: 'settings' as const, icon: Settings, match: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  const canCreate = user.role === 'organizer' || user.role === 'admin';

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-20 shrink-0 border-r border-border-subtle bg-bg-primary/95 md:flex lg:w-64">
      <div className="flex w-full flex-col gap-4 px-3 py-4">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.match || `${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:justify-start',
                  active
                    ? 'bg-bg-tertiary text-text-primary'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                )}
                title={t(item.translationKey)}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden truncate lg:block">{t(item.translationKey)}</span>
              </Link>
            );
          })}
        </nav>

        {canCreate ? (
          <div className="mt-auto border-t border-border-subtle pt-4">
            <Link
              href="/create"
              className="flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-primary-hover lg:justify-start"
              title={t('create_tournament')}
            >
              <PlusCircle className="h-5 w-5 shrink-0" />
              <span className="hidden lg:block">{t('create_tournament')}</span>
            </Link>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
