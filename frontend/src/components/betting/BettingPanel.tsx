'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Participant, OddsData } from '@/types';
import Button from '../ui/Button';
import { Coins, HelpCircle } from 'lucide-react';

interface BettingPanelProps {
  tournamentId: string;
  participants: Participant[];
  odds: OddsData[];
  onBetPlaced: () => void;
}

export default function BettingPanel({
  tournamentId,
  participants,
  odds,
  onBetPlaced,
}: BettingPanelProps) {
  const { user, refreshUser } = useAuthStore();
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [amount, setAmount] = useState<number>(50);
  const [loading, setLoading] = useState(false);

  const activeOdds = odds.find((o) => o.participantId === selectedWinnerId);
  const currentOdds = activeOdds ? activeOdds.odds : 1.0;
  const potentialPayout = Math.round(amount * currentOdds * 100) / 100;

  const handleQuickAdd = (value: number) => {
    setAmount((prev) => Math.max(1, prev + value));
  };

  const handleMax = () => {
    if (user) {
      setAmount(Math.floor(Number(user.credits)));
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedWinnerId) {
      toast.error('Выберите предполагаемого победителя');
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
      await api.bets.place({
        tournamentId,
        predictedWinnerId: selectedWinnerId,
        amount,
      });
      await refreshUser();
      toast.success('Ставка успешно размещена!');
      setSelectedWinnerId('');
      onBetPlaced();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка при размещении ставки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel border border-arena-border p-5 rounded-xl space-y-5">
      <div className="flex justify-between items-center pb-3 border-b border-arena-border">
        <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <span>🎲 Разместить ставку</span>
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase font-orbitron">
          <span>Комиссия: 10%</span>
        </div>
      </div>

      {participants.length < 2 ? (
        <div className="text-center py-6 text-xs text-gray-500">
          Для ставок необходимо минимум 2 зарегистрированных участника.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select Winner Grid */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-orbitron font-bold text-gray-400 tracking-wider">
              Выберите победителя
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
              {participants.map((p) => {
                const oddInfo = odds.find((o) => o.participantId === p.id);
                const isSelected = selectedWinnerId === p.id;
                
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedWinnerId(p.id)}
                    className={`p-3 rounded-lg border text-left flex justify-between items-center transition-all ${
                      isSelected
                        ? 'border-neon-purple bg-neon-purple/10 text-white shadow-neon-purple/20'
                        : 'border-arena-border bg-arena-dark/40 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{p.user.username}</div>
                      {p.teamName && <div className="text-[9px] text-neon-blue uppercase">{p.teamName}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-orbitron font-bold text-sm text-neon-gold">
                        x{oddInfo ? oddInfo.odds.toFixed(2) : '1.00'}
                      </div>
                      <div className="text-[8px] text-gray-500 font-orbitron uppercase">Коэф.</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-orbitron font-bold text-gray-400 tracking-wider">
                Сумма ставки
              </label>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <span>Баланс:</span>
                <span className="text-neon-gold font-bold">{user ? Number(user.credits).toLocaleString() : '0'} CR</span>
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
              <span className="absolute right-3 top-3 text-[10px] text-gray-400 font-orbitron uppercase font-bold">CREDITS</span>
            </div>

            {/* Quick adjust buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {['+50', '+100', '+500'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(parseInt(val))}
                  className="py-1.5 rounded border border-arena-border bg-arena-card text-[10px] font-orbitron font-bold hover:border-gray-500 text-gray-300 hover:text-white transition-all"
                >
                  {val}
                </button>
              ))}
              <button
                key="max"
                type="button"
                onClick={handleMax}
                className="py-1.5 rounded border border-neon-gold bg-neon-gold/10 text-[10px] font-orbitron font-bold text-neon-gold hover:bg-neon-gold/25 transition-all"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Payout calculation */}
          {selectedWinnerId && (
            <div className="p-3 rounded-lg bg-white/5 border border-arena-border flex justify-between items-center">
              <span className="text-xs text-gray-400">Возможный выигрыш:</span>
              <span className="font-orbitron font-extrabold text-sm text-neon-gold neon-text-gold">
                {potentialPayout.toLocaleString()} CR
              </span>
            </div>
          )}

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
