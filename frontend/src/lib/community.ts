import { CommunityTag, GameType } from '@/types';

export const GAME_LABELS: Record<GameType, string> = {
  cs2: 'CS2',
  dota2: 'Dota 2',
  valorant: 'Valorant',
  lol: 'League of Legends',
  pubg: 'PUBG',
  apex: 'Apex Legends',
  custom: 'Общая',
};

export const GAME_SHORT_LABELS: Record<GameType, string> = {
  cs2: 'CS2',
  dota2: 'Dota 2',
  valorant: 'Valorant',
  lol: 'LoL',
  pubg: 'PUBG',
  apex: 'Apex',
  custom: 'Общая',
};

export const COMMUNITY_GAMES: GameType[] = ['cs2', 'dota2', 'valorant', 'lol', 'pubg', 'apex', 'custom'];

export const TAG_LABELS: Record<CommunityTag, string> = {
  discussion: 'Обсуждение',
  lfg: 'Поиск игроков',
  guide: 'Гайд',
  news: 'Новости',
  question: 'Вопрос',
  meta: 'Мета',
};

export const TAG_STYLES: Record<CommunityTag, string> = {
  discussion: 'bg-accent-primary/10 text-accent-primary',
  lfg: 'bg-accent-secondary/10 text-accent-secondary',
  guide: 'bg-accent-success/10 text-accent-success',
  news: 'bg-accent-warning/10 text-accent-warning',
  question: 'bg-white/10 text-text-secondary',
  meta: 'bg-accent-danger/10 text-accent-danger',
};

export const COMMUNITY_TAGS: CommunityTag[] = ['discussion', 'lfg', 'guide', 'news', 'question', 'meta'];

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'только что';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн назад`;

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}
