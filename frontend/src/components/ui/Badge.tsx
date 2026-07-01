import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'default' | 'gold' | 'blue' | 'gray' | 'green' | 'red' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}: BadgeProps) {
  const styles = {
    primary: 'bg-accent-primary/15 text-accent-primary',
    secondary: 'bg-bg-tertiary text-text-secondary',
    success: 'bg-accent-success/15 text-accent-success',
    warning: 'bg-accent-warning/15 text-accent-warning',
    danger: 'bg-accent-danger/15 text-accent-danger',
    info: 'bg-accent-secondary/15 text-accent-secondary',
    default: 'bg-bg-tertiary text-text-tertiary',
    gold: 'bg-yellow-500/15 text-yellow-400',
    blue: 'bg-blue-500/15 text-blue-400',
    gray: 'bg-gray-500/15 text-gray-400',
    green: 'bg-green-500/15 text-green-400',
    red: 'bg-red-500/15 text-red-400',
    purple: 'bg-purple-500/15 text-purple-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-md font-medium',
      styles[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}
