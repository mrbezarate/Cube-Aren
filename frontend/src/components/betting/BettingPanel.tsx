'use client';

import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Participant, OddsData } from '@/types';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { Coins, Swords, Target, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface BettingPanelProps {
  tournamentId: string;
  participants: Participant[];
  odds: OddsData[];
  onBetPlaced: () => void;
  gameMode?: string;
  teamsCount?: number;
}

const QUICK_AMOUNTS = [100, 300, 500, 1000];

const TEAM_COLORS = [
  { bg: '#a855f7', glow: '#a855f730', letter: 'A' },
  { bg: '#22d3ee', glow: '#22d3ee30', letter: 'B' },
  { bg: '#f97316', glow: '#f9731630', letter: 'C' },
  { bg: '#22c55e', glow: '#22c55e30', letter: 'D' },
  { bg: '#f43f5e', glow: '#f43f5e30', letter: 'E' },
  { bg: '#eab308', glow: '#eab30830', letter: 'F' },
];

export default function BettingPanel({
  tournamentId,
  participants,
  odds,
  onBetPlaced,
  gameMode = 'ffa',
  teamsCount,
}: BettingPanelProps) {
  const { user, refreshUser } = useAuthStore();
  const router = useRouter();
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  // FFA: selected participant id
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');

  // Team mode: selected team slot
  const [selectedTeamSlot, setSelectedTeamSlot] = useState<number | null>(null);

  const isTeamMode = gameMode === 'two_team' || gameMode === 'multi_team';

  // Group participants by team slot for team modes
  const teamGroups = useMemo(() => {
    if (!isTeamMode) return {};
    const groups: Record<number, Participant[]> = {};
    const count = teamsCount ?? (gameMode === 'two_team' ? 2 : 3);
    for (let i = 1; i <= count; i++) groups[i] = [];
    for (const p of participants) {
      if (p.teamSlot != null) {
        if (!groups[p.teamSlot]) groups[p.teamSlot] = [];
        groups[p.teamSlot].push(p);
      }
    }
    return groups;
  }, [participants, isTeamMode, teamsCount, gameMode]);

  const getTeamLabel = (slot: number) => {
    const members = teamGroups[slot] ?? [];
    const captain = members.find((m) => m.isTeamCaptain);
    return captain?.teamLabel ?? `Команда ${TEAM_COLORS[slot - 1]?.letter ?? slot}`;
  };

  // For FFA: find odds by participant id
  const selectedParticipantOdds = odds.find((o) => o.participantId === selectedWinnerId);
  const currentOdds = selectedParticipantOdds ? selectedParticipantOdds.odds : 1.0;

  // For team: use flat odds 1/(number of teams) as base
  const teamOddsValue = teamsCount ? (teamsCount / 1).toFixed(2) : '2.00';

  const potentialPayout = Math.round(
    amount * (isTeamMode ? parseFloat(teamOddsValue) : currentOdds) * 100
  ) / 100;

  const hasSelection = isTeamMode ? selectedTeamSlot != null : !!selectedWinnerId;

  const handlePlaceBet = async () => {
    if (!hasSelection) {
      toast.error(isTeamMode ? 'Выберите команду для ставки' : 'Выберите участника');
      return;
    }
    if (amount <= 0) {
      toast.error('Сумма ставки должна быть больше 0');
      return;
    }
    if (user && Number(user.credits) < amount) {
      toast.error('Недостаточно кредитов на балансе');
      return;
    }

    setLoading(true);
    try {
      if (isTeamMode) {
        await api.bets.place({
          tournamentId,
          predictedTeamSlot: selectedTeamSlot ?? undefined,
          amount,
        });
      } else {
        await api.bets.place({
          tournamentId,
          predictedWinnerId: selectedWinnerId,
          amount,
        });
      }
      await refreshUser();
      toast.success('Ставка успешно размещена!');
      setSelectedWinnerId('');
      setSelectedTeamSlot(null);
      onBetPlaced();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка при размещении ставки');
    } finally {
      setLoading(false);
    }
  };

  const minParticipants = isTeamMode ? 2 : 2;
  const hasEnoughParticipants = isTeamMode
    ? Object.keys(teamGroups).filter((k) => (teamGroups[Number(k)]?.length ?? 0) > 0).length >= 2
    : participants.length >= 2;

  return (
    <div className="glass-panel border border-arena-border p-5 rounded-xl space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-arena-border">
        <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <span>🎲 Сделать ставку</span>
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase font-orbitron">
          <span>Комиссия: 10%</span>
        </div>
      </div>

      {!hasEnoughParticipants ? (
        <div className="text-center py-6 text-xs text-gray-500">
          {isTeamMode
            ? 'Дождитесь регистрации минимум 2 команд для ставок.'
            : 'Для ставок необходимо минимум 2 зарегистрированных участника.'}
        </div>
      ) : (
        <div className="space-y-4">

          {/* ======= FFA: list of participants ======= */}
          {!isTeamMode && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-orbitron font-bold text-gray-400 tracking-wider">
                Выберите победителя
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
                {participants.map((p) => {
                  const oddInfo = odds.find((o) => o.participantId === p.id);
                  const isSelected = selectedWinnerId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedWinnerId(p.id)}
                      className={`p-3 rounded-lg border text-left flex justify-between items-center transition-all ${
                        isSelected
                          ? 'border-neon-purple bg-neon-purple/10 text-white'
                          : 'border-arena-border bg-arena-dark/40 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/profile/${p.user?.id || ''}`);
                          }}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          title="Профиль игрока"
                        >
                          <Avatar
                            src={p.user?.avatarUrl}
                            alt={p.user?.username || '?'}
                            className="w-6 h-6 rounded-full"
                          />
                        </div>
                        <span className="text-xs font-bold">{p.user?.username}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-orbitron font-bold text-sm text-neon-gold">
                          ×{oddInfo ? oddInfo.odds.toFixed(2) : '1.00'}
                        </div>
                        <div className="text-[8px] text-gray-500 font-orbitron uppercase">Коэф.</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======= TEAM MODE: big team buttons ======= */}
          {isTeamMode && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-orbitron font-bold text-gray-400 tracking-wider flex items-center gap-1">
                {gameMode === 'two_team' ? <Swords className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                Выберите команду
              </label>
              <div className={`grid gap-2 ${gameMode === 'two_team' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {Object.entries(teamGroups).map(([slotStr, members]) => {
                  const slot = Number(slotStr);
                  const color = TEAM_COLORS[slot - 1] ?? TEAM_COLORS[0];
                  const label = getTeamLabel(slot);
                  const isSelected = selectedTeamSlot === slot;
                  const isEmpty = members.length === 0;

                  return (
                    <motion.button
                      key={slot}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => !isEmpty && setSelectedTeamSlot(slot)}
                      disabled={isEmpty}
                      className="p-4 rounded-xl border-2 text-center space-y-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        borderColor: isSelected ? color.bg : isEmpty ? '#1f2937' : `${color.bg}40`,
                        background: isSelected ? color.glow : 'rgba(255,255,255,0.02)',
                        boxShadow: isSelected ? `0 0 24px ${color.glow}` : 'none',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-base font-orbitron font-black mx-auto"
                        style={{ background: color.bg, opacity: isEmpty ? 0.4 : 1 }}
                      >
                        {color.letter}
                      </div>
                      <div
                        className="text-xs font-orbitron font-bold truncate"
                        style={{ color: isSelected ? color.bg : '#9ca3af' }}
                      >
                        {label}
                      </div>
                      <div className="text-[9px] text-gray-600">{members.length} игроков</div>
                      
                      {!isEmpty && (
                        <div className="flex justify-center gap-1 mt-2.5 flex-wrap">
                          {members.slice(0, 4).map((m) => (
                            <div
                              key={m.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/profile/${m.user?.id || ''}`);
                              }}
                              className="w-5 h-5 rounded-full overflow-hidden border border-white/20 hover:border-white transition-colors cursor-pointer shrink-0"
                              title={m.user?.displayName || m.user?.username}
                            >
                              <Avatar
                                src={m.user?.avatarUrl}
                                alt={m.user?.username || 'User'}
                                className="w-full h-full"
                              />
                            </div>
                          ))}
                          {members.length > 4 && (
                            <span className="text-[8px] text-gray-500 self-center">
                              +{members.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="font-orbitron text-sm font-bold text-neon-gold pt-1">
                        ×{teamOddsValue}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amount input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-orbitron font-bold text-gray-400 tracking-wider">
                Сумма ставки
              </label>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <span>Баланс:</span>
                <span className="text-neon-gold font-bold">
                  {user ? Number(user.credits).toLocaleString() : '0'} CR
                </span>
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                className="w-full pl-10 pr-16 py-2.5 rounded-lg glass-input font-orbitron font-bold text-sm"
              />
              <Coins className="absolute left-3 top-3 w-4 h-4 text-neon-gold" />
              <span className="absolute right-3 top-3 text-[10px] text-gray-400 font-orbitron uppercase font-bold">
                CR
              </span>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-1.5 rounded border text-[10px] font-orbitron font-bold transition-all ${
                    amount === val
                      ? 'border-neon-purple bg-neon-purple/20 text-neon-purple'
                      : 'border-arena-border bg-arena-card text-gray-300 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Payout preview */}
          <AnimatePresence>
            {hasSelection && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3 rounded-lg bg-white/5 border border-arena-border flex justify-between items-center"
              >
                <span className="text-xs text-gray-400">
                  Возможный выигрыш:
                </span>
                <span className="font-orbitron font-extrabold text-sm text-neon-gold neon-text-gold">
                  {potentialPayout.toLocaleString()} CR
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <Button
            onClick={handlePlaceBet}
            loading={loading}
            className="w-full py-3"
            variant="primary"
          >
            СДЕЛАТЬ СТАВКУ
          </Button>
        </div>
      )}
    </div>
  );
}
