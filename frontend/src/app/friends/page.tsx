'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { toast } from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { UserPlus, Users, Check, X } from 'lucide-react';
import Link from 'next/link';

interface FriendRequest {
  id: string;
  sender: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    mainGame?: string;
  };
  createdAt: string;
}

interface Friend {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  mainGame?: string;
  friendsSince: string;
}

export default function FriendsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'incoming' | 'add'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incomingData, friendsData] = await Promise.all([
        api.friends.getIncoming(),
        api.friends.getFriends(),
      ]);
      setIncoming(incomingData);
      setFriends(friendsData);
    } catch (err) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await api.users.search(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      toast.error('Ошибка поиска');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await api.friends.sendRequest(userId);
      toast.success('Запрос отправлен!');
      // Обновляем результаты поиска
      handleSearch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await api.friends.acceptRequest(requestId);
      toast.success('Запрос принят!');
      fetchData();
    } catch (err) {
      toast.error('Ошибка');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await api.friends.rejectRequest(requestId);
      toast.success('Запрос отклонен');
      fetchData();
    } catch (err) {
      toast.error('Ошибка');
    }
  };

  const handleRemove = async (friendId: string) => {
    if (!confirm('Удалить из друзей?')) return;
    try {
      await api.friends.removeFriend(friendId);
      toast.success('Удалено из друзей');
      fetchData();
    } catch (err) {
      toast.error('Ошибка');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">Войдите, чтобы управлять друзьями</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 flex flex-col space-y-6">
      {/* Header */}
      <div className="border-b border-arena-border pb-4">
        <h1 className="font-orbitron font-black text-2xl text-white uppercase tracking-wider flex items-center gap-2">
          <Users className="w-7 h-7 text-neon-purple" />
          Друзья
        </h1>
        <p className="text-gray-400 text-xs mt-1">Управляйте запросами в друзья и вашими контактами</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-arena-border pb-2">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 font-orbitron font-bold text-xs uppercase tracking-wider rounded-t transition-all ${
            activeTab === 'friends'
              ? 'bg-neon-purple/20 text-white border-b-2 border-neon-purple'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Друзья
          {friends.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-neon-purple/30 text-white rounded text-[10px]">
              {friends.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 font-orbitron font-bold text-xs uppercase tracking-wider rounded-t transition-all ${
            activeTab === 'incoming'
              ? 'bg-neon-purple/20 text-white border-b-2 border-neon-purple'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Входящие
          {incoming.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-neon-purple/30 text-white rounded text-[10px]">
              {incoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 font-orbitron font-bold text-xs uppercase tracking-wider rounded-t transition-all ${
            activeTab === 'add'
              ? 'bg-neon-purple/20 text-white border-b-2 border-neon-purple'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Добавить друзей
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <>
            {friends.length === 0 ? (
              <Card className="p-8 text-center space-y-4">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">У вас пока нет друзей</p>
                <Button onClick={() => setActiveTab('add')} variant="primary" size="sm">
                  Добавить друзей
                </Button>
              </Card>
            ) : (
              <div className="space-y-2">
                <h3 className="font-orbitron font-bold text-sm text-gray-400 uppercase tracking-wider px-2">
                  Мои друзья ({friends.length})
                </h3>
                {friends.map((friend) => (
                  <Card key={friend.id} className="p-4 flex items-center justify-between gap-4">
                    <Link href={`/profile/${friend.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-white font-bold">
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-lg">{friend.username[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-orbitron font-bold text-sm text-white">
                          {friend.displayName || friend.username}
                        </p>
                        <p className="text-xs text-gray-400">@{friend.username}</p>
                        {friend.mainGame && (
                          <Badge variant="gray" className="mt-1 text-[9px]">{friend.mainGame}</Badge>
                        )}
                      </div>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="danger" 
                      onClick={() => handleRemove(friend.id)}
                    >
                      Удалить
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Incoming Requests Tab */}
        {activeTab === 'incoming' && (
          <>
            {incoming.length === 0 ? (
              <Card className="p-8 text-center space-y-4">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Нет входящих запросов</p>
                <p className="text-xs text-gray-500 mt-1">Здесь будут отображаться запросы в друзья от других игроков</p>
              </Card>
            ) : (
              <div className="space-y-2">
                <h3 className="font-orbitron font-bold text-sm text-gray-400 uppercase tracking-wider px-2">
                  Запросы в друзья ({incoming.length})
                </h3>
                {incoming.map((req) => (
              <Card key={req.id} className="p-4 flex items-center justify-between gap-4">
                <Link href={`/profile/${req.sender.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-white font-bold">
                    {req.sender.avatarUrl ? (
                      <img src={req.sender.avatarUrl} alt={req.sender.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-lg">{req.sender.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-orbitron font-bold text-sm text-white">
                      {req.sender.displayName || req.sender.username}
                    </p>
                    <p className="text-xs text-gray-400">@{req.sender.username}</p>
                    {req.sender.mainGame && (
                      <Badge variant="gray" className="mt-1 text-[9px]">{req.sender.mainGame}</Badge>
                    )}
                  </div>
                </Link>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="primary" onClick={() => handleAccept(req.id)}>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Принять</span>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleReject(req.id)}>
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Отклонить</span>
                  </Button>
                </div>
              </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add Friends - Search */}
        {activeTab === 'add' && (
          <>
            <Card className="p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Поиск по нику..."
                  className="flex-1 px-4 py-2.5 rounded-lg glass-input text-sm"
                />
                <Button onClick={handleSearch} loading={searching} variant="primary">
                  Найти
                </Button>
              </div>
            </Card>

            {!searchQuery ? (
              <Card className="p-8 text-center">
                <UserPlus className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Поиск по нику</p>
                <p className="text-xs text-gray-500 mt-1">Введите ник игрока и отправьте запрос в друзья</p>
              </Card>
            ) : searchResults.length === 0 && !searching ? (
              <Card className="p-8 text-center">
                <UserPlus className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Пользователи не найдены</p>
              </Card>
            ) : (
              searchResults.map((result) => (
                <Card key={result.id} className="p-4 flex items-center justify-between gap-4">
                  <Link href={`/profile/${result.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-white font-bold">
                      {result.avatarUrl ? (
                        <img src={result.avatarUrl} alt={result.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        result.username[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-orbitron font-bold text-sm text-white">
                        {result.displayName || result.username}
                      </p>
                      <p className="text-xs text-gray-400">@{result.username}</p>
                      {result.mainGame && (
                        <Badge variant="gray" className="mt-1 text-[9px]">{result.mainGame}</Badge>
                      )}
                      {result.friendshipStatus && (
                        <Badge 
                          variant={result.friendshipStatus === 'friends' ? 'green' : 'gray'} 
                          className="mt-1 text-[9px]"
                        >
                          {result.friendshipStatus === 'friends' && 'Друзья'}
                          {result.friendshipStatus === 'pending_sent' && 'Запрос отправлен'}
                          {result.friendshipStatus === 'pending_received' && 'Входящий запрос'}
                        </Badge>
                      )}
                    </div>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="primary" 
                    onClick={() => handleSendRequest(result.id)}
                    disabled={result.friendshipStatus === 'friends' || result.friendshipStatus === 'pending_sent' || result.friendshipStatus === 'pending_received'}
                  >
                    <UserPlus className="w-4 h-4" />
                    {result.friendshipStatus === 'friends' && 'Уже друзья'}
                    {result.friendshipStatus === 'pending_sent' && 'Запрос отправлен'}
                    {result.friendshipStatus === 'pending_received' && 'Принять в друзья'}
                    {!result.friendshipStatus && 'Добавить в друзья'}
                  </Button>
                </Card>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
