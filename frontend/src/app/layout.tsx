'use client';

import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/auth.store';
import { useOnboardingStore } from '@/lib/store/onboarding.store';
import Navbar from '@/components/ui/Navbar';
import Sidebar from '@/components/ui/Sidebar';
import BottomTabBar from '@/components/ui/BottomTabBar';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import { usePreferencesStore, applyPreferences } from '@/lib/store/preferences.store';
import '@/app/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isOnboardingOpen = useOnboardingStore((state) => state.isOpen);
  const openOnboarding = useOnboardingStore((state) => state.open);

  const initializePreferences = usePreferencesStore((state) => state.initializePreferences);
  const loadPreferences = usePreferencesStore((state) => state.loadPreferences);
  const preferences = usePreferencesStore((state) => state.preferences);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Load preferences from localStorage synchronously
  useEffect(() => {
    initializePreferences();
  }, [initializePreferences]);

  // Load preferences from backend API if authenticated
  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user, loadPreferences]);

  // Listen for system theme scheme updates when 'system' is selected
  useEffect(() => {
    if (typeof window === 'undefined' || preferences.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      applyPreferences(preferences);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [preferences]);

  useEffect(() => {
    if (!isLoading && user && !user.onboardingCompleted && !isOnboardingOpen) {
      openOnboarding();
    }
  }, [isLoading, isOnboardingOpen, openOnboarding, user]);

  return (
    <html lang="ru">
      <head>
        <title>Underground Arena | Подпольные турниры и ставки</title>
        <meta name="description" content="Платформа подпольных игровых турниров с системой ставок и внутренней валютой." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-bg-primary min-h-screen text-text-primary flex flex-col font-sans">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#12121a',
              color: '#fff',
              border: '1px solid #1e1e2e',
              fontFamily: 'var(--font-orbitron)',
            },
          }}
        />
        <Navbar />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="min-w-0 flex-1 pb-20 md:pb-0">
            {children}
          </main>
        </div>
        <BottomTabBar />
        
        {/* Global onboarding modal (opens after registration) */}
        <OnboardingModal />
      </body>
    </html>
  );
}
