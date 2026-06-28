export type Gender = 'male' | 'female' | 'other';
export type GameType = 'cs2' | 'dota2' | 'valorant' | 'lol' | 'pubg' | 'apex' | 'custom';

export interface User {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  role: 'participant' | 'organizer' | 'admin';
  avatarUrl?: string;
  bannerUrl?: string;
  tagline?: string;
  country?: string;
  city?: string;
  gender?: Gender;
  bio?: string;
  level: number;
  rating: number;
  wins: number;
  losses: number;
  followersCount: number;
  followingCount: number;
  mainGame?: GameType;
  credits: number;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface PlayerStats {
  id: string;
  userId: string;
  game: GameType;
  rating: number;
  streetScore?: number;
  wins: number;
  losses: number;
  leaderboardRank?: number;
  teamId?: string;
  currentTeam?: TeamSummary | null;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface SocialUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  gender?: Gender;
  mainGame?: GameType;
  followersCount?: number;
  followedAt?: string;
}

export interface UserProfile extends User {
  arenaPower: number;
  overallLeaderboardRank?: number | null;
  overallLeaderboardTotal: number;
  stats: PlayerStats[];
  favoriteGames: string[];
  teams: TeamSummary[];
  mainTeam?: TeamSummary | null;
  canChangeUsername: boolean;
  canChangeAvatar: boolean;
  usernameChangeDays: number;
  avatarChangeDays: number;
}

export interface TeamSummary {
  id: string;
  name: string;
  tag?: string;
  logoUrl?: string;
  game: GameType;
  supportedGames?: GameType[];
  rating: number;
  leaderboardRank?: number;
  myRole?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    gender?: Gender;
  };
  score: number;
  rating: number;
  wins: number;
  losses: number;
  winRate: string;
  currentTeam?: TeamSummary | null;
}

export interface LeaderboardMetric {
  name: string;
  shortName: string;
  description: string;
}

export interface LeaderboardResponse {
  metric?: LeaderboardMetric;
  data: LeaderboardEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TeamLeaderboardEntry {
  rank: number;
  team: {
    id: string;
    name: string;
    tag?: string;
    logoUrl?: string;
    captainName?: string;
    membersCount: number;
    supportedGames?: GameType[];
  };
  rating: number;
  wins: number;
  losses: number;
  winRate: string;
}

export interface TeamLeaderboardResponse {
  data: TeamLeaderboardEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Team {
  id: string;
  name: string;
  tag?: string;
  description?: string;
  logoUrl?: string;
  captainId: string;
  captainName?: string | null;
  game: GameType;
  supportedGames?: GameType[];
  membersCount: number;
  maxMembers: number;
  rating: number;
  wins: number;
  losses: number;
  leaderboardRank?: number;
  isRecruiting: boolean;
  createdAt: string;
  updatedAt: string;
  myRole?: string;
  hasPendingRequest?: boolean;
  pendingRequestsCount?: number;
  isCaptain?: boolean;
}

export interface TeamJoinRequest {
  id: string;
  teamId: string;
  teamName: string;
  message?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface UserSearchResult {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  followersCount: number;
  mainGame?: GameType;
  friendshipStatus?: 'friends' | 'pending_sent' | 'pending_received' | null;
}

export type TournamentGame = GameType;
export type TournamentFormat = '1v1' | '5v5' | 'battle_royale' | 'custom';
export type TournamentStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type TournamentType = 'solo' | 'team';

export interface Tournament {
  id: string;
  title: string;
  description: string;
  game: TournamentGame;
  format: TournamentFormat;
  tournamentType: TournamentType;
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
  viewsCount: number;
  savesCount: number;
  isSaved?: boolean; // populated per-user
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
