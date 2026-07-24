import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TeamJoinRequest, TeamJoinRequestStatus } from '../../entities/team-join-request.entity';
import { TeamMember, TeamRole } from '../../entities/team-member.entity';
import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { GameType } from '../../entities/player-stats.entity';
import { toUserCard } from '../../common/user-view';
import { CreateTeamDto } from './dto/create-team.dto';
import { RequestJoinTeamDto } from './dto/request-join-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepo: Repository<Team>,
    @InjectRepository(TeamMember)
    private teamMembersRepo: Repository<TeamMember>,
    @InjectRepository(TeamJoinRequest)
    private teamJoinRequestsRepo: Repository<TeamJoinRequest>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  // REMOVED: normalizeGames was dead code after createTeam refactor

  private getTeamGames(team: Team): GameType[] {
    return Array.from(new Set([team.game, ...(team.supportedGames || [])]));
  }

  private async ensureCaptainLimit(captainId: string) {
    const createdTeams = await this.teamsRepo.count({ where: { captainId } });
    if (createdTeams >= 4) {
      throw new BadRequestException('Один пользователь может создать максимум 4 клана');
    }
  }

  private async ensureNoGameConflict(userId: string, team: Team) {
    const memberships = await this.teamMembersRepo.find({
      where: { userId },
      relations: ['team'],
    });
    const targetGames = this.getTeamGames(team);

    const hasConflict = memberships.some((membership) => {
      if (!membership.team) {
        return false;
      }

      const membershipGames = this.getTeamGames(membership.team);
      return membershipGames.some((game) => targetGames.includes(game));
    });

    if (hasConflict) {
      throw new ConflictException('У вас уже есть клан по одной из этих игр');
    }
  }

  private async formatTeam(team: Team, viewerId?: string) {
    const pendingRequestsCount = await this.teamJoinRequestsRepo.count({
      where: { teamId: team.id, status: TeamJoinRequestStatus.PENDING },
    });

    const existingRequest = viewerId
      ? await this.teamJoinRequestsRepo.findOne({
          where: { teamId: team.id, userId: viewerId, status: TeamJoinRequestStatus.PENDING },
        })
      : null;

    return {
      ...team,
      supportedGames: this.getTeamGames(team),
      captainName: team.captain?.displayName || team.captain?.username || null,
      hasPendingRequest: !!existingRequest,
      pendingRequestsCount,
      isCaptain: viewerId ? team.captainId === viewerId : false,
    };
  }

  async createTeam(captainId: string, dto: CreateTeamDto): Promise<Team> {
    const user = await this.usersRepo.findOne({ where: { id: captainId } });
    if (!user) throw new NotFoundException('User not found');

    if (Number(user.credits) < 400) {
      throw new BadRequestException('Недостаточно кредитов. Нужно 400 CR');
    }

    await this.ensureCaptainLimit(captainId);

    const existingTeam = await this.teamsRepo.findOne({ where: { name: dto.name } });
    if (existingTeam) {
      throw new ConflictException('Команда с таким названием уже существует');
    }

    // Validate supported games — required, 1-3 unique values
    if (!dto.supportedGames || dto.supportedGames.length === 0) {
      throw new BadRequestException('Выберите хотя бы одну игру для клана');
    }
    const uniqueGames = Array.from(new Set(dto.supportedGames));
    if (uniqueGames.length > 3) {
      throw new BadRequestException('Максимум 3 игры для клана');
    }
    const primaryGame = uniqueGames[0]; // First selected game is always primary

    // Build a temporary team object for the conflict check BEFORE saving
    const tempTeam = { game: primaryGame, supportedGames: uniqueGames } as Team;
    await this.ensureNoGameConflict(captainId, tempTeam);

    // All checks passed — now persist and charge credits
    const team = this.teamsRepo.create({
      ...dto,
      game: primaryGame,
      captainId,
      supportedGames: uniqueGames,
      membersCount: 1,
    });
    await this.teamsRepo.save(team);

    const member = this.teamMembersRepo.create({
      teamId: team.id,
      userId: captainId,
      role: TeamRole.CAPTAIN,
    });
    await this.teamMembersRepo.save(member);

    await this.usersRepo.decrement({ id: captainId }, 'credits', 400);

    return this.teamsRepo.findOne({ where: { id: team.id }, relations: ['captain'] });
  }

  async getTeam(teamId: string, viewerId?: string) {
    const team = await this.teamsRepo.findOne({
      where: { id: teamId },
      relations: ['captain'],
    });
    
    if (!team) throw new NotFoundException('Команда не найдена');

    const members = await this.teamMembersRepo.find({
      where: { teamId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });

    const requests = await this.teamJoinRequestsRepo.find({
      where: { teamId, status: TeamJoinRequestStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return {
      ...(await this.formatTeam(team, viewerId)),
      members: members.map(m => ({
        id: m.id,
        user: toUserCard(m.user),
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      requests: requests.map((request) => ({
        id: request.id,
        user: toUserCard(request.user),
        message: request.message,
        createdAt: request.createdAt,
      })),
    };
  }

  async updateTeam(teamId: string, userId: string, dto: UpdateTeamDto): Promise<Team> {
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');

    // Only captain or vice_captain can update settings
    const requester = await this.teamMembersRepo.findOne({ where: { teamId, userId } });
    const isAllowed = team.captainId === userId ||
      (requester && (requester.role === TeamRole.VICE_CAPTAIN));
    if (!isAllowed) {
      throw new ForbiddenException('Только капитан или заместитель может изменять команду');
    }

    const updates: Partial<Team> = { ...dto } as any;
    // If supportedGames changed, re-derive primary game
    if (dto.supportedGames && dto.supportedGames.length > 0) {
      const uniqueGames = Array.from(new Set(dto.supportedGames)) as GameType[];
      if (uniqueGames.length > 3) {
        throw new BadRequestException('Максимум 3 игры для клана');
      }
      updates.supportedGames = uniqueGames;
      updates.game = uniqueGames[0]; // Recalculate primary game
    }

    await this.teamsRepo.update(teamId, updates);
    return this.teamsRepo.findOne({ where: { id: teamId } });
  }

  async deleteTeam(teamId: string, userId: string) {
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');

    if (team.captainId !== userId) {
      throw new ForbiddenException('Только капитан может удалить команду');
    }

    // Delete all members
    await this.teamMembersRepo.delete({ teamId });
    
    // Delete team
    await this.teamsRepo.delete(teamId);

    return { message: 'Команда удалена' };
  }

  async requestJoinTeam(teamId: string, userId: string, dto?: RequestJoinTeamDto) {
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');

    if (!team.isRecruiting) {
      throw new BadRequestException('Команда не набирает игроков');
    }

    if (team.membersCount >= team.maxMembers) {
      throw new BadRequestException('Команда заполнена');
    }

    const existing = await this.teamMembersRepo.findOne({
      where: { teamId, userId },
    });
    if (existing) {
      throw new ConflictException('Вы уже в этой команде');
    }

    await this.ensureNoGameConflict(userId, team);

    const existingRequest = await this.teamJoinRequestsRepo.findOne({
      where: { teamId, userId },
    });

    if (existingRequest?.status === TeamJoinRequestStatus.PENDING) {
      throw new ConflictException('Заявка уже отправлена');
    }

    if (existingRequest) {
      existingRequest.status = TeamJoinRequestStatus.PENDING;
      existingRequest.message = dto?.message?.trim() || null;
      existingRequest.reviewedAt = null;
      await this.teamJoinRequestsRepo.save(existingRequest);
      return { message: 'Заявка отправлена повторно' };
    }

    const request = this.teamJoinRequestsRepo.create({
      teamId,
      userId,
      message: dto?.message?.trim() || null,
      status: TeamJoinRequestStatus.PENDING,
    });
    await this.teamJoinRequestsRepo.save(request);

    return { message: 'Заявка в клан отправлена' };
  }

  async leaveTeam(teamId: string, userId: string) {
    const member = await this.teamMembersRepo.findOne({
      where: { teamId, userId },
    });

    if (!member) {
      throw new NotFoundException('Вы не состоите в этой команде');
    }

    if (member.role === TeamRole.CAPTAIN) {
      throw new BadRequestException('Капитан не может покинуть команду. Удалите команду или передайте капитанство');
    }

    await this.teamMembersRepo.remove(member);
    await this.teamsRepo.decrement({ id: teamId }, 'membersCount', 1);

    return { message: 'Вы покинули команду' };
  }

  async kickMember(teamId: string, kickerId: string, targetUserId: string) {
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');

    const kicker = await this.teamMembersRepo.findOne({ where: { teamId, userId: kickerId } });
    const isCaptain = team.captainId === kickerId;
    const isViceCaptain = kicker?.role === TeamRole.VICE_CAPTAIN;

    // Only captain or vice_captain may kick
    if (!isCaptain && !isViceCaptain) {
      throw new ForbiddenException('Только капитан или заместитель может исключать игроков');
    }

    if (targetUserId === kickerId) {
      throw new BadRequestException('Нельзя исключить самого себя');
    }

    const target = await this.teamMembersRepo.findOne({ where: { teamId, userId: targetUserId } });
    if (!target) throw new NotFoundException('Игрок не найден в команде');

    // Vice captain cannot kick captain or other vice captains
    if (isViceCaptain && (target.userId === team.captainId || target.role === TeamRole.VICE_CAPTAIN)) {
      throw new ForbiddenException('Заместитель не может исключить капитана или другого заместителя');
    }

    await this.teamMembersRepo.remove(target);
    await this.teamsRepo.decrement({ id: teamId }, 'membersCount', 1);

    return { message: 'Игрок исключён из команды' };
  }

  async getMyJoinRequests(userId: string) {
    const captainTeams = await this.teamsRepo.find({
      where: { captainId: userId },
      select: ['id', 'name'],
    });

    if (!captainTeams.length) {
      return [];
    }

    const requests = await this.teamJoinRequestsRepo.find({
      where: {
        teamId: In(captainTeams.map((team) => team.id)),
        status: TeamJoinRequestStatus.PENDING,
      },
      relations: ['user', 'team'],
      order: { createdAt: 'DESC' },
    });

    return requests.map((request) => ({
      id: request.id,
      teamId: request.teamId,
      teamName: request.team.name,
      message: request.message,
      createdAt: request.createdAt,
      user: toUserCard(request.user),
    }));
  }

  async approveJoinRequest(teamId: string, requestId: string, moderatorId: string) {
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');

    const moderator = await this.teamMembersRepo.findOne({ where: { teamId, userId: moderatorId } });
    const canModerate = team.captainId === moderatorId ||
      (moderator && (moderator.role === TeamRole.VICE_CAPTAIN || moderator.role === TeamRole.MODERATOR));
    if (!canModerate) {
      throw new ForbiddenException('Только капитан, заместитель или модератор может принимать заявки');
    }

    if (team.membersCount >= team.maxMembers) {
      throw new BadRequestException('Команда заполнена');
    }

    const request = await this.teamJoinRequestsRepo.findOne({
      where: { id: requestId, teamId },
      relations: ['user'],
    });

    if (!request || request.status !== TeamJoinRequestStatus.PENDING) {
      throw new NotFoundException('Заявка не найдена');
    }

    await this.ensureNoGameConflict(request.userId, team);

    const existingMember = await this.teamMembersRepo.findOne({
      where: { teamId, userId: request.userId },
    });
    if (!existingMember) {
      const member = this.teamMembersRepo.create({
        teamId,
        userId: request.userId,
        role: TeamRole.MEMBER,
      });
      await this.teamMembersRepo.save(member);
      await this.teamsRepo.increment({ id: teamId }, 'membersCount', 1);
    }

    request.status = TeamJoinRequestStatus.APPROVED;
    request.reviewedAt = new Date();
    await this.teamJoinRequestsRepo.save(request);

    return { message: 'Заявка одобрена' };
  }

  async rejectJoinRequest(teamId: string, requestId: string, moderatorId: string) {
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');

    const moderator = await this.teamMembersRepo.findOne({ where: { teamId, userId: moderatorId } });
    const canModerate = team.captainId === moderatorId ||
      (moderator && (moderator.role === TeamRole.VICE_CAPTAIN || moderator.role === TeamRole.MODERATOR));
    if (!canModerate) {
      throw new ForbiddenException('Только капитан, заместитель или модератор может отклонять заявки');
    }

    const request = await this.teamJoinRequestsRepo.findOne({
      where: { id: requestId, teamId },
    });

    if (!request || request.status !== TeamJoinRequestStatus.PENDING) {
      throw new NotFoundException('Заявка не найдена');
    }

    request.status = TeamJoinRequestStatus.REJECTED;
    request.reviewedAt = new Date();
    await this.teamJoinRequestsRepo.save(request);

    return { message: 'Заявка отклонена' };
  }

  async getLeaderboard(game: GameType, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const teams = await this.teamsRepo.find({
      order: { rating: 'DESC' },
      relations: ['captain'],
    });

    const filteredTeams = teams.filter((team) => this.getTeamGames(team).includes(game));
    const total = filteredTeams.length;
    const pageTeams = filteredTeams.slice(skip, skip + limit);

    for (let i = 0; i < filteredTeams.length; i++) {
      const rank = skip + i + 1;
      if (filteredTeams[i].leaderboardRank !== rank) {
        await this.teamsRepo.update(filteredTeams[i].id, { leaderboardRank: rank });
        filteredTeams[i].leaderboardRank = rank;
      }
    }

    return {
      data: pageTeams.map(t => ({
        rank: t.leaderboardRank,
        team: {
          id: t.id,
          name: t.name,
          tag: t.tag,
          logoUrl: t.logoUrl,
          captainId: t.captainId,
          captainName: t.captain.username,
          membersCount: t.membersCount,
          supportedGames: this.getTeamGames(t),
        },
        rating: t.rating,
        wins: t.wins,
        losses: t.losses,
        winRate: t.wins + t.losses > 0 ? ((t.wins / (t.wins + t.losses)) * 100).toFixed(1) : '0.0',
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMyTeams(userId: string) {
    const memberships = await this.teamMembersRepo.find({
      where: { userId },
      relations: ['team', 'team.captain'],
      order: { joinedAt: 'DESC' },
    });

    return memberships.map(m => ({
      ...m.team,
      supportedGames: this.getTeamGames(m.team),
      myRole: m.role,
    }));
  }

  async getAllTeams(viewerId?: string, game?: GameType, page: number = 1, limit: number = 20) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(500, Math.max(1, Number(limit) || 20));
    const skip = (p - 1) * l;
    const teams = await this.teamsRepo.find({
      order: { rating: 'DESC', createdAt: 'DESC' },
      relations: ['captain'],
    });

    const filteredTeams = game
      ? teams.filter((team) => this.getTeamGames(team).includes(game))
      : teams;
    const pageTeams = filteredTeams.slice(skip, skip + l);

    return {
      data: await Promise.all(pageTeams.map((team) => this.formatTeam(team, viewerId))),
      total: filteredTeams.length,
      page: p,
      totalPages: Math.ceil(filteredTeams.length / l),
    };
  }

  async updateMemberRole(teamId: string, captainId: string, targetUserId: string, newRole: string) {
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');

    if (team.captainId !== captainId) {
      throw new ForbiddenException('Только капитан может изменять роли');
    }

    if (targetUserId === captainId) {
      throw new BadRequestException('Капитан не может изменить свою собственную роль');
    }

    const member = await this.teamMembersRepo.findOne({
      where: { teamId, userId: targetUserId },
    });
    if (!member) throw new NotFoundException('Участник не найден в команде');

    if (newRole === 'captain') {
      // Transfer captaincy: old captain becomes Vice Captain (not plain member)
      const currentCaptainMember = await this.teamMembersRepo.findOne({
        where: { teamId, userId: captainId },
      });
      if (currentCaptainMember) {
        currentCaptainMember.role = TeamRole.VICE_CAPTAIN;
        await this.teamMembersRepo.save(currentCaptainMember);
      }

      team.captainId = targetUserId;
      await this.teamsRepo.save(team);

      member.role = TeamRole.CAPTAIN;
      await this.teamMembersRepo.save(member);

      return { message: 'Капитанство успешно передано' };
    }

    if (!Object.values(TeamRole).includes(newRole as any)) {
      throw new BadRequestException('Неверная роль');
    }

    member.role = newRole as TeamRole;
    await this.teamMembersRepo.save(member);

    return { message: `Роль успешно изменена на ${newRole}` };
  }

  async updateTeamLogo(teamId: string, userId: string, logoUrl: string) {
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');

    const member = await this.teamMembersRepo.findOne({ where: { teamId, userId } });
    const isAllowed = team.captainId === userId || 
      (member && (member.role === 'vice_captain' || member.role === 'moderator'));
    
    if (!isAllowed) {
      throw new ForbiddenException('Недостаточно прав для изменения логотипа');
    }

    await this.teamsRepo.update(teamId, { logoUrl });
    return { logoUrl };
  }

  async updateTeamBanner(teamId: string, userId: string, bannerUrl: string) {
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Команда не найдена');

    const member = await this.teamMembersRepo.findOne({ where: { teamId, userId } });
    const isAllowed = team.captainId === userId || 
      (member && (member.role === 'vice_captain' || member.role === 'moderator'));
    
    if (!isAllowed) {
      throw new ForbiddenException('Недостаточно прав для изменения баннера');
    }

    await this.teamsRepo.update(teamId, { bannerUrl });
    return { bannerUrl };
  }
}
