'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CreditCard, History, Plus, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { Transaction } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Tabs, { TabsList, TabsTrigger } from '@/components/ui/Tabs';

type TransactionFilter = 'all' | Transaction['type'];

const TX_LABELS: Record<Transaction['type'], string> = {
  deposit: 'Пополнение',
  withdrawal: 'Вывод',
  bet: 'Ставка',
  payout: 'Выплата',
  commission: 'Комиссия',
  entry_fee: 'Взнос',
  prize: 'Приз',
  refund: 'Возврат',
};

const TX_BADGES: Record<Transaction['type'], React.ComponentProps<typeof Badge>['variant']> = {
  deposit: 'green',
  withdrawal: 'red',
  bet: 'gray',
  payout: 'gold',
  commission: 'red',
  entry_fee: 'red',
  prize: 'green',
  refund: 'blue',
};

export default function WalletPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, refreshUser } = useAuthStore();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [filter, setFilter] = useState<TransactionFilter>('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadWallet = async () => {
      setLoading(true);
      try {
        const [balanceData, txData] = await Promise.all([
          api.wallet.getBalance(),
          api.wallet.getTransactions({ page: 1, limit: 50 }),
        ]);
        setBalance(Number(balanceData.credits));
        setTransactions(txData.data);
      } catch {
        toast.error('Не удалось загрузить кошелек');
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, [isAuthenticated]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((transaction) => transaction.type === filter);
  }, [filter, transactions]);

  const handleDeposit = async () => {
    setDepositing(true);
    try {
      const result = await api.wallet.deposit(1000);
      toast.success(result.message || 'Баланс пополнен');
      setTransactions((current) => [result.transaction, ...current]);
      setBalance(Number(result.transaction.balanceAfter));
      await refreshUser();
    } catch {
      toast.error('Ошибка пополнения баланса');
    } finally {
      setDepositing(false);
    }
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-6 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-primary/15 text-accent-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Кошелек</h1>
              <p className="text-sm text-text-secondary">Баланс и история движения кредитов.</p>
            </div>
          </div>
        </div>

        <Button onClick={handleDeposit} loading={depositing} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Получить 1,000 CR
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card hover={false} className="lg:col-span-1">
          <div className="flex items-center gap-3 text-text-secondary">
            <CreditCard className="h-5 w-5 text-accent-warning" />
            <span className="text-sm font-medium">Текущий баланс</span>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-bold text-text-primary">{balance.toLocaleString()}</span>
            <span className="pb-1 text-sm font-semibold text-text-tertiary">CR</span>
          </div>
          <p className="mt-3 text-sm text-text-secondary">
            Кредиты используются для участия в турнирах, ставок и выплат.
          </p>
        </Card>

        <Card hover={false} className="lg:col-span-2">
          <div className="flex items-center gap-3 text-text-secondary">
            <History className="h-5 w-5 text-accent-secondary" />
            <span className="text-sm font-medium">Сводка</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-bg-tertiary p-4">
              <div className="text-xs text-text-tertiary">Всего операций</div>
              <div className="mt-1 text-2xl font-semibold text-text-primary">{transactions.length}</div>
            </div>
            <div className="rounded-lg bg-bg-tertiary p-4">
              <div className="text-xs text-text-tertiary">Пополнений</div>
              <div className="mt-1 text-2xl font-semibold text-accent-success">
                {transactions.filter((item) => item.type === 'deposit').length}
              </div>
            </div>
            <div className="rounded-lg bg-bg-tertiary p-4">
              <div className="text-xs text-text-tertiary">Ставок и взносов</div>
              <div className="mt-1 text-2xl font-semibold text-accent-warning">
                {transactions.filter((item) => item.type === 'bet' || item.type === 'entry_fee').length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card hover={false} padding="none">
        <div className="flex flex-col gap-4 border-b border-border-subtle p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">История транзакций</h2>
            <p className="text-sm text-text-secondary">Последние операции по вашему аккаунту.</p>
          </div>

          <Tabs value={filter} onValueChange={(value) => setFilter(value as TransactionFilter)}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="deposit">Пополнения</TabsTrigger>
              <TabsTrigger value="bet">Ставки</TabsTrigger>
              <TabsTrigger value="payout">Выплаты</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-text-tertiary">
            Операций по выбранному фильтру нет.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle text-xs uppercase text-text-tertiary">
                <tr>
                  <th className="px-5 py-3 font-medium">Тип</th>
                  <th className="px-5 py-3 font-medium">Описание</th>
                  <th className="px-5 py-3 text-right font-medium">Сумма</th>
                  <th className="px-5 py-3 text-right font-medium">Баланс после</th>
                  <th className="px-5 py-3 text-right font-medium">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredTransactions.map((transaction) => {
                  const amount = Number(transaction.amount);
                  const balanceAfter = Number(transaction.balanceAfter);

                  return (
                    <tr key={transaction.id} className="hover:bg-bg-tertiary/50">
                      <td className="px-5 py-4">
                        <Badge variant={TX_BADGES[transaction.type]}>
                          {TX_LABELS[transaction.type]}
                        </Badge>
                      </td>
                      <td className="max-w-sm px-5 py-4 text-text-secondary">
                        {transaction.description || 'Без описания'}
                      </td>
                      <td className={`px-5 py-4 text-right font-semibold ${amount >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                        {amount >= 0 ? '+' : ''}
                        {amount.toLocaleString()} CR
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-text-primary">
                        {balanceAfter.toLocaleString()} CR
                      </td>
                      <td className="px-5 py-4 text-right text-text-tertiary">
                        {format(new Date(transaction.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
