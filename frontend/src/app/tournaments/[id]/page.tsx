'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { Tournament, Participant, OddsData } from '@/types';
import { toast } from 'react-hot-toast';
import CountdownTimer from '@/components/three/CountdownTimer';
import ParticipantsList from '@/components/tournaments/ParticipantsList';
import BettingPanel from '@/components/betting/BettingPanel';
import OddsDisplay from '@/components/betting/OddsDisplay';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { Trophy, Coins, Users, Calendar, Shield, ArrowLeft, PenTool } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user, refreshUser } = useAuthStore();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [odds, setOdds] = useState<OddsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const fetchTournamentData = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const [tourData, partData, oddsData] = await Promise.all([
        api.tournaments.getOne(id),
        api.participants.getByTournament(id),
        api.bets.getOdds(id),
      ]);
      setTournament(tourData);
      setParticipants(partData);
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

  const handleJoin = async () => {
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
      await api.participants.join(tournament.id);
      await refreshUser();
      toast.success('Вы успешно зарегистрировались!');
      fetchTournamentData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка регистрации в турнире');
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

  const handleDeclareWinner = async (participantId: string) => {
    if (!tournament) return;
    const confirmWin = confirm('Вы уверены, что хотите объявить этого участника победителем? Это действие закроет турнир и распределит ставки.');
    if (!confirmWin) return;

    try {
      await api.participants.declareWinner(tournament.id, participantId);
      toast.success('Турнир успешно закрыт! Победитель объявлен.');
      fetchTournamentData();
    } catch {
      toast.error('Ошибка закрытия турнира');
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

  const isOrganizer = user ? user.id === tournament.organizerId : false;
  const isJoined = participants.some((p) => p.user.id === user?.id);
  const formattedDate = format(new Date(tournament.startDate), 'd MMMM yyyy, HH:mm', { locale: ru });

  const statusColors = {
    draft: 'gray',
    open: 'green',
    in_progress: 'blue',
    completed: 'purple',
    cancelled: 'red',
  } as const;

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
            <div className="flex items-center gap-2">
              <Badge variant={statusColors[tournament.status]}>{statusLabels[tournament.status]}</Badge>
              <Badge variant="blue">{tournament.game}</Badge>
              <Badge variant="gray">{tournament.format}</Badge>
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
            </div>
          </div>

          {/* Large Prize Info */}
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
        {/* Left Column: Description, Rules, Participants */}
        <div className="lg:col-span-2 space-y-8">
          {/* Details & Rules */}
          <div className="glass-panel border border-arena-border p-5 rounded-xl space-y-6">
            <div className="space-y-2">
              <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider">
                📄 Описание турнира
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {tournament.description || 'Примите участие в захватывающем подпольном соревновании. Сразитесь за банк, составленный из вступительных взносов участников!'}
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

          {/* Registered Participants */}
          <ParticipantsList
            participants={participants}
            tournament={tournament}
            isOrganizer={isOrganizer}
            onDeclareWinner={handleDeclareWinner}
          />
        </div>

        {/* Right Column: Timer, Register button, Betting panel, Odds */}
        <div className="space-y-6">
          {/* Countdown & Action */}
          {tournament.status === 'open' && (
            <div className="glass-panel border border-arena-border p-5 rounded-xl space-y-4 text-center">
              <h3 className="font-orbitron font-bold text-xs text-gray-400 uppercase tracking-widest">
                ВРЕМЯ ДО НАЧАЛА
              </h3>
              <CountdownTimer targetDate={tournament.startDate} />

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
                    onClick={handleJoin}
                    loading={joining}
                    variant="primary"
                    className="w-full py-3"
                  >
                    ЗАРЕГИСТРИРОВАТЬСЯ ({Number(tournament.entryFee) === 0 ? 'FREE' : `${Number(tournament.entryFee)} CR`})
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Betting Panel */}
          {(tournament.status === 'open' || tournament.status === 'in_progress') && (
            <BettingPanel
              tournamentId={tournament.id}
              participants={participants}
              odds={odds}
              onBetPlaced={fetchTournamentData}
            />
          )}

          {/* Odds Display */}
          <OddsDisplay odds={odds} />
        </div>
      </div>
    </div>
  );
}
