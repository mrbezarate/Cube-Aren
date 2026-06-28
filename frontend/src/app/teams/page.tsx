'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Check, Crown, Plus, Shield, Sword, Trophy, Users, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { GameType, Team, TeamJoinRequest } from '@/types';

const GAMES: { id: GameType; name: string }[] = [
  { id: 'cs2', name: 'CS2' },
  { id: 'dota2', name: 'Dota 2' },
  { id: 'valorant', name: 'Valorant' },
  { id: 'lol', name: 'LoL' },
  { id: 'pubg', name: 'PUBG' },
  { id: 'apex', name: 'Apex' },
];

const getGameName = (game: GameType) => GAMES.find((item) => item.id === game)?.name || game;

export default function TeamsPage() {
  const { user, refreshUser } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [captainRequests, setCaptainRequests] = useState<TeamJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [game, setGame] = useState<GameType>('cs2');
  const [supportedGames, setSupportedGames] = useState<GameType[]>(['cs2']);
  const [joinMessages, setJoinMessages] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [allTeams, memberTeams, pendingRequests] = await Promise.all([
        api.teams.getAll({ limit: 24 }),
        user ? api.teams.getMy() : Promise.resolve([]),
        user ? api.teams.getMyRequests() : Promise.resolve([]),
      ]);
      setTeams(allTeams.data);
      setMyTeams(memberTeams);
      setCaptainRequests(pendingRequests);
    } catch {
      toast.error('Не удалось загрузить команды');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useEffect(() => {
    setSupportedGames((prev) => {
      const next = Array.from(new Set([game, ...prev]));
      return next.slice(0, 3);
    });
  }, [game]);

  const myTeamIds = useMemo(() => new Set(myTeams.map((team) => team.id)), [myTeams]);

  const toggleSupportedGame = (gameId: GameType) => {
    if (gameId === game) {
      return;
    }

    setSupportedGames((prev) => {
      if (prev.includes(gameId)) {
        return prev.filter((item) => item !== gameId);
      }

      if (prev.length >= 3) {
        toast.error('У клана может быть максимум 3 игры');
        return prev;
      }

      return [...prev, gameId];
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Введите название клана');
      return;
    }

    if (supportedGames.length === 0) {
      toast.error('Выберите хотя бы одну игру для клана');
      return;
    }
    
    setIsConfirmModalOpen(true);
  };

  const handleConfirmCreate = async () => {
    setIsConfirmModalOpen(false);

    setCreating(true);
    try {
      await api.teams.create({
        name: name.trim(),
        tag: tag.trim().toUpperCase() || undefined,
        description: description.trim() || undefined,
        game,
        supportedGames,
      });
      await refreshUser();
      toast.success('Клан создан');
      setName('');
      setTag('');
      setDescription('');
      setSupportedGames([game]);
      setIsCreateModalOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось создать клан');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (teamId: string) => {
    setJoiningId(teamId);
    try {
      await api.teams.join(teamId, {
        message: joinMessages[teamId]?.trim() || undefined,
      });
      toast.success('Заявка отправлена');
      setJoinMessages((prev) => ({ ...prev, [teamId]: '' }));
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось отправить заявку');
    } finally {
      setJoiningId(null);
    }
  };

  const handleRequestAction = async (teamId: string, requestId: string, mode: 'approve' | 'reject') => {
    setRequestActionId(requestId);
    try {
      if (mode === 'approve') {
        await api.teams.approveRequest(teamId, requestId);
        toast.success('Заявка одобрена');
      } else {
        await api.teams.rejectRequest(teamId, requestId);
        toast.success('Заявка отклонена');
      }
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось обработать заявку');
    } finally {
      setRequestActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-arena-dark py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-orbitron font-black text-4xl text-white uppercase">Команды</h1>
            <p className="text-gray-400 mt-2">Здесь собраны все кланы списком: справа заявка, сверху модерация капитана, создание отдельно через кнопку снизу.</p>
          </div>
          <div className="rounded-xl border border-neon-blue/30 bg-neon-blue/10 px-4 py-3 text-sm text-neon-blue">
            Создатель может вести до 4 кланов и принимать запросы как капитан.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-neon-gold" />
              <h2 className="font-orbitron font-bold text-white">Мои кланы</h2>
            </div>
            {loading ? (
              <div className="text-gray-400">Загрузка...</div>
            ) : myTeams.length === 0 ? (
              <div className="text-gray-500">Вы пока не состоите ни в одном клане.</div>
            ) : (
              <div className="space-y-3">
                {myTeams.map((team) => (
                  <div key={team.id} className="rounded-xl border border-arena-border p-4 bg-white/5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-orbitron font-bold text-white">
                          {team.name} {team.tag ? <span className="text-neon-blue">[{team.tag}]</span> : null}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {(team.supportedGames || [team.game]).map(getGameName).join(' · ')}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                          {team.myRole === 'captain' ? <Crown className="w-3.5 h-3.5 text-neon-gold" /> : <Shield className="w-3.5 h-3.5 text-neon-blue" />}
                          роль: {team.myRole || 'member'}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-neon-purple font-bold">{Number(team.rating).toFixed(0)} TRP</div>
                        <div className="text-gray-400">{team.membersCount}/{team.maxMembers} игроков</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-neon-purple" />
              <h2 className="font-orbitron font-bold text-white">Заявки капитану</h2>
            </div>
            {!user ? (
              <div className="text-gray-500">Войдите, чтобы видеть заявки.</div>
            ) : loading ? (
              <div className="text-gray-400">Загрузка...</div>
            ) : captainRequests.length === 0 ? (
              <div className="text-gray-500">У ваших кланов пока нет новых заявок.</div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
                {captainRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-arena-border p-4 bg-white/5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={request.user.avatarUrl || '/default-avatar.svg'}
                          alt={request.user.username}
                          className="w-12 h-12 rounded-xl border border-arena-border object-cover"
                        />
                        <div>
                          <div className="font-orbitron font-bold text-white">
                            {request.user.displayName || request.user.username}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            @{request.user.username} · {request.teamName}
                          </div>
                          {request.message ? (
                            <div className="text-sm text-gray-500 mt-2">{request.message}</div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRequestAction(request.teamId, request.id, 'approve')}
                          loading={requestActionId === request.id}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Принять
                        </Button>
                        <Button
                          onClick={() => handleRequestAction(request.teamId, request.id, 'reject')}
                          loading={requestActionId === request.id}
                          variant="secondary"
                          className="flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-neon-purple" />
            <h2 className="font-orbitron font-bold text-white">Открытые кланы</h2>
          </div>
          {loading ? (
            <div className="text-gray-400">Загрузка...</div>
          ) : teams.length === 0 ? (
            <div className="text-gray-500">Пока нет доступных кланов.</div>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => {
                const isMyTeam = myTeamIds.has(team.id);
                return (
                  <div key={team.id} className="rounded-xl border border-arena-border p-4 bg-white/5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="font-orbitron font-bold text-white">
                          {team.name} {team.tag ? <span className="text-neon-blue">[{team.tag}]</span> : null}
                        </div>
                        <div className="text-sm text-gray-400">Капитан: {team.captainName || 'Неизвестно'}</div>
                        <div className="text-sm text-gray-500">
                          {(team.supportedGames || [team.game]).map(getGameName).join(' · ')}
                        </div>
                        {team.description ? <div className="text-sm text-gray-500">{team.description}</div> : null}
                        <div className="text-xs text-gray-500">
                          {team.membersCount}/{team.maxMembers} игроков · заявок: {team.pendingRequestsCount || 0}
                        </div>
                      </div>

                      <div className="w-full lg:w-[340px] space-y-3">
                        <div className="text-right text-sm">
                          <div className="text-neon-purple font-bold">{Number(team.rating).toFixed(0)} TRP</div>
                        </div>
                        {user && !isMyTeam ? (
                          <>
                            <textarea
                              value={joinMessages[team.id] || ''}
                              onChange={(e) => setJoinMessages((prev) => ({ ...prev, [team.id]: e.target.value }))}
                              placeholder="Короткое сообщение капитану"
                              className="w-full min-h-[84px] px-3 py-2 bg-arena-dark border border-arena-border rounded-lg text-white"
                            />
                            <Button
                              onClick={() => handleJoin(team.id)}
                              loading={joiningId === team.id}
                              variant={team.hasPendingRequest ? 'secondary' : 'primary'}
                              className="w-full"
                              disabled={team.hasPendingRequest}
                            >
                              {team.hasPendingRequest ? 'Заявка уже отправлена' : 'Подать заявку'}
                            </Button>
                          </>
                        ) : isMyTeam ? (
                          <div className="rounded-lg border border-neon-blue/30 bg-neon-blue/10 px-3 py-3 text-sm text-neon-blue text-center">
                            Вы уже в этом клане
                          </div>
                        ) : (
                          <div className="rounded-lg border border-arena-border px-3 py-3 text-sm text-gray-500 text-center">
                            Войдите, чтобы подать заявку
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="fixed bottom-6 right-6 z-30">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-full px-6 py-4 shadow-2xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Создать клан
          </Button>
        </div>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            if (!creating) {
              setIsCreateModalOpen(false);
            }
          }}
          title="Создание клана"
        >
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              Клан стоит 400 CR, может играть максимум в 3 дисциплины и создаётся только после подтверждения.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название клана"
                className="px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white"
              />
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                placeholder="Тег"
                className="px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white"
              />
            </div>

            <select
              value={game}
              onChange={(e) => setGame(e.target.value as GameType)}
              className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white"
            >
              {GAMES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Короткое описание клана"
              className="min-h-[120px] w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white"
            />

            <div className="rounded-xl border border-arena-border p-4 bg-white/5">
              <div className="text-xs uppercase font-orbitron text-gray-400 mb-3">Игры клана</div>
              <div className="flex flex-wrap gap-2">
                {GAMES.map((item) => {
                  const isPrimary = item.id === game;
                  const isSelected = supportedGames.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSupportedGame(item.id)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        isPrimary
                          ? 'border-neon-purple bg-neon-purple/15 text-white'
                          : isSelected
                            ? 'border-neon-blue bg-neon-blue/10 text-white'
                            : 'border-arena-border bg-white/5 text-gray-300'
                      }`}
                    >
                      {item.name}
                      {isPrimary ? ' · основная' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)} disabled={creating}>
                Отмена
              </Button>
              <Button onClick={handleCreate} loading={creating}>
                Дальше
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            if (!creating) {
              setIsConfirmModalOpen(false);
            }
          }}
          title="Подтверждение"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Создать клан <span className="font-semibold text-white">{name || 'без названия'}</span> за <span className="text-neon-gold font-semibold">400 CR</span>?
            </p>
            <div className="rounded-xl border border-arena-border bg-white/5 p-4 text-sm text-gray-400">
              Основная игра: {getGameName(game)}. Доп. игры: {supportedGames.map(getGameName).join(' · ')}.
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)} disabled={creating}>
                Назад
              </Button>
              <Button onClick={handleConfirmCreate} loading={creating}>
                Подтвердить создание
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
