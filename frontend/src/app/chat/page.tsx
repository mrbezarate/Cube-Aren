'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSocket } from '@/lib/hooks/useSocket';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Send, Users, MessageCircle, ArrowLeft, Edit2, Trash2, X, ShieldAlert, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';

interface ChatRoom {
  id: string;
  companion: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    cardBannerUrl?: string;
  };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

interface Message {
  id: string;
  roomId: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  isRead: boolean;
  isDelivered: boolean;
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface Friend {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  cardBannerUrl?: string;
  mainGame?: string;
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdFromUrl = searchParams.get('room');
  const { isAuthenticated, user } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [deleteForBoth, setDeleteForBoth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadRooms();
      loadFriends();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const loadUrlRoom = async () => {
      if (roomIdFromUrl && !selectedRoom && !loadingRoom) {
        let room = rooms.find(r => r.id === roomIdFromUrl);
        if (room) {
          handleSelectRoom(room);
        } else if (rooms.length > 0) {
          try {
            setLoadingRoom(true);
            const fetchedRoom = await api.chat.getRoom(roomIdFromUrl);
            const mappedRoom: ChatRoom = {
              id: fetchedRoom.id,
              companion: fetchedRoom.user1Id === user?.id ? fetchedRoom.user2 : fetchedRoom.user1,
              unreadCount: 0
            };
            setRooms(prev => [...prev, mappedRoom]);
            handleSelectRoom(mappedRoom);
          } catch (err) {
            console.error('Room not found', err);
          } finally {
            setLoadingRoom(false);
          }
        }
      }
    };
    loadUrlRoom();
  }, [roomIdFromUrl, rooms.length]); // depend on rooms.length so it runs after rooms load

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('rooms', (data: ChatRoom[]) => {
        setRooms(data);
      });

      socket.on('messages', (data: Message[]) => {
        setMessages(data);
        scrollToBottom();
      });

