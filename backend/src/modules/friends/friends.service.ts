import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../../entities/follow.entity';
import { User } from '../../entities/user.entity';
import { toUserCard } from '../../common/user-view';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // Подписаться на пользователя (как в TikTok)
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Нельзя подписаться на себя');
    }

    // Проверка что пользователь существует
    const following = await this.userRepo.findOne({ where: { id: followingId } });
    if (!following) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем не подписаны ли уже
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });

    if (existing) {
      throw new BadRequestException('Вы уже подписаны на этого пользователя');
    }

    // Создаём подписку
    const follow = this.followRepo.create({ followerId, followingId });
    await this.followRepo.save(follow);

    // Обновляем счётчики
    await this.userRepo.increment({ id: followerId }, 'followingCount', 1);
    await this.userRepo.increment({ id: followingId }, 'followersCount', 1);

    console.log(`[FriendsService] User ${followerId} followed ${followingId}`);

    return { 
      message: 'Вы подписались',
      followerId,
      followingId,
    };
  }

  // Отписаться от пользователя
  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.followRepo.findOne({
      where: { followerId, followingId },
    });

    if (!follow) {
      throw new NotFoundException('Вы не подписаны на этого пользователя');
    }

    await this.followRepo.remove(follow);

    // Обновляем счётчики
    await this.userRepo.decrement({ id: followerId }, 'followingCount', 1);
    await this.userRepo.decrement({ id: followingId }, 'followersCount', 1);

    console.log(`[FriendsService] User ${followerId} unfollowed ${followingId}`);

    return { 
      message: 'Вы отписались',
      followerId,
      followingId,
    };
  }

  // Удалить из друзей (отписаться от него)
  async removeFriend(userId: string, friendId: string) {
    return this.unfollowUser(userId, friendId);
  }

  // Получить входящие запросы = кто подписался на меня, но я не подписан на них
  async getIncomingRequests(userId: string) {
    console.log('[FriendsService] Getting incoming requests for userId:', userId);
    
    // Находим всех кто подписан на меня
    const followers = await this.followRepo.find({
      where: { followingId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
    });
    console.log('[FriendsService] Followers raw:', followers.length);
    console.log('[FriendsService] Followers data:', followers.map(f => ({ 
      id: f.id, 
      followerId: f.followerId, 
      hasFollowerRelation: !!f.follower,
      followerUsername: f.follower?.username 
    })));

    // Находим на кого я подписан
    const following = await this.followRepo.find({
      where: { followerId: userId },
    });
    console.log('[FriendsService] Following count:', following.length);
    const followingIds = new Set(following.map(f => f.followingId));
    console.log('[FriendsService] Following IDs:', Array.from(followingIds));

    // Фильтруем: оставляем только тех, кто подписан на меня, но я не подписан на них
    const filtered = followers.filter(f => f.follower !== null && !followingIds.has(f.followerId));
    console.log('[FriendsService] Filtered incoming:', filtered.length);
    
    const result = filtered.map(f => ({
      id: f.follower.id, // ID самого пользователя (для frontend совместимости)
      sender: toUserCard(f.follower), // Оборачиваем в sender для совместимости с frontend
      createdAt: f.createdAt,
    }));
    
    console.log('[FriendsService] Returning incoming:', result);
    return result;
  }

  // Получить список друзей = взаимные подписки
  async getFriends(userId: string) {
    console.log('[FriendsService] Getting friends for userId:', userId);
    
    // Находим всех кто подписан на меня
    const followers = await this.followRepo.find({
      where: { followingId: userId },
      relations: ['follower'],
    });
    console.log('[FriendsService] Followers:', followers.length);
    console.log('[FriendsService] Followers data:', followers.map(f => ({ 
      id: f.id, 
      followerId: f.followerId, 
      hasFollowerRelation: !!f.follower 
    })));

    // Находим на кого я подписан
    const following = await this.followRepo.find({
      where: { followerId: userId },
      relations: ['following'],
    });
    console.log('[FriendsService] Following:', following.length);
    console.log('[FriendsService] Following data:', following.map(f => ({ 
      id: f.id, 
      followingId: f.followingId, 
      hasFollowingRelation: !!f.following 
    })));

    const followingIds = new Set(following.map(f => f.followingId));
    const followerIds = new Set(followers.map(f => f.followerId));
    
    console.log('[FriendsService] Following IDs:', Array.from(followingIds));
    console.log('[FriendsService] Follower IDs:', Array.from(followerIds));

    // Друзья = те кто есть в обоих списках (взаимная подписка)
    const filtered = followers.filter(f => f.follower !== null && followingIds.has(f.followerId));
    console.log('[FriendsService] Filtered friends:', filtered.length);
    
    const friendUsers = filtered.map(f => ({
      ...toUserCard(f.follower),
      friendsSince: f.createdAt,
    }));

    console.log('[FriendsService] Returning friends:', friendUsers);
    return friendUsers;
  }

  // Проверка дружбы = взаимная подписка
  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const follow1 = await this.followRepo.findOne({
      where: { followerId: userId, followingId: friendId },
    });
    const follow2 = await this.followRepo.findOne({
      where: { followerId: friendId, followingId: userId },
    });

    return !!follow1 && !!follow2;
  }

  // Получить статус подписки/дружбы
  async getFriendshipStatus(userId: string, targetId: string) {
    if (userId === targetId) {
      return { status: 'self' };
    }

    // Проверяем взаимные подписки
    const iFollow = await this.followRepo.findOne({
      where: { followerId: userId, followingId: targetId },
    });
    const theyFollow = await this.followRepo.findOne({
      where: { followerId: targetId, followingId: userId },
    });

    if (iFollow && theyFollow) {
      return { status: 'friends' }; // Взаимная подписка = друзья
    }

    if (iFollow) {
      return { status: 'following' }; // Я подписан, но он не подписан на меня
    }

    if (theyFollow) {
      return { status: 'follower' }; // Он подписан на меня, но я не подписан на него
    }

    return { status: 'none' }; // Нет подписок
  }
}
