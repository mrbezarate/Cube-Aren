'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Tournament } from '@/types';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Trophy, Coins, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface FeaturedTournamentCardProps {
  tournament: Tournament;
}

export default function FeaturedTournamentCard({ tournament }: FeaturedTournamentCardProps) {
  const formattedDate = format(new Date(tournament.startDate), 'd MMMM yyyy, HH:mm', { locale: ru });
  const fillPercentage = Math.min((tournament.currentParticipants / tournament.maxParticipants) * 100, 100);

  const gameColors = {
    cs2: 'purple',
    dota2: 'gold',
    valorant: 'blue',
    lol: 'purple',
    pubg: 'gold',
    apex: 'blue',
    custom: 'none',
  } as const;

  const currentNeon = gameColors[tournament.game] || 'purple';

  return (
    <Card
      neonColor={currentNeon}
      className="relative flex flex-col md:flex-row gap-6 p-6 overflow-hidden min-h-[280px]"
    >
      {/* Background Banner Effect */}
      <div className="absolute top-0 right-0 w-full md:w-[60%] h-full opacity-10 bg-gradient-to-l from-neon-purple/80 via-transparent to-transparent pointer-events-none" />

      {/* Main Info */}
      <div className="flex-1 flex flex-col justify-between z-10 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="gold">👑 ТОП ТУРНИР</Badge>
            <Badge variant={currentNeon === 'none' ? 'gray' : currentNeon}>{tournament.game}</Badge>
            <Badge variant="purple">{tournament.format}</Badge>
          </div>

          <h2 className="text-2xl md:text-3xl font-orbitron font-extrabold text-white tracking-wide uppercase">
            {tournament.title}
          </h2>
          <p className="text-gray-400 text-xs md:text-sm max-w-xl line-clamp-2">
            {tournament.description || 'Прими вызов в подпольном турнире и докажи, что ты лучший на арене!'}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neon-gold">
              <Coins className="w-4 h-4" />
              <span className="text-xs uppercase font-orbitron font-bold">Призовой</span>
            </div>
            <span className="text-lg md:text-xl font-orbitron font-extrabold text-white neon-text-gold">
              {Number(tournament.prizePool).toLocaleString()} CR
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-neon-blue">
              <Users className="w-4 h-4" />
              <span className="text-xs uppercase font-orbitron font-bold">Слоты</span>
            </div>
            <span className="text-lg md:text-xl font-orbitron font-extrabold text-white">
              {tournament.currentParticipants} / {tournament.maxParticipants}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Trophy className="w-4 h-4" />
              <span className="text-xs uppercase font-orbitron font-bold">Взнос</span>
            </div>
            <span className="text-lg md:text-xl font-orbitron font-extrabold text-gray-300">
              {Number(tournament.entryFee) === 0 ? 'FREE' : `${Number(tournament.entryFee)} CR`}
            </span>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span className="text-xs uppercase font-orbitron font-bold">Старт</span>
            </div>
            <span className="text-xs font-bold text-gray-300 block leading-tight">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Progress slots bar */}
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-arena-dark rounded-full overflow-hidden border border-arena-border">
            <div
              className="h-full bg-gradient-to-r from-neon-purple to-neon-blue transition-all duration-500"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Call to Actions */}
      <div className="md:w-52 flex flex-row md:flex-col justify-end md:justify-center gap-3 z-10">
        <Link href={`/tournaments/${tournament.id}`} className="w-full">
          <Button variant="primary" className="w-full text-xs py-3">
            СТАВКИ / ИГРАТЬ
          </Button>
        </Link>
        <Link href={`/tournaments/${tournament.id}`} className="w-full">
          <Button variant="secondary" className="w-full text-xs py-3">
            ИНФОРМАЦИЯ
          </Button>
        </Link>
      </div>
    </Card>
  );
}
