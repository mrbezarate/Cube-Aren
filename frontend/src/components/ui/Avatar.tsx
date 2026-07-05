'use client';

import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

interface AvatarProps {
  src?: string | null;
  alt: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline';
  className?: string;
}

export default function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  status,
  className,
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(src) && !imageFailed;

  const initials = useMemo(() => {
    if (fallback) return fallback.slice(0, 2).toUpperCase();
    return alt
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'UA';
  }, [alt, fallback]);

  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-24 w-24 text-2xl',
  };

  const statusSizes = {
    xs: 'h-2 w-2',
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5',
    xl: 'h-4 w-4',
  };

  return (
    <span className={clsx('relative inline-flex shrink-0', sizes[size], className)}>
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-border-subtle bg-bg-elevated font-semibold text-text-secondary">
        {showImage ? (
          <img
            src={src ?? undefined}
            alt={alt}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </span>

      {status ? (
        <span
          className={clsx(
            'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-bg-secondary',
            statusSizes[size],
            status === 'online' ? 'bg-accent-success' : 'bg-text-muted',
          )}
        />
      ) : null}
    </span>
  );
}
