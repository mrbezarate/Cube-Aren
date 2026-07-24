'use client';

import React, { useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { GameType, Team } from '@/types';
import Card from '@/components/ui/Card';
import {
  Crown, Users, Trophy, Plus, Search, Shield,
  Star, MessageSquare, AlertCircle, Check, X,
  ChevronRight
} from 'lucide-react';

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────
const GAMES: { id: GameType; label: string; icon: string }[] = [
  { id: 'cs2',      label: 'CS2',            icon: '🔫' },
  { id: 'dota2',    label: 'Dota 2',         icon: '⚔️' },
  { id: 'valorant', label: 'Valorant',       icon: '🎯' },
  { id: 'lol',      label: 'League of Legends', icon: '🔮' },
  { id: 'pubg',     label: 'PUBG',           icon: '🪂' },
  { id: 'apex',     label: 'Apex Legends',   icon: '⚡' },
];

const FLAGS = [
  '🇷🇺', '🇪🇺', '🇺🇸', '🇯🇵', '🇰🇷', '🇧🇷',
  '👑', '👽', '🏴‍☠️', '🔥', '⚡', '💀',
];

const getGame = (id: GameType) => GAMES.find(g => g.id === id);

// ────────────────────────────────────────────────────────────────────
// Small game badge
// ────────────────────────────────────────────────────────────────────
function GameTag({ id }: { id: GameType }) {
  const g = getGame(id);
  if (!g) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-accent-primary/15 text-accent-primary">
      {g.icon} {g.label}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────
// Team Card (styled like TournamentCard)
// ────────────────────────────────────────────────────────────────────
function TeamCard({ team, isMyTeam, onJoin, joinLoading, joinMsg, onMsgChange }: {
  team: Team;
  isMyTeam: boolean;
  onJoin: (id: string) => void;
  joinLoading: boolean;
  joinMsg: string;
  onMsgChange: (v: string) => void;
}) {
  const games: GameType[] = team.supportedGames?.length ? team.supportedGames : (team.game ? [team.game] : []);
  const winTotal = (team.wins || 0) + (team.losses || 0);
  const winRate = winTotal > 0 ? Math.round((team.wins / winTotal) * 100) : 0;
  const fillPct = team.maxMembers > 0 ? Math.min((team.membersCount / team.maxMembers) * 100, 100) : 0;

  return (
    <Card className="flex flex-col h-full group" hover>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Logo / Avatar */}
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary border border-border-subtle flex items-center justify-center text-xl shrink-0 overflow-hidden">
            {team.logoUrl
              ? <img src={team.logoUrl} alt="" className="w-full h-full object-cover" />
              : (team.flag || getGame(team.game)?.icon || '🛡️')
            }
          </div>
          <div>
            <Link
              href={`/teams/${team.id}`}
              className="text-base font-semibold text-text-primary group-hover:text-accent-primary transition-colors line-clamp-1"
            >
              {team.name}
            </Link>
            {team.tag && (
              <span className="text-xs text-text-tertiary font-mono">[{team.tag}]</span>
            )}
          </div>
        </div>

        {/* Recruiting badge */}
        {team.isRecruiting && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-accent-success/15 text-accent-success shrink-0">
            Набор
          </span>
        )}
      </div>

      {/* Description */}
      {team.description && (
        <p className="text-sm text-text-secondary line-clamp-2 mb-4">
          {team.description}
        </p>
      )}

      {/* Games */}
      {games.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {games.map(g => <GameTag key={g} id={g} />)}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-tertiary">
          <Trophy className="w-4 h-4 text-accent-warning" />
          <div>
            <div className="text-sm font-semibold text-text-primary">{Number(team.rating || 0).toFixed(0)}</div>
            <div className="text-xs text-text-tertiary">TRP</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-tertiary">
          <Users className="w-4 h-4 text-accent-primary" />
          <div>
            <div className="text-sm font-semibold text-text-primary">{team.membersCount} / {team.maxMembers}</div>
            <div className="text-xs text-text-tertiary">Игроков</div>
          </div>
        </div>
      </div>

      {/* W/L and fill bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
          <span className="text-accent-success font-medium">{team.wins}W</span>
          <span>{winRate}% побед</span>
          <span className="text-accent-danger font-medium">{team.losses}L</span>
        </div>
        <div className="h-1.5 w-full bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500"
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>

      {/* Members fill */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-text-tertiary mb-1">
          <span>Состав</span>
          <span>{Math.round(fillPct)}% заполнен</span>
        </div>
        <div className="h-1 w-full bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-primary/60 transition-all duration-500"
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* Captain */}
      <div className="text-xs text-text-tertiary mb-4">
        <Crown className="inline w-3 h-3 mr-1 text-accent-warning" />
        {(team as any).captainName || 'Неизвестно'}
      </div>

      {/* Join / status */}
      {isMyTeam ? (
        <div className="mt-auto w-full py-2.5 text-center text-sm font-medium text-text-secondary bg-bg-tertiary rounded-lg">
          ✓ Вы в этом клане
        </div>
      ) : (
        <div className="mt-auto space-y-2">
          <input
            type="text"
            value={joinMsg}
            onChange={e => onMsgChange(e.target.value)}
            placeholder="Сообщение (необязательно)"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border-subtle rounded-lg text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary"
          />
          <button
            onClick={() => onJoin(team.id)}
            disabled={joinLoading || (team as any).hasPendingRequest || !team.isRecruiting}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
              (team as any).hasPendingRequest
                ? 'bg-bg-tertiary text-text-muted cursor-default'
                : !team.isRecruiting
                  ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed'
                  : 'bg-accent-primary/15 hover:bg-accent-primary/25 text-accent-primary border border-accent-primary/30'
            }`}
          >
            {(team as any).hasPendingRequest ? 'Заявка отправлена' : !team.isRecruiting ? 'Набор закрыт' : 'Подать заявку'}
          </button>
        </div>
      )}
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────
// My Clan row (sidebar)
// ────────────────────────────────────────────────────────────────────
function MyClanRow({ team }: { team: Team }) {
  const games: GameType[] = team.supportedGames?.length ? team.supportedGames : (team.game ? [team.game] : []);
  const roleLabel: Record<string, string> = {
    captain: '👑 Лидер', vice_captain: '🛡️ Зам', moderator: '⚡ Модер', member: '⚔️ Боец',
  };
  return (
    <Link
      href={`/teams/${team.id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-tertiary transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-bg-tertiary border border-border-subtle flex items-center justify-center text-sm shrink-0 overflow-hidden">
        {team.logoUrl ? <img src={team.logoUrl} alt="" className="w-full h-full object-cover" /> : (team.flag || '🛡️')}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-text-primary group-hover:text-accent-primary transition-colors truncate">
          {team.name} {team.tag ? <span className="text-text-tertiary font-mono text-xs">[{team.tag}]</span> : null}
        </div>
        <div className="text-xs text-text-tertiary">{roleLabel[(team as any).myRole] || '⚔️ Участник'}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
    </Link>
  );
}

// ────────────────────────────────────────────────────────────────────
// Create Clan Modal
// ────────────────────────────────────────────────────────────────────
function CreateClanModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { refreshUser } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGames, setSelectedGames] = useState<GameType[]>([]); // starts EMPTY
  const [selectedFlag, setSelectedFlag] = useState('');

  const toggleGame = (id: GameType) => {
    setSelectedGames(prev => {
      if (prev.includes(id)) return prev.filter(g => g !== id);
      if (prev.length >= 3) { toast.error('Максимум 3 игры'); return prev; }
      return [...prev, id];
    });
  };

  const validate = () => {
    if (!name.trim() || name.trim().length < 3) { toast.error('Название минимум 3 символа'); return false; }
    if (name.trim().length > 30) { toast.error('Название максимум 30 символов'); return false; }
    if (tag && !/^[A-Za-z0-9]{2,5}$/.test(tag)) { toast.error('Тег: 2-5 символов, только латиница и цифры'); return false; }
    if (selectedGames.length === 0) { toast.error('Выберите хотя бы одну игру'); return false; }
    return true;
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      await api.teams.create({
        name: name.trim(),
        tag: tag.trim().toUpperCase() || undefined,
        description: description.trim() || undefined,
        supportedGames: selectedGames,
        flag: selectedFlag || undefined,
      });
      await refreshUser();
      toast.success('Клан создан! 🎉');
      onClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка при создании клана');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-10 w-full max-w-lg bg-bg-secondary border border-border-default rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {step === 1 ? 'Создать клан' : 'Подтверждение'}
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">Стоимость создания: <span className="text-accent-warning font-medium">400 CR</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Name + Tag */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Название *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Например: Shadow Force"
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Тег (2-5 симв.)</label>
                <input
                  value={tag}
                  onChange={e => setTag(e.target.value.toUpperCase())}
                  placeholder="SF"
                  maxLength={5}
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Описание</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Расскажите о вашем клане..."
                rows={2}
                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary resize-none"
              />
            </div>

            {/* Game selection — EMPTY by default, user picks 1-3 */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Игры * <span className="text-text-tertiary font-normal">(выберите 1-3)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {GAMES.map((g, idx) => {
                  const selected = selectedGames.includes(g.id);
                  const order = selectedGames.indexOf(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGame(g.id)}
                      className={`relative flex flex-col items-center gap-1.5 py-3 rounded-lg border text-sm transition-all ${
                        selected
                          ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                          : 'border-border-subtle bg-bg-tertiary text-text-secondary hover:border-border-default hover:text-text-primary'
                      }`}
                    >
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-accent-primary rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                          {order + 1}
                        </span>
                      )}
                      <span className="text-xl">{g.icon}</span>
                      <span className="text-xs font-medium">{g.label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedGames.length === 0 && (
                <p className="text-xs text-accent-warning mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Выберите хотя бы одну игру
                </p>
              )}
            </div>

            {/* Flag */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Флаг / Эмблема</label>
              <div className="flex flex-wrap gap-2">
                {FLAGS.map(f => (
                  <button
                    key={f}
                    onClick={() => setSelectedFlag(f === selectedFlag ? '' : f)}
                    className={`text-xl w-9 h-9 rounded-lg border transition-all flex items-center justify-center ${
                      selectedFlag === f
                        ? 'border-accent-primary bg-accent-primary/15'
                        : 'border-border-subtle bg-bg-tertiary hover:border-border-default'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default text-sm font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => validate() && setStep(2)}
                className="flex-1 py-2.5 rounded-lg bg-accent-primary text-white hover:bg-accent-primary-hover text-sm font-semibold transition-colors"
              >
                Продолжить →
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-border-subtle bg-bg-tertiary p-4 space-y-3 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Название</span>
                <span className="font-semibold text-text-primary">{name}{tag ? ` [${tag}]` : ''}</span>
              </div>
              <div className="flex justify-between items-start text-text-secondary">
                <span>Игры</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {selectedGames.map(g => <GameTag key={g} id={g} />)}
                </div>
              </div>
              {selectedFlag && (
                <div className="flex justify-between text-text-secondary">
                  <span>Флаг</span>
                  <span className="text-xl">{selectedFlag}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border-subtle text-text-secondary">
                <span>Спишется</span>
                <span className="font-bold text-accent-warning">−400 CR</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default text-sm font-medium transition-colors"
              >
                ← Назад
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-accent-success/15 border border-accent-success/30 text-accent-success hover:bg-accent-success/25 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Создаём...' : '✓ Создать клан'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────
function TeamsPageContent() {
  const { user } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinMsgs, setJoinMsgs] = useState<Record<string, string>>({});

  const searchParams = useSearchParams();
  const router = useRouter();
  const isSearchMode = searchParams.get('search') === 'true';

  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState<GameType | ''>('');
  const [tab, setTab] = useState<'all' | 'recruiting'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, myRes, reqRes] = await Promise.all([
        api.teams.getAll({ limit: 200 }),
        user ? api.teams.getMy() : Promise.resolve([]),
        user ? api.teams.getMyRequests() : Promise.resolve([]),
      ]);
      
      if (user && Array.isArray(myRes) && myRes.length > 0 && !isSearchMode) {
        const mainClan = myRes.find((t: any) => t.myRole === 'captain') || myRes[0];
        if (mainClan && mainClan.myRole) {
          router.push(`/teams/${mainClan.id}`);
          return;
        }
      }

      setTeams(allRes.data);
      setMyTeams(myRes);
      setPendingRequests(reqRes);
    } catch {
      toast.error('Не удалось загрузить кланы');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const myTeamIds = useMemo(() => new Set(myTeams.map(t => t.id)), [myTeams]);

  const filtered = useMemo(() => {
    return teams.filter(t => {
      const games: GameType[] = t.supportedGames?.length ? t.supportedGames : (t.game ? [t.game] : []);
      const matchesGame = !gameFilter || games.includes(gameFilter as GameType);
      const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.tag?.toLowerCase().includes(search.toLowerCase());
      const matchesTab = tab === 'all' || t.isRecruiting;
      return matchesGame && matchesSearch && matchesTab;
    });
  }, [teams, gameFilter, search, tab]);

  const handleJoin = async (id: string) => {
    setJoiningId(id);
    try {
      await api.teams.join(id, { message: joinMsgs[id]?.trim() || undefined });
      toast.success('Заявка отправлена!');
      setJoinMsgs(prev => ({ ...prev, [id]: '' }));
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка при отправке заявки');
    } finally {
      setJoiningId(null);
    }
  };

  const handleRequestAction = async (teamId: string, requestId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await api.teams.approveRequest(teamId, requestId);
      else await api.teams.rejectRequest(teamId, requestId);
      toast.success(action === 'approve' ? 'Игрок принят!' : 'Заявка отклонена');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 flex flex-col space-y-8">
      {showCreate && (
        <CreateClanModal onClose={() => setShowCreate(false)} onSuccess={load} />
      )}

      {/* ── Page Header (same pattern as tournaments & friends) ── */}
      <div className="border-b border-arena-border pb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-orbitron font-black text-2xl sm:text-3xl text-white uppercase tracking-wider flex items-center gap-3">
            <Shield className="w-7 h-7 text-accent-primary" />
            Кланы
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Создайте клан, наберите команду и участвуйте в турнирах Underground Arena.
          </p>
        </div>

        {user && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-primary text-white hover:bg-accent-primary-hover text-sm font-semibold transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Создать клан
            <span className="text-accent-warning/80 text-xs font-normal">400 CR</span>
          </button>
        )}
      </div>

      {/* ── Main layout: sidebar + grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

        {/* ── LEFT SIDEBAR ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* My Clans */}
          <div className="bg-bg-secondary border border-border-subtle rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent-primary" />
                Мои кланы
              </h2>
              <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">
                {myTeams.length}
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myTeams.length === 0 ? (
              <p className="text-xs text-text-tertiary italic text-center py-4">
                Вы пока не состоите в кланах
              </p>
            ) : (
              <div className="space-y-1">
                {myTeams.map(t => <MyClanRow key={t.id} team={t} />)}
              </div>
            )}
          </div>

          {/* Captain's pending requests */}
          {user && pendingRequests.length > 0 && (
            <div className="bg-bg-secondary border border-border-subtle rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-accent-secondary" />
                <h2 className="text-sm font-semibold text-text-primary">Заявки</h2>
                <span className="ml-auto text-xs text-white bg-accent-primary px-2 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto">
                {pendingRequests.map((req: any) => (
                  <div key={req.id} className="rounded-lg border border-border-subtle bg-bg-tertiary p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={req.user?.avatarUrl || '/default-avatar.svg'}
                        alt=""
                        className="w-6 h-6 rounded-lg border border-border-subtle object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <Link href={`/profile/${req.user?.id}`} className="text-xs font-medium text-text-primary hover:text-accent-primary truncate block">
                          {req.user?.displayName || req.user?.username}
                        </Link>
                        <span className="text-[10px] text-text-tertiary">{req.teamName}</span>
                      </div>
                    </div>
                    {req.message && (
                      <p className="text-xs text-text-secondary italic mb-2">"{req.message}"</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequestAction(req.teamId, req.id, 'reject')}
                        className="flex-1 py-1 rounded-lg text-xs font-medium bg-accent-danger/10 text-accent-danger hover:bg-accent-danger/20 transition-colors"
                      >
                        Отклонить
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.teamId, req.id, 'approve')}
                        className="flex-1 py-1 rounded-lg text-xs font-medium bg-accent-success/10 text-accent-success hover:bg-accent-success/20 transition-colors"
                      >
                        Принять
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Filters + Grid ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Filter bar (same style as TournamentFilters) */}
          <div className="bg-bg-secondary border border-border-subtle rounded-xl p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по названию или тегу..."
                className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary"
              />
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-lg border border-border-subtle overflow-hidden">
                {(['all', 'recruiting'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      tab === t
                        ? 'bg-accent-primary text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {t === 'all' ? 'Все кланы' : '🟢 Набор открыт'}
                  </button>
                ))}
              </div>
            </div>

            {/* Game filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setGameFilter('')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  !gameFilter
                    ? 'bg-accent-primary text-white border-accent-primary'
                    : 'bg-bg-tertiary text-text-secondary border-border-subtle hover:border-border-default hover:text-text-primary'
                }`}
              >
                Все игры
              </button>
              {GAMES.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGameFilter(gameFilter === g.id ? '' : g.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border flex items-center gap-1.5 ${
                    gameFilter === g.id
                      ? 'bg-accent-primary text-white border-accent-primary'
                      : 'bg-bg-tertiary text-text-secondary border-border-subtle hover:border-border-default hover:text-text-primary'
                  }`}
                >
                  <span>{g.icon}</span>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <p className="text-xs text-text-tertiary">
            Найдено кланов: <span className="text-text-secondary font-medium">{filtered.length}</span>
          </p>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 rounded-xl bg-bg-secondary border border-border-subtle animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-text-tertiary">
              <div className="text-5xl mb-4">🏴</div>
              <p className="text-sm">Кланов не найдено. Станьте первым!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((team, idx) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <TeamCard
                    team={team}
                    isMyTeam={myTeamIds.has(team.id)}
                    onJoin={handleJoin}
                    joinLoading={joiningId === team.id}
                    joinMsg={joinMsgs[team.id] || ''}
                    onMsgChange={v => setJoinMsgs(prev => ({ ...prev, [team.id]: v }))}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-zinc-500 font-orbitron uppercase tracking-widest text-sm animate-pulse">Загрузка...</div>}>
      <TeamsPageContent />
    </Suspense>
  );
}
