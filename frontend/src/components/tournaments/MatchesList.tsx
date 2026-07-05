'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Edit2, Check, X, Star } from 'lucide-react';
import MatchBetModal from '../betting/MatchBetModal';

interface Match {
  id: string;
  name: string;
  team1Name: string;
  team2Name: string;
  team1Odds: string | number;
  team2Odds: string | number;
  winnerSide: number | null;
  status: string;
}

interface MatchesListProps {
  tournamentId: string;
  matches: Match[];
  isOrganizer: boolean;
  onRefresh: () => void;
}

export default function MatchesList({
  tournamentId,
  matches,
  isOrganizer,
  onRefresh,
}: MatchesListProps) {
  // Editing state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    team1Name: '',
    team2Name: '',
    team1Odds: 1.85,
    team2Odds: 1.85,
    winnerSide: undefined as number | undefined,
  });

  // Bet Modal state
  const [betModal, setBetModal] = useState({
    isOpen: false,
    matchId: '',
    matchName: '',
    predictedSide: 1,
    teamName: '',
    odds: 1.85,
  });

  const handleStartEdit = (match: Match) => {
    setEditingMatchId(match.id);
    setEditForm({
      team1Name: match.team1Name,
      team2Name: match.team2Name,
      team1Odds: Number(match.team1Odds) || 1.85,
      team2Odds: Number(match.team2Odds) || 1.85,
      winnerSide: match.winnerSide || undefined,
    });
  };

  const handleSaveEdit = async (matchId: string) => {
    try {
      await api.tournaments.updateMatch(tournamentId, matchId, editForm);
      toast.success('Матч успешно обновлен!');
      setEditingMatchId(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка при обновлении матча');
    }
  };

  const handleOpenBet = (match: Match, side: number) => {
    if (match.status === 'completed') {
      toast.error('Этот матч уже завершен');
      return;
    }
    const teamName = side === 1 ? match.team1Name : match.team2Name;
    const odds = side === 1 ? Number(match.team1Odds) : Number(match.team2Odds);

    setBetModal({
      isOpen: true,
      matchId: match.id,
      matchName: match.name,
      predictedSide: side,
      teamName,
      odds,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-arena-border">
        <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <span>🎮 КОЭФФИЦИЕНТЫ И РАУНДЫ</span>
        </h3>
      </div>

      <div className="space-y-2.5">
        {matches.map((match) => {
          const isEditing = editingMatchId === match.id;
          const isCompleted = match.status === 'completed';

          return (
            <div
              key={match.id}
              className={`p-4 rounded-xl border transition-all ${
                isCompleted
                  ? 'border-arena-border bg-arena-dark/20 opacity-70'
                  : 'border-arena-border bg-arena-card/40 hover:border-white/10'
              }`}
            >
              {isEditing ? (
                /* Editing Layout */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-orbitron font-bold text-neon-purple uppercase">{match.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(match.id)}
                        className="p-1.5 rounded-lg bg-neon-green/20 hover:bg-neon-green/35 text-neon-green transition-all"
                        title="Сохранить"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingMatchId(null)}
                        className="p-1.5 rounded-lg bg-neon-red/20 hover:bg-neon-red/35 text-neon-red transition-all"
                        title="Отмена"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400 uppercase font-bold font-orbitron">Команда 1 (Слева)</label>
                      <input
                        type="text"
                        value={editForm.team1Name}
                        onChange={(e) => setEditForm({ ...editForm, team1Name: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded glass-input text-white bg-arena-dark/50 border-arena-border"
                      />
                      <label className="text-[10px] text-gray-400 uppercase font-bold font-orbitron">Коэф. 1</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.team1Odds}
                        onChange={(e) => setEditForm({ ...editForm, team1Odds: parseFloat(e.target.value) || 1.0 })}
                        className="w-full px-3 py-1.5 text-xs rounded glass-input text-white font-orbitron bg-arena-dark/50 border-arena-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400 uppercase font-bold font-orbitron">Команда 2 (Справа)</label>
                      <input
                        type="text"
                        value={editForm.team2Name}
                        onChange={(e) => setEditForm({ ...editForm, team2Name: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded glass-input text-white bg-arena-dark/50 border-arena-border"
                      />
                      <label className="text-[10px] text-gray-400 uppercase font-bold font-orbitron">Коэф. 2</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.team2Odds}
                        onChange={(e) => setEditForm({ ...editForm, team2Odds: parseFloat(e.target.value) || 1.0 })}
                        className="w-full px-3 py-1.5 text-xs rounded glass-input text-white font-orbitron bg-arena-dark/50 border-arena-border"
                      />
                    </div>
                  </div>

                  {!isCompleted && (
                    <div className="space-y-1.5 pt-2 border-t border-arena-border">
                      <label className="text-[10px] text-gray-400 uppercase font-bold font-orbitron">Завершить матч (Укажите победителя):</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, winnerSide: 1 })}
                          className={`flex-1 py-1.5 text-xs rounded font-orbitron font-bold border transition-all ${
                            editForm.winnerSide === 1
                              ? 'border-neon-gold bg-neon-gold/15 text-neon-gold'
                              : 'border-arena-border bg-arena-dark/40 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          Победа Команды 1
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, winnerSide: 2 })}
                          className={`flex-1 py-1.5 text-xs rounded font-orbitron font-bold border transition-all ${
                            editForm.winnerSide === 2
                              ? 'border-neon-gold bg-neon-gold/15 text-neon-gold'
                              : 'border-arena-border bg-arena-dark/40 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          Победа Команды 2
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Display Layout matching image style */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left part: Round indicator & Icon */}
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <Star className={`w-4 h-4 ${isCompleted ? 'text-gray-600' : 'text-neon-gold fill-neon-gold/20'}`} />
                    <span className="text-xs font-orbitron font-bold text-gray-300 uppercase tracking-wider">
                      {match.name}
                    </span>
                  </div>

                  {/* Center part: Teams and Odds Buttons */}
                  <div className="flex-1 flex items-center justify-between gap-4">
                    {/* Team 1 & Odds Button */}
                    <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
                      <span className={`text-xs font-bold truncate ${match.winnerSide === 1 ? 'text-neon-green font-extrabold' : 'text-white'}`}>
                        {match.team1Name}
                      </span>
                      <button
                        onClick={() => handleOpenBet(match, 1)}
                        disabled={isCompleted}
                        className={`px-4 py-2.5 rounded-lg border font-orbitron font-extrabold text-xs min-w-[70px] text-center transition-all ${
                          isCompleted
                            ? match.winnerSide === 1
                              ? 'border-neon-green bg-neon-green/10 text-neon-green cursor-default'
                              : 'border-arena-border bg-arena-dark/10 text-gray-600 cursor-default'
                            : 'border-neon-gold bg-neon-gold/5 hover:bg-neon-gold/20 text-neon-gold hover:scale-105'
                        }`}
                      >
                        {Number(match.team1Odds).toFixed(2)}
                      </button>
                    </div>

                    {/* VS divider */}
                    <span className="text-[10px] font-orbitron font-extrabold text-gray-500 uppercase px-1">
                      VS
                    </span>

                    {/* Odds Button & Team 2 */}
                    <div className="flex-1 flex items-center justify-start gap-3 min-w-0">
                      <button
                        onClick={() => handleOpenBet(match, 2)}
                        disabled={isCompleted}
                        className={`px-4 py-2.5 rounded-lg border font-orbitron font-extrabold text-xs min-w-[70px] text-center transition-all ${
                          isCompleted
                            ? match.winnerSide === 2
                              ? 'border-neon-green bg-neon-green/10 text-neon-green cursor-default'
                              : 'border-arena-border bg-arena-dark/10 text-gray-600 cursor-default'
                            : 'border-neon-gold bg-neon-gold/5 hover:bg-neon-gold/20 text-neon-gold hover:scale-105'
                        }`}
                      >
                        {Number(match.team2Odds).toFixed(2)}
                      </button>
                      <span className={`text-xs font-bold truncate ${match.winnerSide === 2 ? 'text-neon-green font-extrabold' : 'text-white'}`}>
                        {match.team2Name}
                      </span>
                    </div>
                  </div>

                  {/* Right part: Action buttons (Organizer Edit) */}
                  {isOrganizer && (
                    <div className="flex justify-end items-center sm:pl-2">
                      <button
                        onClick={() => handleStartEdit(match)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        title="Редактировать матч"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Placing Bet Modal */}
      {betModal.isOpen && (
        <MatchBetModal
          isOpen={betModal.isOpen}
          onClose={() => setBetModal({ ...betModal, isOpen: false })}
          tournamentId={tournamentId}
          matchId={betModal.matchId}
          matchName={betModal.matchName}
          predictedSide={betModal.predictedSide}
          teamName={betModal.teamName}
          odds={betModal.odds}
          onBetPlaced={onRefresh}
        />
      )}
    </div>
  );
}
