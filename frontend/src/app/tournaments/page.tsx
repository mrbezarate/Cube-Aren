'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Tournament } from '@/types';
import TournamentCard from '@/components/tournaments/TournamentCard';
import TournamentFilters from '@/components/tournaments/TournamentFilters';
import Button from '@/components/ui/Button';

interface FiltersState {
  game: string;
  format: string;
  status: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  search: string;
}

export default function TournamentsListPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState<FiltersState>({
    game: '',
    format: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    search: '',
  });

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        const res = await api.tournaments.getAll({
          ...filters,
          page,
          limit: 12,
        });
        setTournaments(res.data);
        setTotalPages(res.pages);
      } catch (err) {
        console.error('Error fetching tournaments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, [filters, page]);

  // Reset page to 1 when filters change
  const handleFiltersChange = (newFilters: FiltersState) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 flex flex-col space-y-8">
      {/* Title Header */}
      <div className="border-b border-arena-border pb-4">
        <h1 className="font-orbitron font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
          ⚔️ Все активные сражения
        </h1>
        <p className="text-gray-400 text-xs mt-1">Отслеживайте текущие игры, делайте прогнозы и находите лобби для участия.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <TournamentFilters filters={filters} onChange={handleFiltersChange} />
        </div>

        {/* Content Section */}
        <div className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-60 glass-panel border border-arena-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-20 glass-panel border border-arena-border rounded-xl text-gray-500 text-sm">
              Турниры по вашему запросу не найдены. Попробуйте сбросить фильтры.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((item) => (
                  <TournamentCard key={item.id} tournament={item} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-6">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Назад
                  </Button>
                  <span className="font-orbitron font-bold text-xs text-gray-400">
                    Страница {page} из {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Вперед
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
