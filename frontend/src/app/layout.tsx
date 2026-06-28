'use client';

import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/auth.store';
import Navbar from '@/components/ui/Navbar';
import '@/app/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

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
      </body>
    </html>
  );
}
