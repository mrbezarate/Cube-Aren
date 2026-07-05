'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import Dropdown from './Dropdown';

export default function NotificationDropdown() {
  return (
    <Dropdown
      trigger={
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary">
          <Bell className="h-4 w-4" />
        </span>
      }
      panelClassName="w-72"
    >
      <div className="px-4 py-5">
        <div className="text-sm font-semibold text-text-primary">Уведомления</div>
        <p className="mt-1 text-sm text-text-tertiary">
          Центр уведомлений будет подключен после появления API списка событий.
        </p>
      </div>
    </Dropdown>
  );
}
