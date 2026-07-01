'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { UserProfile } from '@/types';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/auth.store';
import { useSocket } from '@/lib/hooks/useSocket';
import GenderIcon from '@/components/ui/GenderIcon';
import Button from '@/components/ui/Button';
import {
  Crown,
  MapPin,
  Settings,
  Shield,
  Target,
  Trophy,
  UserMinus,
  UserPlus,
  Users,
  MessageSquare,
  Eye,
} from 'lucide-react';

const GAME_NAMES: Record<string, string> = {
  cs2: 'CS2',
  dota2: 'Dota 2',
  valorant: 'Valorant',
  lol: 'LoL',
  pubg: 'PUBG',
  apex: 'Apex',
  custom: 'Другие',
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { user: currentUser } = useAuthStore();
  const { socket, isConnected } = useSocket();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<{ status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVisitors, setShowVisitors] = useState(false);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loadingVisitors, setLoadingVisitors] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  // Трекаем просмотр профиля (только если это не свой профиль)
  useEffect(() => {
    if (currentUser && userId && currentUser.id !== userId) {
      api.users.trackProfileView(userId).catch(err => {
        console.error('[Profile] Failed to track view:', err);
      });
    }
  }, [userId, currentUser]);

  // Подписываемся на WebSocket события для real-time обновлений
  useEffect(() => {
    if (socket && isConnected && currentUser) {
      socket.on('follow_update', (data: { type: string; followerId: string }) => {
        console.log('[Profile] WebSocket follow_update:', data);
        // Если обновление касается текущего профиля, перезагружаем статус
        if (data.followerId === userId || data.followerId === currentUser.id) {
          loadProfile();
        }
      });

      return () => {
        socket.off('follow_update');
      };
    }
  }, [socket, isConnected, userId, currentUser]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.users.getFullProfile(userId);
      setProfile(data);

      if (currentUser && currentUser.id !== userId) {
        // Получаем статус дружбы/подписки
        const statusData = await api.friends.getStatus(userId);
        setFollowStatus(statusData);
        
        // Определяем подписаны ли мы на пользователя
        // following = мы подписаны на него, friends = взаимная подписка
        setIsFollowing(statusData.status === 'following' || statusData.status === 'friends');
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      toast.error('Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  };

  const handleFriendAction = async () => {
    if (!currentUser) {
      toast.error('Войдите, чтобы подписаться');
      return;
    }

    try {
      if (isFollowing) {
        // Отписаться
        await api.friends.unfollow(userId);
        toast.success('Вы отписались');
        setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount - 1 } : prev);
      } else {
        // Подписаться
        await api.friends.follow(userId);
        toast.success('Вы подписались!');
        setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount + 1 } : prev);
      }
      
      // Обновляем статус
      const statusData = await api.friends.getStatus(userId);
      setFollowStatus(statusData);
      setIsFollowing(statusData.status === 'following' || statusData.status === 'friends');
    } catch (error: any) {
      console.error('Friend action error:', error);
      toast.error(error.response?.data?.message || 'Ошибка');
      
      // Перезагружаем статус при ошибке чтобы синхронизировать
      try {
        const statusData = await api.friends.getStatus(userId);
        setFollowStatus(statusData);
        setIsFollowing(statusData.status === 'following' || statusData.status === 'friends');
      } catch (e) {
        console.error('Failed to reload status:', e);
      }
    }
  };

  const handleOpenChat = async () => {
    if (!currentUser) {
      toast.error('Войдите, чтобы писать сообщения');
      return;
    }

    try {
      const room = await api.chat.getOrCreateRoom(userId);
      // Перенаправляем на страницу чата с конкретной комнатой
      router.push(`/chat?room=${room.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка открытия чата');
    }
  };

  const handleViewVisitors = async () => {
    if (!isOwnProfile) return;
    
    setShowVisitors(true);
    setLoadingVisitors(true);
    
    try {
      const data = await api.users.getProfileVisitors(userId);
      setVisitors(data.views);
    } catch (error: any) {
      console.error('Failed to load visitors:', error);
      toast.error('Не удалось загрузить посетителей');
    } finally {
      setLoadingVisitors(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-arena-dark flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-arena-dark flex items-center justify-center">
        <div className="text-white">Профиль не найден</div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const winRate = profile.wins + profile.losses > 0 
    ? ((profile.wins / (profile.wins + profile.losses)) * 100).toFixed(1)
    : '0.0';
  const profileTitle = profile.displayName || profile.username;
  const location = [profile.city, profile.country].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-arena-dark py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-arena-card border border-arena-border rounded-2xl overflow-hidden mb-6">
          <div
            className="h-40 bg-gradient-to-r from-neon-purple/30 via-neon-blue/20 to-transparent"
            style={
              profile.bannerUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(10,10,15,0.45), rgba(10,10,15,0.85)), url(${profile.bannerUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          />
          <div className="p-6 pt-0">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6 -mt-12">
              <div className="relative">
                <img
                  src={profile.avatarUrl || '/default-avatar.svg'}
                  alt={profile.username}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-arena-card shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2">
                  <GenderIcon gender={profile.gender} size="md" />
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="font-orbitron font-bold text-3xl text-white">
                        {profileTitle}
                      </h1>
                      {profile.overallLeaderboardRank ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-neon-gold/40 bg-neon-gold/10 px-3 py-1 text-xs font-orbitron text-neon-gold">
                          <Crown className="w-3.5 h-3.5" />
                          TOP #{profile.overallLeaderboardRank}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      @{profile.username}
                    </div>
                    {profile.tagline ? (
                      <p className="text-neon-blue text-sm mt-3">{profile.tagline}</p>
                    ) : null}
                    {profile.bio ? (
                      <p className="text-gray-300 text-sm mt-3 max-w-3xl">{profile.bio}</p>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    {isOwnProfile ? (
                      <>
                        <Button
                          onClick={handleViewVisitors}
                          variant="secondary"
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Посетители
                        </Button>
                        <Link href="/profile/edit">
                          <Button
                            variant="secondary"
                            className="flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Редактировать
                          </Button>
                        </Link>
                      </>
                    ) : currentUser && (
                    <>
                      {followStatus?.status === 'friends' && (
                        <Button
                          onClick={handleOpenChat}
                          variant="primary"
                          className="flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Написать
                        </Button>
                      )}
                      {isFollowing ? (
                        <Button
                          onClick={handleFriendAction}
                          variant="secondary"
                          className="flex items-center gap-2"
                        >
                          <UserMinus className="w-4 h-4" />
                          Отписаться
                        </Button>
                      ) : (
                        <Button
                          onClick={handleFriendAction}
                          variant="primary"
                          className="flex items-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          {followStatus?.status === 'follower' ? 'Подписаться в ответ' : 'Подписаться'}
                        </Button>
                      )}
                    </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-neon-blue" />
                    <span className="text-white font-semibold">{profile.followersCount}</span>
                    <span className="text-gray-400">подписчиков</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{profile.followingCount}</span>
                    <span className="text-gray-400">подписок</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-neon-green" />
                    <span className="text-white font-semibold">{profile.profileViewsCount || 0}</span>
                    <span className="text-gray-400">просмотров</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-neon-purple" />
                    <span className="text-white font-semibold">{profile.arenaPower}</span>
                    <span className="text-gray-400">Arena Power</span>
                  </div>
                  {location ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-neon-gold" />
                      <span className="text-gray-300">{location}</span>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-arena-border bg-white/5 p-4">
                    <div className="text-xs uppercase font-orbitron text-gray-400 mb-1">Любимые игры</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.favoriteGames.length ? (
                        profile.favoriteGames.map((game) => (
                          <span
                            key={game}
                            className="rounded-full bg-neon-blue/10 px-3 py-1 text-xs text-neon-blue"
                          >
                            {GAME_NAMES[game] || game}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Не выбраны</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-arena-border bg-white/5 p-4">
                    <div className="text-xs uppercase font-orbitron text-gray-400 mb-1">Главная игра</div>
                    <div className="text-white font-semibold">
                      {profile.mainGame ? GAME_NAMES[profile.mainGame] || profile.mainGame : 'Не указана'}
                    </div>
                    {profile.mainTeam ? (
                      <div className="text-xs text-gray-400 mt-2">
                        Команда: <span className="text-neon-purple">{profile.mainTeam.name}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-xl border border-arena-border bg-white/5 p-4">
                    <div className="text-xs uppercase font-orbitron text-gray-400 mb-1">Команды</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.teams.length ? (
                        profile.teams.map((team) => (
                          <span
                            key={`${team.id}-${team.game}`}
                            className="rounded-full bg-neon-purple/10 px-3 py-1 text-xs text-neon-purple"
                          >
                            {team.name} · {GAME_NAMES[team.game] || team.game}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Пока без команды</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-arena-card border border-arena-border rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Arena Power</div>
            <div className="font-orbitron font-bold text-2xl text-neon-purple">
              {profile.arenaPower}
            </div>
          </div>
          <div className="bg-arena-card border border-arena-border rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Позиция в общем топе</div>
            <div className="font-orbitron font-bold text-2xl text-white">
              {profile.overallLeaderboardRank ? `#${profile.overallLeaderboardRank}` : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">из {profile.overallLeaderboardTotal} игроков</div>
          </div>
          <div className="bg-arena-card border border-arena-border rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Побед / Поражений</div>
            <div className="font-orbitron font-bold text-2xl text-neon-gold">
              {profile.wins} / {profile.losses}
            </div>
            <div className="text-xs text-gray-500 mt-1">Винрейт {winRate}%</div>
          </div>
        </div>

        {/* Game Stats */}
        <div className="bg-arena-card border border-arena-border rounded-xl p-6">
          <h2 className="font-orbitron font-bold text-xl text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-neon-blue" />
            Статистика по играм
          </h2>

          {profile.stats.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              Нет статистики по играм
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.stats.map((stat) => {
                const gameWinRate = stat.wins + stat.losses > 0
                  ? ((stat.wins / (stat.wins + stat.losses)) * 100).toFixed(1)
                  : '0.0';

                return (
                  <div
                    key={stat.id}
                    className="border border-arena-border rounded-lg p-4 hover:border-neon-purple/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-orbitron font-bold text-white">
                        {GAME_NAMES[stat.game] || stat.game}
                      </span>
                      <div className="flex items-center gap-2">
                        {stat.currentTeam ? (
                          <span className="text-xs bg-neon-blue/10 text-neon-blue px-2 py-1 rounded">
                            {stat.currentTeam.name}
                          </span>
                        ) : null}
                        {stat.leaderboardRank && (
                          <span className="text-xs bg-neon-gold/20 text-neon-gold px-2 py-1 rounded">
                            #{stat.leaderboardRank}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">StreetScore:</span>
                        <span className="text-neon-blue font-bold">
                          {stat.streetScore || Number(stat.rating).toFixed(0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Рейтинг:</span>
                        <span className="text-neon-purple font-bold">
                          {Number(stat.rating).toFixed(0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">W/L:</span>
                        <span className="text-white font-semibold">
                          {stat.wins}/{stat.losses}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Винрейт:</span>
                        <span className="text-neon-gold font-bold">{gameWinRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Visitors Modal */}
      {showVisitors && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowVisitors(false)}>
          <div
            className="bg-arena-card border border-arena-border rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-arena-border flex items-center justify-between">
              <h2 className="font-orbitron font-bold text-xl text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-neon-green" />
                Кто смотрел профиль
              </h2>
              <button
                onClick={() => setShowVisitors(false)}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingVisitors ? (
                <div className="text-center text-gray-400 py-8">Загрузка...</div>
              ) : visitors.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  Пока никто не смотрел ваш профиль
                </div>
              ) : (
                <div className="space-y-3">
                  {visitors.map((visit) => (
                    <Link
                      key={visit.id}
                      href={`/profile/${visit.viewer.id}`}
                      onClick={() => setShowVisitors(false)}
                      className="flex items-center gap-4 p-4 rounded-lg border border-arena-border hover:border-neon-purple/50 bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <img
                        src={visit.viewer.avatarUrl || '/default-avatar.svg'}
                        alt={visit.viewer.username}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          {visit.viewer.displayName || visit.viewer.username}
                        </div>
                        <div className="text-sm text-gray-400">@{visit.viewer.username}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(visit.viewedAt).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
