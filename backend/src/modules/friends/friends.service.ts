import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequest, FriendRequestStatus } from '../../entities/friend-request.entity';
import { Friendship } from '../../entities/friendship.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestRepo: Repository<FriendRequest>,
    @InjectRepository(Friendship)
    private friendshipRepo: Repository<Friendship>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // Отправить запрос в друзья
  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Нельзя добавить себя в друзья');
    }

    // Проверка что получатель существует
    const receiver = await this.userRepo.findOne({ where: { id: receiverId } });
    if (!receiver) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверка что уже не друзья
    const areFriends = await this.areFriends(senderId, receiverId);
    if (areFriends) {
      throw new BadRequestException('Вы уже друзья');
    }

    // Проверка существующих запросов
    const existingRequest = await this.friendRequestRepo.findOne({
      where: [
        { senderId, receiverId, status: FriendRequestStatus.PENDING },
        { senderId: receiverId, receiverId: senderId, status: FriendRequestStatus.PENDING },
      ],
    });

    if (existingRequest) {
      if (existingRequest.senderId === receiverId) {
        // Если получатель уже отправил запрос, сразу принимаем и создаем дружбу
        await this.acceptFriendRequest(existingRequest.id, senderId);
        return { message: 'Запрос принят, вы теперь друзья!' };
      }
      throw new BadRequestException('Запрос уже отправлен');
    }

    const request = this.friendRequestRepo.create({
      senderId,
      receiverId,
      status: FriendRequestStatus.PENDING,
    });

    await this.friendRequestRepo.save(request);
    return { message: 'Запрос в друзья отправлен' };
  }

  // Принять запрос в друзья
  async acceptFriendRequest(requestId: string, userId: string) {
    const request = await this.friendRequestRepo.findOne({
      where: { id: requestId },
      relations: ['sender', 'receiver'],
    });

    if (!request) {
      throw new NotFoundException('Запрос не найден');
    }

    if (request.receiverId !== userId) {
      throw new BadRequestException('Вы не можете принять этот запрос');
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Запрос уже обработан');
    }

    // Обновляем статус запроса
    request.status = FriendRequestStatus.ACCEPTED;
    request.respondedAt = new Date();
    await this.friendRequestRepo.save(request);

    // Создаем дружбу (всегда user1Id < user2Id для консистентности)
    const [user1Id, user2Id] = [request.senderId, request.receiverId].sort();
    const friendship = this.friendshipRepo.create({
      user1Id,
      user2Id,
    });
    await this.friendshipRepo.save(friendship);

    return { message: 'Запрос принят, вы теперь друзья!' };
  }

  // Отклонить запрос в друзья
  async rejectFriendRequest(requestId: string, userId: string) {
    const request = await this.friendRequestRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Запрос не найден');
    }

    if (request.receiverId !== userId) {
      throw new BadRequestException('Вы не можете отклонить этот запрос');
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Запрос уже обработан');
    }

    request.status = FriendRequestStatus.REJECTED;
    request.respondedAt = new Date();
    await this.friendRequestRepo.save(request);

    return { message: 'Запрос отклонен' };
  }

  // Отменить отправленный запрос
  async cancelFriendRequest(requestId: string, userId: string) {
    const request = await this.friendRequestRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Запрос не найден');
    }

    if (request.senderId !== userId) {
      throw new BadRequestException('Вы не можете отменить этот запрос');
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Запрос уже обработан');
    }

    await this.friendRequestRepo.remove(request);
    return { message: 'Запрос отменен' };
  }

  // Удалить из друзей
  async removeFriend(userId: string, friendId: string) {
    const [user1Id, user2Id] = [userId, friendId].sort();
    
    const friendship = await this.friendshipRepo.findOne({
      where: { user1Id, user2Id },
    });

    if (!friendship) {
      throw new NotFoundException('Дружба не найдена');
    }

    await this.friendshipRepo.remove(friendship);
    return { message: 'Удалено из друзей' };
  }

  // Получить входящие запросы
  async getIncomingRequests(userId: string) {
    const requests = await this.friendRequestRepo.find({
      where: { receiverId: userId, status: FriendRequestStatus.PENDING },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
    });

    // Фильтруем запросы, у которых отправитель был удален
    return requests
      .filter(req => req.sender !== null)
      .map(req => ({
        id: req.id,
        sender: {
          id: req.sender.id,
          username: req.sender.username,
          displayName: req.sender.displayName,
          avatarUrl: req.sender.avatarUrl,
          mainGame: req.sender.mainGame,
        },
        createdAt: req.createdAt,
      }));
  }

  // Получить исходящие запросы
  async getOutgoingRequests(userId: string) {
    const requests = await this.friendRequestRepo.find({
      where: { senderId: userId, status: FriendRequestStatus.PENDING },
      relations: ['receiver'],
      order: { createdAt: 'DESC' },
    });

    // Фильтруем запросы, у которых получатель был удален
    return requests
      .filter(req => req.receiver !== null)
      .map(req => ({
        id: req.id,
        receiver: {
          id: req.receiver.id,
          username: req.receiver.username,
          displayName: req.receiver.displayName,
          avatarUrl: req.receiver.avatarUrl,
          mainGame: req.receiver.mainGame,
        },
        createdAt: req.createdAt,
      }));
  }

  // Получить список друзей
  async getFriends(userId: string) {
    const friendships = await this.friendshipRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.user1', 'user1')
      .leftJoinAndSelect('f.user2', 'user2')
      .where('f.user1Id = :userId OR f.user2Id = :userId', { userId })
      .orderBy('f.createdAt', 'DESC')
      .getMany();

    // Фильтруем дружбы, где один из пользователей был удален
    return friendships
      .filter(friendship => friendship.user1 !== null && friendship.user2 !== null)
      .map(friendship => {
        const friend = friendship.user1Id === userId ? friendship.user2 : friendship.user1;
        return {
          id: friend.id,
          username: friend.username,
          displayName: friend.displayName,
          avatarUrl: friend.avatarUrl,
          mainGame: friend.mainGame,
          gender: friend.gender,
          followersCount: friend.followersCount,
          friendsSince: friendship.createdAt,
        };
      });
  }

  // Проверка дружбы
  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const [user1Id, user2Id] = [userId, friendId].sort();
    
    const friendship = await this.friendshipRepo.findOne({
      where: { user1Id, user2Id },
    });

    return !!friendship;
  }

  // Получить статус дружбы
  async getFriendshipStatus(userId: string, targetId: string) {
    if (userId === targetId) {
      return { status: 'self' };
    }

    const areFriends = await this.areFriends(userId, targetId);
    if (areFriends) {
      return { status: 'friends' };
    }

    const pendingRequest = await this.friendRequestRepo.findOne({
      where: [
        { senderId: userId, receiverId: targetId, status: FriendRequestStatus.PENDING },
        { senderId: targetId, receiverId: userId, status: FriendRequestStatus.PENDING },
      ],
    });

    if (pendingRequest) {
      if (pendingRequest.senderId === userId) {
        return { status: 'request_sent', requestId: pendingRequest.id };
      } else {
        return { status: 'request_received', requestId: pendingRequest.id };
      }
    }

    return { status: 'none' };
  }
}
