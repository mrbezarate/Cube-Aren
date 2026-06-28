'use client';

import React, { useMemo, useState } from 'react';
import { Flame, MessageSquare, Newspaper, ShieldCheck } from 'lucide-react';
import Card from '@/components/ui/Card';
import { GameType } from '@/types';

const BOARDS: { game: GameType; title: string; description: string; posts: Array<{ title: string; replies: number; tag: string }> }[] = [
  {
    game: 'cs2',
    title: 'CS2 Hub',
    description: 'Тактики, поиск стака и разбор матчей.',
    posts: [
      { title: 'Собираем вечерний стак на прайм', replies: 18, tag: 'поиск' },
      { title: 'Лучшие коллы для Mirage и Nuke', replies: 11, tag: 'тактика' },
    ],
  },
  {
    game: 'dota2',
    title: 'Dota 2 Base',
    description: 'Обсуждение драфтов, ролей и турниров.',
    posts: [
      { title: 'Саппорт-пулы для текущей меты', replies: 21, tag: 'мета' },
      { title: 'Ищем оффлейнера под праки', replies: 7, tag: 'поиск' },
    ],
  },
  {
    game: 'valorant',
    title: 'Valorant Zone',
    description: 'Связки агентов, коллы и набор составов.',
    posts: [
      { title: 'Кто тестил новый сетап на Ascent?', replies: 9, tag: 'стратегия' },
      { title: 'Ищем пятого в флекс-состав', replies: 14, tag: 'поиск' },
    ],
  },
  {
    game: 'lol',
    title: 'LoL Rift',
    description: 'Мета, пики и общение по лигам.',
    posts: [
      { title: 'Топ-3 пики на мид после патча', replies: 12, tag: 'мета' },
      { title: 'Нужен jungle в вечерний стак', replies: 6, tag: 'поиск' },
    ],
  },
  {
    game: 'pubg',
    title: 'PUBG Drop',
    description: 'Сквады, ротации и соревновательная сцена.',
    posts: [
      { title: 'Лучшие зоны для агрессивного дропа', replies: 5, tag: 'гайды' },
      { title: 'Ищем запасного в ростер', replies: 8, tag: 'команда' },
    ],
  },
  {
    game: 'apex',
    title: 'Apex Arena',
    description: 'Легенды, макро и игровые сборки.',
    posts: [
      { title: 'Какая связка легенд сейчас сильнее?', replies: 16, tag: 'мета' },
      { title: 'Набираем трио под лиги', replies: 10, tag: 'поиск' },
    ],
  },
];

export default function CommunityPage() {
  const [selectedGame, setSelectedGame] = useState<GameType | 'all'>('all');
  const visibleBoards = useMemo(
    () => (selectedGame === 'all' ? BOARDS : BOARDS.filter((board) => board.game === selectedGame)),
    [selectedGame],
  );

  return (
    <div className="min-h-screen bg-arena-dark py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="font-orbitron font-black text-4xl text-white uppercase">Сообщество</h1>
          <p className="text-gray-400 mt-2">
            Тут каждая игра получает свою доску: обсуждения, поиск игроков, анонсы и базу для будущих постов с комментариями.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-neon-purple mb-2">
              <MessageSquare className="w-5 h-5" />
              <span className="font-orbitron font-bold">Игровые доски</span>
            </div>
            <div className="text-sm text-gray-400">
              По одной доске на каждую ключевую игру.
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-neon-blue mb-2">
              <Newspaper className="w-5 h-5" />
              <span className="font-orbitron font-bold">Темы и анонсы</span>
            </div>
            <div className="text-sm text-gray-400">
              Здесь удобно держать обсуждения турниров, поиск команды и новости.
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-neon-gold mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-orbitron font-bold">Модерация</span>
            </div>
            <div className="text-sm text-gray-400">
              Закладываем базу под модераторов по каждой игре.
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedGame('all')}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              selectedGame === 'all'
                ? 'bg-neon-purple text-white'
                : 'border border-arena-border bg-white/5 text-gray-300'
            }`}
          >
            Все доски
          </button>
          {BOARDS.map((board) => (
            <button
              key={board.game}
              type="button"
              onClick={() => setSelectedGame(board.game)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                selectedGame === board.game
                  ? 'bg-neon-blue text-white'
                  : 'border border-arena-border bg-white/5 text-gray-300'
              }`}
            >
              {board.title}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleBoards.map((board) => (
            <Card key={board.game} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-orbitron font-bold text-white">{board.title}</h2>
                <span className="rounded-full bg-neon-purple/10 px-3 py-1 text-xs text-neon-purple uppercase">
                  {board.game}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-3">{board.description}</p>
              <div className="mt-4 space-y-2">
                {board.posts.map((post) => (
                  <div key={post.title} className="rounded-lg border border-arena-border bg-white/5 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm text-white">{post.title}</div>
                      <span className="rounded-full bg-neon-purple/10 px-2 py-1 text-[10px] uppercase text-neon-purple">
                        {post.tag}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post.replies} ответов
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-neon-gold" />
                        активная тема
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-dashed border-neon-blue/40 bg-neon-blue/5 px-3 py-3 text-xs text-gray-400">
                Здесь позже можно включить реальные посты, создание темы, комментарии и модераторов по игре.
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
