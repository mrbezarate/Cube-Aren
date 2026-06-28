'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let newTimeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          isExpired: false,
        };
      }

      setTimeLeft(newTimeLeft);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="font-orbitron text-neon-red font-bold text-center tracking-wider text-xl animate-pulse">
        ● ТУРНИР НАЧАЛСЯ
      </div>
    );
  }

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="flex justify-center items-center gap-3 select-none">
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 glass-panel border border-neon-purple/30 rounded-lg flex items-center justify-center font-orbitron font-bold text-2xl text-neon-purple shadow-neon-purple">
          {formatNumber(timeLeft.days)}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-semibold font-orbitron">Дней</span>
      </div>
      
      <span className="font-orbitron font-bold text-2xl text-neon-purple animate-pulse">:</span>

      <div className="flex flex-col items-center">
        <div className="w-14 h-14 glass-panel border border-neon-purple/30 rounded-lg flex items-center justify-center font-orbitron font-bold text-2xl text-white">
          {formatNumber(timeLeft.hours)}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-semibold font-orbitron">Часов</span>
      </div>

      <span className="font-orbitron font-bold text-2xl text-white animate-pulse">:</span>

      <div className="flex flex-col items-center">
        <div className="w-14 h-14 glass-panel border border-neon-purple/30 rounded-lg flex items-center justify-center font-orbitron font-bold text-2xl text-white">
          {formatNumber(timeLeft.minutes)}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-semibold font-orbitron">Мин</span>
      </div>

      <span className="font-orbitron font-bold text-2xl text-white animate-pulse">:</span>

      <div className="flex flex-col items-center">
        <div className="w-14 h-14 glass-panel border border-neon-purple/30 rounded-lg flex items-center justify-center font-orbitron font-bold text-2xl text-neon-blue shadow-neon-blue">
          {formatNumber(timeLeft.seconds)}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-semibold font-orbitron">Сек</span>
      </div>
    </div>
  );
}
