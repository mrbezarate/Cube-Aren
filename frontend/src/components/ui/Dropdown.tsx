'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

interface DropdownContextValue {
  close: () => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end';
  className?: string;
  panelClassName?: string;
}

export function Dropdown({
  trigger,
  children,
  align = 'end',
  className,
  panelClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ close: () => setOpen(false) }}>
      <div ref={rootRef} className={clsx('relative inline-flex', className)}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center"
          aria-expanded={open}
        >
          {trigger}
        </button>

        {open ? (
          <div
            className={clsx(
              'absolute top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-border-default bg-bg-secondary shadow-xl shadow-black/30',
              align === 'end' ? 'right-0' : 'left-0',
              panelClassName,
            )}
          >
            <div className="py-1">{children}</div>
          </div>
        ) : null}
      </div>
    </DropdownContext.Provider>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  onSelect?: () => void;
  variant?: 'default' | 'danger';
  className?: string;
}

export function DropdownItem({
  children,
  icon,
  href,
  onSelect,
  variant = 'default',
  className,
}: DropdownItemProps) {
  const context = useContext(DropdownContext);

  const itemClassName = clsx(
    'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors',
    variant === 'danger'
      ? 'text-accent-danger hover:bg-accent-danger/10'
      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
    className,
  );

  const handleClick = () => {
    onSelect?.();
    context?.close();
  };

  if (href) {
    return (
      <Link href={href} onClick={handleClick} className={itemClassName}>
        {icon ? <span className="h-4 w-4 shrink-0">{icon}</span> : null}
        <span className="min-w-0 flex-1">{children}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={itemClassName}>
      {icon ? <span className="h-4 w-4 shrink-0">{icon}</span> : null}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 h-px bg-border-subtle" />;
}

export default Dropdown;
