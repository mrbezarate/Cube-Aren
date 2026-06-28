'use client';

import React from 'react';
import Link from 'next/link';
import { Tournament } from '@/types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Coins, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TournamentCardProps {
  tournament: Tournament;
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  const formattedDate = format(new Date(tournament.startDate), 'd MMM, HH:mm', { locale: ru });
  const fillPercentage = Math.min((tournament.currentParticipants / tournament.maxParticipants) * 100, 100);

  const statusColors = {
    draft: 'gray',
    open: 'green',
    in_progress: 'blue',
    completed: 'purple',
    cancelled: 'red',
  } as const;

  const gameIcons = {
    cs2: '🔫',
    dota2: '⚔️',
    valorant: '🎯',
    lol: '🔮',
    pubg: '🪂',
    apex: '⚡',
    custom: '🎮',
  };

  const statusLabels = {
    draft: 'Черновик',
    open: 'Открыт',
    in_progress: 'В игре',
    completed: 'Завершен',
    cancelled: 'Отменен',
  };

  return (
    <Card className="flex flex-col justify-between h-full hover:border-neon-purple/40">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex gap-1.5 flex-wrap">
            <Badge variant={statusColors[tournament.status]}>
              {statusLabels[tournament.status]}
            </Badge>
            <span className="text-xl" title={tournament.game}>
              {gameIcons[tournament.game] || '🎮'}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-orbitron uppercase tracking-wider font-semibold">
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
            <div className="flex items-center gap-1 text-neon-gold">
              <Coins className="w-3.5 h-3.5" />
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
              className="h-full bg-gradient-to-r from-neon-purple to-neon-blue"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="flex items-center justify-between mt-5 pt-3 border-t border-arena-border">
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <Calendar className="w-3 h-3" />
          {formattedDate}
        </span>

        <Link href={`/tournaments/${tournament.id}`} className="text-xs font-orbitron font-bold text-neon-purple hover:text-neon-blue transition-colors">
          ОТКРЫТЬ →
        </Link>
      </div>
    </Card>
  );
}
