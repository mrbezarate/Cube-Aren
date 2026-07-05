'use client';

import React from 'react';
import clsx from 'clsx';

type InputSize = 'sm' | 'md' | 'lg';

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> & {
    as?: 'input' | 'textarea';
    label?: string;
    error?: string;
    hint?: string;
    icon?: React.ReactNode;
    inputSize?: InputSize;
    wrapperClassName?: string;
  };

export default function Input({
  as = 'input',
  label,
  error,
  hint,
  icon,
  inputSize = 'md',
  className,
  wrapperClassName,
  id,
  ...props
}: InputProps) {
  const inputId = id || props.name;
  const hasIcon = Boolean(icon);

  const sizes: Record<InputSize, string> = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-3.5 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const controlClassName = clsx(
    'w-full rounded-lg border bg-bg-secondary text-text-primary placeholder:text-text-tertiary transition-colors',
    'focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/15',
    'disabled:cursor-not-allowed disabled:opacity-50',
    error ? 'border-accent-danger' : 'border-border-default hover:border-border-strong',
    sizes[inputSize],
    hasIcon && 'pl-10',
    as === 'textarea' && 'min-h-[120px] resize-y',
    className,
  );

  return (
    <div className={clsx('space-y-1.5', wrapperClassName)}>
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {icon}
          </span>
        ) : null}

        {as === 'textarea' ? (
          <textarea
            id={inputId}
            className={controlClassName}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            id={inputId}
            className={controlClassName}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>

      {error ? (
        <p className="text-xs text-accent-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-tertiary">{hint}</p>
      ) : null}
    </div>
  );
}
