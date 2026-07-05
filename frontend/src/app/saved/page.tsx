'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Bookmark, Calendar, Search, Star, Trash2, Trophy, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { Tournament } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Tabs, { TabsList, TabsTrigger } from '@/components/ui/Tabs';

type SavedFilter = 'all' | Tournament['status'];

const STATUS_LABELS: Record<Tournament['status'], string> = {
  draft: 'Черновик',
  open: 'Открыт',
  in_progress: 'В игре',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

const STATUS_BADGES: Record<Tournament['status'], React.ComponentProps<typeof Badge>['variant']> = {
  draft: 'gray',
  open: 'green',
  in_progress: 'blue',
  completed: 'gray',
  cancelled: 'red',
};

export default function SavedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [items, setItems] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<SavedFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadSaved = async () => {
      setLoading(true);
      try {
        const data = await api.tournaments.getSaved();
        setItems(data.map((item) => ({ ...item, isSaved: true })));
      } catch {
        toast.error('Не удалось загрузить сохраненные турниры');
      } finally {
        setLoading(false);
      }
    };

    loadSaved();
  }, [isAuthenticated]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesFilter = filter === 'all' || item.status === filter;
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.game.toLowerCase().includes(query) ||
        item.format.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [filter, items, search]);

  const handleUnsave = async (id: string) => {
    setRemovingId(id);
    try {
      await api.tournaments.unsave(id);
      setItems((current) => current.filter((item) => item.id !== id));
      toast.success('Турнир удален из сохраненных');
    } catch {
      toast.error('Не удалось удалить турнир');
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-6 lg:flex-row lg:items-end">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-warning/15 text-accent-warning">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Сохраненное</h1>
            <p className="text-sm text-text-secondary">Турниры, к которым вы хотите вернуться позже.</p>
          </div>
        </div>

        <Link href="/tournaments">
          <Button variant="secondary" className="w-full sm:w-auto">
            <Trophy className="h-4 w-4" />
            Найти турниры
          </Button>
        </Link>
      </div>

      <Card hover={false}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию, игре или формату"
            icon={<Search className="h-4 w-4" />}
            wrapperClassName="w-full lg:max-w-md"
          />

          <Tabs value={filter} onValueChange={(value) => setFilter(value as SavedFilter)}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="open">Открытые</TabsTrigger>
              <TabsTrigger value="in_progress">В игре</TabsTrigger>
              <TabsTrigger value="completed">Завершенные</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-xl border border-border-subtle bg-bg-secondary" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <Card hover={false} className="py-14 text-center">
          <Star className="mx-auto h-10 w-10 text-text-muted" />
          <h2 className="mt-4 text-lg font-semibold text-text-primary">Ничего не найдено</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Сохраните турнир через звезду на карточке турнира или измените фильтр.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <Card key={item.id} hover className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Badge variant={STATUS_BADGES[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                  <h2 className="line-clamp-2 text-lg font-semibold text-text-primary">{item.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnsave(item.id)}
                  disabled={removingId === item.id}
                  className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-accent-danger/10 hover:text-accent-danger disabled:opacity-50"
                  title="Удалить из сохраненных"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-bg-tertiary p-3">
                  <div className="text-xs text-text-tertiary">Игра</div>
                  <div className="mt-1 font-semibold text-text-primary">{item.game}</div>
                </div>
                <div className="rounded-lg bg-bg-tertiary p-3">
                  <div className="text-xs text-text-tertiary">Формат</div>
                  <div className="mt-1 font-semibold text-text-primary">{item.format}</div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent-secondary" />
                  {format(new Date(item.startDate), 'dd MMM yyyy, HH:mm', { locale: ru })}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent-primary" />
                  {item.currentParticipants} / {item.maxParticipants} участников
                </div>
              </div>

              <div className="mt-auto pt-5">
                <Link href={`/tournaments/${item.id}`}>
                  <Button variant="secondary" className="w-full">
                    Открыть турнир
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
