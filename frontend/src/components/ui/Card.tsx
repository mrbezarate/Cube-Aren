'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'ghost';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  neonColor?: 'blue' | 'purple' | 'gold' | 'green' | 'red';
}

export default function Card({
  children,
  className,
  variant = 'default',
  hover = true,
  padding = 'md',
  neonColor,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-bg-secondary border border-white/[0.06]',
    elevated: 'bg-bg-tertiary border border-white/[0.06] shadow-lg',
    ghost: 'bg-transparent border border-white/[0.04]',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  const neonStyles = {
    blue: 'shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-500/50',
    purple: 'shadow-[0_0_20px_rgba(147,51,234,0.3)] border-purple-500/50',
    gold: 'shadow-[0_0_20px_rgba(234,179,8,0.3)] border-yellow-500/50',
    green: 'shadow-[0_0_20px_rgba(34,197,94,0.3)] border-green-500/50',
    red: 'shadow-[0_0_20px_rgba(239,68,68,0.3)] border-red-500/50',
  };

  return (
    <motion.div
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : {}}
      className={clsx(
        'rounded-xl overflow-hidden',
        variants[variant],
        paddings[padding],
        neonColor && neonStyles[neonColor],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
