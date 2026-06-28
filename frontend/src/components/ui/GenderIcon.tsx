'use client';

import React from 'react';

interface GenderIconProps {
  gender?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const genderMap = {
  male: {
    icon: '♂',
    label: 'Мужской',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  female: {
    icon: '♀',
    label: 'Женский',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  other: {
    icon: '?',
    label: 'Другое',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
  },
};

const sizeMap = {
  sm: { text: 'text-lg', padding: 'p-1' },
  md: { text: 'text-2xl', padding: 'p-2' },
  lg: { text: 'text-4xl', padding: 'p-3' },
};

export default function GenderIcon({
  gender = 'other',
  size = 'md',
  showLabel = false,
}: GenderIconProps) {
  const genderData = genderMap[gender as keyof typeof genderMap] || genderMap.other;
  const sizeData = sizeMap[size];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          ${sizeData.padding}
          rounded-full
          ${genderData.bgColor}
          flex items-center justify-center
          border border-current
          ${genderData.color}
        `}
      >
        <span className={`font-bold ${sizeData.text} ${genderData.color}`}>
          {genderData.icon}
        </span>
      </div>
      {showLabel && (
        <span className="text-sm text-gray-400 font-orbitron">
          {genderData.label}
        </span>
      )}
    </div>
  );
}
