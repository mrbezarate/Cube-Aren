'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LeaderboardResponse, GameType, TeamLeaderboardResponse } from '@/types';
import { toast } from 'react-hot-toast';
import GenderIcon from '@/components/ui/GenderIcon';
import Link from 'next/link';
import { Trophy, Medal, Award, Shield } from 'lucide-react';

const GAMES: { id: GameType; name: string; icon: string }[] = [
  { id: 'cs2', name: 'Counter-Strike 2', icon: '🎯' },
  { id: 'dota2', name: 'Dota 2', icon: '⚔️' },
  { id: 'valorant', name: 'Valorant', icon: '🔫' },
  { id: 'lol', name: 'League of Legends', icon: '🏆' },
  { id: 'pubg', name: 'PUBG', icon: '🎮' },
  { id: 'apex', name: 'Apex Legends', icon: '🚀' },
];

export default function LeaderboardPage() {
  const [mode, setMode] = useState<'players' | 'teams'>('players');
  const [selectedGame, setSelectedGame] = useState<GameType>('cs2');
  const [playersLeaderboard, setPlayersLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [teamsLeaderboard, setTeamsLeaderboard] = useState<TeamLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadLeaderboard();
  }, [mode, selectedGame, page]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      if (mode === 'players') {
        const data = await api.users.getLeaderboard(selectedGame, page, 50);
        setPlayersLeaderboard(data);
      } else {
        const data = await api.teams.getLeaderboard(selectedGame, page, 50);
        setTeamsLeaderboard(data);
      }
    } catch (error: any) {
      console.error('Failed to load leaderboard:', error);
      toast.error('Не удалось загрузить таблицу лидеров');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-400';
  };

  const activeLeaderboard = mode === 'players' ? playersLeaderboard : teamsLeaderboard;

  return (
    <div className="min-h-screen bg-arena-dark py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-orbitron font-black text-4xl text-white mb-2 uppercase">
            Таблица Лидеров
          </h1>
          <p className="text-gray-400">
            {mode === 'players'
              ? `Лучшие игроки по ${playersLeaderboard?.metric?.name || 'StreetScore'}`
              : 'Лучшие кланы по Team Rating Points'}
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => {
              setMode('players');
              setPage(1);
            }}
            className={`rounded-lg px-5 py-2.5 font-orbitron text-sm font-semibold transition-all ${
              mode === 'players'
                ? 'bg-neon-purple text-white border border-neon-purple'
                : 'bg-arena-card text-gray-400 border border-arena-border hover:border-neon-purple/40'
            }`}
          >
            Игроки
          </button>
          <button
            onClick={() => {
              setMode('teams');
              setPage(1);
            }}
            className={`rounded-lg px-5 py-2.5 font-orbitron text-sm font-semibold transition-all ${
              mode === 'teams'
                ? 'bg-neon-blue text-white border border-neon-blue'
                : 'bg-arena-card text-gray-400 border border-arena-border hover:border-neon-blue/40'
            }`}
          >
            Команды
          </button>
        </div>

        {/* Game Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => {
                setSelectedGame(game.id);
                setPage(1);
              }}
              className={`
                px-4 py-2 rounded-lg font-orbitron font-semibold text-sm
                transition-all flex items-center gap-2
                ${
                  selectedGame === game.id
                    ? 'bg-neon-purple text-white border-2 border-neon-purple shadow-lg shadow-neon-purple/20'
                    : 'bg-arena-card text-gray-400 border border-arena-border hover:border-neon-purple/50'
                }
              `}
            >
              <span className="text-lg">{game.icon}</span>
              {game.name}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-arena-card border border-arena-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Загрузка...</div>
          ) : !activeLeaderboard || activeLeaderboard.data.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Нет данных</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-arena-dark border-b border-arena-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-orbitron font-bold text-gray-400 uppercase tracking-wider">
                        Ранг
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-orbitron font-bold text-gray-400 uppercase tracking-wider">
                        {mode === 'players' ? 'Игрок' : 'Команда'}
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-orbitron font-bold text-gray-400 uppercase tracking-wider">
                        {mode === 'players' ? playersLeaderboard?.metric?.shortName || 'Score' : 'TRP'}
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-orbitron font-bold text-gray-400 uppercase tracking-wider">
                        Рейтинг
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-orbitron font-bold text-gray-400 uppercase tracking-wider">
                        Побед
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-orbitron font-bold text-gray-400 uppercase tracking-wider">
                        Поражений
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-orbitron font-bold text-gray-400 uppercase tracking-wider">
                        Винрейт
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-orbitron font-bold text-gray-400 uppercase tracking-wider">
                        {mode === 'players' ? 'Команда' : 'Капитан'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arena-border">
                    {mode === 'players'
                      ? playersLeaderboard?.data.map((entry) => (
                          <tr
                            key={entry.user.id}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getRankIcon(entry.rank)}
                                <span className={`font-orbitron font-bold text-lg ${getRankColor(entry.rank)}`}>
                                  #{entry.rank}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/profile/${entry.user.id}`}
                                className="flex items-center gap-3 hover:text-neon-purple transition-colors group"
                              >
                                <img
                                  src={entry.user.avatarUrl || '/default-avatar.svg'}
                                  alt={entry.user.username}
                                  className="w-10 h-10 rounded-lg object-cover border border-arena-border group-hover:border-neon-purple transition-colors"
                                />
                                <div className="flex items-center gap-2">
                                  <span className="font-orbitron font-semibold text-white">
                                    {entry.user.displayName || entry.user.username}
                                  </span>
                                  <GenderIcon gender={entry.user.gender} size="sm" />
                                </div>
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="font-orbitron font-bold text-neon-blue text-lg">
                                {entry.score}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="font-orbitron font-bold text-neon-purple text-lg">
                                {Number(entry.rating).toFixed(0)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="font-semibold text-green-400">{entry.wins}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="font-semibold text-red-400">{entry.losses}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="font-orbitron font-bold text-neon-gold">
                                {entry.winRate}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="text-sm text-gray-300">
                                {entry.currentTeam?.name || 'Свободный агент'}
                              </span>
                            </td>
                          </tr>
                        ))
                      : teamsLeaderboard?.data.map((entry) => (
                          <tr
                            key={entry.team.id}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getRankIcon(entry.rank)}
                                <span className={`font-orbitron font-bold text-lg ${getRankColor(entry.rank)}`}>
                                  #{entry.rank}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-arena-border bg-neon-blue/10">
                                  <Shield className="h-5 w-5 text-neon-blue" />
                                </div>
                                <div>
                                  <div className="font-orbitron font-semibold text-white">
                                    {entry.team.name} {entry.team.tag ? <span className="text-neon-blue">[{entry.team.tag}]</span> : null}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {(entry.team.supportedGames || [selectedGame]).join(' · ')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="font-orbitron font-bold text-neon-blue text-lg">
                                {Number(entry.rating).toFixed(0)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="font-orbitron font-bold text-neon-purple text-lg">
                                {Number(entry.rating).toFixed(0)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="font-semibold text-green-400">{entry.wins}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="font-semibold text-red-400">{entry.losses}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="font-orbitron font-bold text-neon-gold">
                                {entry.winRate}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="text-sm text-gray-300">
                                {entry.team.captainName || 'Не указан'}
                              </span>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {activeLeaderboard.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-arena-border flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg bg-arena-dark text-white font-orbitron font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neon-purple/20 transition-colors"
                  >
                    Назад
                  </button>
                  <span className="text-gray-400 text-sm font-orbitron">
                    Страница {page} из {activeLeaderboard.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(activeLeaderboard.totalPages, p + 1))}
                    disabled={page === activeLeaderboard.totalPages}
                    className="px-4 py-2 rounded-lg bg-arena-dark text-white font-orbitron font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neon-purple/20 transition-colors"
                  >
                    Вперёд
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
