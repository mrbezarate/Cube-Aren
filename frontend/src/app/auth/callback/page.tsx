'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { useOnboardingStore } from '@/lib/store/onboarding.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const openOnboarding = useOnboardingStore((state) => state.open);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refresh');

      if (token && refreshToken) {
        try {
          // Temporarily set token in store to execute getMe request
          useAuthStore.getState().setTokens(token, refreshToken);
          
          const profile = await api.auth.getMe();
          login(profile, token, refreshToken);
          
          toast.success('Успешный вход через социальную сеть!');
          
          if (!profile.onboardingCompleted) {
            router.push('/');
            openOnboarding();
          } else {
            router.push('/dashboard');
          }
        } catch {
          toast.error('Ошибка входа через социальную сеть');
          router.push('/auth/login');
        }
      } else {
        router.push('/auth/login');
      }
    };

    handleCallback();
  }, [searchParams, login, openOnboarding, router]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      <span className="mt-4 font-orbitron font-bold text-xs text-gray-400">ПОЛУЧЕНИЕ ДАННЫХ АВТОРИЗАЦИИ...</span>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
        <span className="mt-4 font-orbitron font-bold text-xs text-gray-400">ЗАГРУЗКА...</span>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