      socket.on('new_message', (message: Message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      socket.on('room_updated', (data: any) => {
        setRooms((prev) =>
          prev.map((room) =>
            room.id === data.roomId
              ? { 
                  ...room, 
                  lastMessage: data.lastMessage, 
                  lastMessageAt: data.lastMessageAt,
                  unreadCount: selectedRoom?.id === data.roomId ? 0 : room.unreadCount + 1
                }
              : room
          )
        );
      });

      socket.on('user_typing', (data: { userId: string; isTyping: boolean }) => {
        if (selectedRoom && data.userId === selectedRoom.companion.id) {
          setIsTyping(data.isTyping);
        }
      });

      socket.on('messages_read', (data: { roomId: string }) => {
        if (selectedRoom && selectedRoom.id === data.roomId) {
          setMessages((prev) =>
            prev.map((msg) => ({
              ...msg,
              isRead: msg.senderId === user?.id ? true : msg.isRead,
            }))
          );
        }
      });

      socket.on('message_edited', (editedMessage: Message) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === editedMessage.id ? editedMessage : msg))
        );
      });

      socket.on('message_deleted', (data: { messageId: string, roomId: string }) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
      });

      return () => {
        socket.off('rooms');
        socket.off('messages');
        socket.off('new_message');
        socket.off('room_updated');
        socket.off('user_typing');
        socket.off('messages_read');
        socket.off('message_edited');
        socket.off('message_deleted');
      };
    }
  }, [socket, isConnected, selectedRoom, user]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await api.chat.getRooms();
      setRooms(data);
    } catch (err) {
      toast.error('Ошибка загрузки чатов');
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const data = await api.friends.getFriends();
      setFriends(data);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  };

  const handleSelectFriend = async (friend: Friend) => {
    const existingRoom = rooms.find(r => r.companion.id === friend.id);
    if (existingRoom) {
      handleSelectRoom(existingRoom);
      setSelectedFriend(friend);
      return;
    }

    try {
      setLoadingRoom(true);
      setSelectedFriend(friend);
      setMessages([]);
      setSelectedRoom(null);
      
      const room = await api.chat.getOrCreateRoom(friend.id);
      
      const chatRoom: ChatRoom = {
        id: room.id,
        companion: friend,
        unreadCount: 0,
      };
      
      setRooms(prev => {
        if (prev.find(r => r.id === room.id)) return prev;
        return [...prev, chatRoom];
      });
      
      handleSelectRoom(chatRoom);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка создания чата');
      setSelectedFriend(null);
    } finally {
      setLoadingRoom(false);
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    if (socket && isConnected && selectedRoom) {
      socket.emit('typing', { roomId: selectedRoom.id, isTyping: false });
    }

    setSelectedRoom(room);
    setMessages([]);
    setIsTyping(false);
    setNewMessage(''); 

    if (socket && isConnected) {
      socket.emit('join_room', { roomId: room.id });
      socket.emit('mark_as_read', { roomId: room.id });
    }

    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r))
    );
  };

  const handleBack = () => {
    setSelectedRoom(null);
    setSelectedFriend(null);
    router.replace('/chat');
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoom || !socket || !isConnected) return;

    if (editingMessageId) {
      socket.emit('edit_message', {
        roomId: selectedRoom.id,
        messageId: editingMessageId,
        content: newMessage.trim(),
      }, (response: any) => {
        if (response?.error) toast.error(response.error);
      });
      setEditingMessageId(null);
      setNewMessage('');
      return;
    }

    socket.emit('send_message', {
      roomId: selectedRoom.id,
      content: newMessage.trim(),
    }, (response: any) => {
      if (response?.error) {
        toast.error(response.error);
      }
    });

    setNewMessage('');
  };

  const handleEditInit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setNewMessage(msg.content);
  };

  const handleDelete = (msgId: string) => {
    setDeletingMessageId(msgId);
  };

  const confirmDelete = () => {
    if (!selectedRoom || !socket || !isConnected || !deletingMessageId) return;
    
    socket.emit('delete_message', { 
      roomId: selectedRoom.id, 
      messageId: deletingMessageId,
      deleteForBoth
    }, (response: any) => {
      if (response?.error) {
        toast.error(response.error);
      }
    });
    
    setDeletingMessageId(null);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    if (socket && isConnected && selectedRoom) {
      const isCurrentlyTyping = value.length > 0;
      socket.emit('typing', { roomId: selectedRoom.id, isTyping: isCurrentlyTyping });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isCurrentlyTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('typing', { roomId: selectedRoom.id, isTyping: false });
        }, 3000);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socket && isConnected && selectedRoom) {
        socket.emit('typing', { roomId: selectedRoom.id, isTyping: false });
      }
    };
  }, [socket, isConnected, selectedRoom]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">Войдите, чтобы использовать чат</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-[#0a0a0c]">
      {/* Left Sidebar - Contacts List */}
      <div className={`${selectedRoom ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 flex-col bg-[#0d0d12] border-r border-zinc-800/80`}>
        <div className="p-6 bg-zinc-900/50 border-b border-zinc-800/80 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 to-transparent" />
          <h2 className="font-orbitron font-black text-xl text-white uppercase tracking-widest flex items-center gap-3">
            <Users className="w-5 h-5 text-yellow-600" />
            Контакты
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              {isConnected ? 'Сеть стабильна' : 'Соединение разорвано'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : friends.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldAlert className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 font-bold uppercase text-xs tracking-widest">Нет союзников</p>
            </div>
          ) : (
            friends.map((friend) => {
              const room = rooms.find(r => r.companion.id === friend.id);
              const isActive = selectedRoom?.companion.id === friend.id;
              
              return (
                <button
                  key={friend.id}
                  onClick={() => handleSelectFriend(friend)}
                  className={`w-full p-4 flex items-center gap-4 transition-all relative group text-left ${
                    isActive ? 'bg-zinc-800/50' : 'hover:bg-zinc-900'
                  }`}
                  style={{
                    clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
                    backgroundImage: friend.cardBannerUrl && isActive
                      ? `linear-gradient(90deg, rgba(13,13,18,0.95) 0%, rgba(13,13,18,0.7) 100%), url(${friend.cardBannerUrl})`
                      : 'none',
                    backgroundSize: 'cover',
                  }}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isActive ? 'bg-yellow-600' : 'bg-transparent group-hover:bg-zinc-700'}`} />
                  
                  <div className="relative shrink-0">
                    <Avatar src={friend.avatarUrl} alt={friend.displayName || friend.username} className="w-12 h-12 rounded-none border border-zinc-700 [clip-path:polygon(0_0,100%_0,100%_80%,80%_100%,0_100%)]" />
                    {room && room.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-yellow-600 text-black text-[10px] font-black px-1.5 py-0.5" style={{ clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)' }}>
                        {room.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-orbitron font-bold text-sm text-white truncate uppercase tracking-wide group-hover:text-yellow-500 transition-colors">
                      {friend.displayName || friend.username}
                    </p>
                    {room?.lastMessage && (
                      <p className={`text-[11px] truncate mt-1 font-mono ${room.unreadCount > 0 ? 'text-yellow-600 font-bold' : 'text-zinc-500'}`}>
                        {room.lastMessage}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel - Chat Area */}
      {selectedRoom || loadingRoom ? (
        <div className="flex-1 flex flex-col relative bg-[#111116] overflow-hidden">
          {loadingRoom ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedRoom ? (
            <>
              {/* Header */}
              <div
                className="px-6 py-4 border-b border-zinc-800/80 flex items-center gap-4 relative z-10"
                style={{
                  backgroundImage: selectedRoom.companion.cardBannerUrl
                    ? `linear-gradient(90deg, rgba(17,17,22,1) 0%, rgba(17,17,22,0.6) 100%), url(${selectedRoom.companion.cardBannerUrl})`
                    : 'none',
                  backgroundSize: 'cover',
                }}
              >
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 mix-blend-overlay" />
                <button
                  onClick={handleBack}
                  className="lg:hidden p-2 text-zinc-400 hover:text-white bg-black border border-zinc-800 transition-colors"
                  style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar src={selectedRoom.companion.avatarUrl} alt={selectedRoom.companion.displayName || selectedRoom.companion.username} className="w-10 h-10 rounded-none border border-zinc-700 shrink-0 [clip-path:polygon(0_0,100%_0,100%_80%,80%_100%,0_100%)]" />
                <div className="flex-1 relative z-10">
                  <p className="font-orbitron font-black text-lg text-white uppercase tracking-widest drop-shadow-md">
                    {selectedRoom.companion.displayName || selectedRoom.companion.username}
                  </p>
                  {isTyping && (
                    <p className="text-[10px] text-yellow-600 font-mono uppercase tracking-widest animate-pulse mt-0.5">Приём данных...</p>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative z-0">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center opacity-50">
                      <MessageCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-500 font-orbitron font-bold uppercase tracking-widest text-xs">Канал связи открыт</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, i) => {
                    const isOwn = message.senderId === user.id;
                    const prevMsg = i > 0 ? messages[i-1] : null;
                    const isConsecutive = prevMsg && prevMsg.senderId === message.senderId;
                    
                    return (
                      <div key={message.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${isConsecutive ? '-mt-4' : ''} animate-fadeIn`}>
                        <div className={`group relative max-w-[85%] md:max-w-[70%] ${
                          isOwn 
                            ? 'bg-gradient-to-br from-yellow-600/10 to-transparent border border-yellow-600/30' 
                            : 'bg-zinc-900 border border-zinc-800'
                        } px-4 py-3 shadow-lg`}
                        style={{ clipPath: isOwn ? 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' : 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
                          
                          {isOwn && (
                            <div className="absolute top-2 -left-16 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button onClick={() => handleEditInit(message)} className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDelete(message.id)} className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-900/50 transition-colors" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          
                          <p className={`text-sm break-words font-mono ${isOwn ? 'text-zinc-200' : 'text-zinc-300'}`}>{message.content}</p>
                          
                          <div className="flex items-center justify-end gap-2 mt-2">
                            {message.isEdited && <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Ред.</span>}
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(message.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              <div className="flex -space-x-1">
                                <Check className={`w-3 h-3 ${message.isDelivered || message.isRead ? 'text-yellow-600' : 'text-zinc-600'}`} />
                                <Check className={`w-3 h-3 ${message.isRead ? 'text-yellow-600' : 'text-transparent'}`} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-zinc-900 border-t border-zinc-800 relative z-10">
                {editingMessageId && (
                  <div className="absolute -top-10 left-0 w-full px-4 flex justify-between items-center bg-black/80 backdrop-blur-sm border-t border-yellow-600/30 py-2">
                    <span className="text-[10px] text-yellow-600 font-orbitron font-bold uppercase tracking-widest flex items-center gap-2">
                      <Edit2 className="w-3 h-3" /> Режим изменения
                    </span>
                    <button onClick={cancelEdit} className="text-zinc-500 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex gap-3 max-w-5xl mx-auto items-end">
                  <textarea
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="КОД СООБЩЕНИЯ..."
                    className="flex-1 bg-black border border-zinc-800 text-sm text-white px-4 py-3 min-h-[48px] max-h-32 focus:border-yellow-600 focus:outline-none transition-colors resize-none font-mono"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    disabled={!isConnected}
                    rows={1}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="shrink-0 bg-yellow-600 hover:bg-yellow-500 text-black px-5 py-3 h-[48px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(202,138,4,0.3)]"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-[#0a0a0c] bg-[url('/grid.svg')] bg-center relative">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          <div className="text-center relative z-10">
            <MessageCircle className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
            <p className="text-zinc-500 font-orbitron font-black text-xl uppercase tracking-widest">Канал не выбран</p>
            <p className="text-xs text-zinc-600 mt-2 font-mono uppercase">Ожидание подключения к узлу связи</p>
          </div>
        </div>
      )}

      {/* Modern Game-like Delete Modal */}
      {deletingMessageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111116] border border-red-900/50 p-8 max-w-sm w-full shadow-[0_0_50px_rgba(220,38,38,0.1)]" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
            <h3 className="font-orbitron font-black text-lg text-white uppercase tracking-widest mb-4 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-red-500" /> Уничтожение данных
            </h3>
            
            <p className="text-sm text-zinc-400 font-mono mb-6">
              Вы уверены, что хотите безвозвратно удалить эту передачу?
            </p>
            
            <label className="flex items-center gap-3 cursor-pointer mb-8 group">
              <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${deleteForBoth ? 'border-red-500 bg-red-500/20' : 'border-zinc-700 bg-black group-hover:border-zinc-500'}`} style={{ clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)' }}>
                {deleteForBoth && <Check className="w-3 h-3 text-red-500" />}
              </div>
              <input type="checkbox" checked={deleteForBoth} onChange={(e) => setDeleteForBoth(e.target.checked)} className="hidden" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-300 select-none group-hover:text-white transition-colors">Стереть у обоих агентов</span>
            </label>
            
            <div className="flex gap-4">
              <button onClick={() => setDeletingMessageId(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 text-xs font-black uppercase tracking-widest transition-colors" style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                Отмена
              </button>
              <button onClick={confirmDelete} className="flex-1 bg-red-900/50 hover:bg-red-600 border border-red-500/50 hover:border-red-500 text-white py-3 text-xs font-black uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]" style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                Уничтожить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#0a0a0c]">
          <div className="w-10 h-10 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
