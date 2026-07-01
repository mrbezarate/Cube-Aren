'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Tournament } from '@/types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Trophy, Coins, Users, Calendar, ArrowRight, Eye, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface FeaturedTournamentCardProps {
  tournament: Tournament;
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

export default function FeaturedTournamentCard({ tournament }: FeaturedTournamentCardProps) {
  const formattedDate = format(new Date(tournament.startDate), 'd MMMM yyyy, HH:mm', { locale: ru });
  const fillPercentage = Math.min((tournament.currentParticipants / tournament.maxParticipants) * 100, 100);

  return (
    <Card className="relative flex flex-col h-full overflow-hidden" variant="elevated" hover>
      {/* Gradient accent top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary to-accent-secondary" />
      
      {/* Featured badge */}
      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent-primary/15 text-accent-primary text-xs font-medium">
          <Trophy className="w-3 h-3" />
          Топ турнир
        </span>
      </div>

      <div className="flex flex-col h-full pt-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{gameIcons[tournament.game] || '🎮'}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-accent-primary transition-colors">
              {tournament.title}
            </h3>
            <p className="text-sm text-text-secondary mt-0.5">
              {tournament.format} • {tournament.tournamentType === 'team' ? 'Командный' : 'Одиночный'}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-secondary">
            <Coins className="w-4 h-4 text-accent-success" />
            <div>
              <div className="text-sm font-semibold text-white">{Number(tournament.prizePool).toLocaleString()}</div>
              <div className="text-xs text-text-tertiary">Приз</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-secondary">
            <Users className="w-4 h-4 text-accent-primary" />
            <div>
              <div className="text-sm font-semibold text-white">{tournament.currentParticipants}/{tournament.maxParticipants}</div>
              <div className="text-xs text-text-tertiary">Участники</div>
            </div>
          </div>
        </div>

        {/* View and Save counters */}
        <div className="flex items-center gap-4 mb-4 text-xs text-text-tertiary">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>{tournament.viewsCount || 0} просмотров</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" />
            <span>{tournament.savesCount || 0} сохранений</span>
          </div>
        </div>

        {/* Date & Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
            <span>{Math.round(fillPercentage)}%</span>
          </div>
          <div className="h-1.5 w-full bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/tournaments/${tournament.id}`}
          className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-white text-sm font-medium transition-colors"
        >
          Подробнее
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  );
}
