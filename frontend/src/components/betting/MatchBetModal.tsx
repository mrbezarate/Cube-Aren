'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Coins, X } from 'lucide-react';
import Button from '../ui/Button';

interface MatchBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  matchId: string;
  matchName: string;
  predictedSide: number;
  teamName: string;
  odds: number;
  onBetPlaced: () => void;
}

export default function MatchBetModal({
  isOpen,
  onClose,
  tournamentId,
  matchId,
  matchName,
  predictedSide,
  teamName,
  odds,
  onBetPlaced,
}: MatchBetModalProps) {
  const { user, refreshUser } = useAuthStore();
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const oddsNum = Number(odds) || 1.0;
  const potentialPayout = Math.round(amount * oddsNum * 100) / 100;

  const handlePlaceBet = async () => {
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
        matchId,
        predictedSide,
        amount,
      });
      await refreshUser();
      toast.success('Ставка на матч успешно размещена!');
      onBetPlaced();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка при размещении ставки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md glass-panel border border-arena-border rounded-xl p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-arena-border">
          <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider">
            🎲 Ставка на {matchName}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Team & Odds */}
        <div className="p-4 rounded-xl bg-arena-card/60 border border-arena-border flex justify-between items-center">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-orbitron font-bold tracking-wider">Ваш выбор</div>
            <div className="text-white font-bold text-base mt-0.5">{teamName}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase font-orbitron font-bold tracking-wider">Коэффициент</div>
            <div className="text-neon-gold font-orbitron font-extrabold text-xl mt-0.5">x{oddsNum.toFixed(2)}</div>
          </div>
        </div>

        {/* Amount Input */}
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
              className="w-full pl-10 pr-16 py-3 rounded-lg glass-input font-orbitron font-bold text-sm bg-arena-dark/50 border-arena-border text-white focus:outline-none"
              min="1"
            />
            <Coins className="absolute left-3 top-3.5 w-4 h-4 text-neon-gold" />
            <span className="absolute right-3 top-3.5 text-[10px] text-gray-400 font-orbitron uppercase font-bold">CREDITS</span>
          </div>

          {/* Quick select buttons */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[100, 300, 500, 1000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                className={`py-2 rounded-lg border font-orbitron font-bold text-xs transition-all ${
                  amount === val
                    ? 'border-neon-purple bg-neon-purple/20 text-white shadow-neon-purple/10'
                    : 'border-arena-border bg-arena-dark/40 hover:border-gray-500 text-gray-300 hover:text-white'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Payout calculation */}
        <div className="p-3 rounded-lg bg-white/5 border border-arena-border flex justify-between items-center text-xs">
          <span className="text-gray-400">Возможный выигрыш:</span>
          <span className="font-orbitron font-extrabold text-sm text-neon-gold neon-text-gold">
            {potentialPayout.toLocaleString()} CR
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button onClick={onClose} variant="outline" className="flex-1 py-3">
            ОТМЕНА
          </Button>
          <Button onClick={handlePlaceBet} loading={loading} variant="primary" className="flex-1 py-3">
            ПОДТВЕРДИТЬ
          </Button>
        </div>

      </div>
    </div>
  );
}
