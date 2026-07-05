'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import clsx from 'clsx';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ children, value, defaultValue = '', onValueChange, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;

  const contextValue = useMemo(
    () => ({
      value: currentValue,
      setValue: (nextValue: string) => {
        if (value === undefined) {
          setInternalValue(nextValue);
        }
        onValueChange?.(nextValue);
      },
    }),
    [currentValue, onValueChange, value],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function useTabsContext(component: string) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`${component} must be used inside Tabs`);
  }
  return context;
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={clsx('flex gap-1 rounded-lg border border-border-subtle bg-bg-secondary p-1', className)}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const context = useTabsContext('TabsTrigger');
  const active = context.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => context.setValue(value)}
      className={clsx(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-bg-elevated text-text-primary shadow-sm'
          : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
        className,
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useTabsContext('TabsContent');

  if (context.value !== value) {
    return null;
  }

  return <div className={className}>{children}</div>;
}

export default Tabs;
