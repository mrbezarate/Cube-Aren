'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Mail, Lock, LogIn } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Неверный адрес почты'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await api.auth.login(data);
      login(res.user, res.accessToken, res.refreshToken);
      toast.success('С возвращением на Арену!');
      router.push(res.user.onboardingCompleted ? '/dashboard' : '/onboarding');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка входа. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'discord') => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api'}/auth/${provider}`;
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 bg-[#020205] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-neon-purple/5 filter blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6 z-10">
        <div className="text-center space-y-2">
          <h1 className="font-orbitron font-black text-2xl text-white tracking-widest uppercase">
            ВХОД НА АРЕНУ
          </h1>
          <p className="text-xs text-gray-400">Вернитесь в подпольные бои прямо сейчас.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-orbitron font-bold text-gray-400">Электронная почта</label>
            <div className="relative">
              <input
                type="email"
                {...register('email')}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-xs"
                placeholder="example@mail.com"
              />
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            </div>
            {errors.email && <span className="text-[9px] text-neon-red font-bold">{errors.email.message}</span>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-orbitron font-bold text-gray-400">Пароль</label>
            <div className="relative">
              <input
                type="password"
                {...register('password')}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-xs"
                placeholder="••••••••"
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            </div>
            {errors.password && <span className="text-[9px] text-neon-red font-bold">{errors.password.message}</span>}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            loading={loading}
            variant="primary"
            className="w-full py-3 mt-2 flex justify-center items-center gap-2"
          >
            <LogIn className="w-4 h-4" /> ВОЙТИ НА АРЕНУ
          </Button>
        </form>

        {/* Separator */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-arena-border w-full" />
          <span className="absolute bg-[#12121a] px-3 font-orbitron text-[9px] text-gray-500 uppercase tracking-widest">ИЛИ ВОЙТИ ЧЕРЕЗ</span>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuth('google')}
            type="button"
            className="py-2.5 px-4 rounded-lg border border-arena-border bg-arena-card font-orbitron text-xs font-bold text-gray-300 hover:text-white hover:border-red-500/40 hover:bg-red-500/5 transition-all"
          >
            GOOGLE
          </button>
          
          <button
            onClick={() => handleOAuth('discord')}
            type="button"
            className="py-2.5 px-4 rounded-lg border border-arena-border bg-arena-card font-orbitron text-xs font-bold text-gray-300 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
          >
            DISCORD
          </button>
        </div>

        {/* Register link */}
        <div className="text-center text-xs text-gray-400 pt-2">
          <span>Нет аккаунта? </span>
          <Link href="/auth/register" className="font-bold text-neon-purple hover:text-neon-blue transition-colors">
            Создайте его здесь
          </Link>
        </div>
      </Card>
    </div>
  );
}
