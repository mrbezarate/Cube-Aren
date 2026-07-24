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
  const myMembership = team?.members?.find((m) => m.user.id === currentUser?.id);
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
    <div className="min-h-screen bg-[#0a0a0c] pb-16 font-sans text-gray-300">
      
      {/* Hidden Upload Inputs */}
      <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
      <input type="file" ref={bannerInputRef} onChange={handleBannerChange} accept="image/*" className="hidden" />

      {/* Navigation */}
      <div className="w-full bg-black/80 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-orbitron font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Назад в штаб
          </button>
        </div>
      </div>

      {/* Clan Hero Section */}
      <div className="relative mb-20">
        {/* Banner Base with angular cut */}
        <div 
          className="h-64 sm:h-96 w-full relative overflow-hidden"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 80%, 95% 100%, 0 100%)',
            backgroundImage: team.bannerUrl 
              ? `linear-gradient(to top, rgba(10,10,12,1) 0%, rgba(10,10,12,0.4) 100%), url(${team.bannerUrl})` 
              : 'linear-gradient(45deg, #0a0a0c, #1a1a24)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-600 to-transparent opacity-50" />
        </div>

        {/* Content Wrapper overlapping the banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-24 sm:-mt-40 relative z-10 flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-end">
          
          {/* Hexagon Logo */}
          <div className="relative shrink-0 group z-20">
            <div 
              className="w-32 h-32 sm:w-56 sm:h-56 bg-zinc-900 p-1 shadow-[0_0_50px_rgba(202,138,4,0.15)] transition-all duration-500 group-hover:shadow-[0_0_80px_rgba(202,138,4,0.3)] relative"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-transparent pointer-events-none" />
              <div 
                className="w-full h-full bg-[#0d0d12] flex items-center justify-center overflow-hidden"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                {team.logoUrl ? (
                  <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-110 transition-all duration-700" />
                ) : (
                  <Shield className="h-16 w-16 sm:h-24 sm:w-24 text-zinc-700 group-hover:text-yellow-600 transition-colors" />
                )}
              </div>
            </div>
            
            {/* Rank overlay */}
            <div 
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-black font-orbitron px-8 py-2 text-xs sm:text-sm tracking-widest shadow-[0_4px_20px_rgba(202,138,4,0.5)] whitespace-nowrap" 
              style={{ clipPath: 'polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)' }}
            >
              TRP: {Number(team.rating).toFixed(0)}
            </div>
          </div>

          {/* Text Info */}
          <div className="flex-1 pb-4 md:pb-8 w-full z-10">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <h1 className="font-orbitron font-black text-4xl sm:text-6xl text-white uppercase tracking-tighter drop-shadow-2xl leading-none">
                    {team.name}
                  </h1>
                  {team.tag && (
                    <span className="text-yellow-500 text-3xl sm:text-5xl font-black font-orbitron tracking-widest opacity-90 leading-none">
                      [{team.tag}]
                    </span>
                  )}
                  <span className="text-2xl sm:text-4xl ml-2 drop-shadow-md leading-none" title="Регион">{team.flag || '🏴'}</span>
                </div>

                <div className="flex items-center gap-4 sm:gap-8 text-xs sm:text-sm text-zinc-400 font-mono uppercase tracking-widest flex-wrap">
                  <span className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 border border-zinc-800/50" style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}>
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    Основан: <span className="text-zinc-200">{formattedDate}</span>
                  </span>
                  <span className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 border border-zinc-800/50" style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}>
                    <Crown className="w-4 h-4 text-yellow-500" />
                    Коммандер: 
                    <Link href={`/profile/${team.captainId}`} className="text-white hover:text-yellow-400 font-bold transition-colors">
                      {team.captainName || 'Капитан'}
                    </Link>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full xl:w-auto">
                {canManageSettings && (
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-8 py-3.5 font-orbitron font-bold uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-3 border border-zinc-700/50 group shadow-lg"
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                  >
                    <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Управление
                  </button>
                )}

                {!isCaptain && !isMember && team.isRecruiting && !team.hasPendingRequest && (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black px-10 py-3.5 font-orbitron font-black uppercase tracking-widest transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(202,138,4,0.3)] hover:shadow-[0_0_30px_rgba(202,138,4,0.5)]"
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                  >
                    {joining ? 'Отправка...' : 'Вступить в ряды'}
                  </button>
                )}

                {!isCaptain && !isMember && team.hasPendingRequest && (
                  <div 
                    className="flex-1 sm:flex-none bg-zinc-900 text-yellow-500 px-8 py-3.5 font-orbitron font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 border border-yellow-600/30 shadow-inner"
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                  >
                    <Check className="w-4 h-4" /> Ожидание ответа
                  </div>
                )}

                {isMember && !isCaptain && (
                  <button
                    
                    className="flex-1 sm:flex-none bg-zinc-900 hover:bg-red-950 text-red-500 hover:text-red-400 px-8 py-3.5 font-orbitron font-bold uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-3 border border-zinc-800 hover:border-red-900/50"
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                  >
                    <UserX className="w-4 h-4" /> Покинуть клан
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Grid - Details sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Info Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Description */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-900 opacity-50 group-hover:opacity-100 transition-opacity" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}></div>
            <div className="bg-[#111116] p-6 relative" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
              <h3 className="font-orbitron font-black text-sm text-zinc-500 uppercase tracking-widest flex items-center gap-3 mb-4">
                <span className="w-2 h-2 bg-yellow-600 rounded-sm"></span>
                Устав / Описание
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line font-mono">
                {team.description || 'Капитан пока не добавил описание клана.'}
              </p>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b-2 border-zinc-800/50">
              <h3 className="font-orbitron font-black text-lg text-white uppercase tracking-widest flex items-center gap-3">
                <Users className="w-5 h-5 text-yellow-600" />
                Личный состав <span className="text-zinc-500 text-sm">[{team.members.length}/{team.maxMembers}]</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="relative bg-[#111116] border border-zinc-800/80 p-4 flex flex-col justify-between transition-all hover:bg-[#16161c] hover:border-zinc-700 group"
                    style={{
                      clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
                      backgroundImage: user.cardBannerUrl 
                        ? `linear-gradient(90deg, rgba(17,17,22,0.95) 0%, rgba(17,17,22,0.85) 100%), url(${user.cardBannerUrl})`
                        : 'none',
                      backgroundSize: 'cover'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar Wrapper */}
                      <Link
                        href={`/profile/${user.id}`}
                        className="w-12 h-12 border-2 border-zinc-800 bg-black flex items-center justify-center relative hover:border-yellow-600 transition-colors shrink-0"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' }}
                      >
                        <Avatar src={user.avatarUrl} alt={user.displayName || user.username} className="w-full h-full" />
                        {isUserCaptain && (
                          <div className="absolute -top-1 -right-1 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,1)]">
                            <Crown className="w-4 h-4 fill-current" />
                          </div>
                        )}
                      </Link>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/profile/${user.id}`}
                            className="text-sm font-black text-white hover:text-yellow-500 transition-colors font-orbitron truncate uppercase tracking-wide"
                          >
                            {user.displayName || user.username}
                          </Link>
                          {user.gender && <GenderIcon gender={user.gender as any} size="sm" />}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {/* Role Badges */}
                          {isUserCaptain ? (
                            <span className="text-[9px] bg-yellow-600/10 border border-yellow-600/30 text-yellow-500 px-1.5 py-0.5 uppercase font-black tracking-widest">Лидер</span>
                          ) : isUserVice ? (
                            <span className="text-[9px] bg-orange-600/10 border border-orange-600/30 text-orange-500 px-1.5 py-0.5 uppercase font-black tracking-widest">Зам</span>
                          ) : isUserMod ? (
                            <span className="text-[9px] bg-blue-600/10 border border-blue-600/30 text-blue-500 px-1.5 py-0.5 uppercase font-black tracking-widest">Модер</span>
                          ) : (
                            <span className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 uppercase font-bold tracking-widest">Боец</span>
                          )}
                          <span className="text-[9px] text-zinc-500 font-mono">с {formattedJoinDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls for Roles and Kick */}
                    <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/50">
                      {canManageRoles && !isUserCaptain && !isTargetSelf && (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(user.id, user.displayName || user.username, e.target.value)}
                          className="bg-black border border-zinc-800 text-[10px] text-zinc-300 py-1 px-2 uppercase font-bold tracking-wider focus:border-yellow-600 focus:outline-none transition-colors"
                          style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                        >
                          <option value="member">Боец</option>
                          <option value="moderator">Модератор</option>
                          <option value="vice_captain">Зам. капитана</option>
                          <option value="captain">Сделать Лидером</option>
                        </select>
                      )}

                      {((isCaptain && !isUserCaptain) || (isViceCaptain && !isUserCaptain && !isUserVice)) && !isTargetSelf && (
                        <button
                          onClick={() => handleKick(user.id)}
                          title="Исключить игрока"
                          className="p-1 bg-zinc-900 border border-zinc-800 hover:border-red-900 text-zinc-600 hover:text-red-500 transition-colors"
                          style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          
          {/* Stats Block */}
          <div className="bg-[#111116] border border-zinc-800/80 p-5 relative" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
            <h3 className="font-orbitron font-black text-xs text-zinc-500 uppercase tracking-widest pb-3 border-b border-zinc-800/50 mb-4">
              Боевая Статистика
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gradient-to-br from-green-900/20 to-transparent border border-green-900/30 p-3 text-center" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                <span className="text-[10px] uppercase text-green-500 font-black tracking-widest block mb-1">Победы</span>
                <span className="font-orbitron font-black text-2xl text-white">{team.wins}</span>
              </div>
              <div className="bg-gradient-to-br from-red-900/20 to-transparent border border-red-900/30 p-3 text-center" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                <span className="text-[10px] uppercase text-red-500 font-black tracking-widest block mb-1">Поражения</span>
                <span className="font-orbitron font-black text-2xl text-white">{team.losses}</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-600/10 to-transparent border border-yellow-600/20 p-3 flex items-center justify-between" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
              <span className="text-[10px] uppercase text-yellow-600 font-black tracking-widest">Винрейт</span>
              <span className="font-orbitron font-black text-xl text-yellow-500">{winRate}%</span>
            </div>
          </div>

          {/* Supported Games */}
          <div className="bg-[#111116] border border-zinc-800/80 p-5 relative" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
            <h3 className="font-orbitron font-black text-xs text-zinc-500 uppercase tracking-widest pb-3 border-b border-zinc-800/50 mb-4 flex items-center gap-2">
              <Swords className="w-4 h-4 text-zinc-400" />
              Дисциплины
            </h3>
            {team.supportedGames && team.supportedGames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {team.supportedGames.map(gameId => {
                  const game = GAMES.find(g => g.id === gameId);
                  return (
                    <div 
                      key={gameId}
                      className="bg-black border border-zinc-800 px-3 py-1.5 flex items-center gap-1.5 group hover:border-yellow-600 transition-colors"
                      style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                    >
                      <span className="grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{game?.icon || '🎮'}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-yellow-500">{getGameName(gameId as any)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-600 font-mono uppercase">Дисциплины не указаны</p>
            )}
          </div>

          {/* Pending Requests */}
          {canManageRequests && (
            <div className="bg-[#111116] border border-zinc-800/80 p-5 relative" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
              <h3 className="font-orbitron font-black text-xs text-zinc-500 uppercase tracking-widest pb-3 border-b border-zinc-800/50 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-zinc-400" />
                Рекрутинг ({pendingRequests.length})
              </h3>
              
              {pendingRequests.length === 0 ? (
                <p className="text-xs text-zinc-600 font-mono uppercase text-center py-4">Нет новых заявок</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="bg-black border border-zinc-800 p-3" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                      <div className="flex items-center gap-3 mb-3">
                        <Link href={`/profile/${req.user.id}`}>
                          <Avatar src={req.user.avatarUrl} alt={req.user.displayName || req.user.username} className="w-8 h-8 rounded-none border border-zinc-700" />
                        </Link>
                        <div>
                          <Link
                            href={`/profile/${req.user.id}`}
                            className="text-xs font-black font-orbitron uppercase text-white hover:text-yellow-500 transition-colors block"
                          >
                            {req.user.displayName || req.user.username}
                          </Link>
                          <span className="text-[9px] text-zinc-500 font-mono">{format(new Date(req.createdAt), 'd MMM HH:mm', { locale: ru })}</span>
                        </div>
                      </div>
                      
                      {req.message && (
                        <div className="bg-zinc-900/50 p-2 mb-3 text-[10px] text-zinc-400 border-l-2 border-zinc-700 font-mono">
                          {req.message}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          
                          className="flex-1 bg-green-900/20 hover:bg-green-900/40 text-green-500 border border-green-900/50 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                          style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                        >
                          <UserCheck className="w-3 h-3" /> Принять
                        </button>
                        <button
                          
                          className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                          style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                        >
                          <X className="w-3 h-3" /> Отклонить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal (unchanged styling for now, just wrapped in standard modal) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !savingSettings && setIsEditModalOpen(false)}
        title="Настройки клана"
      >
        <div className="space-y-5">
          
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-400 font-bold">Тег (1-5 символов)</label>
            <input
              value={editTag}
              onChange={(e) => setEditTag(e.target.value.toUpperCase())}
              maxLength={5}
              placeholder="TAG"
              className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs font-orbitron font-bold text-white focus:border-accent-secondary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-400 font-bold">Флаг/Регион</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {FLAGS.map(f => (
                <button
                  key={f.emoji}
                  onClick={() => setEditFlag(f.emoji)}
                  className={`p-2 rounded-lg border transition-all text-xl ${
                    editFlag === f.emoji 
                      ? 'border-accent-secondary bg-accent-secondary/10' 
                      : 'border-border-subtle bg-bg-primary hover:border-gray-500'
                  }`}
                  title={f.name}
                >
                  {f.emoji}
                </button>
              ))}
            </div>
            <input
              value={editCustomFlag}
              onChange={(e) => {
                setEditCustomFlag(e.target.value);
                setEditFlag(e.target.value);
              }}
              placeholder="Свой эмодзи (опционально)"
              className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-400 font-bold">Описание клана</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Расскажите о вашем клане, правилах, целях..."
              rows={4}
              className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs text-white focus:border-accent-secondary outline-none resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-400 font-bold">Игры</label>
            <div className="flex flex-wrap gap-2">
              {GAMES.map(game => (
                <button
                  key={game.id}
                  onClick={() => toggleEditSupportedGame(game.id)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase flex items-center gap-1.5 transition-all ${
                    editSupportedGames.includes(game.id)
                      ? 'border-accent-secondary bg-accent-secondary/10 text-white'
                      : 'border-border-subtle bg-bg-primary text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className={editSupportedGames.includes(game.id) ? '' : 'grayscale opacity-50'}>{game.icon}</span>
                  {game.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-bg-primary border border-border-subtle rounded-lg cursor-pointer hover:border-gray-600 transition-colors"
               onClick={() => setEditRecruiting(!editRecruiting)}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              editRecruiting ? 'bg-accent-secondary border-accent-secondary' : 'border-gray-600'
            }`}>
              {editRecruiting && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-white block">Открытый набор</span>
              <span className="text-[10px] text-gray-400">Разрешить игрокам подавать заявки на вступление</span>
            </div>
          </div>

          {/* Logo Input URL / File Upload */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-400 font-bold">Логотип (URL или картинка)</label>
            <div className="flex gap-2">
              <input
                value={editLogoUrl}
                onChange={(e) => setEditLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png или загрузите"
                className="flex-1 px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs text-white"
              />
              <div className="relative">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/gif"
                  onChange={handleLogoChange}
                  disabled={uploadingLogo}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
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
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={savingSettings}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSaveSettings} loading={savingSettings}>
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
            <Button variant="danger" onClick={handleConfirmTransfer}>
              Передать права
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
