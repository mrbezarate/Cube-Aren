'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Shield, Lock, PlusCircle, Swords } from 'lucide-react';
import { Participant } from '@/types';
import Button from '../ui/Button';

interface TeamSlotPickerProps {
  gameMode: 'two_team' | 'multi_team';
  teamsCount: number;      // 2 для two_team, 3+ для multi_team
  teamSize?: number;       // игроков в команде (если задано)
  participants: Participant[];
  currentUserId?: string;
  alreadyJoined: boolean;
  onJoin: (teamSlot: number, teamLabel?: string) => Promise<void>;
  loading?: boolean;
}

const TEAM_COLORS = [
  { bg: '#a855f7', glow: '#a855f730', label: 'Команда A', letter: 'A' },
  { bg: '#22d3ee', glow: '#22d3ee30', label: 'Команда B', letter: 'B' },
  { bg: '#f97316', glow: '#f9731630', label: 'Команда C', letter: 'C' },
  { bg: '#22c55e', glow: '#22c55e30', label: 'Команда D', letter: 'D' },
  { bg: '#f43f5e', glow: '#f43f5e30', label: 'Команда E', letter: 'E' },
  { bg: '#eab308', glow: '#eab30830', label: 'Команда F', letter: 'F' },
  { bg: '#8b5cf6', glow: '#8b5cf630', label: 'Команда G', letter: 'G' },
  { bg: '#06b6d4', glow: '#06b6d430', label: 'Команда H', letter: 'H' },
];

