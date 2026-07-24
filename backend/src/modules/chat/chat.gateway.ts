import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { WsThrottleGuard } from './guards/ws-throttle.guard';

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
    
    // Получить сообщения комнаты
    const messages = await this.chatService.getMessages(roomId, userId);
    client.emit('messages', messages);
    
    // Помечаем сообщения как прочитанные
    await this.chatService.markMessagesAsRead(roomId, userId);
    
    // Уведомляем собеседника что сообщения прочитаны
    const companionId = room.user1Id === userId ? room.user2Id : room.user1Id;
    const companionSocketId = this.connectedUsers.get(companionId);
    if (companionSocketId) {
      this.server.to(companionSocketId).emit('messages_read', { roomId });
    }
    
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
  @UseGuards(WsThrottleGuard) // 1 сообщение в 5 секунд
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

      // Определяем получателя
      const recipientId = room.user1Id === userId ? room.user2Id : room.user1Id;
      const isRecipientOnline = this.connectedUsers.has(recipientId);

      // Сохраняем сообщение
      const message = await this.chatService.createMessage(roomId, userId, content, isRecipientOnline);

      // Отправляем сообщение всем в комнате
      this.server.to(roomId).emit('new_message', message);

      // Уведомляем получателя если он онлайн (но не в комнате)
      const recipientSocketId = this.connectedUsers.get(recipientId);
      if (recipientSocketId) {
        // Проверяем находится ли получатель в этой комнате
        const recipientSocket = this.server.sockets.sockets.get(recipientSocketId);
        const isInRoom = recipientSocket?.rooms.has(roomId);
        
        if (!isInRoom) {
          // Если не в комнате - отправляем уведомление
          this.server.to(recipientSocketId).emit('room_updated', {
            roomId,
            lastMessage: content,
            lastMessageAt: new Date(),
          });
        } else {
          // Если в комнате - сразу помечаем как прочитанное
          await this.chatService.markMessagesAsRead(roomId, recipientId);
          this.server.to(roomId).emit('messages_read', { roomId });
        }
      }

      return { success: true, message };
    } catch (error) {
      console.error('Send message error:', error);
      if (error.message?.includes('Слишком частые')) {
        return { error: error.message };
      }
      return { error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('edit_message')
  @UseGuards(WsThrottleGuard)
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string; roomId: string },
  ) {
    const userId = client.data.userId;
    const { messageId, content, roomId } = data;

    try {
      const updatedMessage = await this.chatService.editMessage(messageId, userId, content);
      
      // Notify room
      this.server.to(roomId).emit('message_edited', updatedMessage);
      
      return { success: true, message: updatedMessage };
    } catch (error) {
      return { error: error.message || 'Failed to edit message' };
    }
  }

  @SubscribeMessage('delete_message')
  @UseGuards(WsThrottleGuard)
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; roomId: string; deleteForBoth?: boolean },
  ) {
    const userId = client.data.userId;
    const { messageId, roomId, deleteForBoth = true } = data;

    try {
      await this.chatService.deleteMessage(messageId, userId, deleteForBoth);
      
      // Notify room
      this.server.to(roomId).emit('message_deleted', { messageId, roomId, deleteForBoth, deletedBy: userId });
      
      return { success: true };
    } catch (error) {
      return { error: error.message || 'Failed to delete message' };
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

  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // Отправить уведомление о новой подписке
  sendFollowNotification(recipientId: string, followerId: string) {
    const recipientSocketId = this.connectedUsers.get(recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('follow_update', {
        type: 'new_follower',
        followerId,
      });
      console.log(`[ChatGateway] Sent follow notification to ${recipientId}`);
    }
  }

  // Отправить уведомление об отписке
  sendUnfollowNotification(recipientId: string, followerId: string) {
    const recipientSocketId = this.connectedUsers.get(recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('follow_update', {
        type: 'unfollowed',
        followerId,
      });
      console.log(`[ChatGateway] Sent unfollow notification to ${recipientId}`);
    }
  }
}
