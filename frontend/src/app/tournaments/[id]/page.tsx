'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { Tournament, Participant, OddsData } from '@/types';
import { toast } from 'react-hot-toast';
import CountdownTimer from '@/components/three/CountdownTimer';
import ParticipantsList from '@/components/tournaments/ParticipantsList';
import TeamSlotPicker from '@/components/tournaments/TeamSlotPicker';
import BettingPanel from '@/components/betting/BettingPanel';
import OddsDisplay from '@/components/betting/OddsDisplay';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { Trophy, Coins, Users, Calendar, Shield, ArrowLeft, PenTool, Target, Swords, Globe, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useSocket } from '@/lib/hooks/useSocket';

const GAME_MODE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ffa: {
    label: 'FFA — Каждый сам за себя',
    icon: <Target className="w-3.5 h-3.5" />,
    color: '#f97316',
  },
  two_team: {
    label: '2 команды',
    icon: <Swords className="w-3.5 h-3.5" />,
    color: '#a855f7',
  },
  multi_team: {
    label: 'Несколько команд',
    icon: <Globe className="w-3.5 h-3.5" />,
    color: '#22d3ee',
  },
};

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user, refreshUser } = useAuthStore();
  const { socket } = useSocket();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [odds, setOdds] = useState<OddsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [selectedWinnerTeamSlot, setSelectedWinnerTeamSlot] = useState<number | null>(null);
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  const fetchTournamentData = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const [tourData, partData, oddsData] = await Promise.all([
        api.tournaments.getOne(id),
        api.participants.getByTournament(id),
        api.bets.getOdds(id),
      ]);
      setTournament(tourData);
      setParticipants(partData.filter((p: Participant) => p.user !== null));
      setOdds(oddsData);
    } catch (err) {
      toast.error('Ошибка загрузки данных турнира');
      router.push('/tournaments');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  useEffect(() => {
    if (!socket || !id || typeof id !== 'string') return;

    const handleTournamentUpdated = (data: { id: string }) => {
      if (data.id === id) {
        fetchTournamentData();
        refreshUser();
      }
    };

    const handleParticipantsUpdated = (data: { tournamentId: string }) => {
      if (data.tournamentId === id) {
        fetchTournamentData();
      }
    };

    const handleBetsUpdated = (data: { tournamentId: string }) => {
      if (data.tournamentId === id) {
        fetchTournamentData();
      }
    };

    socket.on('tournament_updated', handleTournamentUpdated);
    socket.on('participants_updated', handleParticipantsUpdated);
    socket.on('bets_updated', handleBetsUpdated);

    return () => {
      socket.off('tournament_updated', handleTournamentUpdated);
      socket.off('participants_updated', handleParticipantsUpdated);
      socket.off('bets_updated', handleBetsUpdated);
    };
  }, [socket, id, fetchTournamentData, refreshUser]);

  // FFA — обычная регистрация без слота
  const handleJoinFFA = async () => {
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы присоединиться к турниру');
      router.push('/auth/login');
      return;
    }
    if (!tournament) return;
    if (user && Number(user.credits) < Number(tournament.entryFee)) {
      toast.error('Недостаточно кредитов на балансе');
      return;
    }
    setJoining(true);
    try {
      await api.participants.join(tournament.id, {});
      await refreshUser();
      toast.success('Вы успешно зарегистрировались!');
      fetchTournamentData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка регистрации в турнире');
    } finally {
      setJoining(false);
    }
  };

  // Team mode — регистрация в выбранный слот
  const handleJoinTeamSlot = async (teamSlot: number, teamLabel?: string) => {
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы присоединиться к турниру');
      router.push('/auth/login');
      return;
    }
    if (!tournament) return;
    if (user && Number(user.credits) < Number(tournament.entryFee)) {
      toast.error('Недостаточно кредитов на балансе');
      return;
    }
    setJoining(true);
    try {
      await api.participants.join(tournament.id, { teamSlot, teamLabel });
      await refreshUser();
      toast.success('Вы успешно вступили в команду!');
      fetchTournamentData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setJoining(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!tournament) return;
    try {
      await api.tournaments.updateStatus(tournament.id, status);
      toast.success('Статус турнира успешно обновлен');
      fetchTournamentData();
    } catch {
      toast.error('Ошибка обновления статуса');
    }
  };

  const handleDeclareWinner = (participantId: string) => {
    setSelectedWinnerId(participantId);
    setSelectedWinnerTeamSlot(null);
    setCompleteModalOpen(true);
  };

  const handleDeclareWinnerTeamSlot = (teamSlot: number) => {
    setSelectedWinnerTeamSlot(teamSlot);
    setSelectedWinnerId(null);
    setCompleteModalOpen(true);
  };

  const confirmCompleteTournament = async () => {
    if (!tournament) return;
    setCompleteSubmitting(true);
    try {
      await api.participants.completeTournament(tournament.id, {
        winnerParticipantId: selectedWinnerId || undefined,
        winnerTeamSlot: selectedWinnerTeamSlot !== null ? selectedWinnerTeamSlot : undefined,
      });
      toast.success('Турнир успешно закрыт! Победитель объявлен и призы распределены.');
      setCompleteModalOpen(false);
      fetchTournamentData();
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка закрытия турнира');
    } finally {
      setCompleteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full flex-1 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
        <span className="mt-4 font-orbitron font-bold text-xs text-gray-400">ПОДКЛЮЧЕНИЕ К СЕРВЕРУ...</span>
      </div>
    );
  }

  if (!tournament) return null;

  const gameMode = tournament.gameMode ?? 'ffa';
  const isTeamMode = gameMode === 'two_team' || gameMode === 'multi_team';
  const isOrganizer = user ? user.id === tournament.organizerId : false;
  const isJoined = participants.some((p) => p.user?.id === user?.id);
  const formattedDate = format(new Date(tournament.startDate), 'd MMMM yyyy, HH:mm', { locale: ru });

  const modeMeta = GAME_MODE_LABELS[gameMode] ?? GAME_MODE_LABELS['ffa'];

  const statusColors: Record<string, 'gray' | 'green' | 'blue' | 'gold' | 'red'> = {
    draft: 'gray',
    open: 'green',
    in_progress: 'blue',
    completed: 'gold',
    cancelled: 'red',
  };

  const statusLabels = {
    draft: 'Черновик',
    open: 'Открыт',
    in_progress: 'В игре',
    completed: 'Завершен',
    cancelled: 'Отменен',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col space-y-8">
      {/* Navigation & Action Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-orbitron font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> НАЗАД
        </button>

        {isOrganizer && (
          <div className="flex gap-2 flex-wrap">
            {tournament.status === 'open' && (
              <Button variant="primary" size="sm" onClick={() => handleUpdateStatus('in_progress')}>
                Начать турнир
              </Button>
            )}
            {tournament.status === 'open' && (
              <Button variant="danger" size="sm" onClick={() => handleUpdateStatus('cancelled')}>
                Отменить
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Tournament Banner Details */}
      <Card neonColor={tournament.status === 'in_progress' ? 'blue' : 'purple'} className="p-6 relative">
        <div className="absolute top-0 right-0 w-[40%] h-full opacity-10 bg-gradient-to-l from-neon-purple via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusColors[tournament.status]}>{statusLabels[tournament.status]}</Badge>
              <Badge variant="blue">{tournament.game}</Badge>
              <Badge variant="gray">{tournament.format}</Badge>
              {/* Game Mode Badge */}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-orbitron font-bold"
                style={{
                  background: `${modeMeta.color}20`,
                  border: `1px solid ${modeMeta.color}50`,
                  color: modeMeta.color,
                }}
              >
                {modeMeta.icon}
                {modeMeta.label}
              </span>
            </div>

            <h1 className="font-orbitron font-extrabold text-2xl sm:text-3xl text-white uppercase tracking-wide">
              {tournament.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Орг: {tournament.organizer?.username || 'Система'}
              </span>
              {isTeamMode && tournament.teamsCount && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {tournament.teamsCount} команды × {tournament.teamSize ?? '?'} игроков
                </span>
              )}
            </div>
          </div>

          {/* Prize Pool */}
          <div className="p-4 rounded-xl bg-neon-gold/10 border border-neon-gold/30 text-right min-w-[200px] flex flex-col justify-center">
            <span className="text-[10px] uppercase font-orbitron font-extrabold text-neon-gold tracking-widest">
              Призовой фонд
            </span>
            <span className="font-orbitron font-black text-2xl text-white neon-text-gold">
              {Number(tournament.prizePool).toLocaleString()} CR
            </span>
          </div>
        </div>
      </Card>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description, Rules, Participants / Team Slots */}
        <div className="lg:col-span-2 space-y-8">
          {/* Details & Rules */}
          <div className="glass-panel border border-arena-border p-5 rounded-xl space-y-6">
            <div className="space-y-2">
              <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider">
                📄 Описание турнира
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {tournament.description ||
                  'Примите участие в захватывающем подпольном соревновании. Сразитесь за банк, составленный из вступительных взносов участников!'}
              </p>
            </div>

            {tournament.rules && (
              <div className="space-y-2 pt-4 border-t border-arena-border">
                <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider flex items-center gap-1">
                  <PenTool className="w-4 h-4 text-neon-purple" />
                  <span>Правила турнира</span>
                </h3>
                <p className="text-gray-400 text-sm whitespace-pre-line leading-relaxed">
                  {tournament.rules}
                </p>
              </div>
            )}
          </div>

          {/* Team Slots (for team modes) */}
          {isTeamMode && tournament.status === 'open' && (
            <div className="glass-panel border border-arena-border p-5 rounded-xl">
              <TeamSlotPicker
                gameMode={gameMode as 'two_team' | 'multi_team'}
                teamsCount={tournament.teamsCount ?? (gameMode === 'two_team' ? 2 : 3)}
                teamSize={tournament.teamSize}
                participants={participants}
                currentUserId={user?.id}
                alreadyJoined={isJoined}
                onJoin={handleJoinTeamSlot}
                loading={joining}
              />
            </div>
          )}

          {/* Registered Participants */}
          <ParticipantsList
            participants={participants}
            tournament={tournament}
            isOrganizer={isOrganizer}
            onDeclareWinner={handleDeclareWinner}
            onDeclareWinnerTeamSlot={handleDeclareWinnerTeamSlot}
          />
        </div>

        {/* Right Column: Timer, Register button (FFA only), Betting panel, Odds */}
        <div className="space-y-6">
          {/* Countdown & Action */}
          {tournament.status === 'open' && (
            <div className="glass-panel border border-arena-border p-5 rounded-xl space-y-4 text-center">
              <h3 className="font-orbitron font-bold text-xs text-gray-400 uppercase tracking-widest">
                ВРЕМЯ ДО НАЧАЛА
              </h3>
              <CountdownTimer targetDate={tournament.startDate} />

              {/* FFA: simple join button here. Team: handled by TeamSlotPicker */}
              {!isTeamMode && (
                <div className="pt-2">
                  {isJoined ? (
                    <Button variant="secondary" className="w-full" disabled>
                      ВЫ УЧАСТВУЕТЕ
                    </Button>
                  ) : tournament.currentParticipants >= tournament.maxParticipants ? (
                    <Button variant="secondary" className="w-full" disabled>
                      НЕТ СЛОТОВ
                    </Button>
                  ) : (
                    <Button
                      onClick={handleJoinFFA}
                      loading={joining}
                      variant="primary"
                      className="w-full py-3"
                    >
                      ЗАРЕГИСТРИРОВАТЬСЯ (
                      {Number(tournament.entryFee) === 0 ? 'FREE' : `${Number(tournament.entryFee)} CR`})
                    </Button>
                  )}
                </div>
              )}

              {/* Team mode hint */}
              {isTeamMode && !isJoined && (
                <p className="text-xs text-gray-500 pt-2">
                  ⬅️ Выберите командный слот слева для регистрации
                </p>
              )}
              {isTeamMode && isJoined && (
                <Button variant="secondary" className="w-full" disabled>
                  ВЫ В КОМАНДЕ
                </Button>
              )}
            </div>
          )}

          {/* Betting Panel */}
          {(tournament.status === 'open' || tournament.status === 'in_progress') && (
            <BettingPanel
              tournamentId={tournament.id}
              participants={participants}
              odds={odds}
              onBetPlaced={fetchTournamentData}
              gameMode={gameMode}
              teamsCount={tournament.teamsCount}
            />
          )}

          {/* Odds Display */}
          <OddsDisplay odds={odds} />
        </div>
      </div>
      
      {completeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-arena-card border border-arena-border w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div>
              <h3 className="font-orbitron font-extrabold text-white text-lg tracking-wider uppercase flex items-center gap-2">
                🏆 ЗАВЕРШЕНИЕ ТУРНИРА
              </h3>
              <p className="text-xs text-gray-400 mt-1">Шаг подтверждения для организатора</p>
            </div>

            {/* Content */}
            <div className="space-y-4 text-sm text-gray-300">
              <p>
                Вы действительно хотите закрыть турнир <strong className="text-white">«{tournament.title}»</strong> и объявить победителем:
              </p>
              
              <div className="p-3 bg-arena-dark/50 border border-arena-border/50 rounded-xl flex items-center gap-3">
                <Crown className="w-5 h-5 text-neon-gold shrink-0" />
                <span className="font-bold text-white text-base">
                  {selectedWinnerTeamSlot !== null 
                    ? `Команда Слот #${selectedWinnerTeamSlot}` 
                    : (participants.find(p => p.id === selectedWinnerId)?.user?.username || 'Выбранный участник')
                  }
                </span>
              </div>

              <div className="space-y-2.5 text-xs border-l-2 border-neon-gold pl-3 py-1">
                <p>⚠️ Это действие является окончательным и приведет к следующим результатам:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Турнир перейдет в статус <strong className="text-white">«Завершен»</strong>.</li>
                  <li>Распределится призовой фонд турнира (CR) среди победителей.</li>
                  <li>Будут пересчитаны ELO-рейтинги игроков (+25 / -15).</li>
                  <li>Ставки будут распределены по системе Pari-Mutuel.</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                disabled={completeSubmitting}
                onClick={() => setCompleteModalOpen(false)}
                className="px-4 py-2 text-xs font-orbitron font-bold text-gray-400 hover:text-white uppercase tracking-wider rounded-lg transition-colors border border-transparent hover:border-arena-border"
              >
                Отмена
              </button>
              <button
                disabled={completeSubmitting}
                onClick={confirmCompleteTournament}
                className="px-5 py-2 text-xs font-orbitron font-extrabold text-arena-dark bg-neon-gold hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {completeSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-arena-dark border-t-transparent rounded-full animate-spin" />
                    ОБРАБОТКА...
                  </>
                ) : (
                  'Да, завершить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
