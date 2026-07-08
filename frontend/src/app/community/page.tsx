'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Flame, ShieldCheck, Search, Plus, SlidersHorizontal, ArrowLeft, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { CommunityPost, CommunityTag, GameType } from '@/types';
import { COMMUNITY_GAMES, COMMUNITY_TAGS, GAME_LABELS, TAG_LABELS } from '@/lib/community';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PostCard from '@/components/community/PostCard';
import CreatePostModal from '@/components/community/CreatePostModal';
import toast from 'react-hot-toast';

const BOARDS_DETAILS: Record<GameType, { title: string; description: string }> = {
  cs2: { title: 'CS2 Hub', description: 'Тактики, поиск стака и разбор матчей.' },
  dota2: { title: 'Dota 2 Base', description: 'Обсуждение драфтов, ролей и турниров.' },
  valorant: { title: 'Valorant Zone', description: 'Связки агентов, коллы и набор составов.' },
  lol: { title: 'LoL Rift', description: 'Мета, пики и общение по лигам.' },
  pubg: { title: 'PUBG Drop', description: 'Сквады, ротации и соревновательная сцена.' },
  apex: { title: 'Apex Arena', description: 'Легенды, макро и игровые сборки.' },
  custom: { title: 'Общий хаб', description: 'Темы о киберспорте, общие вопросы и оффтоп.' },
};

