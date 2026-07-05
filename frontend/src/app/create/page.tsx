'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import {
  Gamepad2,
  Calendar,
  Users,
  Coins,
  MapPin,
  PenTool,
  ShieldAlert,
  Swords,
  Target,
  Globe,
} from 'lucide-react';

const schema = z.object({
  title: z.string().min(3, 'Минимум 3 символа').max(100, 'Максимум 100 символов'),
  description: z.string().optional(),
  game: z.enum(['cs2', 'dota2', 'valorant', 'lol', 'pubg', 'apex', 'custom']),
  format: z.enum(['1v1', '5v5', 'battle_royale', 'custom']),
  tournamentType: z.enum(['solo', 'team']).optional(),
  gameMode: z.enum(['ffa', 'two_team', 'multi_team']).default('ffa'),
  entryFee: z.number().min(0, 'Не может быть отрицательным'),
  maxParticipants: z.number().min(2, 'Минимум 2 участника').max(1000),
  teamsCount: z.number().min(2).max(16).optional(),
  teamSize: z.number().min(1).max(100).optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Неверная дата начала'),
  rules: z.string().optional(),
  region: z.string().min(2, 'Минимум 2 символа').optional(),
  roundsCount: z.number().min(1, 'Минимум 1 раунд').max(10, 'Максимум 10 раундов').default(3),
});

type FormValues = z.infer<typeof schema>;

const GAME_MODE_OPTIONS = [
  {
    value: 'ffa',
    label: 'FFA — Каждый сам за себя',
    sublabel: 'Battle Royale, одиночные бои. Ставки на каждого игрока отдельно.',
    icon: Target,
    color: '#f97316',
    example: 'PUBG, Apex Legends, Deathmatch',
  },
  {
    value: 'two_team',
    label: '2 команды',
    sublabel: '5v5, 1v1. Игроки выбирают сторону, ставки на одну из двух команд.',
    icon: Swords,
    color: '#a855f7',
    example: 'CS2, Valorant, 1v1',
  },
  {
    value: 'multi_team',
    label: 'Несколько команд',
    sublabel: '4v4v4, 3v3v3... Несколько командных слотов, ставки на каждую команду.',
    icon: Globe,
    color: '#22d3ee',
    example: '4v4v4 Arena, Multi-team BR',
  },
] as const;

