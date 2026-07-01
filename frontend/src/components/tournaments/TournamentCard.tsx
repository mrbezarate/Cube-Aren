'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tournament } from '@/types';
import Card from '../ui/Card';
import { Coins, Users, Calendar, Star, Eye } from 'lucide-react';
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

const gameIcons: Record<string, string> = {
  cs2: '🔫',
  dota2: '⚔️',
  valorant: '🎯',
  lol: '🔮',
  pubg: '🪂',
  apex: '⚡',
  custom: '🎮',
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-text-muted/20', text: 'text-text-tertiary', label: 'Черновик' },
  open: { bg: 'bg-accent-success/15', text: 'text-accent-success', label: 'Открыт' },
  in_progress: { bg: 'bg-accent-primary/15', text: 'text-accent-primary', label: 'В игре' },
  completed: { bg: 'bg-text-muted/20', text: 'text-text-tertiary', label: 'Завершен' },
  cancelled: { bg: 'bg-accent-danger/15', text: 'text-accent-danger', label: 'Отменен' },
};

export default function TournamentCard({ tournament, isFavoriteGame = false }: TournamentCardProps) {
  const { isAuthenticated } = useAuthStore();
  const [saved, setSaved] = useState(tournament.isSaved ?? false);
  const [savesCount, setSavesCount] = useState(tournament.savesCount ?? 0);
  const [savingInProgress, setSavingInProgress] = useState(false);

  const formattedDate = format(new Date(tournament.startDate), 'd MMM, HH:mm', { locale: ru });
  const fillPercentage = Math.min((tournament.currentParticipants / tournament.maxParticipants) * 100, 100);
  
  const status = statusColors[tournament.status] || statusColors.draft;

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
        setSaved(true);
      } else {
        toast.error('Ошибка. Попробуйте снова');
      }
    } finally {
      setSavingInProgress(false);
    }
  };

  return (
    <Card className="flex flex-col h-full group" hover>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{gameIcons[tournament.game] || '🎮'}</span>
          <div className="flex flex-col">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {isFavoriteGame && (
            <span className="text-xs px-2 py-0.5 rounded bg-accent-warning/15 text-accent-warning font-medium">
              ★ Избранное
            </span>
          )}
          <button
            onClick={handleToggleSave}
            disabled={savingInProgress}
            className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors"
            title={saved ? 'Убрать из сохранённых' : 'Сохранить турнир'}
          >
            <motion.div
              whileTap={{ scale: 0.8 }}
              animate={saved ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              <Star
                className={`w-4 h-4 transition-colors ${
                  saved
                    ? 'fill-accent-warning text-accent-warning'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Title */}
      <Link href={`/tournaments/${tournament.id}`} className="block mb-4 group/title">
        <h3 className="text-lg font-semibold text-white group-hover/title:text-accent-primary transition-colors line-clamp-2">
          {tournament.title}
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          {tournament.format} • {tournament.tournamentType === 'team' ? 'Командный' : 'Одиночный'}
        </p>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-tertiary">
          <Coins className="w-4 h-4 text-accent-success" />
          <div>
            <div className="text-sm font-semibold text-white">
              {Number(tournament.prizePool).toLocaleString()} CR
            </div>
            <div className="text-xs text-text-tertiary">Приз</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-tertiary">
          <Users className="w-4 h-4 text-accent-primary" />
          <div>
            <div className="text-sm font-semibold text-white">
              {tournament.currentParticipants} / {tournament.maxParticipants}
            </div>
            <div className="text-xs text-text-tertiary">Участники</div>
          </div>
        </div>
      </div>

      {/* View and Save counters */}
      <div className="flex items-center gap-4 mb-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          <span>{tournament.viewsCount || 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5" />
          <span>{savesCount}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
          <span>{Math.round(fillPercentage)}% заполнено</span>
        </div>
        <div className="h-1.5 w-full bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500"
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
      </div>

      {/* Footer link */}
      <Link
        href={`/tournaments/${tournament.id}`}
        className="block w-full py-2.5 text-center text-sm font-medium text-text-secondary hover:text-white bg-bg-tertiary hover:bg-bg-elevated rounded-lg transition-colors"
      >
        Подробнее
      </Link>
    </Card>
  );
}
