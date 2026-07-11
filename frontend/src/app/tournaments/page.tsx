'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Tournament } from '@/types';
import { useAuthStore } from '@/lib/store/auth.store';
import TournamentCard from '@/components/tournaments/TournamentCard';
import TournamentFilters from '@/components/tournaments/TournamentFilters';
import Button from '@/components/ui/Button';
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

function sortByFavorites(
  tournaments: Tournament[],
  favoriteGames: string[],
  showAll: boolean,
  gameFilter: string,
): Tournament[] {
  if (!favoriteGames.length || showAll || gameFilter) return tournaments;

  const favorites = tournaments.filter((t) => favoriteGames.includes(t.game));
  const others = tournaments.filter((t) => !favoriteGames.includes(t.game));

  const byDate = (a: Tournament, b: Tournament) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime();

  return [...favorites.sort(byDate), ...others.sort(byDate)];
}

export default function TournamentsListPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<FiltersState>({
    game: '',
    format: '',
    tournamentType: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    search: '',
    showAll: false,
  });

  // Load user's favorite games
  useEffect(() => {
    if (isAuthenticated && user?.onboardingCompleted) {
      api.users.getOnboarding().then((data) => {
        if (data?.games) setFavoriteGames(data.games);
      }).catch(() => {});
    }
  }, [isAuthenticated, user]);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.tournaments.getAll({
        game: filters.game || undefined,
        format: filters.format || undefined,
        tournamentType: filters.tournamentType || undefined,
        status: filters.status || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: filters.search || undefined,
        page,
        limit: 12,
      });

      const sorted = sortByFavorites(res.data, favoriteGames, filters.showAll, filters.game);
      setTournaments(sorted);
      setTotalPages(res.pages);
    } catch (err) {
      console.error('Error fetching tournaments', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, favoriteGames]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const handleFiltersChange = (newFilters: FiltersState) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 flex flex-col space-y-8">
      {/* Title Header */}
      <div className="border-b border-arena-border pb-4">
        <h1 className="font-orbitron font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
          ⚔️ {t('all_active_battles')}
        </h1>
        <div className="flex items-center gap-4 mt-1">
          <p className="text-gray-400 text-xs">
            {t('tournaments_desc')}
          </p>
          {favoriteGames.length > 0 && !filters.showAll && !filters.game && (
            <span className="text-[10px] text-neon-gold font-orbitron font-bold">
              {t('favorite_games_first')}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <TournamentFilters
            filters={filters}
            onChange={handleFiltersChange}
            favoriteGames={favoriteGames}
          />
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 glass-panel border border-arena-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-20 glass-panel border border-arena-border rounded-xl text-gray-500 text-sm">
              {t('no_tournaments_reset')}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((item) => (
                  <TournamentCard
                    key={item.id}
                    tournament={item}
                    isFavoriteGame={favoriteGames.includes(item.game)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-6">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    {t('page_prev')}
                  </Button>
                  <span className="font-orbitron font-bold text-xs text-gray-400">
                    {t('page_of').replace('{page}', String(page)).replace('{totalPages}', String(totalPages))}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    {t('page_next')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
