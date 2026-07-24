import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChatRoom } from '../../entities/chat-room.entity';
import { Message } from '../../entities/message.entity';
import { toUserCard } from '../../common/user-view';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepo: Repository<ChatRoom>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    private dataSource: DataSource,
  ) {}

  // Получить или создать комнату между двумя пользователями
  async getOrCreateRoom(user1Id: string, user2Id: string): Promise<ChatRoom> {
    console.log(`[ChatService] getOrCreateRoom: user1=${user1Id}, user2=${user2Id}`);
    const [minId, maxId] = [user1Id, user2Id].sort();
    console.log(`[ChatService] Sorted IDs: min=${minId}, max=${maxId}`);
    
    // Используем transaction для атомарности
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Проверяем что пользователи друзья = взаимная подписка
      const followRepo = queryRunner.manager.getRepository('Follow');
      
      const follow1 = await followRepo.findOne({
        where: { followerId: user1Id, followingId: user2Id },
      });
      const follow2 = await followRepo.findOne({
        where: { followerId: user2Id, followingId: user1Id },
      });

      console.log(`[ChatService] Follow check: follow1=${!!follow1}, follow2=${!!follow2}`);

      if (!follow1 || !follow2) {
        throw new BadRequestException('Вы можете писать только друзьям (нужна взаимная подписка)');
      }

      // Ищем существующую комнату (с блокировкой строки)
      let room = await queryRunner.manager.findOne(ChatRoom, {
        where: { user1Id: minId, user2Id: maxId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!room) {
        console.log(`[ChatService] Creating new room`);
        // Создаем новую комнату
        room = queryRunner.manager.create(ChatRoom, {
          user1Id: minId,
          user2Id: maxId,
        });
        await queryRunner.manager.save(room);
        console.log(`[ChatService] Room created: ${room.id}`);
      } else {
        console.log(`[ChatService] Existing room found: ${room.id}`);
      }

      await queryRunner.commitTransaction();

      // Загружаем с relations после коммита
      const fullRoom = await this.chatRoomRepo.findOne({
        where: { id: room.id },
        relations: ['user1', 'user2'],
      });
      
      console.log(`[ChatService] Returning room with relations: ${fullRoom?.id}`);
      return fullRoom;
    } catch (error) {
      // Откатываем только если транзакция ещё активна (избегаем двойного rollback)
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      console.error(`[ChatService] Error in getOrCreateRoom:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
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
    console.log(`[ChatService] getUserRooms for userId: ${userId}`);
    const rooms = await this.chatRoomRepo
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.user1', 'user1')
      .leftJoinAndSelect('room.user2', 'user2')
      .where('room.user1Id = :userId OR room.user2Id = :userId', { userId })
      .orderBy('room.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('room.createdAt', 'DESC')
      .getMany();

    console.log(`[ChatService] Found ${rooms.length} rooms`);

    // Фильтруем комнаты где оба пользователя существуют
    const validRooms = rooms.filter(room => room.user1 !== null && room.user2 !== null);
    console.log(`[ChatService] Valid rooms: ${validRooms.length}`);

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
          companion: toUserCard(companion),
          lastMessage: room.lastMessage,
          lastMessageAt: room.lastMessageAt,
          unreadCount,
        };
      }),
    );

    console.log(`[ChatService] Returning rooms with unread counts`);
    return roomsWithUnread;
  }

  // Создать сообщение
  async createMessage(roomId: string, senderId: string, content: string, isDelivered = true): Promise<Message> {
    const message = this.messageRepo.create({
      roomId,
      senderId,
      content,
      isDelivered,
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

  // Редактировать сообщение
  async editMessage(messageId: string, userId: string, newContent: string): Promise<Message> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    if (message.senderId !== userId) {
      throw new BadRequestException('Нельзя редактировать чужие сообщения');
    }

    message.content = newContent;
    message.isEdited = true;
    message.updatedAt = new Date();

    await this.messageRepo.save(message);

    // Обновляем lastMessage в комнате, если это последнее сообщение
    const room = await this.chatRoomRepo.findOne({ where: { id: message.roomId } });
    if (room && room.lastMessage === message.content) {
      // It's possible the lastMessage was the old content, so this check might not always hit perfectly,
      // but typically we can just update it if we fetch the latest message in the room.
      const latestMessage = await this.messageRepo.findOne({
        where: { roomId: message.roomId },
        order: { createdAt: 'DESC' },
      });
      if (latestMessage && latestMessage.id === message.id) {
        room.lastMessage = newContent;
        await this.chatRoomRepo.save(room);
      }
    }

    return message;
  }

  // Удалить сообщение
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });

    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    if (message.senderId !== userId) {
      throw new BadRequestException('Нельзя удалять чужие сообщения');
    }

    const roomId = message.roomId;
    await this.messageRepo.remove(message);

    // Обновляем lastMessage в комнате, если мы удалили последнее сообщение
    const latestMessage = await this.messageRepo.findOne({
      where: { roomId },
      order: { createdAt: 'DESC' },
    });

    await this.chatRoomRepo.update(roomId, {
      lastMessage: latestMessage ? latestMessage.content : null,
      lastMessageAt: latestMessage ? latestMessage.createdAt : new Date(),
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
