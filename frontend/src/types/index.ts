export interface User {
  id: string;
  username: string;
  email: string;
  role: 'participant' | 'organizer' | 'admin';
  avatarUrl?: string;
  credits: number;
  onboardingCompleted: boolean;
  createdAt: string;
}

export type TournamentGame = 'cs2' | 'dota2' | 'valorant' | 'lol' | 'pubg' | 'apex' | 'custom';
export type TournamentFormat = '1v1' | '5v5' | 'battle_royale' | 'custom';
export type TournamentStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface Tournament {
  id: string;
  title: string;
  description: string;
  game: TournamentGame;
  format: TournamentFormat;
  status: TournamentStatus;
  organizer: User;
  organizerId: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  commissionRate: number;
  isFeatured: boolean;
  featuredOrder?: number;
  startDate: string;
  endDate?: string;
  rules?: string;
  region?: string;
  bannerUrl?: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  user: User;
  userId: string;
  teamName?: string;
  status: 'registered' | 'checked_in' | 'playing' | 'eliminated' | 'winner';
  placement?: number;
  joinedAt: string;
}

export interface Bet {
  id: string;
  tournament: Tournament;
  predictedWinnerId: string;
  amount: number;
  status: 'pending' | 'won' | 'lost' | 'refunded';
  payout?: number;
  placedAt: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'payout' | 'commission' | 'entry_fee' | 'prize' | 'refund';
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export interface OddsData {
  participantId: string;
  teamName: string;
  username: string;
  totalBets: number;
  bettorCount: number;
  odds: number;
}
