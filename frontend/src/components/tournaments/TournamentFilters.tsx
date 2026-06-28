'use client';

import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

interface FiltersState {
  game: string;
  format: string;
  status: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  search: string;
}

interface TournamentFiltersProps {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
}

const GAMES = [
  { id: '', name: 'Все игры' },
  { id: 'cs2', name: 'CS 2' },
  { id: 'dota2', name: 'Dota 2' },
  { id: 'valorant', name: 'Valorant' },
  { id: 'lol', name: 'LoL' },
  { id: 'pubg', name: 'PUBG' },
  { id: 'apex', name: 'Apex' },
];

const FORMATS = [
  { id: '', name: 'Все форматы' },
  { id: '1v1', name: '1 на 1' },
  { id: '5v5', name: '5 на 5' },
  { id: 'battle_royale', name: 'Королевская битва' },
  { id: 'custom', name: 'Кастомный' },
];

const STATUSES = [
  { id: '', name: 'Все статусы' },
  { id: 'open', name: 'Открыт' },
  { id: 'in_progress', name: 'В игре' },
  { id: 'completed', name: 'Завершен' },
];

export default function TournamentFilters({ filters, onChange }: TournamentFiltersProps) {
  const handleSelectGame = (gameId: string) => {
    onChange({ ...filters, game: gameId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  const toggleSortOrder = () => {
    onChange({
      ...filters,
      sortOrder: filters.sortOrder === 'ASC' ? 'DESC' : 'ASC',
    });
  };

  const handleReset = () => {
    onChange({
      game: '',
      format: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      search: '',
    });
  };

  return (
    <div className="glass-panel border border-arena-border p-5 rounded-xl space-y-6">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleInputChange}
          placeholder="Поиск по названию..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-sm"
        />
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
      </div>

      {/* Game Selection Pills */}
      <div className="space-y-2">
        <label className="text-xs uppercase font-orbitron font-bold text-gray-400 tracking-wider">Дисциплина</label>
        <div className="flex flex-wrap gap-1.5">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => handleSelectGame(g.id)}
              className={`px-3 py-1.5 rounded-md font-orbitron text-[10px] font-bold uppercase tracking-wider transition-all border ${
                filters.game === g.id
                  ? 'border-neon-purple bg-neon-purple/15 text-white shadow-neon-purple/20'
                  : 'border-arena-border bg-arena-dark/40 text-gray-400 hover:border-gray-600'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Format & Status Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs uppercase font-orbitron font-bold text-gray-400 tracking-wider">Формат</label>
          <select
            name="format"
            value={filters.format}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded-lg glass-input text-xs"
          >
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id} className="bg-arena-card text-white">
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase font-orbitron font-bold text-gray-400 tracking-wider">Статус</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded-lg glass-input text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id} className="bg-arena-card text-white">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort By controls */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs uppercase font-orbitron font-bold text-gray-400 tracking-wider">Сортировка</label>
          <div className="flex gap-2">
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 rounded-lg glass-input text-xs"
            >
              <option value="createdAt" className="bg-arena-card text-white">Дата создания</option>
              <option value="prizePool" className="bg-arena-card text-white">Призовой фонд</option>
              <option value="startDate" className="bg-arena-card text-white">Дата начала</option>
              <option value="entryFee" className="bg-arena-card text-white">Стоимость входа</option>
            </select>
            
            <button
              onClick={toggleSortOrder}
              className="px-3 py-2 rounded-lg border border-arena-border bg-arena-dark/40 hover:bg-arena-card text-xs text-white"
            >
              {filters.sortOrder === 'ASC' ? '▲' : '▼'}
            </button>
          </div>
        </div>
      </div>

      {/* Reset filter button */}
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-arena-border hover:border-gray-500 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Сбросить фильтры
      </button>
    </div>
  );
}
