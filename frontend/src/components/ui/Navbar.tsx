'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Coins, Gamepad2, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/lib/store/auth.store';
import Button from './Button';
import NotificationDropdown from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';
import { useSocket } from '@/lib/hooks/useSocket';
import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

const PUBLIC_LINKS = [
  { href: '/tournaments', translationKey: 'tournaments' as const, icon: Gamepad2 },
  { href: '/community', translationKey: 'community' as const, icon: MessageSquare },
  { href: '/leaderboard', translationKey: 'leaderboard' as const, icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isAuthenticated, user, isLoading, setUser } = useAuthStore();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !isAuthenticated || !user) return;

    const handleBalanceUpdated = (data: { balance: number }) => {
      setUser({
        ...user,
        credits: data.balance,
      });
    };

    socket.on('balance_updated', handleBalanceUpdated);

    return () => {
      socket.off('balance_updated', handleBalanceUpdated);
    };
  }, [socket, isAuthenticated, user, setUser]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-primary/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary text-sm font-bold text-white">
              UA
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-semibold text-text-primary">Underground</div>
              <div className="text-xs text-text-tertiary">Arena</div>
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {PUBLIC_LINKS.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-bg-tertiary text-text-primary'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(link.translationKey)}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isLoading && isAuthenticated && user ? (
            <>
              <Link
                href="/wallet"
                className="hidden items-center gap-2 rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-tertiary sm:flex"
              >
                <Coins className="h-4 w-4 text-accent-warning" />
                <span>{Number(user.credits).toLocaleString()}</span>
                <span className="text-xs text-text-tertiary">CR</span>
              </Link>
              <NotificationDropdown />
              <ProfileDropdown user={user} />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">{t('login')}</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">{t('register')}</Button>
              </Link>
            </div>
          )}

          {!isLoading && !isAuthenticated ? (
            <Link href="/auth/login" className="sm:hidden">
              <Button variant="secondary" size="sm">{t('login')}</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
