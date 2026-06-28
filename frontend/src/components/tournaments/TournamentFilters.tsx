'use client';

import React from 'react';
import { Search, RotateCcw, Star } from 'lucide-react';

interface FiltersState {
  game: string;
  format: string;
  tournamentType: string;
  status: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  search: string;
  showAll: boolean;
}

interface TournamentFiltersProps {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
  favoriteGames?: string[];
}

const GAMES = [
  { id: 'cs2', name: 'CS 2', icon: '🔫' },
  { id: 'dota2', name: 'Dota 2', icon: '⚔️' },
  { id: 'valorant', name: 'Valorant', icon: '🎯' },
  { id: 'lol', name: 'LoL', icon: '🔮' },
  { id: 'pubg', name: 'PUBG', icon: '🪂' },
  { id: 'apex', name: 'Apex', icon: '⚡' },
  { id: 'custom', name: 'Custom', icon: '🎮' },
];

const FORMATS = [
  { id: '', name: 'Все форматы' },
  { id: '1v1', name: '1 на 1' },
  { id: '5v5', name: '5 на 5' },
  { id: 'battle_royale', name: 'Королевская битва' },
  { id: 'custom', name: 'Кастомный' },
];

const TOURNAMENT_TYPES = [
  { id: '', name: 'Все типы' },
  { id: 'solo', name: '👤 Одиночный' },
  { id: 'team', name: '👥 Клановый' },
];

const STATUSES = [
  { id: '', name: 'Все статусы' },
  { id: 'open', name: 'Открыт' },
  { id: 'in_progress', name: 'В игре' },
  { id: 'completed', name: 'Завершен' },
];

export default function TournamentFilters({
  filters,
  onChange,
  favoriteGames = [],
}: TournamentFiltersProps) {

  const handleSelectGame = (gameId: string) => {
    onChange({ ...filters, game: filters.game === gameId ? '' : gameId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  const toggleSortOrder = () => {
    onChange({ ...filters, sortOrder: filters.sortOrder === 'ASC' ? 'DESC' : 'ASC' });
  };

  const toggleShowAll = () => {
    onChange({ ...filters, showAll: !filters.showAll, game: '' });
  };

  const handleReset = () => {
    onChange({
      game: '',
      format: '',
      tournamentType: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      search: '',
      showAll: false,
    });
  };

  return (
    <div className="glass-panel border border-arena-border p-5 rounded-xl space-y-6">

      {/* Favorites toggle — only if user has favorites */}
      {favoriteGames.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs uppercase font-orbitron font-bold text-gray-400 tracking-wider">
            Мои игры
          </label>

          {/* Show all toggle */}
          <button
            onClick={toggleShowAll}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-xs font-orbitron font-bold uppercase tracking-wider ${
              filters.showAll
                ? 'border-gray-500 bg-white/5 text-gray-300'
                : 'border-neon-gold/50 bg-neon-gold/5 text-neon-gold'
            }`}
          >
            <span className="flex items-center gap-2">
              <Star
                className={`w-3.5 h-3.5 ${filters.showAll ? 'text-gray-500' : 'fill-neon-gold text-neon-gold'}`}
              />
              {filters.showAll ? 'Показать избранные' : 'Избранные первыми'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
              filters.showAll ? 'border-gray-600 text-gray-500' : 'border-neon-gold/40 text-neon-gold/80'
            }`}>
              {filters.showAll ? 'ВЫКЛ' : 'ВКЛ'}
            </span>
          </button>

          {/* Favorite game chips */}
          {!filters.showAll && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {favoriteGames.map((gId) => {
                const game = GAMES.find((g) => g.id === gId);
                if (!game) return null;
                return (
                  <button
                    key={gId}
                    onClick={() => handleSelectGame(gId)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-orbitron text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      filters.game === gId
                        ? 'border-neon-gold bg-neon-gold/15 text-neon-gold shadow-[0_0_8px_rgba(255,215,0,0.3)]'
                        : 'border-neon-gold/30 bg-neon-gold/5 text-neon-gold/70 hover:border-neon-gold/60'
                    }`}
                  >
                    <span>{game.icon}</span> {game.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t border-arena-border pt-4" />
        </div>
      )}

      {/* Search Input */}
      <div className="space-y-2">
        <label className="text-xs uppercase font-orbitron font-bold text-gray-400 tracking-wider">Поиск</label>
        <div className="relative">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleInputChange}
            placeholder="Название турнира..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-sm"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Game Selection */}
      <div className="space-y-2">
        <label className="text-xs uppercase font-orbitron font-bold text-gray-400 tracking-wider">
          Дисциплина
        </label>
        <div className="flex flex-wrap gap-1.5">
          {/* All games button */}
          <button
            onClick={() => onChange({ ...filters, game: '' })}
            className={`px-3 py-1.5 rounded-md font-orbitron text-[10px] font-bold uppercase tracking-wider transition-all border ${
              !filters.game
                ? 'border-neon-purple bg-neon-purple/15 text-white'
                : 'border-arena-border bg-arena-dark/40 text-gray-400 hover:border-gray-600'
            }`}
          >
            Все
          </button>
          {GAMES.map((g) => {
            const isFav = favoriteGames.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => handleSelectGame(g.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-orbitron text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  filters.game === g.id
                    ? 'border-neon-purple bg-neon-purple/15 text-white'
                    : isFav
                    ? 'border-neon-gold/30 bg-arena-dark/40 text-gray-300 hover:border-neon-gold/60'
                    : 'border-arena-border bg-arena-dark/40 text-gray-400 hover:border-gray-600'
                }`}
              >
                {isFav && <Star className="w-2.5 h-2.5 fill-neon-gold text-neon-gold" />}
                {g.icon} {g.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Format, Type & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs uppercase font-orbitron font-bold text-gray-400 tracking-wider">Формат</label>
          <select
            name="format"
            value={filters.format}
            onChange={handleInputChange}
            aria-label="Формат турнира"
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
          <label className="text-xs uppercase font-orbitron font-bold text-gray-400 tracking-wider">Тип</label>
          <select
            name="tournamentType"
            value={filters.tournamentType}
            onChange={handleInputChange}
            aria-label="Тип турнира"
            className="w-full px-3 py-2 rounded-lg glass-input text-xs"
          >
            {TOURNAMENT_TYPES.map((t) => (
              <option key={t.id} value={t.id} className="bg-arena-card text-white">
                {t.name}
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
            aria-label="Статус турнира"
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

      {/* Sort */}
      <div className="space-y-1.5">
        <label className="text-xs uppercase font-orbitron font-bold text-gray-400 tracking-wider">Сортировка</label>
        <div className="flex gap-2">
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleInputChange}
            aria-label="Поле сортировки"
            className="flex-1 px-3 py-2 rounded-lg glass-input text-xs"
          >
            <option value="createdAt" className="bg-arena-card text-white">Дата создания</option>
            <option value="prizePool" className="bg-arena-card text-white">Призовой фонд</option>
            <option value="startDate" className="bg-arena-card text-white">Дата начала</option>
            <option value="entryFee" className="bg-arena-card text-white">Стоимость входа</option>
          </select>
          <button
            onClick={toggleSortOrder}
            className="px-3 py-2 rounded-lg border border-arena-border bg-arena-dark/40 hover:bg-arena-card text-xs text-white transition-colors"
            title={filters.sortOrder === 'ASC' ? 'По возрастанию' : 'По убыванию'}
          >
            {filters.sortOrder === 'ASC' ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-arena-border hover:border-gray-500 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Сбросить фильтры
      </button>
    </div>
  );
}
