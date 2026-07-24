import { GameType, CommunityTag } from '@/types';

export const COMMUNITY_GAMES: GameType[] = [
  'cs2',
  'dota2',
  'valorant',
  'lol',
  'pubg',
  'apex',
  'custom',
];

export const COMMUNITY_TAGS: CommunityTag[] = [
  'discussion',
  'lfg',
  'guide',
  'news',
  'question',
  'meta',
];

export const GAME_LABELS: Record<GameType, string> = {
  cs2: 'Counter-Strike 2',
  dota2: 'Dota 2',
  valorant: 'Valorant',
  lol: 'League of Legends',
  pubg: 'PUBG: BATTLEGROUNDS',
  apex: 'Apex Legends',
  fortnite: 'Fortnite',
  rocket_league: 'Rocket League',
  overwatch2: 'Overwatch 2',
  rainbow6: 'Rainbow Six Siege',
  fifa: 'EA SPORTS FC / FIFA',
  custom: 'Общий хаб',
};

export const GAME_SHORT_LABELS: Record<GameType, string> = {
  cs2: 'CS2',
  dota2: 'Dota 2',
  valorant: 'Valorant',
  lol: 'LoL',
  pubg: 'PUBG',
  apex: 'Apex',
  fortnite: 'FN',
  rocket_league: 'RL',
  overwatch2: 'OW2',
  rainbow6: 'R6S',
  fifa: 'FC/FIFA',
  custom: 'Общее',
};

export const TAG_LABELS: Record<CommunityTag, string> = {
  discussion: 'Обсуждение',
  lfg: 'Поиск игроков',
  guide: 'Гайд',
  news: 'Новость',
  question: 'Вопрос',
  meta: 'Мета',
};

export const TAG_STYLES: Record<CommunityTag, string> = {
  discussion: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  lfg: 'bg-green-500/10 text-green-400 border border-green-500/20',
  guide: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  news: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  question: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  meta: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
};

export function timeAgo(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'только что';
  } else if (diffMin < 60) {
    const lastDigit = diffMin % 10;
    const lastTwoDigits = diffMin % 100;
    if (lastDigit === 1 && lastTwoDigits !== 11) {
      return `${diffMin} минуту назад`;
    }
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
      return `${diffMin} минуты назад`;
    }
    return `${diffMin} минут назад`;
  } else if (diffHour < 24) {
    const lastDigit = diffHour % 10;
    const lastTwoDigits = diffHour % 100;
    if (lastDigit === 1 && lastTwoDigits !== 11) {
      return `${diffHour} час назад`;
    }
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
      return `${diffHour} часа назад`;
    }
    return `${diffHour} часов назад`;
  } else if (diffDay < 7) {
    if (diffDay === 1) return 'вчера';
    if (diffDay > 1 && diffDay < 5) return `${diffDay} дня назад`;
    return `${diffDay} дней назад`;
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