export default function CreateTournamentPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'ffa' | 'two_team' | 'multi_team'>('ffa');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      game: 'cs2',
      format: '5v5',
      tournamentType: 'solo',
      gameMode: 'ffa',
      entryFee: 0,
      maxParticipants: 16,
      teamsCount: 2,
      teamSize: 5,
      startDate: '',
      rules: '',
      region: 'RU',
      roundsCount: 3,
    },
  });

  const gameMode = watch('gameMode');
  const teamsCount = watch('teamsCount') ?? 2;
  const teamSize = watch('teamSize') ?? 5;

  // Автоматически вычисляем maxParticipants для командных режимов
  const isTeamMode = gameMode === 'two_team' || gameMode === 'multi_team';

  const canCreate = user && (user.role === 'organizer' || user.role === 'admin');

  const onSubmit = async (data: FormValues) => {
    if (!canCreate) {
      toast.error('Недостаточно прав. Нужен статус Организатора.');
      return;
    }

    // Для командных режимов — пересчитываем maxParticipants
    let finalData = { ...data };
    if (data.gameMode === 'two_team') {
      finalData.teamsCount = 2;
      finalData.maxParticipants = 2 * (data.teamSize ?? 5);
    } else if (data.gameMode === 'multi_team') {
      finalData.maxParticipants = (data.teamsCount ?? 3) * (data.teamSize ?? 5);
    }

    setLoading(true);
    try {
      const res = await api.tournaments.create(finalData);
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
      <form onSubmit={handleSubmit(onSubmit)} className="glass-panel border border-arena-border p-6 rounded-xl space-y-8">

        {/* === GAME MODE SELECTION === */}
        <div className="space-y-3">
          <label className="text-xs uppercase font-orbitron font-bold text-gray-300 flex items-center gap-2">
            <Swords className="w-4 h-4 text-neon-purple" />
            Режим турнира
            <span className="text-[10px] text-gray-500 normal-case font-normal">— определяет систему регистрации и ставок</span>
          </label>
          <Controller
            name="gameMode"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {GAME_MODE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = field.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        field.onChange(opt.value);
                        setSelectedMode(opt.value as any);
                      }}
                      className="text-left p-4 rounded-xl border-2 transition-all duration-200 space-y-2"
                      style={{
                        borderColor: isActive ? opt.color : 'rgba(255,255,255,0.08)',
                        background: isActive ? `${opt.color}15` : 'rgba(255,255,255,0.03)',
                        boxShadow: isActive ? `0 0 20px ${opt.color}30` : 'none',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className="w-5 h-5 flex-shrink-0"
                          style={{ color: isActive ? opt.color : '#6b7280' }}
                        />
                        <span
                          className="text-sm font-orbitron font-bold"
                          style={{ color: isActive ? opt.color : '#9ca3af' }}
                        >
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight">{opt.sublabel}</p>
                      <p className="text-[9px] text-gray-600 italic">{opt.example}</p>
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

        {/* === TEAM SETTINGS (only for team modes) === */}
        {isTeamMode && (
          <div
            className="rounded-xl border p-4 space-y-4"
            style={{ borderColor: gameMode === 'two_team' ? '#a855f730' : '#22d3ee30', background: gameMode === 'two_team' ? '#a855f708' : '#22d3ee08' }}
          >
            <p className="text-xs font-orbitron font-bold uppercase" style={{ color: gameMode === 'two_team' ? '#a855f7' : '#22d3ee' }}>
              ⚙️ Настройки команд
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameMode === 'multi_team' && (
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-orbitron font-bold text-gray-400">
                    Количество команд
                  </label>
                  <input
                    type="number"
                    {...register('teamsCount', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
                    placeholder="3"
                    min="2"
                    max="16"
                  />
                  <p className="text-[10px] text-gray-600">Сколько командных слотов будет (мин. 2)</p>
                </div>
              )}
              {gameMode === 'two_team' && (
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-orbitron font-bold text-gray-400">
                    Команд
                  </label>
                  <div className="px-4 py-2.5 rounded-lg glass-input text-sm text-gray-400">
                    2 (Team A vs Team B)
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-orbitron font-bold text-gray-400">
                  Игроков в команде
                </label>
                <input
                  type="number"
                  {...register('teamSize', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
                  placeholder="5"
                  min="1"
                  max="100"
                />
                <p className="text-[10px] text-gray-600">
                  Итого слотов:{' '}
                  <span className="text-white font-bold">
                    {gameMode === 'two_team'
                      ? `2 × ${teamSize} = ${2 * teamSize}`
                      : `${teamsCount} × ${teamSize} = ${teamsCount * teamSize}`}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

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
            <select {...register('game')} className="w-full px-4 py-2.5 rounded-lg glass-input text-sm">
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
            <label className="text-xs uppercase font-orbitron font-bold text-gray-400">Формат матча</label>
            <select {...register('format')} className="w-full px-4 py-2.5 rounded-lg glass-input text-sm">
              <option value="5v5">5 на 5</option>
              <option value="1v1">1 на 1</option>
              <option value="battle_royale">Королевская битва</option>
              <option value="custom">Другое</option>
            </select>
          </div>

          {/* Max Participants — only for FFA */}
          {!isTeamMode && (
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-orbitron font-bold text-gray-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-neon-blue" /> Макс. участников
              </label>
              <input
                type="number"
                {...register('maxParticipants', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
                placeholder="16"
              />
              {errors.maxParticipants && <span className="text-[10px] text-neon-red font-bold">{errors.maxParticipants.message}</span>}
            </div>
          )}

          {/* Rounds Count */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-orbitron font-bold text-gray-400 flex items-center gap-1">
              <Gamepad2 className="w-3.5 h-3.5 text-neon-purple" /> Количество раундов
            </label>
            <input
              type="number"
              {...register('roundsCount', { valueAsNumber: true })}
              className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
              placeholder="3"
              min="1"
              max="10"
            />
            {errors.roundsCount && <span className="text-[10px] text-neon-red font-bold">{errors.roundsCount.message}</span>}
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

        {/* Summary Banner */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-4 flex items-center gap-3">
          <div className="text-2xl">
            {gameMode === 'ffa' ? '🎯' : gameMode === 'two_team' ? '⚔️' : '🌐'}
          </div>
          <div className="text-sm text-gray-300">
            {gameMode === 'ffa' && (
              <>
                <strong className="text-white">FFA-режим</strong>: каждый регистрируется сам.
                Ставки — на каждого участника отдельно.
              </>
            )}
            {gameMode === 'two_team' && (
              <>
                <strong className="text-white">2 команды</strong>: при регистрации выбирают <em>Team A</em> или <em>Team B</em>.
                Первый в команде задаёт название. Ставки — Team A vs Team B.
              </>
            )}
            {gameMode === 'multi_team' && (
              <>
                <strong className="text-white">{teamsCount} команд</strong>: каждый выбирает командный слот.
                Ставки — на любую из команд.
              </>
            )}
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
