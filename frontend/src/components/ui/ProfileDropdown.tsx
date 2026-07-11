'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Coins, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { User } from '@/types';
import { useAuthStore } from '@/lib/store/auth.store';
import { useTranslation } from '@/lib/i18n';
import Avatar from './Avatar';
import Dropdown, { DropdownDivider, DropdownItem } from './Dropdown';

interface ProfileDropdownProps {
  user: User;
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <Dropdown
      trigger={
        <div className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-bg-tertiary">
          <Avatar src={user.avatarUrl} alt={user.username} fallback={user.username} size="sm" />
          <div className="hidden min-w-0 text-left lg:block">
            <div className="max-w-[120px] truncate text-sm font-medium text-text-primary">
              {user.displayName || user.username}
            </div>
            <div className="text-xs text-text-tertiary">{user.role}</div>
          </div>
        </div>
      }
      panelClassName="w-72"
    >
      <div className="px-3 py-3">
        <div className="text-sm font-semibold text-text-primary">{user.displayName || user.username}</div>
        <div className="truncate text-xs text-text-tertiary">{user.email}</div>
      </div>
      <DropdownDivider />
      <DropdownItem href={`/profile/${user.id}`} icon={<UserIcon className="h-4 w-4" />}>
        {t('my_profile')}
      </DropdownItem>
      <DropdownItem href="/wallet" icon={<Coins className="h-4 w-4" />}>
        {t('wallet')}
      </DropdownItem>
      <DropdownItem href="/settings/profile" icon={<Settings className="h-4 w-4" />}>
        {t('settings')}
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem onSelect={handleLogout} icon={<LogOut className="h-4 w-4" />} variant="danger">
        {t('logout')}
      </DropdownItem>
    </Dropdown>
  );
}
