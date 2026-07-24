'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Team, GameType, TeamJoinRequest } from '@/types';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/auth.store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import GenderIcon from '@/components/ui/GenderIcon';
import Modal from '@/components/ui/Modal';
import { 
  Shield, Crown, Users, Trophy, ArrowLeft, Swords, Target, 
  Calendar, Edit2, Upload, Trash2, Check, X, ShieldAlert,
  Settings, UserX, UserCheck, MessageSquare, Plus, Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Avatar from '@/components/ui/Avatar';
import { UserCard } from '@/types';

interface TeamMember {
  id: string;
  user: UserCard;
  role: string;
  joinedAt: string;
}

interface TeamDetail extends Team {
  members: TeamMember[];
  requests: TeamJoinRequest[];
}

const GAMES: { id: GameType; name: string; icon: string }[] = [
  { id: 'cs2', name: 'CS2', icon: '🔫' },
  { id: 'dota2', name: 'Dota 2', icon: '🧙' },
  { id: 'valorant', name: 'Valorant', icon: '🎯' },
  { id: 'lol', name: 'LoL', icon: '⚔️' },
  { id: 'pubg', name: 'PUBG', icon: '🪂' },
  { id: 'apex', name: 'Apex', icon: '⚡' },
];

const FLAGS = [
  { emoji: '🇷🇺', name: 'Россия' },
  { emoji: '🇪🇺', name: 'Евросоюз' },
  { emoji: '🇺🇸', name: 'США' },
  { emoji: '🇯🇵', name: 'Япония' },
  { emoji: '🇰🇷', name: 'Корея' },
  { emoji: '🇧🇷', name: 'Бразилия' },
  { emoji: '👑', name: 'Элита' },
  { emoji: '👽', name: 'Кибер' },
  { emoji: '🏴‍☠️', name: 'Пираты' },
];

const GAME_NAMES: Record<string, string> = {
  cs2: 'CS2',
  dota2: 'Dota 2',
  valorant: 'Valorant',
  lol: 'LoL',
  pubg: 'PUBG',
  apex: 'Apex',
  custom: 'Другие',
};

const getGameName = (game: GameType) => GAME_NAMES[game] || game;

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { user: currentUser } = useAuthStore();
  
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Recruitment Join
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');

  // Editing Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTag, setEditTag] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRecruiting, setEditRecruiting] = useState(true);
  const [editSupportedGames, setEditSupportedGames] = useState<GameType[]>([]);
  const [editFlag, setEditFlag] = useState('🇷🇺');
  const [editCustomFlag, setEditCustomFlag] = useState('');
  
  // File and URL States
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Transfer Captain Confirmation Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [transferTargetName, setTransferTargetName] = useState('');
  
  // File upload refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const data = await api.teams.getOne(teamId);
      setTeam(data as TeamDetail);
      
      // Pre-fill edit inputs
      if (data) {
        setEditTag(data.tag || '');
        setEditDescription(data.description || '');
        setEditRecruiting(data.isRecruiting);
        setEditSupportedGames(data.supportedGames || [data.game]);
        setEditFlag(data.flag || '🇷🇺');
        setEditLogoUrl(data.logoUrl || '');
        setEditBannerUrl(data.bannerUrl || '');
      }
    } catch (error: any) {
      console.error('Failed to load team details:', error);
      toast.error('Не удалось загрузить данные о клане');
      router.push('/teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const toggleEditSupportedGame = (gameId: GameType) => {
    setEditSupportedGames((prev) => {
      if (prev.includes(gameId)) {
        if (prev.length <= 1) {
          toast.error('Клан должен поддерживать как минимум одну игру');
          return prev;
        }
        return prev.filter((item) => item !== gameId);
      }
      if (prev.length >= 3) {
        toast.error('Максимум 3 игры');
        return prev;
      }
      return [...prev, gameId];
    });
  };

  // Roles verification helper
  const myMembership = team?.members?.find((m) => m.userId === currentUser?.id);
  const myRole = myMembership?.role;
  const isCaptain = team?.captainId === currentUser?.id || myRole === 'captain';
  const isViceCaptain = myRole === 'vice_captain';
  const isModerator = myRole === 'moderator';
  const isMember = !!myMembership;
  
  // Custom privileges
  const canManageSettings = isCaptain || isViceCaptain;
  const canManageRequests = isCaptain || isViceCaptain || isModerator;
  const canManageRoles = isCaptain; // Only captain can change roles

  const handleJoin = async () => {
    if (!team) return;
    setJoining(true);
    try {
      await api.teams.join(team.id, {
        message: joinMessage.trim() || undefined,
      });
      toast.success('Заявка на вступление успешно отправлена!');
      setJoinMessage('');
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось отправить заявку');
    } finally {
      setJoining(false);
    }
  };

  // Upload Logo from modal settings
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingLogo(true);
    try {
      const res = await api.teams.uploadLogo(team.id, formData);
      toast.success('Логотип успешно загружен!');
      setEditLogoUrl(res.logoUrl);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка при загрузке логотипа');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Upload Banner from modal settings
  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingBanner(true);
    try {
      const res = await api.teams.uploadBanner(team.id, formData);
      toast.success('Баннер успешно загружен!');
      setEditBannerUrl(res.bannerUrl);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка при загрузке баннера');
    } finally {
      setUploadingBanner(false);
    }
  };

  // Update General Clan Settings
  const handleSaveSettings = async () => {
    if (!team) return;

    setSavingSettings(true);
    const finalFlag = editCustomFlag.trim() || editFlag;

    try {
      await api.teams.update(team.id, {
        description: editDescription.trim() || undefined,
        tag: editTag.trim().toUpperCase() || undefined,
        flag: finalFlag || undefined,
        isRecruiting: editRecruiting,
        supportedGames: editSupportedGames,
        logoUrl: editLogoUrl.trim() || undefined,
        bannerUrl: editBannerUrl.trim() || undefined,
      });

      toast.success('Настройки клана успешно сохранены!');
      setIsEditModalOpen(false);
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось обновить настройки');
    } finally {
      setSavingSettings(false);
    }
  };

  // Moderate Request
  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!team) return;
    try {
      if (action === 'approve') {
        await api.teams.approveRequest(team.id, requestId);
        toast.success('Игрок принят в клан!');
      } else {
        await api.teams.rejectRequest(team.id, requestId);
        toast.success('Заявка отклонена');
      }
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось выполнить действие');
    }
  };

  // Kick Member
  const handleKick = async (targetUserId: string) => {
    if (!team) return;
    if (!confirm('Вы уверены, что хотите исключить этого игрока из клана?')) return;

    try {
      await api.teams.kickMember(team.id, targetUserId);
      toast.success('Игрок успешно исключен');
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось исключить игрока');
    }
  };

  // Change Role
  const handleRoleChange = async (targetUserId: string, targetName: string, newRole: string) => {
    if (!team) return;
    if (newRole === 'captain') {
      setTransferTargetId(targetUserId);
      setTransferTargetName(targetName);
      setIsTransferModalOpen(true);
      return;
    }

    try {
      await api.teams.updateMemberRole(team.id, targetUserId, newRole);
      toast.success('Роль игрока успешно изменена');
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось изменить роль');
    }
  };

  // Confirm Transfer Captain
  const handleConfirmTransfer = async () => {
    if (!team || !transferTargetId) return;
    setIsTransferModalOpen(false);
    try {
      await api.teams.updateMemberRole(team.id, transferTargetId, 'captain');
      toast.success(`Вы передали капитанство игроку ${transferTargetName}!`);
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось передать капитанство');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-orbitron font-bold text-xs uppercase tracking-widest animate-pulse">Загрузка клана...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-white text-lg font-orbitron font-bold">КЛАН НЕ НАЙДЕН</div>
      </div>
    );
  }

  const formattedDate = format(new Date(team.createdAt), 'd MMMM yyyy', { locale: ru });
  const pendingRequests = team.requests || [];
  const winRate = team.wins + team.losses > 0 
    ? ((team.wins / (team.wins + team.losses)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-bg-primary pb-16">
      
      {/* Hidden Upload Inputs */}
      <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
      <input type="file" ref={bannerInputRef} onChange={handleBannerChange} accept="image/*" className="hidden" />

      {/* Navigation & Header */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-orbitron font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> НАЗАД
        </button>
      </div>

      {/* Profile Details Container - Large & Unified structure like user profile */}
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Main Header Card */}
        <div className="bg-bg-secondary border border-border-subtle rounded-2xl overflow-hidden mb-6 shadow-2xl relative">
          
          {/* Header Cover Banner */}
          <div
            className="h-44 sm:h-52 bg-gradient-to-r from-accent-primary/20 via-accent-secondary/10 to-transparent relative"
            style={
              team.bannerUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(10,10,15,0.4), rgba(10,10,15,0.85)), url(${team.bannerUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          />

          {/* User Profile-like Info Block */}
          <div className="p-6 pt-0">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6 -mt-16 sm:-mt-20">
              
              {/* Logo Area */}
              <div className="relative shrink-0">
                <div className="h-32 w-32 rounded-2xl border-4 border-bg-secondary bg-bg-tertiary flex items-center justify-center overflow-hidden shadow-2xl">
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="h-16 w-16 text-accent-secondary" />
                  )}
                </div>
              </div>

              {/* Text Info */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="font-orbitron font-extrabold text-2xl sm:text-3xl text-white uppercase tracking-wide">
                        {team.name}
                      </h1>
                      {team.tag && (
                        <span className="text-accent-secondary text-lg sm:text-xl font-black font-orbitron">[{team.tag}]</span>
                      )}
                      <span className="text-xl sm:text-2xl" title="Флаг/Регион">{team.flag || '🏴'}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Основан: {formattedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-accent-warning" />
                        Лидер:{' '}
                        <Link
                          href={`/profile/${team.captainId}`}
                          className="text-white hover:text-accent-secondary font-bold transition-colors"
                        >
                          {team.captainName || 'Капитан'}
                        </Link>
                      </span>
                    </div>
                  </div>

                  {/* Compact Header Stats - Matches, Wins, Rating */}
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <div className="bg-bg-primary/50 border border-border-subtle p-2 px-3.5 rounded-xl text-center">
                      <span className="text-[8px] uppercase font-bold text-text-tertiary tracking-widest block">TRP</span>
                      <span className="font-orbitron font-bold text-sm text-white">{Number(team.rating).toFixed(0)}</span>
                    </div>
                    <div className="bg-bg-primary/50 border border-border-subtle p-2 px-3.5 rounded-xl text-center">
                      <span className="text-[8px] uppercase font-bold text-text-tertiary tracking-widest block">Победы</span>
                      <span className="font-orbitron font-bold text-sm text-green-400">{team.wins}</span>
                    </div>
                    <div className="bg-bg-primary/50 border border-border-subtle p-2 px-3.5 rounded-xl text-center">
                      <span className="text-[8px] uppercase font-bold text-text-tertiary tracking-widest block">Винрейт</span>
                      <span className="font-orbitron font-bold text-sm text-accent-warning">{winRate}%</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex gap-2 self-start sm:self-end">
                    {canManageSettings && (
                      <Button 
                        onClick={() => setIsEditModalOpen(true)}
                        variant="secondary"
                        className="flex items-center gap-1.5 py-2 px-4 text-xs font-orbitron"
                      >
                        <Settings className="w-4 h-4" />
                        УПРАВЛЕНИЕ
                      </Button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Layout Grid - Details sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Area: Description and Members */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Description */}
            <div className="bg-bg-secondary border border-border-subtle p-5 rounded-2xl space-y-3 shadow-xl">
              <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <span>📝 Описание клана</span>
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {team.description || 'Капитан пока не добавил описание клана.'}
              </p>
            </div>

            {/* Members List */}
            <div className="bg-bg-secondary border border-border-subtle p-5 rounded-2xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent-secondary" />
                  <span>Состав клана ({team.members.length} / {team.maxMembers})</span>
                </h3>
              </div>

              <div className="space-y-3">
                {team.members.map((member) => {
                  const user = member.user;
                  const formattedJoinDate = format(new Date(member.joinedAt), 'd MMM yyyy', { locale: ru });
                  const isUserCaptain = member.role === 'captain' || user.id === team.captainId;
                  const isUserVice = member.role === 'vice_captain';
                  const isUserMod = member.role === 'moderator';
                  
                  const isTargetSelf = user.id === currentUser?.id;
                  
                  return (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-xl border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                      style={
                        user.cardBannerUrl
                          ? {
                              backgroundImage: `linear-gradient(90deg, rgba(20, 20, 30, 0.95) 0%, rgba(20, 20, 30, 0.85) 100%), url(${user.cardBannerUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderColor: 'var(--border-subtle)'
                            }
                          : { backgroundColor: 'rgba(255, 255, 255, 0.01)' }
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/profile/${user.id}`}
                          className="w-10 h-10 rounded-lg border border-border-subtle bg-bg-primary flex items-center justify-center relative hover:border-accent-secondary transition-colors shrink-0"
                        >
                          <Avatar src={user.avatarUrl} alt={user.displayName || user.username} className="w-10 h-10 rounded-lg" />
                          {isUserCaptain && (
                            <Crown className="w-4 h-4 text-accent-warning absolute -top-2 -right-1.5 rotate-12" />
                          )}
                        </Link>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/profile/${user.id}`}
                              className="text-xs sm:text-sm font-bold text-white hover:text-accent-secondary transition-colors font-orbitron"
                            >
                              {user.displayName || user.username}
                            </Link>
                            {user.gender && <GenderIcon gender={user.gender as any} size="sm" />}
                            
                            {/* Badges for roles */}
                            {isUserCaptain ? (
                              <span className="text-[8px] bg-accent-warning/10 border border-accent-warning/30 text-accent-warning px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Лидер</span>
                            ) : isUserVice ? (
                              <span className="text-[8px] bg-accent-primary/10 border border-accent-primary/30 text-accent-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Зам</span>
                            ) : isUserMod ? (
                              <span className="text-[8px] bg-accent-secondary/10 border border-accent-secondary/30 text-accent-secondary px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Модер</span>
                            ) : (
                              <span className="text-[8px] bg-white/5 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Боец</span>
                            )}
                          </div>
                          <span className="text-[9px] text-gray-500 block">В клане с {formattedJoinDate}</span>
                        </div>
                      </div>

                      {/* Controls for Roles and Kick */}
                      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                        
                        {/* Role Selector Dropdown (Captain Only) */}
                        {canManageRoles && !isUserCaptain && !isTargetSelf && (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(user.id, user.displayName || user.username, e.target.value)}
                            className="bg-bg-primary border border-border-subtle rounded-lg text-[10px] text-gray-300 py-1 px-2 focus:outline-none"
                          >
                            <option value="member">Боец</option>
                            <option value="moderator">Модератор</option>
                            <option value="vice_captain">Зам. капитана</option>
                            <option value="captain">Передать капитанство</option>
                          </select>
                        )}

                        {/* Kick member button */}
                        {((isCaptain && !isUserCaptain) || (isViceCaptain && !isUserCaptain && !isUserVice)) && !isTargetSelf && (
                          <button
                            onClick={() => handleKick(user.id)}
                            title="Исключить игрока"
                            className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Area: Stats, Disciplines, Requests */}
          <div className="space-y-6">
            
            {/* Stats Block */}
            <div className="bg-bg-secondary border border-border-subtle p-5 rounded-2xl space-y-4 shadow-xl">
              <h3 className="font-orbitron font-bold text-xs text-gray-400 uppercase tracking-widest pb-2 border-b border-border-subtle">
                Статистика Битв
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                  <span className="text-[9px] uppercase text-green-400 font-bold block">Победы</span>
                  <span className="font-orbitron font-bold text-lg text-white">{team.wins}</span>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                  <span className="text-[9px] uppercase text-red-400 font-bold block">Поражения</span>
                  <span className="font-orbitron font-bold text-lg text-white">{team.losses}</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Винрейт</span>
                  <span className="font-orbitron font-bold text-white">
                    {team.wins + team.losses > 0 
                      ? ((team.wins / (team.wins + team.losses)) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-secondary to-accent-primary rounded-full"
                    style={{
                      width: `${
                        team.wins + team.losses > 0 
                          ? (team.wins / (team.wins + team.losses)) * 100 
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Game Disciplines */}
            <div className="bg-bg-secondary border border-border-subtle p-5 rounded-2xl space-y-3 shadow-xl">
              <h3 className="font-orbitron font-bold text-xs text-gray-400 uppercase tracking-widest pb-2 border-b border-border-subtle">
                Дисциплины
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {(team.supportedGames || [team.game]).map((gameId) => (
                  <Badge key={gameId} variant="blue" className="font-orbitron">
                    {getGameName(gameId)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Inbound Requests Panel (Moderators/Captains Only) */}
            {canManageRequests && (
              <div className="bg-bg-secondary border border-border-subtle p-5 rounded-2xl space-y-4 shadow-xl">
                <h3 className="font-orbitron font-bold text-xs text-gray-400 uppercase tracking-widest pb-2 border-b border-border-subtle flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-accent-primary" />
                  <span>Запросы на вступление</span>
                </h3>

                {pendingRequests.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic py-2 text-center">Нет новых заявок.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="rounded-xl border border-border-subtle p-3 bg-bg-tertiary/40 space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar src={req.user?.avatarUrl} alt={req.user?.displayName || req.user?.username || ''} className="w-7 h-7 rounded-lg" />
                          <div className="min-w-0 flex-1">
                            <Link href={`/profile/${req.user?.id}`} className="text-xs font-bold text-white hover:text-accent-secondary transition-colors truncate block">
                              {req.user?.displayName || req.user?.username}
                            </Link>
                            <span className="text-[8px] text-gray-500 block">Запрос на рассмотрении</span>
                          </div>
                        </div>

                        {req.message && (
                          <p className="text-[10px] text-gray-400 bg-black/40 p-1.5 rounded italic">
                            "{req.message}"
                          </p>
                        )}

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            onClick={() => handleRequestAction(req.id, 'reject')}
                            className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] transition-colors"
                          >
                            Отклонить
                          </button>
                          <button
                            onClick={() => handleRequestAction(req.id, 'approve')}
                            className="px-2.5 py-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 text-[10px] font-bold transition-colors"
                          >
                            Принять
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recruitment Join Module (For visitors) */}
            {currentUser && !isMember && (
              <div className="bg-bg-secondary border border-border-subtle p-5 rounded-2xl space-y-4 shadow-xl">
                <h3 className="font-orbitron font-bold text-xs text-gray-400 uppercase tracking-widest pb-1">
                  Присоединиться к клану
                </h3>
                {team.isRecruiting ? (
                  <>
                    {team.hasPendingRequest ? (
                      <Button variant="secondary" className="w-full text-xs font-orbitron" disabled>
                        Заявка на рассмотрении
                      </Button>
                    ) : team.membersCount >= team.maxMembers ? (
                      <Button variant="secondary" className="w-full text-xs font-orbitron" disabled>
                        Клан заполнен
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          value={joinMessage}
                          onChange={(e) => setJoinMessage(e.target.value)}
                          placeholder="Сообщение лидеру клана..."
                          rows={3}
                          className="w-full px-3 py-2 text-xs bg-bg-primary border border-border-subtle rounded-lg text-white"
                        />
                        <Button
                          onClick={handleJoin}
                          loading={joining}
                          variant="primary"
                          className="w-full text-xs font-orbitron font-bold"
                        >
                          Отправить заявку
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-red-400 italic text-center py-2 flex items-center justify-center gap-1.5 bg-red-500/5 border border-red-500/15 rounded-lg">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Набор в клан временно закрыт.</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Edit Settings Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !savingSettings && setIsEditModalOpen(false)}
        title="⚙️ Управление настройками клана"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          
          {/* Logo Input URL / File Upload */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-400 font-bold">Логотип клана (URL, картинка или GIF)</label>
            <div className="flex gap-2">
              <input
                value={editLogoUrl}
                onChange={(e) => setEditLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.gif или загрузите"
                className="flex-1 px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs text-white"
              />
              <div className="relative">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/gif"
                  onChange={handleLogoChange}
                  disabled={uploadingLogo}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                />
                <Button
                  variant="secondary"
                  disabled={uploadingLogo}
                  type="button"
                  className="py-2 px-3 text-xs shrink-0"
                >
                  {uploadingLogo ? '...' : 'Файл'}
                </Button>
              </div>
            </div>
            {editLogoUrl && (
              <div className="relative h-12 w-12 rounded-lg border border-border-subtle bg-bg-primary overflow-hidden mt-1.5">
                <img src={editLogoUrl} alt="Logo preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Banner Input URL / File Upload */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-400 font-bold">Баннер клана (URL, картинка или GIF)</label>
            <div className="flex gap-2">
              <input
                value={editBannerUrl}
                onChange={(e) => setEditBannerUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg или загрузите"
                className="flex-1 px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs text-white"
              />
              <div className="relative">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/gif"
                  onChange={handleBannerChange}
                  disabled={uploadingBanner}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                />
                <Button
                  variant="secondary"
                  disabled={uploadingBanner}
                  type="button"
                  className="py-2 px-3 text-xs shrink-0"
                >
                  {uploadingBanner ? '...' : 'Файл'}
                </Button>
              </div>
            </div>
            {editBannerUrl && (
              <div className="relative h-16 w-full rounded-lg border border-border-subtle bg-bg-primary overflow-hidden mt-1.5">
                <img src={editBannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-gray-400 font-bold">Тег команды</label>
              <input
                value={editTag}
                onChange={(e) => setEditTag(e.target.value.toUpperCase())}
                placeholder="TAG"
                maxLength={5}
                className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs text-white uppercase font-bold"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-gray-400 font-bold">Флаг / Регион</label>
              <div className="flex gap-2">
                <select
                  value={editFlag}
                  onChange={(e) => {
                    setEditFlag(e.target.value);
                    setEditCustomFlag('');
                  }}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs text-white"
                >
                  {FLAGS.map((f) => (
                    <option key={f.emoji} value={f.emoji}>
                      {f.emoji} {f.name}
                    </option>
                  ))}
                </select>
                <input
                  value={editCustomFlag}
                  onChange={(e) => setEditCustomFlag(e.target.value)}
                  placeholder="Свой эмодзи"
                  className="w-24 px-2 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs text-center text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-400 font-bold">Описание клана</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Введите описание вашего клана..."
              rows={3}
              className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs text-white resize-none"
            />
          </div>

          {/* Supported Games list (Multi-toggle) */}
          <div className="rounded-xl border border-border-subtle p-3 bg-bg-tertiary/40">
            <div className="text-[10px] uppercase font-orbitron text-gray-400 mb-2 font-bold flex justify-between items-center">
              <span>Игры клана (выберите 1-3) *</span>
              <span className="text-[8px] text-text-tertiary uppercase">Первая выбранная — основная</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GAMES.map((item) => {
                const selected = editSupportedGames.includes(item.id);
                const order = editSupportedGames.indexOf(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleEditSupportedGame(item.id)}
                    className={`relative flex flex-col items-center gap-1 py-2.5 rounded-lg border text-[11px] transition-all ${
                      selected
                        ? 'border-accent-primary bg-accent-primary/10 text-white font-semibold'
                        : 'border-border-subtle bg-bg-primary/50 text-text-secondary hover:border-border-default hover:text-white'
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-accent-primary rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                        {order === 0 ? '👑' : order + 1}
                      </span>
                    )}
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recruiting Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-bg-tertiary/40">
            <div>
              <div className="text-xs font-bold text-white">Набор в клан открыт</div>
              <div className="text-[10px] text-gray-500">Позволяет другим игрокам присылать заявки</div>
            </div>
            <input
              type="checkbox"
              checked={editRecruiting}
              onChange={(e) => setEditRecruiting(e.target.checked)}
              className="w-5 h-5 accent-accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={savingSettings}>
              Отмена
            </Button>
            <Button onClick={handleSaveSettings} loading={savingSettings}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Captain Confirmation Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="⚠️ Передача капитанства"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-300">
            Вы действительно хотите передать права капитана игроку{' '}
            <span className="font-bold text-white">{transferTargetName}</span>?
          </p>
          <div className="text-[10px] text-accent-danger bg-accent-danger/10 border border-accent-danger/20 p-3 rounded-lg flex items-start gap-2 leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              Внимание: вы перестанете быть лидером клана и будете понижены до должности Заместителя. Вернуть права капитана сможет только новый владелец.
            </span>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleConfirmTransfer} className="bg-red-600 hover:bg-red-500 border-none">
              Передать права
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
