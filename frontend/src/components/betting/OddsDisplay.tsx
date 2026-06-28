'use client';

import React from 'react';
import { OddsData } from '@/types';
import { Coins, Flame } from 'lucide-react';

interface OddsDisplayProps {
  odds: OddsData[];
}

export default function OddsDisplay({ odds }: OddsDisplayProps) {
  const totalPool = odds.reduce((sum, o) => sum + Number(o.totalBets), 0);

  return (
    <div className="glass-panel border border-arena-border p-5 rounded-xl space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-arena-border">
        <h4 className="font-orbitron font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-neon-gold" />
          <span>Коэффициенты ставок</span>
        </h4>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold font-orbitron">
          <span>ПУЛ:</span>
          <span className="text-neon-gold">{totalPool.toLocaleString()} CR</span>
        </div>
      </div>

      {odds.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-500">
          Коэффициенты будут рассчитаны после регистрации участников.
        </div>
      ) : (
        <div className="space-y-3">
          {odds.map((item) => {
            const share = totalPool > 0 ? (item.totalBets / totalPool) * 100 : 0;
            
            return (
              <div key={item.participantId} className="space-y-1">
                {/* Info Header */}
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white block leading-tight">{item.username}</span>
                    {item.teamName && <span className="text-[9px] text-neon-blue uppercase">{item.teamName}</span>}
                  </div>

                  <div className="text-right">
                    <span className="font-orbitron font-extrabold text-sm text-neon-gold">
                      x{item.odds.toFixed(2)}
                    </span>
                    <span className="text-[8px] text-gray-500 font-orbitron uppercase block">Коэф.</span>
                  </div>
                </div>

                {/* Proportion bar */}
                <div className="relative">
                  <div className="h-2 w-full bg-arena-dark rounded-full overflow-hidden border border-arena-border">
                    <div
                      className="h-full bg-gradient-to-r from-neon-purple to-neon-blue transition-all duration-300"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-gray-400 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Coins className="w-2.5 h-2.5 text-neon-gold" />
                      {item.totalBets.toLocaleString()} CR
                    </span>
                    <span>{Math.round(share)}% пула</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
