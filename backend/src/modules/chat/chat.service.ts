import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from '../../entities/chat-room.entity';
import { Message } from '../../entities/message.entity';
import { Friendship } from '../../entities/friendship.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepo: Repository<ChatRoom>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(Friendship)
    private friendshipRepo: Repository<Friendship>,
  ) {}

  // Получить или создать комнату между двумя пользователями
  async getOrCreateRoom(user1Id: string, user2Id: string): Promise<ChatRoom> {
    // Проверяем что пользователи друзья
    const [minId, maxId] = [user1Id, user2Id].sort();
    
    const areFriends = await this.friendshipRepo.findOne({
      where: { user1Id: minId, user2Id: maxId },
    });

    if (!areFriends) {
      throw new BadRequestException('Вы можете писать только друзьям');
    }

    // Ищем существующую комнату
    let room = await this.chatRoomRepo.findOne({
      where: { user1Id: minId, user2Id: maxId },
      relations: ['user1', 'user2'],
    });

    if (!room) {
      // Создаем новую комнату
      room = this.chatRoomRepo.create({
        user1Id: minId,
        user2Id: maxId,
      });
      await this.chatRoomRepo.save(room);
      
      // Загружаем с relations
      room = await this.chatRoomRepo.findOne({
        where: { id: room.id },
        relations: ['user1', 'user2'],
      });
    }

    return room;
  }

  // Получить комнату по ID
  async getRoom(roomId: string): Promise<ChatRoom> {
    const room = await this.chatRoomRepo.findOne({
      where: { id: roomId },
      relations: ['user1', 'user2'],
    });

    if (!room) {
      throw new NotFoundException('Комната не найдена');
    }

    return room;
  }

  // Получить все комнаты пользователя
  async getUserRooms(userId: string) {
    const rooms = await this.chatRoomRepo
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.user1', 'user1')
      .leftJoinAndSelect('room.user2', 'user2')
      .where('room.user1Id = :userId OR room.user2Id = :userId', { userId })
      .orderBy('room.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('room.createdAt', 'DESC')
      .getMany();

    // Фильтруем комнаты где оба пользователя существуют
    const validRooms = rooms.filter(room => room.user1 !== null && room.user2 !== null);

    // Подсчитываем непрочитанные сообщения для каждой комнаты
    const roomsWithUnread = await Promise.all(
      validRooms.map(async (room) => {
        const unreadCount = await this.messageRepo.count({
          where: {
            roomId: room.id,
            senderId: room.user1Id === userId ? room.user2Id : room.user1Id,
            isRead: false,
          },
        });

        // Определяем собеседника
        const companion = room.user1Id === userId ? room.user2 : room.user1;

        return {
          id: room.id,
          companion: {
            id: companion.id,
            username: companion.username,
            displayName: companion.displayName,
            avatarUrl: companion.avatarUrl,
          },
          lastMessage: room.lastMessage,
          lastMessageAt: room.lastMessageAt,
          unreadCount,
        };
      }),
    );

    return roomsWithUnread;
  }

  // Создать сообщение
  async createMessage(roomId: string, senderId: string, content: string): Promise<Message> {
    const message = this.messageRepo.create({
      roomId,
      senderId,
      content,
    });

    await this.messageRepo.save(message);

    // Обновляем lastMessage в комнате
    await this.chatRoomRepo.update(roomId, {
      lastMessage: content,
      lastMessageAt: new Date(),
    });

    // Загружаем с sender
    return this.messageRepo.findOne({
      where: { id: message.id },
      relations: ['sender'],
    });
  }

  // Получить сообщения комнаты
  async getMessages(roomId: string, limit = 50): Promise<Message[]> {
    return this.messageRepo.find({
      where: { roomId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  // Отметить сообщения как прочитанные
  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('roomId = :roomId', { roomId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('isRead = false')
      .execute();
  }
}
