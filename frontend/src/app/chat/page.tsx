'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSocket } from '@/lib/hooks/useSocket';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Send, Users, MessageCircle, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ChatRoom {
  id: string;
  companion: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const roomIdFromUrl = searchParams.get('room');
  const { isAuthenticated, user } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadRooms();
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
              ? { ...room, lastMessage: data.lastMessage, lastMessageAt: data.lastMessageAt }
              : room
          )
        );
      });

      socket.on('user_typing', (data: { userId: string; isTyping: boolean }) => {
        if (selectedRoom && data.userId === selectedRoom.companion.id) {
          setIsTyping(data.isTyping);
        }
      });

      return () => {
        socket.off('rooms');
        socket.off('messages');
        socket.off('new_message');
        socket.off('room_updated');
        socket.off('user_typing');
      };
    }
  }, [socket, isConnected, selectedRoom]);

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

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setMessages([]);
    setIsTyping(false);

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

    socket.emit('send_message', {
      roomId: selectedRoom.id,
      content: newMessage.trim(),
    });

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
      socket.emit('typing', {
        roomId: selectedRoom.id,
        isTyping: value.length > 0,
      });
    }
  };

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
      {/* Left Sidebar - Room List */}
      <div className={`${selectedRoom ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-arena-border bg-arena-card`}>
        <div className="p-6 border-b border-arena-border">
          <h2 className="font-orbitron font-bold text-xl text-white flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-neon-purple" />
            Чаты
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
          ) : rooms.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-300 text-base font-medium">Нет активных чатов</p>
              <p className="text-sm text-gray-500 mt-2">Добавьте друзей и начните общение</p>
            </div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleSelectRoom(room)}
                className={`w-full p-5 flex items-center gap-4 hover:bg-arena-dark/30 transition-all border-b border-arena-border/30 ${
                  selectedRoom?.id === room.id ? 'bg-neon-purple/15 border-l-4 border-l-neon-purple' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-white font-bold">
                    {room.companion.avatarUrl ? (
                      <img src={room.companion.avatarUrl} alt={room.companion.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-lg">{room.companion.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  {room.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-neon-purple border-2 border-arena-card flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">{room.unreadCount}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-orbitron font-bold text-base text-white truncate">
                    {room.companion.displayName || room.companion.username}
                  </p>
                  {room.lastMessage && (
                    <p className="text-sm text-gray-400 truncate mt-1">{room.lastMessage}</p>
                  )}
                  {room.lastMessageAt && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      {new Date(room.lastMessageAt).toLocaleString('ru-RU', { 
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Window */}
      {selectedRoom ? (
        <div className="flex-1 flex flex-col bg-arena-dark">
          {/* Chat Header */}
          <div className="p-5 border-b border-arena-border flex items-center gap-4 bg-arena-card/80 backdrop-blur-sm">
            <button
              onClick={() => setSelectedRoom(null)}
              className="md:hidden text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-white font-bold">
              {selectedRoom.companion.avatarUrl ? (
                <img src={selectedRoom.companion.avatarUrl} alt={selectedRoom.companion.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-lg">{selectedRoom.companion.username[0].toUpperCase()}</span>
              )}
            </div>
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
                    <div className={`max-w-[75%] md:max-w-[60%] ${
                      isOwn 
                        ? 'bg-neon-purple/25 border-neon-purple/50' 
                        : 'bg-arena-card border-arena-border'
                    } border rounded-2xl px-4 py-3 shadow-lg`}>
                      <p className="text-base text-white break-words leading-relaxed">{message.content}</p>
                      <p className="text-[11px] text-gray-500 mt-2 text-right">
                        {new Date(message.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-5 border-t border-arena-border bg-arena-card/80 backdrop-blur-sm">
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
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-arena-dark via-arena-dark to-neon-purple/5">
          <div className="text-center">
            <MessageCircle className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <p className="text-gray-300 font-orbitron font-bold text-lg">Выберите чат</p>
            <p className="text-sm text-gray-500 mt-2">Выберите беседу из списка слева</p>
          </div>
        </div>
      )}
    </div>
  );
}
