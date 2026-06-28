import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'purple' | 'blue' | 'gold' | 'green' | 'red' | 'gray';
  className?: string;
}

export default function Badge({
  children,
  variant = 'gray',
  className,
}: BadgeProps) {
  const styles = {
    purple: 'bg-neon-purple/15 text-purple-400 border border-neon-purple/35',
    blue: 'bg-neon-blue/15 text-blue-400 border border-neon-blue/35',
    gold: 'bg-neon-gold/15 text-yellow-500 border border-neon-gold/35',
    green: 'bg-neon-green/15 text-green-400 border border-neon-green/35',
    red: 'bg-neon-red/15 text-red-400 border border-neon-red/35',
    gray: 'bg-arena-border text-gray-400 border border-white/5',
  };

  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-orbitron font-bold tracking-wider uppercase',
      styles[variant],
      className
    )}>
      {children}
    </span>
  );
}
