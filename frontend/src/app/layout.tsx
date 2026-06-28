'use client';

import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/auth.store';
import { useOnboardingStore } from '@/lib/store/onboarding.store';
import Navbar from '@/components/ui/Navbar';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
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

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

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
      <body className="bg-arena-dark min-h-screen text-gray-100 flex flex-col font-space">
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
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        
        {/* Global onboarding modal (opens after registration) */}
        <OnboardingModal />
      </body>
    </html>
  );
}
