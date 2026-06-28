'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Tournament } from '@/types';
import HeroScene from '@/components/three/HeroScene';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import FeaturedTournamentCard from '@/components/tournaments/FeaturedTournamentCard';
import TournamentCard from '@/components/tournaments/TournamentCard';
import TournamentFilters from '@/components/tournaments/TournamentFilters';
import { Gamepad2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FiltersState {
  game: string;
  format: string;
  status: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  search: string;
}

export default function Home() {
  const [featured, setFeatured] = useState<Tournament[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState<FiltersState>({
    game: '',
    format: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    search: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [featData, tourData] = await Promise.all([
          api.tournaments.getFeatured(),
          api.tournaments.getAll(filters),
        ]);
        setFeatured(featData);
        setTournaments(tourData.data);
      } catch (err) {
        console.error('Failed to fetch tournaments', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filters]);

  return (
    <div className="relative flex-1 flex flex-col">
      {/* 3D background */}
      <HeroScene />
      
      {/* Onboarding Questionnaire */}
      <OnboardingModal />

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 w-full text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/35 text-neon-purple text-xs font-orbitron font-bold uppercase tracking-widest"
        >
          <Gamepad2 className="w-3.5 h-3.5" /> ПОДПОЛЬНАЯ ИГРОВАЯ АРЕНА
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-orbitron font-black text-4xl sm:text-6xl text-white tracking-widest uppercase leading-none"
        >
          ИГРАЙ И <span className="text-neon-purple neon-text-purple">ЗАРАБАТЫВАЙ</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto font-medium"
        >
          Запускай собственные турниры, собирай команду, делай ставки и забирай банк побежденных. Никаких ограничений — только твои правила.
        </motion.p>
      </div>

      {/* Featured Tournaments Section */}
      {featured.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="font-orbitron font-black text-xl text-white uppercase tracking-wider">
              🔥 Топ Турниры
            </h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-neon-purple/50 to-transparent" />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {featured.slice(0, 3).map((item) => (
              <FeaturedTournamentCard key={item.id} tournament={item} />
            ))}
          </div>
        </div>
      )}

      {/* All Tournaments with Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-arena-border pb-4">
          <h2 className="font-orbitron font-black text-xl text-white uppercase tracking-wider">
            ⚡ Все сражения
          </h2>
          <Link href="/tournaments" className="text-xs font-orbitron font-bold text-neon-blue hover:text-neon-purple flex items-center gap-1 transition-colors">
            ВСЕ ТУРНИРЫ <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <TournamentFilters filters={filters} onChange={setFilters} />
          </div>

          {/* Cards Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-60 glass-panel border border-arena-border rounded-xl animate-pulse" />
                ))}
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-16 glass-panel border border-arena-border rounded-xl text-gray-500 text-sm">
                Турниры по вашему запросу не найдены.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((item) => (
                  <TournamentCard key={item.id} tournament={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
