import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      client.data.userId = userId;
      this.connectedUsers.set(userId, client.id);
      
      console.log(`User ${userId} connected to chat`);
      
      // Отправляем пользователю его комнаты
      const rooms = await this.chatService.getUserRooms(userId);
      client.emit('rooms', rooms);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected from chat`);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.userId;
    const { roomId } = data;

    // Проверяем что пользователь участник этой комнаты
    const room = await this.chatService.getRoom(roomId);
    if (!room || (room.user1Id !== userId && room.user2Id !== userId)) {
      return { error: 'Access denied' };
    }

    client.join(roomId);
    
    // Отправляем историю сообщений
    const messages = await this.chatService.getMessages(roomId);
    client.emit('messages', messages);
    
    return { success: true };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(data.roomId);
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; content: string },
  ) {
    const userId = client.data.userId;
    const { roomId, content } = data;

    try {
      // Проверяем что пользователь участник этой комнаты
      const room = await this.chatService.getRoom(roomId);
      if (!room || (room.user1Id !== userId && room.user2Id !== userId)) {
        return { error: 'Access denied' };
      }

      // Сохраняем сообщение
      const message = await this.chatService.createMessage(roomId, userId, content);

      // Отправляем сообщение всем в комнате
      this.server.to(roomId).emit('new_message', message);

      // Уведомляем получателя если он онлайн
      const recipientId = room.user1Id === userId ? room.user2Id : room.user1Id;
      const recipientSocketId = this.connectedUsers.get(recipientId);
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('room_updated', {
          roomId,
          lastMessage: content,
          lastMessageAt: new Date(),
        });
      }

      return { success: true, message };
    } catch (error) {
      console.error('Send message error:', error);
      return { error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.userId;
    const { roomId } = data;

    try {
      await this.chatService.markMessagesAsRead(roomId, userId);
      return { success: true };
    } catch (error) {
      return { error: 'Failed to mark as read' };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    // Отправляем индикатор набора всем в комнате кроме отправителя
    client.to(data.roomId).emit('user_typing', {
      userId,
      isTyping: data.isTyping,
    });
  }
}
