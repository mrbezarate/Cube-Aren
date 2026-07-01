'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { Transaction, Bet, Tournament } from '@/types';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Coins, History, Swords, Landmark, CreditCard, ExternalLink, ShieldCheck, Star, User, Users, MessageSquare, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import TournamentCard from '@/components/tournaments/TournamentCard';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, refreshUser, isLoading } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'wallet' | 'bets' | 'tournaments' | 'saved'>('wallet');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [savedTournaments, setSavedTournaments] = useState<Tournament[]>([]);
  
  const [loadingTx, setLoadingTx] = useState(false);
  const [depositing, setDepositing] = useState(false);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoadingTx(true);
    try {
      const [walletData, betsData, tourData, savedData] = await Promise.all([
        api.users.getWallet(),
        api.bets.getMy(),
        api.tournaments.getAll({ limit: 50 }),
        api.tournaments.getSaved(),
      ]);
      setTransactions(walletData.transactions);
      setBets(betsData.data);
      setSavedTournaments(savedData.map((t) => ({ ...t, isSaved: true })));
      
      // Filter tournaments where the user is organizer or participant
      const relevantTours = tourData.data.filter(
        (t) => t.organizerId === user.id
      );
      setMyTournaments(relevantTours);
    } catch {
      toast.error('Ошибка загрузки данных кабинета');
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleDeposit = async () => {
    setDepositing(true);
    try {
      const res = await api.wallet.deposit(1000);
      toast.success(res.message);
      await refreshUser();
      loadDashboardData();
    } catch {
      toast.error('Ошибка пополнения баланса');
    } finally {
      setDepositing(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const txTypeLabels = {
    deposit: 'Пополнение (Демо)',
    withdrawal: 'Вывод средств',
    bet: 'Ставка на турнир',
    payout: 'Выплата по ставке',
    commission: 'Комиссия',
    entry_fee: 'Вступительный взнос',
    prize: 'Выигрыш в турнире',
    refund: 'Возврат кредитов',
  };

  const txTypeColors = {
    deposit: 'green',
    withdrawal: 'red',
    bet: 'gray',
    payout: 'gold',
    commission: 'red',
    entry_fee: 'red',
    prize: 'green',
    refund: 'blue',
  } as const;

  const betStatusLabels = {
    pending: 'Ожидает',
    won: 'Выиграна',
    lost: 'Проиграна',
    refunded: 'Возвращена',
  };

  const betStatusColors = {
    pending: 'gold',
    won: 'green',
    lost: 'red',
    refunded: 'blue',
  } as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex flex-col space-y-8">
      {/* User Info Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-arena-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-orbitron font-black text-2xl text-white uppercase tracking-wider">
              Личный кабинет
            </h1>
            <Badge variant="primary">{user.role}</Badge>
          </div>
          <span className="text-xs text-gray-400">Добро пожаловать, {user.username} ({user.email})</span>
        </div>

        {user.onboardingCompleted && (
          <div className="flex items-center gap-1 text-[10px] text-neon-green font-bold font-orbitron uppercase">
            <ShieldCheck className="w-4 h-4" /> Профиль верифицирован
          </div>
        )}
      </div>

      {/* Grid: Wallet and stats card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet balance & deposit */}
        <Card neonColor="gold" className="md:col-span-1 flex flex-col justify-between p-6">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-orbitron font-extrabold text-neon-gold tracking-widest block">
              Игровой Баланс
            </span>
            <div className="flex items-center gap-2 text-white">
              <Coins className="w-8 h-8 text-neon-gold animate-pulse" />
              <span className="font-orbitron font-black text-3xl neon-text-gold">
                {Number(user.credits).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-gray-400 font-orbitron uppercase">CR</span>
            </div>
            <p className="text-[10px] text-gray-400">Используйте кредиты для участия в боях или совершения ставок.</p>
          </div>

          <div className="pt-6">
            <Button
              onClick={handleDeposit}
              loading={depositing}
              variant="gold"
              className="w-full py-3 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> ПОЛУЧИТЬ +1,000 CR (ДЕМО)
            </Button>
          </div>
        </Card>

        {/* Stats card 1 */}
        <Card className="p-6 flex flex-col justify-center gap-2">
          <span className="text-[10px] uppercase font-orbitron font-bold text-gray-400 tracking-wider">
            Активных ставок
          </span>
          <span className="font-orbitron font-black text-3xl text-white">
            {bets.filter((b) => b.status === 'pending').length}
          </span>
          <span className="text-xs text-gray-400">Всего совершено ставок: {bets.length}</span>
        </Card>

        {/* Stats card 2 */}
        <Card className="p-6 flex flex-col justify-center gap-2">
          <span className="text-[10px] uppercase font-orbitron font-bold text-gray-400 tracking-wider">
            Создано турниров
          </span>
          <span className="font-orbitron font-black text-3xl text-white">
            {myTournaments.length}
          </span>
          <span className="text-xs text-gray-400">Активных в лобби: {myTournaments.filter((t) => t.status === 'open').length}</span>
        </Card>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href={`/profile/${user.id}`}>
          <Card className="p-4 hover:border-neon-purple transition-all cursor-pointer group h-full">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-neon-purple/10 group-hover:bg-neon-purple/20 transition-colors">
                <User className="w-6 h-6 text-neon-purple" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-sm text-white">Мой Профиль</h3>
                <p className="text-xs text-gray-400">Статистика и достижения</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/leaderboard">
          <Card className="p-4 hover:border-neon-gold transition-all cursor-pointer group h-full">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-neon-gold/10 group-hover:bg-neon-gold/20 transition-colors">
                <Trophy className="w-6 h-6 text-neon-gold" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-sm text-white">Лидеры</h3>
                <p className="text-xs text-gray-400">Таблица рейтингов</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/teams">
          <Card className="p-4 hover:border-neon-blue transition-all cursor-pointer group h-full">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-neon-blue/10 group-hover:bg-neon-blue/20 transition-colors">
                <Users className="w-6 h-6 text-neon-blue" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-sm text-white">Команда</h3>
                <p className="text-xs text-gray-400">Состав и кланы</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/friends">
          <Card className="p-4 hover:border-neon-green transition-all cursor-pointer group h-full">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-neon-green/10 group-hover:bg-neon-green/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-neon-green" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-sm text-white">Друзья</h3>
                <p className="text-xs text-gray-400">Подписки и взаимки</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/community">
          <Card className="p-4 hover:border-neon-green transition-all cursor-pointer group h-full">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-neon-green/10 group-hover:bg-neon-green/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-neon-green" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-sm text-white">Сообщество</h3>
                <p className="text-xs text-gray-400">Игровые доски</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>



      {/* Tabs Interface */}
      <div className="space-y-6">
        <div className="flex gap-2 border-b border-arena-border">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`pb-3 px-4 font-orbitron text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'wallet'
                ? 'border-neon-purple text-neon-purple neon-text-purple'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Landmark className="w-4 h-4" /> Кошелек
          </button>
          
          <button
            onClick={() => setActiveTab('bets')}
            className={`pb-3 px-4 font-orbitron text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'bets'
                ? 'border-neon-purple text-neon-purple neon-text-purple'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" /> Мои ставки
          </button>

          <button
            onClick={() => setActiveTab('tournaments')}
            className={`pb-3 px-4 font-orbitron text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'tournaments'
                ? 'border-neon-purple text-neon-purple neon-text-purple'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" /> Мои турниры
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-3 px-4 font-orbitron text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'saved'
                ? 'border-neon-purple text-neon-purple neon-text-purple'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" /> Сохранённые
          </button>
        </div>

        {/* Tab Content panels */}
        <div className="glass-panel border border-arena-border rounded-xl p-5 min-h-[250px]">
          {loadingTx ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Wallet panel */}
              {activeTab === 'wallet' && (
                <div className="space-y-4">
                  <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider">
                    История транзакций
                  </h3>
                  {transactions.length === 0 ? (
                    <div className="text-center py-12 text-sm text-gray-500">Транзакции отсутствуют.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-arena-border text-gray-400 uppercase font-orbitron">
                            <th className="pb-3">ID Транзакции</th>
                            <th className="pb-3">Тип операции</th>
                            <th className="pb-3">Описание</th>
                            <th className="pb-3 text-right">Сумма</th>
                            <th className="pb-3 text-right">Баланс после</th>
                            <th className="pb-3 text-right">Дата</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx) => {
                            const date = format(new Date(tx.createdAt), 'dd.MM.yyyy, HH:mm', { locale: ru });
                            const amountNum = Number(tx.amount);
                            const balanceNum = Number(tx.balanceAfter);
                            
                            return (
                              <tr key={tx.id} className="border-b border-arena-border/50 hover:bg-white/5">
                                <td className="py-3.5 font-mono text-[10px] text-gray-400">{tx.id.substring(0, 8)}...</td>
                                <td className="py-3.5">
                                  <Badge variant={txTypeColors[tx.type]}>
                                    {txTypeLabels[tx.type]}
                                  </Badge>
                                </td>
                                <td className="py-3.5 text-gray-300">{tx.description || '—'}</td>
                                <td className={`py-3.5 text-right font-orbitron font-extrabold ${amountNum > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                                  {amountNum > 0 ? `+${amountNum.toLocaleString()}` : amountNum.toLocaleString()} CR
                                </td>
                                <td className="py-3.5 text-right font-orbitron font-bold text-gray-300">
                                  {balanceNum.toLocaleString()} CR
                                </td>
                                <td className="py-3.5 text-right text-gray-400">{date}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Bets panel */}
              {activeTab === 'bets' && (
                <div className="space-y-4">
                  <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider">
                    Ваши прогнозы
                  </h3>
                  {bets.length === 0 ? (
                    <div className="text-center py-12 text-sm text-gray-500">Вы еще не делали ставок.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-arena-border text-gray-400 uppercase font-orbitron">
                            <th className="pb-3">Турнир</th>
                            <th className="pb-3">Сумма ставки</th>
                            <th className="pb-3">Статус прогноза</th>
                            <th className="pb-3 text-right">Выплата</th>
                            <th className="pb-3 text-right">Дата размещения</th>
                            <th className="pb-3 text-right">Детали</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bets.map((bet) => {
                            const date = format(new Date(bet.placedAt), 'dd.MM.yyyy, HH:mm', { locale: ru });
                            const amountNum = Number(bet.amount);
                            const payoutNum = bet.payout ? Number(bet.payout) : null;
                            
                            return (
                              <tr key={bet.id} className="border-b border-arena-border/50 hover:bg-white/5">
                                <td className="py-3.5 font-bold text-white max-w-[200px] truncate">
                                  {bet.tournament?.title || 'Архивный турнир'}
                                </td>
                                <td className="py-3.5 font-orbitron font-bold text-gray-300">
                                  {amountNum.toLocaleString()} CR
                                </td>
                                <td className="py-3.5">
                                  <Badge variant={betStatusColors[bet.status]}>
                                    {betStatusLabels[bet.status]}
                                  </Badge>
                                </td>
                                <td className="py-3.5 text-right font-orbitron font-extrabold text-neon-gold">
                                  {payoutNum ? `${payoutNum.toLocaleString()} CR` : '—'}
                                </td>
                                <td className="py-3.5 text-right text-gray-400">{date}</td>
                                <td className="py-3.5 text-right">
                                  <Link href={`/tournaments/${bet.tournament?.id}`} className="inline-flex items-center gap-1 text-neon-purple hover:underline">
                                    Открыть <ExternalLink className="w-3 h-3" />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tournaments panel */}
              {activeTab === 'tournaments' && (
                <div className="space-y-4">
                  <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider">
                    Созданные вами бои
                  </h3>
                  {myTournaments.length === 0 ? (
                    <div className="text-center py-12 text-sm text-gray-500">Вы еще не создали ни одного турнира.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myTournaments.map((tour) => {
                        const date = format(new Date(tour.startDate), 'd MMM yyyy, HH:mm', { locale: ru });
                        const fee = Number(tour.entryFee);

                        return (
                          <Card key={tour.id} className="p-4 hover:border-neon-purple/40 flex flex-col justify-between h-44">
                            <div className="space-y-1">
                              <Badge variant="blue">{tour.game}</Badge>
                              <h4 className="font-orbitron font-bold text-sm text-white uppercase line-clamp-1">{tour.title}</h4>
                              <span className="text-[10px] text-gray-400 block">{date}</span>
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-3 border-t border-arena-border">
                              <div className="text-[10px] text-gray-400 font-orbitron">
                                ВХОД: <span className="text-white font-bold">{fee === 0 ? 'FREE' : `${fee} CR`}</span>
                              </div>
                              <Link href={`/tournaments/${tour.id}`} className="text-xs font-orbitron font-bold text-neon-purple hover:underline">
                                Управление →
                              </Link>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Saved tournaments panel */}
              {activeTab === 'saved' && (
                <div className="space-y-4">
                  <h3 className="font-orbitron font-bold text-sm text-white uppercase tracking-wider">
                    Сохранённые турниры
                  </h3>
                  {savedTournaments.length === 0 ? (
                    <div className="text-center py-12 text-sm text-gray-500">
                      Вы ещё не сохранили ни одного турнира. Нажмите ★ на карточке турнира.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {savedTournaments.map((tour) => (
                        <TournamentCard key={tour.id} tournament={tour} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
