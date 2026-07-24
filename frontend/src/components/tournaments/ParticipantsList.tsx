'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Participant, Tournament } from '@/types';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { User, Medal, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';

interface ParticipantsListProps {
  participants: Participant[];
  tournament: Tournament;
  isOrganizer: boolean;
  onDeclareWinner?: (participantId: string) => void;
  onDeclareWinnerTeamSlot?: (teamSlot: number) => void;
}

export default function ParticipantsList({
  participants,
  tournament,
  isOrganizer,
  onDeclareWinner,
  onDeclareWinnerTeamSlot,
}: ParticipantsListProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
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

  const gameMode = tournament.gameMode ?? 'ffa';
  const isTeamMode = gameMode === 'two_team' || gameMode === 'multi_team';

  // Group participants by team slot if team mode
  const teamSlots: { [slot: number]: { label: string; members: Participant[] } } = {};
  if (isTeamMode) {
    participants.forEach((p) => {
      const slot = p.teamSlot || 1;
      if (!teamSlots[slot]) {
        teamSlots[slot] = {
          label: p.teamName || `Команда ${slot}`,
          members: [],
        };
      }
      teamSlots[slot].members.push(p);
    });
  }

  // Check if a slot is declared winner
  const getSlotWinnerStatus = (members: Participant[]) => {
    return members.some((m) => m.status === 'winner');
  };

  if (participants.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <span>👥 Участники турнира</span>
          <span className="text-xs text-gray-400 font-normal">(0 зарегистрировано)</span>
        </h3>
        <div className="text-center py-8 border border-dashed border-arena-border rounded-lg text-gray-500 text-sm">
          Участники еще не зарегистрировались. Будь первым!
        </div>
      </div>
    );
  }

  if (isTeamMode) {
    const isTournamentActive = tournament.status === 'in_progress';

    if (gameMode === 'two_team') {
      const team1 = teamSlots[1] || { label: 'Команда А', members: [] };
      const team2 = teamSlots[2] || { label: 'Команда Б', members: [] };
      const isTeam1Winner = getSlotWinnerStatus(team1.members);
      const isTeam2Winner = getSlotWinnerStatus(team2.members);

      return (
        <div className="space-y-4">
          <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <span>👥 Командный Duel (Команды)</span>
            <span className="text-xs text-gray-400 font-normal">({participants.length} игроков)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch relative">
            {/* VS overlay */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-arena-border bg-arena-dark flex items-center justify-center font-orbitron font-extrabold text-neon-gold z-10 hidden md:flex">
              VS
            </div>

            {/* Team 1 */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                isTeam1Winner
                  ? 'border-neon-gold bg-neon-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.05)]'
                  : 'border-arena-border bg-arena-card/30'
              }`}
            >
              <div>
                <h4 className="font-orbitron font-extrabold text-white text-base mb-3 flex items-center justify-between border-b border-arena-border pb-2">
                  <span className="flex items-center gap-2">
                    {isTeam1Winner && <Crown className="w-5 h-5 text-neon-gold" />}
                    {team1.label}
                  </span>
                  <span className="text-xs text-neon-blue font-bold">СЛОТ #1</span>
                </h4>
                {team1.members.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Слот свободен</p>
                ) : (
                  <div className="space-y-2.5">
                    {team1.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-arena-border/30"
                        style={
                          m.user?.cardBannerUrl
                            ? {
                                backgroundImage: `linear-gradient(90deg, rgba(10, 10, 15, 0.93) 0%, rgba(10, 10, 15, 0.75) 100%), url(${m.user.cardBannerUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : { backgroundColor: 'rgba(10, 10, 15, 0.4)' }
                        }
                      >
                        <Link href={`/profile/${m.user?.id || ''}`} className="flex items-center gap-2.5 group">
                          <Avatar
                            src={m.user?.avatarUrl}
                            alt={m.user?.username || 'Игрок'}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-sm font-bold text-white group-hover:text-neon-blue transition-colors">
                            {m.user?.username || 'Игрок'}
                          </span>
                        </Link>
                        <Badge variant={statusVariants[m.status]}>{statusLabels[m.status]}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isOrganizer && isTournamentActive && team1.members.length > 0 && !isTeam1Winner && !isTeam2Winner && onDeclareWinnerTeamSlot && (
                <button
                  onClick={() => onDeclareWinnerTeamSlot(1)}
                  className="w-full py-2 text-xs font-orbitron font-extrabold uppercase bg-neon-gold hover:shadow-[0_0_10px_rgba(212,175,55,0.3)] text-arena-dark rounded-lg transition-all"
                >
                  🏆 Объявить победу Команды А
                </button>
              )}
            </div>

            {/* Team 2 */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                isTeam2Winner
                  ? 'border-neon-gold bg-neon-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.05)]'
                  : 'border-arena-border bg-arena-card/30'
              }`}
            >
              <div>
                <h4 className="font-orbitron font-extrabold text-white text-base mb-3 flex items-center justify-between border-b border-arena-border pb-2">
                  <span className="flex items-center gap-2">
                    {isTeam2Winner && <Crown className="w-5 h-5 text-neon-gold" />}
                    {team2.label}
                  </span>
                  <span className="text-xs text-neon-blue font-bold">СЛОТ #2</span>
                </h4>
                {team2.members.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Слот свободен</p>
                ) : (
                  <div className="space-y-2.5">
                    {team2.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-arena-border/30"
                        style={
                          m.user?.cardBannerUrl
                            ? {
                                backgroundImage: `linear-gradient(90deg, rgba(10, 10, 15, 0.93) 0%, rgba(10, 10, 15, 0.75) 100%), url(${m.user.cardBannerUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : { backgroundColor: 'rgba(10, 10, 15, 0.4)' }
                        }
                      >
                        <Link href={`/profile/${m.user?.id || ''}`} className="flex items-center gap-2.5 group">
                          <Avatar
                            src={m.user?.avatarUrl}
                            alt={m.user?.username || 'Игрок'}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-sm font-bold text-white group-hover:text-neon-blue transition-colors">
                            {m.user?.username || 'Игрок'}
                          </span>
                        </Link>
                        <Badge variant={statusVariants[m.status]}>{statusLabels[m.status]}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isOrganizer && isTournamentActive && team2.members.length > 0 && !isTeam1Winner && !isTeam2Winner && onDeclareWinnerTeamSlot && (
                <button
                  onClick={() => onDeclareWinnerTeamSlot(2)}
                  className="w-full py-2 text-xs font-orbitron font-extrabold uppercase bg-neon-gold hover:shadow-[0_0_10px_rgba(212,175,55,0.3)] text-arena-dark rounded-lg transition-all"
                >
                  🏆 Объявить победу Команды Б
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Otherwise multi_team layout
    const isAnyTeamWinner = Object.values(teamSlots).some((slot) => getSlotWinnerStatus(slot.members));

    return (
      <div className="space-y-4">
        <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <span>👥 Команды турнира (Multi-Team)</span>
          <span className="text-xs text-gray-400 font-normal">({Object.keys(teamSlots).length} команд зарегистрировано)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(teamSlots).map(([slotNumStr, slotData]) => {
            const slotNum = Number(slotNumStr);
            const isSlotWinner = getSlotWinnerStatus(slotData.members);

            return (
              <div
                key={slotNum}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                  isSlotWinner
                    ? 'border-neon-gold bg-neon-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.05)]'
                    : 'border-arena-border bg-arena-card/30'
                }`}
              >
                <div>
                  <h4 className="font-orbitron font-extrabold text-white text-sm mb-3 flex items-center justify-between border-b border-arena-border pb-2 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 truncate">
                      {isSlotWinner && <Crown className="w-4.5 h-4.5 text-neon-gold shrink-0" />}
                      <span className="truncate">{slotData.label}</span>
                    </span>
                    <span className="text-[10px] text-neon-blue shrink-0 font-bold">СЛОТ #{slotNum}</span>
                  </h4>

                  <div className="space-y-2">
                    {slotData.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-arena-border/30"
                        style={
                          m.user?.cardBannerUrl
                            ? {
                                backgroundImage: `linear-gradient(90deg, rgba(10, 10, 15, 0.93) 0%, rgba(10, 10, 15, 0.75) 100%), url(${m.user.cardBannerUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : { backgroundColor: 'rgba(10, 10, 15, 0.4)' }
                        }
                      >
                        <Link href={`/profile/${m.user?.id || ''}`} className="flex items-center gap-2.5 group min-w-0">
                          <Avatar
                            src={m.user?.avatarUrl}
                            alt={m.user?.username || 'Игрок'}
                            className="w-7 h-7 rounded-full shrink-0"
                          />
                          <span className="text-xs font-bold text-white group-hover:text-neon-blue transition-colors truncate">
                            {m.user?.username || 'Игрок'}
                          </span>
                        </Link>
                        <Badge variant={statusVariants[m.status]}>{statusLabels[m.status]}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {isOrganizer && isTournamentActive && slotData.members.length > 0 && !isAnyTeamWinner && onDeclareWinnerTeamSlot && (
                  <button
                    onClick={() => onDeclareWinnerTeamSlot(slotNum)}
                    className="w-full py-1.5 text-[10px] font-orbitron font-extrabold uppercase bg-neon-gold hover:shadow-[0_0_10px_rgba(212,175,55,0.3)] text-arena-dark rounded-lg transition-all"
                  >
                    🏆 Объявить победителем
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // FFA / Solo Mode Layout
  return (
    <div className="space-y-4">
      <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
        <span>👥 Участники турнира</span>
        <span className="text-xs text-gray-400 font-normal">({participants.length} зарегистрировано)</span>
      </h3>

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
              style={
                p.user?.cardBannerUrl
                  ? {
                      backgroundImage: `linear-gradient(90deg, rgba(20, 20, 30, 0.93) 0%, rgba(20, 20, 30, 0.75) 100%), url(${p.user.cardBannerUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {/* Left Side: Avatar, Username, Team */}
              <div className="flex items-center gap-3">
                <Link href={`/profile/${p.user?.id || ''}`} className="w-9 h-9 rounded-full border border-arena-border bg-arena-dark flex items-center justify-center relative hover:border-neon-blue transition-colors">
                  <Avatar
                    src={p.user?.avatarUrl}
                    alt={p.user?.username || 'User'}
                    className="w-9 h-9 rounded-full"
                  />
                  {isWinner && (
                    <Crown className="w-4 h-4 text-neon-gold absolute -top-2 -right-1 rotate-12" />
                  )}
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${p.user?.id || ''}`} className="text-sm font-bold text-white hover:text-neon-blue transition-colors">
                      {p.user?.username || 'Пользователь'}
                    </Link>
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
    </div>
  );
}
