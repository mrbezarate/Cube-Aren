import React from 'react';
import { Search, RotateCcw, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

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

export default function TournamentFilters({
  filters,
  onChange,
  favoriteGames = [],
}: TournamentFiltersProps) {
  const { t } = useTranslation();

  const formatsList = [
    { id: '', name: t('format_all') },
    { id: '1v1', name: t('format_1v1') },
    { id: '5v5', name: t('format_5v5') },
    { id: 'battle_royale', name: t('format_battle_royale') },
    { id: 'custom', name: t('format_custom') },
  ];

  const typesList = [
    { id: '', name: t('type_all') },
    { id: 'solo', name: t('type_solo') },
    { id: 'team', name: t('type_team') },
  ];

  const statusesList = [
    { id: '', name: t('status_all') },
    { id: 'open', name: t('status_open') },
    { id: 'in_progress', name: t('status_in_progress') },
    { id: 'completed', name: t('status_completed') },
  ];

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
            {t('filter_my_games')}
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
              {filters.showAll ? t('filter_show_favorites') : t('filter_favorites_first')}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              filters.showAll ? 'bg-bg-elevated text-text-tertiary' : 'bg-accent-warning/20 text-accent-warning'
            }`}>
              {filters.showAll ? t('filter_off') : t('filter_on')}
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
        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('filter_search')}</label>
        <div className="relative">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleInputChange}
            placeholder={t('filter_search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-tertiary border border-white/[0.06] text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:border-white/[0.1] transition-colors"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-text-tertiary" />
        </div>
      </div>

      {/* Game Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
          {t('filter_discipline')}
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
            {t('filter_all')}
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
          <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('filter_format')}</label>
          <select
            name="format"
            value={filters.format}
            onChange={handleInputChange}
            aria-label={t('filter_format')}
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-white/[0.06] text-sm text-white focus:outline-none focus:border-white/[0.1] transition-colors"
          >
            {formatsList.map((f) => (
              <option key={f.id} value={f.id} className="bg-bg-secondary text-white">
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('filter_type')}</label>
          <select
            name="tournamentType"
            value={filters.tournamentType}
            onChange={handleInputChange}
            aria-label={t('filter_type')}
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-white/[0.06] text-sm text-white focus:outline-none focus:border-white/[0.1] transition-colors"
          >
            {typesList.map((tItem) => (
              <option key={tItem.id} value={tItem.id} className="bg-bg-secondary text-white">
                {tItem.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('filter_status')}</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleInputChange}
            aria-label={t('filter_status')}
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-white/[0.06] text-sm text-white focus:outline-none focus:border-white/[0.1] transition-colors"
          >
            {statusesList.map((s) => (
              <option key={s.id} value={s.id} className="bg-bg-secondary text-white">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('filter_sort')}</label>
        <div className="flex gap-2">
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleInputChange}
            aria-label={t('filter_sort')}
            className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-white/[0.06] text-sm text-white focus:outline-none focus:border-white/[0.1] transition-colors"
          >
            <option value="createdAt" className="bg-bg-secondary text-white">{t('sort_created_at')}</option>
            <option value="prizePool" className="bg-bg-secondary text-white">{t('sort_prize_pool')}</option>
            <option value="startDate" className="bg-bg-secondary text-white">{t('sort_start_date')}</option>
            <option value="entryFee" className="bg-bg-secondary text-white">{t('sort_entry_fee')}</option>
          </select>
          <button
            onClick={toggleSortOrder}
            className="px-3 py-2 rounded-lg border border-white/[0.06] bg-bg-tertiary hover:bg-bg-elevated text-sm text-white transition-colors"
            title={filters.sortOrder === 'ASC' ? t('sort_asc') : t('sort_desc')}
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
        <RotateCcw className="w-4 h-4" /> {t('filter_reset')}
      </button>
    </div>
  );
}
