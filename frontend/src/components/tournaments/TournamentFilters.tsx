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
  { id: 'solo', name: 'Одиночный' },
  { id: 'team', name: 'Командный' },
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
    <div className="bg-bg-secondary border border-white/[0.06] p-5 rounded-xl space-y-5">
      {/* Favorites toggle — only if user has favorites */}
      {favoriteGames.length > 0 && (
        <div className="space-y-3">
          <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
            Мои игры
          </label>

          {/* Show all toggle */}
          <button
            onClick={toggleShowAll}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-sm ${
              filters.showAll
                ? 'border-white/[0.1] bg-bg-tertiary text-text-secondary'
                : 'border-accent-warning/30 bg-accent-warning/5 text-accent-warning'
            }`}
          >
            <span className="flex items-center gap-2">
              <Star className={`w-4 h-4 ${filters.showAll ? 'text-text-tertiary' : 'fill-accent-warning text-accent-warning'}`} />
              {filters.showAll ? 'Показать избранные' : 'Избранные первыми'}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              filters.showAll ? 'bg-bg-elevated text-text-tertiary' : 'bg-accent-warning/20 text-accent-warning'
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
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                      filters.game === gId
                        ? 'border-accent-warning bg-accent-warning/15 text-accent-warning'
                        : 'border-white/[0.06] bg-bg-tertiary text-text-secondary hover:border-white/[0.1]'
                    }`}
                  >
                    <span>{game.icon}</span> {game.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t border-white/[0.06] pt-4" />
        </div>
      )}

      {/* Search Input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Поиск</label>
        <div className="relative">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleInputChange}
            placeholder="Название турнира..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-tertiary border border-white/[0.06] text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:border-white/[0.1] transition-colors"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-text-tertiary" />
        </div>
      </div>

      {/* Game Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
          Дисциплина
        </label>
        <div className="flex flex-wrap gap-1.5">
          {/* All games button */}
          <button
            onClick={() => onChange({ ...filters, game: '' })}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${ 
              !filters.game
                ? 'border-accent-primary bg-accent-primary/15 text-white'
                : 'border-white/[0.06] bg-bg-tertiary text-text-secondary hover:border-white/[0.1]'
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
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                  filters.game === g.id
                    ? 'border-accent-primary bg-accent-primary/15 text-white'
                    : isFav
                    ? 'border-accent-warning/30 bg-bg-tertiary text-text-secondary hover:border-accent-warning/50'
                    : 'border-white/[0.06] bg-bg-tertiary text-text-secondary hover:border-white/[0.1]'
                }`}
              >
                {isFav && <Star className="w-3 h-3 fill-accent-warning text-accent-warning" />}
                {g.icon} {g.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Format, Type & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Формат</label>
          <select
            name="format"
            value={filters.format}
            onChange={handleInputChange}
            aria-label="Формат турнира"
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-white/[0.06] text-sm text-white focus:outline-none focus:border-white/[0.1] transition-colors"
          >
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id} className="bg-bg-secondary text-white">
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Тип</label>
          <select
            name="tournamentType"
            value={filters.tournamentType}
            onChange={handleInputChange}
            aria-label="Тип турнира"
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-white/[0.06] text-sm text-white focus:outline-none focus:border-white/[0.1] transition-colors"
          >
            {TOURNAMENT_TYPES.map((t) => (
              <option key={t.id} value={t.id} className="bg-bg-secondary text-white">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Статус</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleInputChange}
            aria-label="Статус турнира"
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-white/[0.06] text-sm text-white focus:outline-none focus:border-white/[0.1] transition-colors"
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id} className="bg-bg-secondary text-white">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Сортировка</label>
        <div className="flex gap-2">
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleInputChange}
            aria-label="Поле сортировки"
            className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-white/[0.06] text-sm text-white focus:outline-none focus:border-white/[0.1] transition-colors"
          >
            <option value="createdAt" className="bg-bg-secondary text-white">Дата создания</option>
            <option value="prizePool" className="bg-bg-secondary text-white">Призовой фонд</option>
            <option value="startDate" className="bg-bg-secondary text-white">Дата начала</option>
            <option value="entryFee" className="bg-bg-secondary text-white">Стоимость входа</option>
          </select>
          <button
            onClick={toggleSortOrder}
            className="px-3 py-2 rounded-lg border border-white/[0.06] bg-bg-tertiary hover:bg-bg-elevated text-sm text-white transition-colors"
            title={filters.sortOrder === 'ASC' ? 'По возрастанию' : 'По убыванию'}
          >
            {filters.sortOrder === 'ASC' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-white/[0.06] hover:border-white/[0.15] hover:bg-bg-tertiary rounded-lg text-sm text-text-secondary hover:text-white transition-colors"
      >
        <RotateCcw className="w-4 h-4" /> Сбросить фильтры
      </button>
    </div>
  );
}
