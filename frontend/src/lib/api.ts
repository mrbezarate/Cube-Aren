import axios from 'axios';
import { useAuthStore } from './store/auth.store';
import { 
  User, 
  Tournament, 
  Participant, 
  Bet, 
  Transaction, 
  OddsData, 
  UserProfile, 
  PlayerStats, 
  LeaderboardResponse,
  TeamLeaderboardResponse,
  GameType,
  Team,
  TeamJoinRequest,
  UserSearchResult,
  PrivacySettings,
  NotificationSettings,
  UserPreferences,
  BlockedUser,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

const apiInstance = axios.create({
  baseURL: API_URL,
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const logoutAndRedirect = () => {
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
    window.location.href = '/auth/login';
  }
};

apiInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && !config.url?.includes('/auth/refresh')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');

    // Обработка rate limit ошибок
    if (error.response?.status === 429) {
      const message = error.response?.data?.message || 'Слишком много запросов. Подождите немного.';
      if (typeof window !== 'undefined') {
        // Показываем toast только если это не было показано недавно
        const lastToast = sessionStorage.getItem('lastRateLimitToast');
        const now = Date.now();
        if (!lastToast || now - parseInt(lastToast) > 3000) {
          const { toast } = await import('react-hot-toast');
          toast.error(message, { duration: 3000 });
          sessionStorage.setItem('lastRateLimitToast', now.toString());
        }
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        logoutAndRedirect();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { accessToken, refreshToken: nextRefreshToken } = await api.auth.refresh(refreshToken);
        useAuthStore.getState().setTokens(accessToken, nextRefreshToken ?? refreshToken);
        processQueue(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return await apiInstance(originalRequest);
      } catch (refreshError) {
        logoutAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
      logoutAndRedirect();
    }

    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    register: (data: any) => apiInstance.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', data).then(r => r.data),
    login: (data: any) => apiInstance.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', data).then(r => r.data),
    refresh: (refreshToken: string) => apiInstance.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }).then(r => r.data),
    getMe: () => apiInstance.get<User>('/auth/me').then(r => r.data),
  },
  users: {
    getMe: () => apiInstance.get<User>('/users/me').then(r => r.data),
    updateMe: (data: any) => apiInstance.put<User>('/users/me', data).then(r => r.data),
    getWallet: () => apiInstance.get<{ credits: number; transactions: Transaction[] }>('/users/me/wallet').then(r => r.data),
    onboarding: (data: any) =>
      apiInstance
        .post<{ user: User; accessToken: string; refreshToken: string }>('/users/onboarding', data)
        .then((r) => r.data),
    getOnboarding: () => apiInstance.get<{ games: string[]; role: string } | null>('/users/onboarding').then(r => r.data),
    search: (query: string) =>
      apiInstance.get<UserSearchResult[]>('/users/search', { params: { query } }).then((r) => r.data),
    getProfile: (id: string) => apiInstance.get<User>(`/users/${id}`).then(r => r.data),
    getFullProfile: (id: string) => apiInstance.get<UserProfile>(`/users/${id}/profile`).then(r => r.data),
    updateProfile: (data: any) => apiInstance.patch<User>('/users/profile', data).then(r => r.data),
    getAllStats: (id: string) => apiInstance.get<PlayerStats[]>(`/users/${id}/stats`).then(r => r.data),
    getGameStats: (id: string, game: GameType) => apiInstance.get<PlayerStats>(`/users/${id}/stats/${game}`).then(r => r.data),
    getLeaderboard: (game: GameType, page?: number, limit?: number) => 
      apiInstance.get<LeaderboardResponse>(`/users/leaderboard/${game}`, { params: { page, limit } }).then(r => r.data),
    follow: (id: string) => apiInstance.post<{ message: string }>(`/users/${id}/follow`).then(r => r.data),
    unfollow: (id: string) => apiInstance.delete<{ message: string }>(`/users/${id}/follow`).then(r => r.data),
    getFollowers: (id: string, page?: number, limit?: number) => 
      apiInstance.get<{ data: any[]; total: number; page: number; totalPages: number }>(`/users/${id}/followers`, { params: { page, limit } }).then(r => r.data),
    getFollowing: (id: string, page?: number, limit?: number) => 
      apiInstance.get<{ data: any[]; total: number; page: number; totalPages: number }>(`/users/${id}/following`, { params: { page, limit } }).then(r => r.data),
    isFollowing: (id: string, targetId: string) => 
      apiInstance.get<{ isFollowing: boolean }>(`/users/${id}/is-following/${targetId}`).then(r => r.data),
    areFriends: (id: string, targetId: string) => 
      apiInstance.get<{ areFriends: boolean }>(`/users/${id}/are-friends/${targetId}`).then(r => r.data),
    trackProfileView: (id: string) => 
      apiInstance.post<{ message: string }>(`/users/${id}/view`).then(r => r.data),
    getProfileVisitors: (id: string) => 
      apiInstance.get<{ total: number; views: any[] }>(`/users/${id}/visitors`).then(r => r.data),
  },
  teams: {
    getAll: (params?: { game?: GameType; page?: number; limit?: number }) =>
      apiInstance
        .get<{ data: Team[]; total: number; page: number; totalPages: number }>('/teams', { params })
        .then((r) => r.data),
    getMy: () => apiInstance.get<Team[]>('/teams/my').then((r) => r.data),
    getMyRequests: () => apiInstance.get<TeamJoinRequest[]>('/teams/requests/my').then((r) => r.data),
    getOne: (id: string) => apiInstance.get<Team>(`/teams/${id}`).then((r) => r.data),
    getLeaderboard: (game: GameType, page?: number, limit?: number) =>
      apiInstance
        .get<TeamLeaderboardResponse>(`/teams/leaderboard/${game}`, { params: { page, limit } })
        .then((r) => r.data),
    create: (data: {
      name: string;
      tag?: string;
      description?: string;
      logoUrl?: string;
      game: GameType;
      supportedGames?: GameType[];
      maxMembers?: number;
    }) => apiInstance.post<Team>('/teams', data).then((r) => r.data),
    join: (id: string, data?: { message?: string }) =>
      apiInstance.post<{ message: string }>(`/teams/${id}/join`, data || {}).then((r) => r.data),
    leave: (id: string) => apiInstance.post<{ message: string }>(`/teams/${id}/leave`).then((r) => r.data),
    approveRequest: (teamId: string, requestId: string) =>
      apiInstance.post<{ message: string }>(`/teams/${teamId}/requests/${requestId}/approve`).then((r) => r.data),
    rejectRequest: (teamId: string, requestId: string) =>
      apiInstance.post<{ message: string }>(`/teams/${teamId}/requests/${requestId}/reject`).then((r) => r.data),
  },
  tournaments: {
    getAll: (params: any) => apiInstance.get<{ data: Tournament[]; total: number; page: number; pages: number }>('/tournaments', { params }).then(r => r.data),
    getFeatured: () => apiInstance.get<Tournament[]>('/tournaments/featured').then(r => r.data),
    getSaved: () => apiInstance.get<Tournament[]>('/tournaments/saved').then(r => r.data),
    getOne: (id: string) => apiInstance.get<Tournament>(`/tournaments/${id}`).then(r => r.data),
    create: (data: any) => apiInstance.post<Tournament>('/tournaments', data).then(r => r.data),
    update: (id: string, data: any) => apiInstance.put<Tournament>(`/tournaments/${id}`, data).then(r => r.data),
    delete: (id: string) => apiInstance.delete<void>(`/tournaments/${id}`).then(r => r.data),
    updateStatus: (id: string, status: string) => apiInstance.patch<Tournament>(`/tournaments/${id}/status`, { status }).then(r => r.data),
    save: (id: string) => apiInstance.post<{ message: string }>(`/tournaments/${id}/save`).then(r => r.data),
    unsave: (id: string) => apiInstance.delete<{ message: string }>(`/tournaments/${id}/save`).then(r => r.data),
    trackView: (id: string) => apiInstance.post<{ message: string }>(`/tournaments/${id}/view`).then(r => r.data),
  },
  participants: {
    join: (tournamentId: string, teamName?: string) => apiInstance.post<Participant>(`/tournaments/${tournamentId}/join`, { teamName }).then(r => r.data),
    getByTournament: (tournamentId: string) => apiInstance.get<Participant[]>(`/tournaments/${tournamentId}/participants`).then(r => r.data),
    updateStatus: (tournamentId: string, participantId: string, status: string, placement?: number) => apiInstance.put<Participant>(`/tournaments/${tournamentId}/participants/${participantId}/status`, { status, placement }).then(r => r.data),
    declareWinner: (tournamentId: string, participantId: string) => apiInstance.post<void>(`/tournaments/${tournamentId}/winner/${participantId}`).then(r => r.data),
  },
  bets: {
    place: (data: { tournamentId: string; predictedWinnerId: string; amount: number }) => apiInstance.post<Bet>('/bets', data).then(r => r.data),
    getMy: (params?: { page?: number; limit?: number }) => apiInstance.get<{ data: Bet[]; total: number }>('/bets/me', { params }).then(r => r.data),
    getTournamentBets: (tournamentId: string) => apiInstance.get<Bet[]>(`/bets/tournament/${tournamentId}`).then(r => r.data),
    getOdds: (tournamentId: string) => apiInstance.get<OddsData[]>(`/bets/tournament/${tournamentId}/odds`).then(r => r.data),
  },
  wallet: {
    getBalance: () => apiInstance.get<{ credits: number }>('/wallet/balance').then(r => r.data),
    getTransactions: (params?: { page?: number; limit?: number }) => apiInstance.get<{ data: Transaction[]; total: number }>('/wallet/transactions', { params }).then(r => r.data),
    deposit: (amount: number) => apiInstance.post<{ message: string; transaction: Transaction }>('/wallet/deposit', { amount }).then(r => r.data),
  },
  friends: {
    follow: (userId: string) => apiInstance.post<{ message: string }>(`/friends/follow/${userId}`).then(r => r.data),
    unfollow: (userId: string) => apiInstance.delete<{ message: string }>(`/friends/unfollow/${userId}`).then(r => r.data),
    removeFriend: (friendId: string) => apiInstance.delete<{ message: string }>(`/friends/remove/${friendId}`).then(r => r.data),
    getIncoming: () => apiInstance.get<any[]>('/friends/incoming').then(r => r.data),
    getFriends: () => apiInstance.get<any[]>('/friends/list').then(r => r.data),
    getStatus: (userId: string) => apiInstance.get<{ status: string }>(`/friends/status/${userId}`).then(r => r.data),
  },
  chat: {
    getRooms: () => apiInstance.get<any[]>('/chat/rooms').then(r => r.data),
    getOrCreateRoom: (userId: string) => apiInstance.post<any>(`/chat/room/${userId}`).then(r => r.data),
    getRoom: (roomId: string) => apiInstance.get<any>(`/chat/room/${roomId}`).then(r => r.data),
    getMessages: (roomId: string) => apiInstance.get<any[]>(`/chat/room/${roomId}/messages`).then(r => r.data),
  },
  settings: {
    // Privacy
    getPrivacySettings: () => apiInstance.get<PrivacySettings>('/settings/privacy').then(r => r.data),
    updatePrivacySettings: (data: Partial<PrivacySettings>) => 
      apiInstance.put<PrivacySettings>('/settings/privacy', data).then(r => r.data),
    clearProfileVisitorsHistory: () => 
      apiInstance.delete<void>('/settings/privacy/history/visitors').then(r => r.data),
    clearTournamentHistory: () => 
      apiInstance.delete<void>('/settings/privacy/history/tournaments').then(r => r.data),
    
    // Notifications
    getNotificationSettings: () => 
      apiInstance.get<NotificationSettings>('/settings/notifications').then(r => r.data),
    updateNotificationSettings: (data: Partial<NotificationSettings>) => 
      apiInstance.put<NotificationSettings>('/settings/notifications', data).then(r => r.data),
    
    // Preferences
    getUserPreferences: () => 
      apiInstance.get<UserPreferences>('/settings/preferences').then(r => r.data),
    updateUserPreferences: (data: Partial<UserPreferences>) => 
      apiInstance.put<UserPreferences>('/settings/preferences', data).then(r => r.data),
    
    // Blocked users
    getBlockedUsers: () => 
      apiInstance.get<BlockedUser[]>('/settings/blocked').then(r => r.data),
    blockUser: (userId: string, reason?: string) => 
      apiInstance.post<BlockedUser>(`/settings/blocked/${userId}`, { reason }).then(r => r.data),
    unblockUser: (userId: string) => 
      apiInstance.delete<void>(`/settings/blocked/${userId}`).then(r => r.data),
  },
};
export default apiInstance;
