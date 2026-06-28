import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { Follow } from '../../entities/follow.entity';
import { OnboardingAnswer } from '../../entities/onboarding-answer.entity';
import { PlayerStats, GameType as StatsGameType } from '../../entities/player-stats.entity';
import { TeamMember } from '../../entities/team-member.entity';
import { Team } from '../../entities/team.entity';
import { Transaction } from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { OnboardingDto } from './dto/onboarding.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Transaction)
    private transactionsRepo: Repository<Transaction>,
    @InjectRepository(OnboardingAnswer)
    private onboardingRepo: Repository<OnboardingAnswer>,
    @InjectRepository(PlayerStats)
    private playerStatsRepo: Repository<PlayerStats>,
    @InjectRepository(Follow)
    private followsRepo: Repository<Follow>,
    @InjectRepository(Team)
    private teamsRepo: Repository<Team>,
    @InjectRepository(TeamMember)
    private teamMembersRepo: Repository<TeamMember>,
  ) {}

  private normalizeProfileValue(value?: string | null): string | null {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private calculateArenaPower(user: Pick<User, 'rating' | 'wins' | 'losses'>): number {
    return Math.round(Number(user.rating) + user.wins * 16 - user.losses * 6);
  }

  private calculateStreetScore(stat: Pick<PlayerStats, 'rating' | 'wins' | 'losses'>): number {
    return Math.round(Number(stat.rating) + stat.wins * 18 - stat.losses * 7);
  }

  private async rankStatsForGame(game: StatsGameType): Promise<PlayerStats[]> {
    const stats = await this.playerStatsRepo.find({
      where: { game },
      relations: ['user'],
    });

    const rankedStats = [...stats].sort((a, b) => {
      const scoreDiff = this.calculateStreetScore(b) - this.calculateStreetScore(a);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      const ratingDiff = Number(b.rating) - Number(a.rating);
      if (ratingDiff !== 0) {
        return ratingDiff;
      }

      const winsDiff = b.wins - a.wins;
      if (winsDiff !== 0) {
        return winsDiff;
      }

      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    await Promise.all(
      rankedStats.map((stat, index) => {
        const rank = index + 1;
        if (stat.leaderboardRank === rank) {
          return Promise.resolve();
        }

        stat.leaderboardRank = rank;
        return this.playerStatsRepo.update(stat.id, { leaderboardRank: rank });
      }),
    );

    return rankedStats;
  }

  private async getOverallLeaderboardRank(userId: string) {
    const users = await this.usersRepo.find();
    const rankedUsers = [...users].sort((a, b) => {
      const scoreDiff = this.calculateArenaPower(b) - this.calculateArenaPower(a);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      const ratingDiff = Number(b.rating) - Number(a.rating);
      if (ratingDiff !== 0) {
        return ratingDiff;
      }

      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const index = rankedUsers.findIndex((candidate) => candidate.id === userId);

    return {
      rank: index >= 0 ? index + 1 : null,
      total: rankedUsers.length,
    };
  }

  private async getTeamMemberships(userIds: string[], game?: StatsGameType) {
    if (!userIds.length) {
      return new Map();
    }

    const memberships = await this.teamMembersRepo.find({
      where: { userId: In(userIds) },
      relations: ['team'],
      order: { joinedAt: 'ASC' },
    });

    const teamMap = new Map();

    for (const membership of memberships) {
      if (!membership.team) {
        continue;
      }

      if (game && membership.team.game !== game) {
        continue;
      }

      const key = game ? membership.userId : `${membership.userId}:${membership.team.game}`;
      if (teamMap.has(key)) {
        continue;
      }

      teamMap.set(key, {
        id: membership.team.id,
        name: membership.team.name,
        tag: membership.team.tag,
        logoUrl: membership.team.logoUrl,
        game: membership.team.game,
        rating: membership.team.rating,
        leaderboardRank: membership.team.leaderboardRank,
        myRole: membership.role,
      });
    }

    return teamMap;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { username } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.usersRepo.update(id, dto);
    return this.findById(id);
  }

  async getWallet(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const transactions = await this.transactionsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return {
      credits: user.credits,
      transactions,
    };
  }

  async completeOnboarding(userId: string, dto: OnboardingDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (!dto.games.includes(dto.mainGame)) {
      throw new BadRequestException('Основная игра должна входить в список выбранных игр');
    }

    if (user.onboardingCompleted) {
      const answer = await this.onboardingRepo.findOne({ where: { userId } });
      if (answer) {
        Object.assign(answer, dto);
        await this.onboardingRepo.save(answer);
      }
      // Update gender if provided
      await this.usersRepo.update(userId, {
        gender: dto.gender as any,
        mainGame: dto.mainGame,
      });
      return this.findById(userId);
    }

    let answer = await this.onboardingRepo.findOne({ where: { userId } });
    if (!answer) {
      answer = this.onboardingRepo.create({ userId, ...dto });
    } else {
      Object.assign(answer, dto);
    }
    await this.onboardingRepo.save(answer);

    // Update user with gender if provided, and mark onboarding as completed
    const updateData: any = { onboardingCompleted: true, mainGame: dto.mainGame };
    if (dto.gender) {
      updateData.gender = dto.gender;
    }
    await this.usersRepo.update(userId, updateData);
    return this.findById(userId);
  }

  async getOnboardingAnswers(userId: string): Promise<OnboardingAnswer | null> {
    return this.onboardingRepo.findOne({ where: { userId } });
  }

  async searchUsers(query: string, currentUserId?: string) {
    const normalizedQuery = query?.trim();
    if (!normalizedQuery || normalizedQuery.length < 2) {
      return [];
    }

    const users = await this.usersRepo.find({
      where: [
        { username: ILike(`%${normalizedQuery}%`) },
        { displayName: ILike(`%${normalizedQuery}%`) },
      ],
      take: 12,
      order: { followersCount: 'DESC', createdAt: 'ASC' },
    });

    const filteredUsers = users.filter((user) => user.id !== currentUserId);

    if (!currentUserId) {
      return filteredUsers.map((user) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        followersCount: user.followersCount,
        mainGame: user.mainGame,
      }));
    }

    // Если пользователь авторизован, добавляем статус дружбы
    // Используем прямой импорт сервиса друзей через инжекцию в конструкторе
    // Вместо этого используем прямые запросы к БД
    const friendRequestRepo = this.onboardingRepo.manager.getRepository('FriendRequest');
    const friendshipRepo = this.onboardingRepo.manager.getRepository('Friendship');

    const results = await Promise.all(
      filteredUsers.map(async (user) => {
        // Проверяем дружбу
        const [user1Id, user2Id] = [currentUserId, user.id].sort();
        const friendship = await friendshipRepo.findOne({
          where: { user1Id, user2Id },
        });

        if (friendship) {
          return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            followersCount: user.followersCount,
            mainGame: user.mainGame,
            friendshipStatus: 'friends',
          };
        }

        // Проверяем pending запросы
        const pendingRequest = await friendRequestRepo.findOne({
          where: [
            { senderId: currentUserId, receiverId: user.id, status: 'pending' },
            { senderId: user.id, receiverId: currentUserId, status: 'pending' },
          ],
        });

        if (pendingRequest) {
          const status = (pendingRequest as any).senderId === currentUserId 
            ? 'pending_sent' 
            : 'pending_received';
          
          return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            followersCount: user.followersCount,
            mainGame: user.mainGame,
            friendshipStatus: status,
          };
        }

        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          followersCount: user.followersCount,
          mainGame: user.mainGame,
          friendshipStatus: null,
        };
      }),
    );

    return results;
  }

  // ========== PROFILE METHODS ==========
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const updateData: any = {};

    // Check username change limit (once every 3 days)
    if (dto.username && dto.username !== user.username) {
      if (user.lastUsernameChange) {
        const daysSinceLastChange = (now.getTime() - new Date(user.lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastChange < 3) {
          const daysLeft = Math.ceil(3 - daysSinceLastChange);
          throw new BadRequestException(`Вы сможете изменить ник через ${daysLeft} ${daysLeft === 1 ? 'день' : 'дня'}`);
        }
      }

      // Check if username is already taken
      const existingUser = await this.findByUsername(dto.username);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Этот ник уже занят');
      }

      updateData.username = dto.username;
      updateData.lastUsernameChange = now;
    }

    // Check avatar change limit (once every 7 days after first change)
    if (dto.avatarUrl !== undefined && dto.avatarUrl !== user.avatarUrl) {
      if (user.lastAvatarChange) {
        const daysSinceLastChange = (now.getTime() - new Date(user.lastAvatarChange).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastChange < 7) {
          const daysLeft = Math.ceil(7 - daysSinceLastChange);
          throw new BadRequestException(`Вы сможете изменить аватарку через ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}`);
        }
      }

      updateData.avatarUrl = this.normalizeProfileValue(dto.avatarUrl);
      updateData.lastAvatarChange = now;
    }

    // Other fields can be updated freely
    if (dto.bio !== undefined) updateData.bio = this.normalizeProfileValue(dto.bio);
    if (dto.displayName !== undefined) updateData.displayName = this.normalizeProfileValue(dto.displayName);
    if (dto.tagline !== undefined) updateData.tagline = this.normalizeProfileValue(dto.tagline);
    if (dto.bannerUrl !== undefined) updateData.bannerUrl = this.normalizeProfileValue(dto.bannerUrl);
    if (dto.country !== undefined) updateData.country = this.normalizeProfileValue(dto.country);
    if (dto.city !== undefined) updateData.city = this.normalizeProfileValue(dto.city);
    if (dto.gender !== undefined) updateData.gender = dto.gender;
    if (dto.mainGame !== undefined) updateData.mainGame = dto.mainGame;

    await this.usersRepo.update(userId, updateData);

    if (dto.favoriteGames !== undefined) {
      let answer = await this.onboardingRepo.findOne({ where: { userId } });

      if (!answer) {
        answer = this.onboardingRepo.create({
          userId,
          role: user.role,
          games: dto.favoriteGames,
          goals: [],
        });
      } else {
        answer.games = dto.favoriteGames;
      }

      await this.onboardingRepo.save(answer);
    }

    return this.findById(userId);
  }

  async getProfile(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const stats = await this.playerStatsRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
    const onboarding = await this.getOnboardingAnswers(userId);
    const overallRank = await this.getOverallLeaderboardRank(userId);
    const uniqueGames = [...new Set(stats.map((stat) => stat.game))];
    const rankMap = new Map<string, number>();

    for (const game of uniqueGames) {
      const rankedStats = await this.rankStatsForGame(game);
      rankedStats.forEach((rankedStat) => rankMap.set(rankedStat.id, rankedStat.leaderboardRank));
    }

    const teamMemberships = await this.getTeamMemberships([userId]);
    const teams = [...teamMemberships.values()];
    const enrichedStats = stats.map((stat) => ({
      ...stat,
      leaderboardRank: rankMap.get(stat.id) ?? stat.leaderboardRank,
      streetScore: this.calculateStreetScore(stat),
      currentTeam: teamMemberships.get(`${userId}:${stat.game}`) ?? null,
    }));

    // Calculate days until username/avatar can be changed
    const now = new Date();
    let usernameChangeDays = 0;
    let avatarChangeDays = 0;

    if (user.lastUsernameChange) {
      const daysSince = (now.getTime() - new Date(user.lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24);
      usernameChangeDays = Math.max(0, Math.ceil(3 - daysSince));
    }

    if (user.lastAvatarChange) {
      const daysSince = (now.getTime() - new Date(user.lastAvatarChange).getTime()) / (1000 * 60 * 60 * 24);
      avatarChangeDays = Math.max(0, Math.ceil(7 - daysSince));
    }

    return {
      ...user,
      arenaPower: this.calculateArenaPower(user),
      overallLeaderboardRank: overallRank.rank,
      overallLeaderboardTotal: overallRank.total,
      stats: enrichedStats,
      teams,
      mainTeam: user.mainGame ? teamMemberships.get(`${userId}:${user.mainGame}`) ?? null : null,
      favoriteGames: onboarding?.games || [],
      canChangeUsername: usernameChangeDays === 0,
      canChangeAvatar: avatarChangeDays === 0,
      usernameChangeDays,
      avatarChangeDays,
    };
  }

  // ========== PLAYER STATS METHODS ==========
  async getPlayerStats(userId: string, game: StatsGameType) {
    let stats = await this.playerStatsRepo.findOne({ where: { userId, game } });
    if (!stats) {
      // Create default stats if not exists
      stats = this.playerStatsRepo.create({ userId, game });
      await this.playerStatsRepo.save(stats);
    }

    const teamMemberships = await this.getTeamMemberships([userId], game);

    return {
      ...stats,
      streetScore: this.calculateStreetScore(stats),
      currentTeam: teamMemberships.get(userId) ?? null,
    };
  }

  async getAllPlayerStats(userId: string) {
    const stats = await this.playerStatsRepo.find({ where: { userId } });
    const teamMemberships = await this.getTeamMemberships([userId]);

    return stats.map((stat) => ({
      ...stat,
      streetScore: this.calculateStreetScore(stat),
      currentTeam: teamMemberships.get(`${userId}:${stat.game}`) ?? null,
    }));
  }

  async updatePlayerRating(userId: string, game: StatsGameType, ratingChange: number, won: boolean) {
    const stats = await this.getPlayerStats(userId, game);
    stats.rating = Number(stats.rating) + ratingChange;
    if (won) {
      stats.wins += 1;
    } else {
      stats.losses += 1;
    }
    await this.playerStatsRepo.save(stats);

    // Update user overall rating (average of all games)
    const allStats = await this.getAllPlayerStats(userId);
    const avgRating = allStats.reduce((sum, s) => sum + Number(s.rating), 0) / allStats.length;
    const totalWins = allStats.reduce((sum, s) => sum + s.wins, 0);
    const totalLosses = allStats.reduce((sum, s) => sum + s.losses, 0);
    
    await this.usersRepo.update(userId, { 
      rating: avgRating,
      wins: totalWins,
      losses: totalLosses,
    });

    return stats;
  }

  async getLeaderboard(game: StatsGameType, page: number = 1, limit: number = 50) {
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 50;
    const skip = (safePage - 1) * safeLimit;
    const rankedStats = await this.rankStatsForGame(game);
    const pageItems = rankedStats.slice(skip, skip + safeLimit);
    const teamMemberships = await this.getTeamMemberships(
      pageItems.map((item) => item.userId),
      game,
    );

    return {
      metric: {
        name: 'StreetScore',
        shortName: 'SSR',
        description: 'Игровая сила игрока: базовый рейтинг + победы - штраф за поражения.',
      },
      data: pageItems.map((s) => ({
        rank: s.leaderboardRank,
        user: {
          id: s.user.id,
          username: s.user.username,
          displayName: s.user.displayName,
          avatarUrl: s.user.avatarUrl,
          gender: s.user.gender,
        },
        score: this.calculateStreetScore(s),
        rating: s.rating,
        wins: s.wins,
        losses: s.losses,
        currentTeam: teamMemberships.get(s.userId) ?? null,
        winRate: s.wins + s.losses > 0 ? (s.wins / (s.wins + s.losses) * 100).toFixed(1) : '0.0',
      })),
      total: rankedStats.length,
      page: safePage,
      totalPages: Math.ceil(rankedStats.length / safeLimit),
    };
  }

  // ========== FOLLOW METHODS ==========
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const following = await this.findById(followingId);
    if (!following) throw new NotFoundException('User not found');

    const existing = await this.followsRepo.findOne({ where: { followerId, followingId } });
    if (existing) {
      throw new ConflictException('Already following this user');
    }

    const follow = this.followsRepo.create({ followerId, followingId });
    await this.followsRepo.save(follow);

    // Update counts
    await this.usersRepo.increment({ id: followerId }, 'followingCount', 1);
    await this.usersRepo.increment({ id: followingId }, 'followersCount', 1);

    return { message: 'Followed successfully' };
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.followsRepo.findOne({ where: { followerId, followingId } });
    if (!follow) {
      throw new NotFoundException('Not following this user');
    }

    await this.followsRepo.remove(follow);

    // Update counts
    await this.usersRepo.decrement({ id: followerId }, 'followingCount', 1);
    await this.usersRepo.decrement({ id: followingId }, 'followersCount', 1);

    return { message: 'Unfollowed successfully' };
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [follows, total] = await this.followsRepo.findAndCount({
      where: { followingId: userId },
      relations: ['follower'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: follows
        .filter(f => f.follower !== null)
        .map(f => ({
          id: f.follower.id,
          username: f.follower.username,
          displayName: f.follower.displayName,
          avatarUrl: f.follower.avatarUrl,
          gender: f.follower.gender,
          mainGame: f.follower.mainGame,
          followersCount: f.follower.followersCount,
          followedAt: f.createdAt,
        })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [follows, total] = await this.followsRepo.findAndCount({
      where: { followerId: userId },
      relations: ['following'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: follows
        .filter(f => f.following !== null)
        .map(f => ({
          id: f.following.id,
          username: f.following.username,
          displayName: f.following.displayName,
          avatarUrl: f.following.avatarUrl,
          gender: f.following.gender,
          mainGame: f.following.mainGame,
          followersCount: f.following.followersCount,
          followedAt: f.createdAt,
        })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.followsRepo.findOne({ where: { followerId, followingId } });
    return !!follow;
  }

  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const follow1 = await this.isFollowing(userId1, userId2);
    const follow2 = await this.isFollowing(userId2, userId1);
    return follow1 && follow2; // Friends = mutual follow
  }
}
