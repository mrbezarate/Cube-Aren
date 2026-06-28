'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode;
  neonColor?: 'purple' | 'blue' | 'gold' | 'none';
  hoverEffect?: boolean;
}

export default function Card({
  children,
  className,
  neonColor = 'none',
  hoverEffect = true,
  ...props
}: CardProps) {
  const neonBorders = {
    purple: 'border border-neon-purple/20 shadow-neon-purple/10',
    blue: 'border border-neon-blue/20 shadow-neon-blue/10',
    gold: 'border border-neon-gold/20 shadow-neon-gold/10',
    none: 'border border-arena-border',
  };

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={clsx(
        'glass-panel rounded-xl p-5 overflow-hidden relative',
        neonBorders[neonColor],
        className
      )}
      {...props}
    >
      {/* Subtle background glow */}
      {neonColor !== 'none' && (
        <div className={clsx(
          'absolute -top-12 -left-12 w-24 h-24 rounded-full filter blur-[40px] opacity-10 pointer-events-none',
          neonColor === 'purple' && 'bg-neon-purple',
          neonColor === 'blue' && 'bg-neon-blue',
          neonColor === 'gold' && 'bg-neon-gold'
        )} />
      )}
      {children}
    </motion.div>
  );
}