export default function CommunityPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [boardStats, setBoardStats] = useState<Record<string, { posts: number; comments: number }>>({});
  const [selectedGame, setSelectedGame] = useState<GameType | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<CommunityTag | 'all'>('all');
  const [selectedSort, setSelectedSort] = useState<'new' | 'hot' | 'top'>('new');
  const [searchVal, setSearchVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Получить статистику досок
  const fetchStats = useCallback(async () => {
    try {
      const stats = await api.community.getBoardsStats();
      const statsMap: Record<string, { posts: number; comments: number }> = {};
      stats.forEach((s) => {
        statsMap[s.game] = { posts: s.posts, comments: s.comments };
      });
      setBoardStats(statsMap);
    } catch (err) {
      console.error('Failed to fetch board stats', err);
    }
  }, []);

  // Получить посты
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.community.listPosts({
        game: selectedGame === 'all' ? undefined : selectedGame,
        tag: selectedTag === 'all' ? undefined : selectedTag,
        sort: selectedSort,
        search: searchQuery.trim() || undefined,
        page,
        limit: 10,
      });
      setPosts(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to fetch posts', err);
      toast.error('Не удалось загрузить посты');
    } finally {
      setLoading(false);
    }
  }, [selectedGame, selectedTag, selectedSort, searchQuery, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Сброс страницы при изменении фильтров
  const handleGameChange = (game: GameType | 'all') => {
    setSelectedGame(game);
    setPage(1);
  };

  const handleTagChange = (tag: CommunityTag | 'all') => {
    setSelectedTag(tag);
    setPage(1);
  };

  const handleSortChange = (sort: 'new' | 'hot' | 'top') => {
    setSelectedSort(sort);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchVal);
    setPage(1);
  };

  const handlePostCreated = () => {
    fetchPosts();
    fetchStats();
  };

  const triggerCreatePost = () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    setIsCreateOpen(true);
  };

  return (
    <div className="min-h-screen bg-bg-primary py-8 text-text-primary">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <h1 className="font-orbitron font-black text-4xl text-white uppercase tracking-wider">Сообщество</h1>
            <p className="text-text-secondary mt-1">
              Обсуждай турниры, ищи тиммейтов и делись своим опытом.
            </p>
          </div>
          <Button 
            onClick={triggerCreatePost}
            variant="primary" 
            className="self-start md:self-auto shrink-0 shadow-lg shadow-accent-primary/20"
          >
            <Plus className="w-4 h-4" />
            Создать пост
          </Button>
        </div>

        {/* Feature widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 border border-white/[0.04] bg-bg-secondary/60">
            <div className="flex items-center gap-2 text-accent-purple mb-2">
              <MessageSquare className="w-5 h-5" />
              <span className="font-orbitron font-bold uppercase tracking-wider text-sm">Игровые доски</span>
            </div>
            <div className="text-xs text-text-secondary">
              Отдельная секция под каждую киберспортивную дисциплину для удобной навигации.
            </div>
          </Card>
          <Card className="p-5 border border-white/[0.04] bg-bg-secondary/60">
            <div className="flex items-center gap-2 text-accent-primary mb-2">
              <Flame className="w-5 h-5" />
              <span className="font-orbitron font-bold uppercase tracking-wider text-sm">Тренды и поиск</span>
            </div>
            <div className="text-xs text-text-secondary">
              Сортировка по горячему и теги позволят мгновенно найти тактики или тиммейтов.
            </div>
          </Card>
          <Card className="p-5 border border-white/[0.04] bg-bg-secondary/60">
            <div className="flex items-center gap-2 text-accent-warning mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-orbitron font-bold uppercase tracking-wider text-sm">Модерация</span>
            </div>
            <div className="text-xs text-text-secondary">
              Честные правила сообщества и защита от токсичности для комфортного общения.
            </div>
          </Card>
        </div>

        {/* Search, Sort and Filter Bar */}
        <Card className="p-4 border border-white/[0.06] bg-bg-secondary">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search form */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Поиск постов..."
                className="w-full rounded-lg border border-border-default bg-bg-primary pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-text-muted" />
              {searchVal !== searchQuery && (
                <button 
                  type="submit" 
                  className="absolute right-2 top-1.5 rounded bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold hover:bg-white/[0.12] transition-colors"
                >
                  Найти
                </button>
              )}
            </form>

            {/* Sort options */}
            <div className="flex items-center gap-2 border-t md:border-t-0 border-white/[0.06] pt-3 md:pt-0 shrink-0">
              <span className="text-xs text-text-tertiary flex items-center gap-1.5 mr-2">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Сортировка:
              </span>
              {(['new', 'hot', 'top'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSortChange(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                    selectedSort === s
                      ? 'bg-accent-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                  }`}
                >
                  {s === 'new' ? 'Новые' : s === 'hot' ? 'Горячие' : 'Популярные'}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/[0.04] pt-4">
            <button
              onClick={() => handleTagChange('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                selectedTag === 'all'
                  ? 'bg-white text-bg-primary border-white font-semibold'
                  : 'bg-white/[0.04] text-text-secondary border-border-default hover:text-text-primary hover:border-text-secondary'
              }`}
            >
              Все темы
            </button>
            {COMMUNITY_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => handleTagChange(t)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  selectedTag === t
                    ? 'bg-white text-bg-primary border-white font-semibold'
                    : 'bg-white/[0.04] text-text-secondary border-border-default hover:text-text-primary hover:border-text-secondary'
                }`}
              >
                {TAG_LABELS[t]}
              </button>
            ))}
          </div>
        </Card>

        {/* Board stats & Feed wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Sidebar - Game boards list */}
          <div className="space-y-2 lg:col-span-1">
            <div className="px-1.5 py-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Игровые доски
            </div>
            
            <button
              onClick={() => handleGameChange('all')}
              className={`w-full text-left rounded-xl p-3 border transition-all flex items-center justify-between ${
                selectedGame === 'all'
                  ? 'bg-white/[0.06] border-white/20 text-white font-bold'
                  : 'bg-bg-secondary/40 border-white/[0.04] text-text-secondary hover:text-text-primary hover:bg-bg-secondary/70'
              }`}
            >
              <div>
                <div className="text-sm font-semibold">Все доски</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">Все киберспортивные темы</div>
              </div>
            </button>

            {COMMUNITY_GAMES.map((g) => {
              const details = BOARDS_DETAILS[g];
              const stats = boardStats[g] || { posts: 0, comments: 0 };
              const isSelected = selectedGame === g;
              
              return (
                <button
                  key={g}
                  onClick={() => handleGameChange(g)}
                  className={`w-full text-left rounded-xl p-3 border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-white/[0.06] border-white/20 text-white font-bold'
                      : 'bg-bg-secondary/40 border-white/[0.04] text-text-secondary hover:text-text-primary hover:bg-bg-secondary/70'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-sm font-semibold truncate">{details.title}</div>
                    <div className="text-[10px] text-text-tertiary mt-0.5 truncate">{details.description}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-text-secondary uppercase">
                      {stats.posts} постов
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Posts Feed */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-secondary">
                <svg className="animate-spin h-8 w-8 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Загрузка обсуждений...</span>
              </div>
            ) : posts.length === 0 ? (
              <Card className="p-10 text-center border border-dashed border-white/[0.06] bg-bg-secondary/20">
                <div className="text-text-muted text-sm">Постов пока нет. Будьте первым, кто создаст тему!</div>
                <Button 
                  onClick={triggerCreatePost}
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                >
                  <Plus className="w-3.5 h-3.5" /> Опубликовать пост
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-6 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ArrowLeft className="h-4 w-4" /> Назад
                    </Button>
                    <span className="text-xs text-text-secondary">
                      Страница {page} из {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Вперед <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Creation Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultGame={selectedGame === 'all' ? undefined : selectedGame}
        onCreated={handlePostCreated}
      />
    </div>
  );
}
