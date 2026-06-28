'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { Gamepad2, Calendar, Users, Coins, MapPin, PenTool, ShieldAlert } from 'lucide-react';

const schema = z.object({
  title: z.string().min(3, 'Минимум 3 символа').max(100, 'Максимум 100 символов'),
  description: z.string().optional(),
  game: z.enum(['cs2', 'dota2', 'valorant', 'lol', 'pubg', 'apex', 'custom']),
  format: z.enum(['1v1', '5v5', 'battle_royale', 'custom']),
  tournamentType: z.enum(['solo', 'team']).optional(),
  entryFee: z.number().min(0, 'Не может быть отрицательным'),
  maxParticipants: z.number().min(2, 'Минимум 2 участника').max(1000),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Неверная дата начала'),
  rules: z.string().optional(),
  region: z.string().min(2, 'Минимум 2 символа').optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateTournamentPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      game: 'cs2',
      format: '5v5',
      tournamentType: 'solo',
      entryFee: 0,
      maxParticipants: 16,
      startDate: '',
      rules: '',
      region: 'RU',
    },
  });

  // Check role but don't redirect (middleware handles auth)
  const canCreate = user && (user.role === 'organizer' || user.role === 'admin');

  const onSubmit = async (data: FormValues) => {
    if (!canCreate) {
      toast.error('Недостаточно прав. Нужен статус Организатора.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.tournaments.create(data);
      toast.success('Турнир успешно создан!');
      router.push(`/tournaments/${res.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка создания турнира');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-neon-red mx-auto" />
        <h1 className="font-orbitron font-black text-2xl text-white">Недостаточно прав</h1>
        <p className="text-gray-400">Создание турниров доступно только для организаторов.</p>
        <p className="text-xs text-gray-500">Измените роль в настройках профиля или обратитесь к администратору.</p>
        <Button onClick={() => router.push('/tournaments')}>Смотреть турниры</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 flex flex-col space-y-8">
      {/* Title */}
      <div className="border-b border-arena-border pb-4">
        <h1 className="font-orbitron font-black text-2xl text-white uppercase tracking-wider">
          🏆 Создать новый турнир
        </h1>
        <p className="text-gray-400 text-xs mt-1">Определите правила, взносы и соберите команду на Арене.</p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit(onSubmit)} className="glass-panel border border-arena-border p-6 rounded-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs uppercase font-orbitron font-bold text-gray-400">Название турнира</label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
              placeholder="Подпольный кубок CS2..."
            />
            {errors.title && <span className="text-[10px] text-neon-red font-bold">{errors.title.message}</span>}
          </div>

          {/* Game Selector */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-orbitron font-bold text-gray-400 flex items-center gap-1">
              <Gamepad2 className="w-3.5 h-3.5 text-neon-purple" /> Дисциплина
            </label>
            <select
              {...register('game')}
              className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
            >
              <option value="cs2">CS 2</option>
              <option value="dota2">Dota 2</option>
              <option value="valorant">Valorant</option>
              <option value="lol">League of Legends</option>
              <option value="pubg">PUBG Mobile</option>
              <option value="apex">Apex Legends</option>
              <option value="custom">Другое</option>
            </select>
          </div>

          {/* Format Selector */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-orbitron font-bold text-gray-400">Формат игры</label>
            <select
              {...register('format')}
              className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
            >
              <option value="5v5">5 на 5</option>
              <option value="1v1">1 на 1</option>
              <option value="battle_royale">Королевская битва</option>
              <option value="custom">Другое</option>
            </select>
          </div>

          {/* Tournament Type Selector */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs uppercase font-orbitron font-bold text-gray-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-neon-blue" /> Тип турнира
            </label>
            <select
              {...register('tournamentType')}
              className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
            >
              <option value="solo">👤 Одиночный (Solo) - игроки участвуют индивидуально</option>
              <option value="team">👥 Клановый (Team) - участвуют команды</option>
            </select>
          </div>

          {/* Entry Fee */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-orbitron font-bold text-gray-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-neon-gold" /> Стоимость входа (CR)
            </label>
            <input
              type="number"
              {...register('entryFee', { valueAsNumber: true })}
              className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
              placeholder="0"
            />
            {errors.entryFee && <span className="text-[10px] text-neon-red font-bold">{errors.entryFee.message}</span>}
          </div>

          {/* Max Participants */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-orbitron font-bold text-gray-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-neon-blue" /> Макс. количество слотов
            </label>
            <input
              type="number"
              {...register('maxParticipants', { valueAsNumber: true })}
              className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
              placeholder="16"
            />
            {errors.maxParticipants && <span className="text-[10px] text-neon-red font-bold">{errors.maxParticipants.message}</span>}
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-orbitron font-bold text-gray-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Дата и время начала
            </label>
            <input
              type="datetime-local"
              {...register('startDate')}
              className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
            />
            {errors.startDate && <span className="text-[10px] text-neon-red font-bold">{errors.startDate.message}</span>}
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-orbitron font-bold text-gray-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Регион / Страна
            </label>
            <input
              type="text"
              {...register('region')}
              className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
              placeholder="GLOBAL"
            />
            {errors.region && <span className="text-[10px] text-neon-red font-bold">{errors.region.message}</span>}
          </div>

          {/* Description */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs uppercase font-orbitron font-bold text-gray-400">Описание турнира</label>
            <textarea
              rows={3}
              {...register('description')}
              className="w-full px-4 py-2.5 rounded-lg glass-input text-sm resize-none"
              placeholder="Дополнительные подробности..."
            />
          </div>

          {/* Rules */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs uppercase font-orbitron font-bold text-gray-400 flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5 text-neon-purple" /> Правила и регламент
            </label>
            <textarea
              rows={4}
              {...register('rules')}
              className="w-full px-4 py-2.5 rounded-lg glass-input text-sm resize-none"
              placeholder="1. Запрещено использовать читы.&#10;2. Явка за 15 минут до старта..."
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-arena-border flex justify-end">
          <Button
            type="submit"
            loading={loading}
            variant="primary"
            className="w-full sm:w-auto"
          >
            СОЗДАТЬ ТУРНИР
          </Button>
        </div>
      </form>
    </div>
  );
}
