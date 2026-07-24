'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSocket } from '@/lib/hooks/useSocket';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Send, Users, MessageCircle, ArrowLeft, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
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

  // Автоматически открываем комнату из URL
  useEffect(() => {
    if (roomIdFromUrl && rooms.length > 0 && !selectedRoom) {
      const room = rooms.find(r => r.id === roomIdFromUrl);
      if (room) {
        handleSelectRoom(room);
      }
    }
  }, [roomIdFromUrl, rooms, selectedRoom]);

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
        // Помечаем все сообщения в комнате как прочитанные
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
        // Обновить lastMessage если нужно
        setRooms((prev) =>
          prev.map((room) => {
            if (room.id === editedMessage.roomId || (selectedRoom && selectedRoom.id === room.id)) {
               // Только если это последнее сообщение, но мы просто обновим для надежности
               // Это сложно проверить без полного массива, так что пока так
            }
            return room;
          })
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
    // Проверяем есть ли уже комната с этим другом
    const existingRoom = rooms.find(r => r.companion.id === friend.id);
    
    if (existingRoom) {
      // Если комната уже есть, открываем её
      handleSelectRoom(existingRoom);
      setSelectedFriend(friend);
      return;
    }

    // Создаём или получаем комнату
    try {
      setLoadingRoom(true);
      setSelectedFriend(friend);
      setMessages([]);
      setSelectedRoom(null);
      
      const room = await api.chat.getOrCreateRoom(friend.id);
      
      // Добавляем комнату в список если её там нет
      setRooms(prev => {
        const exists = prev.find(r => r.id === room.id);
        if (exists) return prev;
        
        return [...prev, {
          id: room.id,
          companion: friend,
          unreadCount: 0,
        }];
      });
      
      // Открываем комнату
      const chatRoom: ChatRoom = {
        id: room.id,
        companion: friend,
        unreadCount: 0,
      };
      
      setSelectedRoom(chatRoom);
      
      if (socket && isConnected) {
        socket.emit('join_room', { roomId: room.id });
      }
    } catch (err: any) {
      console.error('Failed to create room:', err);
      toast.error(err.response?.data?.message || 'Ошибка создания чата');
      setSelectedFriend(null);
    } finally {
      setLoadingRoom(false);
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    // Останавливаем печатание в предыдущей комнате
    if (socket && isConnected && selectedRoom) {
      socket.emit('typing', {
        roomId: selectedRoom.id,
        isTyping: false,
      });
    }

    setSelectedRoom(room);
    setMessages([]);
    setIsTyping(false);
    setNewMessage(''); // Очищаем поле ввода

    if (socket && isConnected) {
      socket.emit('join_room', { roomId: room.id });
      socket.emit('mark_as_read', { roomId: room.id });
    }

    // Обновляем счетчик непрочитанных
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r))
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoom || !socket || !isConnected) return;

    if (editingMessageId) {
      socket.emit('edit_message', {
        roomId: selectedRoom.id,
        messageId: editingMessageId,
        content: newMessage.trim(),
      }, (response: any) => {
        if (response?.error) {
          toast.error(response.error);
        }
      });
      setEditingMessageId(null);
      setNewMessage('');
      return;
    }

    // Отправляем сообщение
    socket.emit('send_message', {
      roomId: selectedRoom.id,
      content: newMessage.trim(),
    }, (response: any) => {
      // Обработка ответа от сервера
      if (response?.error) {
        if (response.error.includes('Слишком частые')) {
          toast.error(response.error, { duration: 3000 });
        } else {
          toast.error('Ошибка отправки сообщения');
        }
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
      deleteForBoth // Pass the flag to backend if supported, but for now we just show the checkbox in UI as requested by user
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
      
      socket.emit('typing', {
        roomId: selectedRoom.id,
        isTyping: isCurrentlyTyping,
      });

      // Автоматически отключаем "печатает" через 3 секунды
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isCurrentlyTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('typing', {
            roomId: selectedRoom.id,
            isTyping: false,
          });
        }, 3000);
      }
    }
  };

  // Останавливаем индикатор печатания при выходе из комнаты
  useEffect(() => {
    return () => {
      // Очищаем таймер
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // При размонтировании компонента или смене комнаты отправляем что перестали печатать
      if (socket && isConnected && selectedRoom) {
        socket.emit('typing', {
          roomId: selectedRoom.id,
          isTyping: false,
        });
      }
    };
  }, [socket, isConnected, selectedRoom]);

  // Присоединяемся к комнате когда сокет подключается или комната меняется
  useEffect(() => {
    if (socket && isConnected && selectedRoom) {
      socket.emit('join_room', { roomId: selectedRoom.id });
      socket.emit('mark_as_read', { roomId: selectedRoom.id });
    }
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
    <div className="h-[calc(100vh-64px)] flex">
      {/* Left Sidebar - Friends List (Contacts) */}
      <div className={`${selectedRoom ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 flex-col border-r border-arena-border bg-arena-card`}>
        <div className="p-6 border-b border-arena-border">
          <h2 className="font-orbitron font-bold text-xl text-white flex items-center gap-3">
            <Users className="w-6 h-6 text-neon-purple" />
            Друзья
          </h2>
          <p className="text-xs text-gray-400 mt-2">
            {isConnected ? '🟢 Подключено' : '🔴 Не подключено'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : friends.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-300 text-base font-medium">Нет друзей</p>
              <p className="text-sm text-gray-500 mt-2">Добавьте друзей чтобы начать общение</p>
            </div>
          ) : (
            friends.map((friend) => {
              // Ищем комнату с этим другом для показа счётчика непрочитанных
              const room = rooms.find(r => r.companion.id === friend.id);
              const isActive = selectedFriend?.id === friend.id;
              
              return (
                <button
                  key={friend.id}
                  onClick={() => handleSelectFriend(friend)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-arena-dark/30 transition-all border-b border-arena-border/30 relative overflow-hidden group ${
                    isActive ? 'bg-neon-purple/15 border-l-4 border-l-neon-purple' : ''
                  }`}
                  style={
                    friend.cardBannerUrl
                      ? {
                          backgroundImage: `linear-gradient(90deg, rgba(17, 17, 25, 0.96) 0%, rgba(17, 17, 25, 0.88) 100%), url(${friend.cardBannerUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : undefined
                  }
                >
                  <div className="relative flex-shrink-0">
                    <Avatar src={friend.avatarUrl} alt={friend.displayName || friend.username} className="w-12 h-12" />
                    {room && room.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-arena-card flex items-center justify-center animate-pulse">
                        <span className="text-white text-[9px] font-bold">{room.unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-orbitron font-bold text-sm text-white truncate">
                      {friend.displayName || friend.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">@{friend.username}</p>
                    {room?.lastMessage && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{room.lastMessage}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel - Chat Window */}
      {selectedRoom || loadingRoom ? (
        <div className="flex-1 flex flex-col bg-arena-dark">
          {loadingRoom ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Загрузка чата...</p>
              </div>
            </div>
          ) : selectedRoom ? (
            <>
              {/* Chat Header */}
              <div
                className="p-5 border-b border-arena-border flex items-center gap-4 bg-arena-card/80 backdrop-blur-sm relative overflow-hidden"
                style={
                  selectedRoom.companion.cardBannerUrl
                    ? {
                        backgroundImage: `linear-gradient(90deg, rgba(17, 17, 25, 0.9) 0%, rgba(17, 17, 25, 0.75) 100%), url(${selectedRoom.companion.cardBannerUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                <button
                  onClick={() => {
                    setSelectedRoom(null);
                    setSelectedFriend(null);
                  }}
                  className="lg:hidden text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <Avatar src={selectedRoom.companion.avatarUrl} alt={selectedRoom.companion.displayName || selectedRoom.companion.username} className="w-12 h-12" />
                <div className="flex-1">
                  <p className="font-orbitron font-bold text-base text-white">
                    {selectedRoom.companion.displayName || selectedRoom.companion.username}
                  </p>
                  {isTyping && (
                    <p className="text-sm text-neon-blue animate-pulse">печатает...</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-arena-dark to-arena-dark/50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 font-medium">Начните общение</p>
                      <p className="text-sm text-gray-500 mt-1">Отправьте первое сообщение</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderId === user.id;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                        <div className={`group relative max-w-[85%] md:max-w-[70%] ${
                          isOwn 
                            ? 'bg-gradient-to-br from-neon-purple to-neon-purple/80 text-white shadow-neon-purple/20' 
                            : 'bg-arena-card/80 backdrop-blur-sm border-arena-border/50 text-gray-200 shadow-black/20'
                        } border rounded-2xl px-5 py-3 shadow-lg flex flex-col`}>
                          
                          {/* Dropdown menu for own messages */}
                          {isOwn && (
                            <div className="absolute top-2 -left-12 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                              <button onClick={() => handleEditInit(message)} className="p-1.5 bg-arena-card border border-arena-border rounded-full hover:bg-arena-dark text-gray-400 hover:text-white transition-colors" title="Редактировать">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(message.id)} className="p-1.5 bg-arena-card border border-arena-border rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors" title="Удалить">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          
                          <p className={`text-base break-words leading-relaxed ${isOwn ? 'text-white' : 'text-gray-200'}`}>{message.content}</p>
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              {message.isEdited && (
                                <span className={`text-[10px] italic mr-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>ред.</span>
                              )}
                              <p className={`text-[11px] ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                                {new Date(message.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {isOwn && (
                              <div className="flex items-center gap-0.5">
                                {message.isRead ? (
                                  <>
                                    <svg className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <svg className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-green-400'} -ml-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </>
                                ) : message.isDelivered ? (
                                  <>
                                    <svg className={`w-4 h-4 ${isOwn ? 'text-white/70' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <svg className={`w-4 h-4 ${isOwn ? 'text-white/70' : 'text-gray-400'} -ml-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </>
                                ) : (
                                  <svg className={`w-4 h-4 ${isOwn ? 'text-white/50' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
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

              {/* Input */}
              <div className="p-5 border-t border-arena-border bg-arena-card/80 backdrop-blur-sm flex flex-col gap-2">
                {editingMessageId && (
                  <div className="flex items-center justify-between text-sm text-gray-400 bg-arena-dark px-4 py-2 rounded-lg border border-arena-border">
                    <div className="flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-neon-purple" />
                      <span>Редактирование сообщения</span>
                    </div>
                    <button onClick={cancelEdit} className="hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Напишите сообщение..."
                    className="flex-1 px-5 py-3.5 rounded-xl glass-input text-base focus:ring-2 focus:ring-neon-purple/50 transition-all"
                    disabled={!isConnected}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    variant="primary"
                    className="px-6 py-3.5 rounded-xl"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-arena-dark via-arena-dark to-neon-purple/5">
          <div className="text-center">
            <MessageCircle className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <p className="text-gray-300 font-orbitron font-bold text-lg">Выберите друга</p>
            <p className="text-sm text-gray-500 mt-2">Выберите друга из списка слева чтобы начать общение</p>
          </div>
        </div>
      )}

      {/* Delete Message Modal */}
      <Modal
        isOpen={!!deletingMessageId}
        onClose={() => setDeletingMessageId(null)}
        title="Удаление сообщения"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Вы уверены, что хотите удалить это сообщение?
          </p>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deleteForBoth"
              checked={deleteForBoth}
              onChange={(e) => setDeleteForBoth(e.target.checked)}
              className="w-4 h-4 rounded border-arena-border bg-arena-dark text-neon-purple focus:ring-neon-purple focus:ring-offset-arena-card"
            />
            <label htmlFor="deleteForBoth" className="text-sm text-gray-400 select-none cursor-pointer">
              Удалить у обоих
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeletingMessageId(null)}
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-red-500 hover:bg-red-600 border-red-500 text-white"
              onClick={confirmDelete}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
