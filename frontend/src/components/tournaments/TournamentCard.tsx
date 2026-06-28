'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tournament } from '@/types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Coins, Users, Calendar, Eye, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

interface TournamentCardProps {
  tournament: Tournament;
  isFavoriteGame?: boolean;
}

export default function TournamentCard({ tournament, isFavoriteGame = false }: TournamentCardProps) {
  const { isAuthenticated } = useAuthStore();
  const [saved, setSaved] = useState(tournament.isSaved ?? false);
  const [savesCount, setSavesCount] = useState(tournament.savesCount ?? 0);
  const [savingInProgress, setSavingInProgress] = useState(false);

  const formattedDate = format(new Date(tournament.startDate), 'd MMM, HH:mm', { locale: ru });
  const fillPercentage = Math.min((tournament.currentParticipants / tournament.maxParticipants) * 100, 100);

  const statusColors = {
    draft: 'gray',
    open: 'green',
    in_progress: 'blue',
    completed: 'purple',
    cancelled: 'red',
  } as const;

  const gameIcons: Record<string, string> = {
    cs2: '🔫',
    dota2: '⚔️',
    valorant: '🎯',
    lol: '🔮',
    pubg: '🪂',
    apex: '⚡',
    custom: '🎮',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Черновик',
    open: 'Открыт',
    in_progress: 'В игре',
    completed: 'Завершен',
    cancelled: 'Отменен',
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Войдите в систему чтобы сохранять турниры');
      return;
    }

    if (savingInProgress) return;
    setSavingInProgress(true);

    try {
      if (saved) {
        await api.tournaments.unsave(tournament.id);
        setSaved(false);
        setSavesCount((prev) => Math.max(0, prev - 1));
        toast.success('Удалено из сохранённых');
      } else {
        await api.tournaments.save(tournament.id);
        setSaved(true);
        setSavesCount((prev) => prev + 1);
        toast.success('Добавлено в сохранённые');
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Already saved — sync state
        setSaved(true);
      } else {
        toast.error('Ошибка. Попробуйте снова');
      }
    } finally {
      setSavingInProgress(false);
    }
  };

  return (
    <Card
      className={`flex flex-col justify-between h-full transition-all duration-300 ${
        isFavoriteGame
          ? 'hover:border-neon-gold/50 border-neon-gold/20'
          : 'hover:border-neon-purple/40'
      }`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex gap-1.5 flex-wrap items-center">
            <Badge variant={statusColors[tournament.status]}>
              {statusLabels[tournament.status]}
            </Badge>
            <span className="text-xl" title={tournament.game}>
              {gameIcons[tournament.game] || '🎮'}
            </span>
            {/* Tournament Type Badge */}
            <span
              className={`text-[9px] font-orbitron font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                tournament.tournamentType === 'team'
                  ? 'text-neon-blue border-neon-blue/40 bg-neon-blue/5'
                  : 'text-gray-300 border-gray-600/40 bg-gray-600/5'
              }`}
              title={tournament.tournamentType === 'team' ? 'Клановый турнир' : 'Одиночный турнир'}
            >
              {tournament.tournamentType === 'team' ? '👥 TEAM' : '👤 SOLO'}
            </span>
            {/* Favorite game indicator */}
            {isFavoriteGame && (
              <span
                title="Одна из ваших любимых игр"
                className="text-[9px] font-orbitron font-extrabold uppercase text-neon-gold tracking-widest px-1.5 py-0.5 rounded border border-neon-gold/40 bg-neon-gold/5"
              >
                ★ Избранное
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 font-orbitron uppercase tracking-wider font-semibold shrink-0">
            {tournament.format}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="font-orbitron font-bold text-base text-white tracking-wide uppercase line-clamp-1">
            {tournament.title}
          </h3>
          <span className="text-[10px] text-gray-400">Регион: {tournament.region || 'GLOBAL'}</span>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 gap-4 py-2 border-y border-arena-border">
          <div className="space-y-0.5">
            <span className="text-[9px] text-gray-400 font-orbitron uppercase font-bold tracking-wider">Приз</span>
            <div className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-neon-gold" />
              <span className="font-orbitron font-extrabold text-sm text-white">
                {Number(tournament.prizePool).toLocaleString()} CR
              </span>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-gray-400 font-orbitron uppercase font-bold tracking-wider">Вход</span>
            <span className="font-orbitron font-bold text-xs text-gray-200 block mt-0.5">
              {Number(tournament.entryFee) === 0 ? 'FREE' : `${Number(tournament.entryFee)} CR`}
            </span>
          </div>
        </div>

        {/* Slots & Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-neon-blue" />
              {tournament.currentParticipants} / {tournament.maxParticipants} слотов
            </span>
            <span>{Math.round(fillPercentage)}%</span>
          </div>
          <div className="h-1 w-full bg-arena-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-purple to-neon-blue transition-all duration-500"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-3 border-t border-arena-border">
        {/* Left: date + views */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500" title="Просмотры">
            <Eye className="w-3 h-3" />
            {(tournament.viewsCount ?? 0).toLocaleString()}
          </span>
        </div>

        {/* Right: saves + star + link */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSave}
            disabled={savingInProgress}
            className="flex items-center gap-1 group focus:outline-none"
            title={saved ? 'Убрать из сохранённых' : 'Сохранить турнир'}
          >
            <span className="text-[10px] text-gray-400">{savesCount}</span>
            <motion.div
              whileTap={{ scale: 0.8 }}
              animate={saved ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Star
                className={`w-4 h-4 transition-all duration-300 ${
                  saved
                    ? 'fill-neon-gold text-neon-gold drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]'
                    : 'text-gray-500 group-hover:text-neon-gold'
                }`}
              />
            </motion.div>
          </button>

          <Link
            href={`/tournaments/${tournament.id}`}
            className="text-xs font-orbitron font-bold text-neon-purple hover:text-neon-blue transition-colors"
          >
            ОТКРЫТЬ →
          </Link>
        </div>
      </div>
    </Card>
  );
}
