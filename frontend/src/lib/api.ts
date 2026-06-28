import axios from 'axios';
import { useAuthStore } from './store/auth.store';
import { User, Tournament, Participant, Bet, Transaction, OddsData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

const apiInstance = axios.create({
  baseURL: API_URL,
});

apiInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    register: (data: any) => apiInstance.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', data).then(r => r.data),
    login: (data: any) => apiInstance.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', data).then(r => r.data),
    getMe: () => apiInstance.get<User>('/auth/me').then(r => r.data),
  },
  users: {
    getMe: () => apiInstance.get<User>('/users/me').then(r => r.data),
    updateMe: (data: any) => apiInstance.put<User>('/users/me', data).then(r => r.data),
    getWallet: () => apiInstance.get<{ credits: number; transactions: Transaction[] }>('/users/me/wallet').then(r => r.data),
    onboarding: (data: any) => apiInstance.post<User>('/users/onboarding', data).then(r => r.data),
    getProfile: (id: string) => apiInstance.get<User>(`/users/${id}`).then(r => r.data),
  },
  tournaments: {
    getAll: (params: any) => apiInstance.get<{ data: Tournament[]; total: number; page: number; pages: number }>('/tournaments', { params }).then(r => r.data),
    getFeatured: () => apiInstance.get<Tournament[]>('/tournaments/featured').then(r => r.data),
    getOne: (id: string) => apiInstance.get<Tournament>(`/tournaments/${id}`).then(r => r.data),
    create: (data: any) => apiInstance.post<Tournament>('/tournaments', data).then(r => r.data),
    update: (id: string, data: any) => apiInstance.put<Tournament>(`/tournaments/${id}`, data).then(r => r.data),
    delete: (id: string) => apiInstance.delete<void>(`/tournaments/${id}`).then(r => r.data),
    updateStatus: (id: string, status: string) => apiInstance.patch<Tournament>(`/tournaments/${id}/status`, { status }).then(r => r.data),
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
};
export default apiInstance;
