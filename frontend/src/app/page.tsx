'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Tournament } from '@/types';
import { useAuthStore } from '@/lib/store/auth.store';
import FeaturedTournamentCard from '@/components/tournaments/FeaturedTournamentCard';
import TournamentCard from '@/components/tournaments/TournamentCard';
import TournamentFilters from '@/components/tournaments/TournamentFilters';
import { ArrowRight, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
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

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const [featured, setFeatured] = useState<Tournament[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Load user's favorite games from onboarding
  useEffect(() => {
    if (isAuthenticated && user?.onboardingCompleted) {
      api.users.getOnboarding().then((data) => {
        if (data?.games) setFavoriteGames(data.games);
      }).catch(() => {});
    }
  }, [isAuthenticated, user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const apiParams: any = {
        format: filters.format || undefined,
        tournamentType: filters.tournamentType || undefined,
        status: filters.status || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: filters.search || undefined,
        limit: 12,
      };

      if (filters.game) {
        apiParams.game = filters.game;
      }

      const [featData, tourData] = await Promise.all([
        api.tournaments.getFeatured(),
        api.tournaments.getAll(apiParams),
      ]);

      setFeatured(featData);
      const sorted = sortByFavorites(tourData.data, favoriteGames, filters.showAll, filters.game);
      setTournaments(sorted);
    } catch (err) {
      console.error('Failed to fetch tournaments', err);
    } finally {
      setLoading(false);
    }
  }, [filters, favoriteGames]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section - Clean & Modern */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-secondary to-bg-primary" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent-primary/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-secondary/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-tertiary border border-white/[0.06] mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
              <span className="text-sm text-text-secondary">{t('platform_active')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            >
              {t('play_and_earn_title')}
              <span className="text-accent-primary">{t('play_and_earn_highlight')}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-text-secondary mb-8 max-w-xl"
            >
              {t('hero_description')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/tournaments">
                <Button variant="primary" size="lg">
                  <Trophy className="w-4 h-4" />
                  {t('find_tournament')}
                </Button>
              </Link>
              <Link href="/community">
                <Button variant="secondary" size="lg">
                  <Users className="w-4 h-4" />
                  {t('community')}
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-8 border-t border-white/[0.06]"
          >
            {[
              { value: '1,200+', label: t('stat_active_tournaments') },
              { value: '50K+', label: t('stat_players') },
              { value: '2M+', label: t('stat_prize_pool') },
              { value: '99.9%', label: t('stat_uptime') },
            ].map((stat, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Tournaments */}
      {featured.length > 0 && (
        <section className="py-20 bg-bg-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">{t('featured_tournaments')}</h2>
                <p className="text-text-secondary mt-1">{t('featured_tournaments_desc')}</p>
              </div>
              <Link href="/tournaments">
                <Button variant="ghost">
                  {t('view_all')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {featured.slice(0, 3).map((item) => (
                <FeaturedTournamentCard key={item.id} tournament={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Tournaments */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">{t('all_tournaments')}</h2>
              <p className="text-text-secondary mt-1">{t('find_suitable_competition')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <TournamentFilters
                filters={filters}
                onChange={setFilters}
                favoriteGames={favoriteGames}
              />
            </div>

            {/* Cards Grid */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-64 bg-bg-secondary border border-white/[0.06] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : tournaments.length === 0 ? (
                <div className="text-center py-16 bg-bg-secondary border border-white/[0.06] rounded-xl text-text-secondary">
                  {t('no_tournaments_found')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tournaments.map((item) => (
                    <TournamentCard
                      key={item.id}
                      tournament={item}
                      isFavoriteGame={favoriteGames.includes(item.game)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Sort tournaments: favorites first (by date), then others (by date)
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
