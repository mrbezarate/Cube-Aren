'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, MessageSquare, PenSquare, Search, Sparkles, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { CommunityBoardStats, CommunityPost, CommunityTag, GameType } from '@/types';
import {
  COMMUNITY_GAMES,
  COMMUNITY_TAGS,
  GAME_LABELS,
  GAME_SHORT_LABELS,
  TAG_LABELS,
} from '@/lib/community';
import PostCard from '@/components/community/PostCard';
import CreatePostModal from '@/components/community/CreatePostModal';
import Button from '@/components/ui/Button';

type SortMode = 'new' | 'hot' | 'top';

const SORT_OPTIONS: { value: SortMode; label: string; icon: React.ReactNode }[] = [
  { value: 'new', label: 'Новое', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'hot', label: 'Горячее', icon: <Flame className="h-4 w-4" /> },
  { value: 'top', label: 'Топ', icon: <TrendingUp className="h-4 w-4" /> },
];

export default function CommunityPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [boards, setBoards] = useState<CommunityBoardStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedGame, setSelectedGame] = useState<GameType | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<CommunityTag | 'all'>('all');
  const [sort, setSort] = useState<SortMode>('hot');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  // Дебаунс поиска
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const boardsMap = useMemo(() => {
    const map = new Map<string, CommunityBoardStats>();
    boards.forEach((b) => map.set(b.game, b));
    return map;
  }, [boards]);

  const loadPosts = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const response = await api.community.getPosts({
          game: selectedGame === 'all' ? undefined : selectedGame,
          tag: selectedTag === 'all' ? undefined : selectedTag,
          sort,
          search: debouncedSearch || undefined,
          page: targetPage,
          limit: 12,
        });
        setPosts((prev) => (append ? [...prev, ...response.data] : response.data));
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotal(response.total);
      } catch (error) {
        console.error('Failed to load community posts', error);
        if (!append) setPosts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedGame, selectedTag, sort, debouncedSearch],
  );

  useEffect(() => {
    loadPosts(1, false);
  }, [loadPosts]);

  useEffect(() => {
    api.community
      .getBoards()
      .then(setBoards)
      .catch(() => {});
  }, []);

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    setCreateOpen(true);
  };

  const handleCreated = (post: CommunityPost) => {
    router.push(`/community/${post.id}`);
  };

  return (
    <div className="min-h-screen py-10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary sm:text-4xl text-balance">Сообщество</h1>
            <p className="mt-2 max-w-xl text-text-secondary leading-relaxed">
              Обсуждения, поиск тиммейтов, гайды и новости по каждой игре. Создавайте темы и общайтесь с игроками.
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={handleCreateClick} className="shrink-0">
            <PenSquare className="h-4 w-4" />
            Создать пост
          </Button>
        </div>

        {/* Boards */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedGame('all')}
            className={clsx(
              'shrink-0 rounded-lg px-4 py-2.5 text-sm transition-colors',
              selectedGame === 'all'
                ? 'bg-accent-primary text-white'
                : 'border border-white/[0.08] bg-bg-secondary text-text-secondary hover:text-text-primary',
            )}
          >
            Все доски
          </button>
          {COMMUNITY_GAMES.map((game) => {
            const stats = boardsMap.get(game);
            return (
              <button
                key={game}
                type="button"
                onClick={() => setSelectedGame(game)}
                className={clsx(
                  'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors',
                  selectedGame === game
                    ? 'bg-accent-primary text-white'
                    : 'border border-white/[0.08] bg-bg-secondary text-text-secondary hover:text-text-primary',
                )}
              >
                {GAME_SHORT_LABELS[game]}
                {stats && stats.posts > 0 && (
                  <span
                    className={clsx(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      selectedGame === game ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-text-tertiary',
                    )}
                  >
                    {stats.posts}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-lg border border-white/[0.08] bg-bg-secondary p-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSort(option.value)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm transition-colors',
                  sort === option.value
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-tertiary hover:text-text-secondary',
                )}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTag('all')}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs transition-colors',
                  selectedTag === 'all'
                    ? 'bg-accent-secondary text-bg-primary font-medium'
                    : 'border border-white/[0.08] bg-bg-secondary text-text-tertiary hover:text-text-secondary',
                )}
              >
                Все темы
              </button>
              {COMMUNITY_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={clsx(
                    'rounded-full px-3 py-1.5 text-xs transition-colors',
                    selectedTag === tag
                      ? 'bg-accent-secondary text-bg-primary font-medium'
                      : 'border border-white/[0.08] bg-bg-secondary text-text-tertiary hover:text-text-secondary',
                  )}
                >
                  {TAG_LABELS[tag]}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по постам..."
                aria-label="Поиск по постам"
                className="w-full rounded-lg border border-white/[0.08] bg-bg-secondary py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl border border-white/[0.06] bg-bg-secondary" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-white/[0.06] bg-bg-secondary px-6 py-16 text-center">
            <MessageSquare className="h-10 w-10 text-text-muted" />
            <div>
              <div className="font-semibold text-text-primary">
                {debouncedSearch ? 'Ничего не найдено' : 'Пока нет постов'}
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                {debouncedSearch
                  ? 'Попробуйте изменить запрос или фильтры.'
                  : selectedGame === 'all'
                    ? 'Станьте первым, кто начнёт обсуждение!'
                    : `На доске ${GAME_LABELS[selectedGame]} пока тихо. Начните первую тему!`}
              </p>
            </div>
            {!debouncedSearch && (
              <Button variant="primary" onClick={handleCreateClick}>
                <PenSquare className="h-4 w-4" />
                Создать пост
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="text-xs text-text-tertiary">
              {total} {pluralizePosts(total)}
            </div>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {page < totalPages && (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" loading={loadingMore} onClick={() => loadPosts(page + 1, true)}>
                  Показать ещё
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <CreatePostModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultGame={selectedGame === 'all' ? undefined : selectedGame}
        onCreated={handleCreated}
      />
    </div>
  );
}

function pluralizePosts(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'пост';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'поста';
  return 'постов';
}