export default function TeamSlotPicker({
  gameMode,
  teamsCount,
  teamSize,
  participants,
  currentUserId,
  alreadyJoined,
  onJoin,
  loading = false,
}: TeamSlotPickerProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);

  // Группируем участников по слотам
  const slotMap: Record<number, Participant[]> = {};
  for (let i = 1; i <= teamsCount; i++) slotMap[i] = [];
  for (const p of participants) {
    if (p.teamSlot != null) {
      if (!slotMap[p.teamSlot]) slotMap[p.teamSlot] = [];
      slotMap[p.teamSlot].push(p);
    }
  }

  const getSlotLabel = (slot: number): string => {
    const members = slotMap[slot] ?? [];
    const captain = members.find((m) => m.isTeamCaptain);
    if (captain?.teamLabel) return captain.teamLabel;
    return TEAM_COLORS[slot - 1]?.label ?? `Команда ${slot}`;
  };

  const isClanSlot = (slot: number) => (slotMap[slot] ?? []).some((m) => m.clanId);
  const isFull = (slot: number) => teamSize != null && (slotMap[slot]?.length ?? 0) >= teamSize;

  const mySlot = participants.find((p) => p.userId === currentUserId)?.teamSlot;
  const isFirstInSlot = (slot: number) => (slotMap[slot]?.length ?? 0) === 0;

  const handleJoinSlot = async (slot: number) => {
    if (alreadyJoined) return;
    if (isFirstInSlot(slot) && !customLabel) {
      setSelectedSlot(slot);
      setShowLabelInput(true);
      return;
    }
    await onJoin(slot, customLabel || undefined);
    setShowLabelInput(false);
    setSelectedSlot(null);
    setCustomLabel('');
  };

  const handleConfirmLabel = async () => {
    if (selectedSlot == null) return;
    await onJoin(selectedSlot, customLabel || undefined);
    setShowLabelInput(false);
    setSelectedSlot(null);
    setCustomLabel('');
  };

  return (
    <div className="space-y-4">
      <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
        <Swords className="w-4 h-4 text-neon-purple" />
        Командные слоты
        {teamsCount && <span className="text-xs text-gray-400 font-normal">({teamsCount} команды)</span>}
      </h3>

      {/* Label input popup */}
      <AnimatePresence>
        {showLabelInput && selectedSlot != null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl border border-neon-purple/40 bg-neon-purple/10 p-4 space-y-3"
          >
            <p className="text-sm text-white font-orbitron font-bold">
              🎖 Ты первый в команде! Придумай название:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded-lg glass-input text-sm"
                placeholder={TEAM_COLORS[selectedSlot - 1]?.label ?? `Команда ${selectedSlot}`}
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                maxLength={40}
                autoFocus
              />
              <Button
                onClick={handleConfirmLabel}
                loading={loading}
                variant="primary"
                className="px-4 py-2 text-sm"
              >
                Войти
              </Button>
              <Button
                onClick={() => {
                  setShowLabelInput(false);
                  setSelectedSlot(null);
                  setCustomLabel('');
                }}
                variant="secondary"
                className="px-4 py-2 text-sm"
              >
                Отмена
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team slots grid */}
      <div className={`grid gap-3 ${gameMode === 'two_team' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {Array.from({ length: teamsCount }, (_, i) => i + 1).map((slot) => {
          const color = TEAM_COLORS[slot - 1] ?? TEAM_COLORS[0];
          const members = slotMap[slot] ?? [];
          const slotLabel = getSlotLabel(slot);
          const full = isFull(slot);
          const hasClan = isClanSlot(slot);
          const isMySlot = mySlot === slot;
          const filledCount = members.length;
          const captain = members.find((m) => m.isTeamCaptain);

          return (
            <motion.div
              key={slot}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: slot * 0.06 }}
              className="rounded-xl border-2 p-4 space-y-3 transition-all duration-200"
              style={{
                borderColor: isMySlot ? color.bg : full ? '#374151' : `${color.bg}40`,
                background: isMySlot ? color.glow : full ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
                boxShadow: isMySlot ? `0 0 24px ${color.glow}` : 'none',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-orbitron font-black"
                    style={{ background: color.bg }}
                  >
                    {color.letter}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none">{slotLabel}</p>
                    {hasClan && (
                      <p className="text-[9px] text-yellow-400 flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> Клан
                      </p>
                    )}
                  </div>
                </div>
                {isMySlot && (
                  <span className="text-[9px] bg-neon-purple/30 text-neon-purple px-2 py-0.5 rounded-full font-bold">
                    Ваша команда
                  </span>
                )}
                {full && !isMySlot && (
                  <Lock className="w-4 h-4 text-gray-600" />
                )}
              </div>

              {/* Progress bar */}
              {teamSize != null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>{filledCount}/{teamSize} игроков</span>
                    {full && <span className="text-red-400">Занято</span>}
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((filledCount / teamSize) * 100, 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: full ? '#ef4444' : color.bg }}
                    />
                  </div>
                </div>
              )}

              {/* Members preview */}
              {members.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {members.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center gap-1" title={m.user?.username}>
                      {m.user?.avatarUrl ? (
                        <img
                          src={m.user.avatarUrl}
                          alt={m.user.username}
                          className="w-5 h-5 rounded-full object-cover border"
                          style={{ borderColor: color.bg }}
                        />
                      ) : (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                          style={{ background: `${color.bg}50` }}
                        >
                          {m.user?.username?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                      {m.isTeamCaptain && (
                        <Crown className="w-2.5 h-2.5" style={{ color: color.bg }} />
                      )}
                    </div>
                  ))}
                  {members.length > 5 && (
                    <span className="text-[10px] text-gray-500 self-center">+{members.length - 5}</span>
                  )}
                </div>
              )}

              {/* Join button */}
              {!alreadyJoined && !full && (
                <button
                  onClick={() => handleJoinSlot(slot)}
                  disabled={loading || hasClan}
                  className="w-full text-center py-2 rounded-lg text-xs font-orbitron font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: hasClan ? 'transparent' : `${color.bg}20`,
                    border: `1px solid ${hasClan ? '#374151' : `${color.bg}60`}`,
                    color: hasClan ? '#6b7280' : color.bg,
                  }}
                  title={hasClan ? 'Слот занят кланом' : undefined}
                >
                  {hasClan ? (
                    <span className="flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" /> Только для клана
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <PlusCircle className="w-3 h-3" />
                      {isFirstInSlot(slot) ? 'Создать команду' : 'Вступить'}
                    </span>
                  )}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
