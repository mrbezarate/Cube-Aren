'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Participant, Tournament } from '@/types';
import Badge from '../ui/Badge';
import { User, Medal, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ParticipantsListProps {
  participants: Participant[];
  tournament: Tournament;
  isOrganizer: boolean;
  onDeclareWinner?: (participantId: string) => void;
}

export default function ParticipantsList({
  participants,
  tournament,
  isOrganizer,
  onDeclareWinner,
}: ParticipantsListProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 },
  };

  const statusLabels = {
    registered: 'Участник',
    checked_in: 'Готов',
    playing: 'В игре',
    eliminated: 'Выбыл',
    winner: 'Победитель',
  };

  const statusVariants = {
    registered: 'gray',
    checked_in: 'blue',
    playing: 'gold',
    eliminated: 'red',
    winner: 'green',
  } as const;

  return (
    <div className="space-y-4">
      <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
        <span>👥 Участники турнира</span>
        <span className="text-xs text-gray-400 font-normal">({participants.length} зарегистрировано)</span>
      </h3>

      {participants.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-arena-border rounded-lg text-gray-500 text-sm">
          Участники еще не зарегистрировались. Будь первым!
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-2 max-h-[400px] overflow-y-auto pr-1"
        >
          {participants.map((p) => {
            const formattedDate = format(new Date(p.joinedAt), 'd MMM, HH:mm', { locale: ru });
            const isTournamentActive = tournament.status === 'in_progress';
            const isWinner = p.status === 'winner';

            return (
              <motion.div
                key={p.id}
                variants={itemVariants}
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                  isWinner
                    ? 'border-neon-gold bg-neon-gold/10 shadow-neon-gold/10'
                    : 'border-arena-border bg-arena-card/40'
                }`}
              >
                {/* Left Side: Avatar, Username, Team */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-arena-border bg-arena-dark flex items-center justify-center relative">
                    {p.user.avatarUrl ? (
                      <img src={p.user.avatarUrl} alt={p.user.username} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User className="w-4.5 h-4.5 text-gray-400" />
                    )}
                    {isWinner && (
                      <Crown className="w-4 h-4 text-neon-gold absolute -top-2 -right-1 rotate-12" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{p.user.username}</span>
                      {p.placement && (
                        <span className="flex items-center gap-0.5 text-xs text-neon-gold">
                          <Medal className="w-3.5 h-3.5" /> #{p.placement}
                        </span>
                      )}
                    </div>
                    {p.teamName && <span className="text-[10px] text-neon-blue font-bold uppercase">{p.teamName}</span>}
                  </div>
                </div>

                {/* Right Side: Status, Actions */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 hidden sm:inline">{formattedDate}</span>
                  
                  <Badge variant={statusVariants[p.status]}>
                    {statusLabels[p.status]}
                  </Badge>

                  {/* Organizer Controls: Declare Winner */}
                  {isOrganizer && isTournamentActive && p.status !== 'eliminated' && onDeclareWinner && (
                    <button
                      onClick={() => onDeclareWinner(p.id)}
                      className="px-2.5 py-1 text-[10px] font-orbitron font-extrabold uppercase bg-neon-gold hover:shadow-neon-gold/30 text-arena-dark rounded transition-all"
                    >
                      🏆 Выигрыш
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
