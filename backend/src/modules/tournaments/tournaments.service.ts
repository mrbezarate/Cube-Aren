import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tournament, TournamentStatus } from '../../entities/tournament.entity';
import { SavedTournament } from '../../entities/saved-tournament.entity';
import { TournamentView } from '../../entities/tournament-view.entity';
import { TournamentReport } from '../../entities/tournament-report.entity';
import { User } from '../../entities/user.entity';
import { Match } from '../../entities/match.entity';
import { Bet, BetStatus } from '../../entities/bet.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../../entities/transaction.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { FilterTournamentDto } from './dto/filter-tournament.dto';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private tournamentsRepo: Repository<Tournament>,
    @InjectRepository(SavedTournament)
    private savedTournamentsRepo: Repository<SavedTournament>,
    @InjectRepository(TournamentView)
    private tournamentViewRepo: Repository<TournamentView>,
    @InjectRepository(TournamentReport)
    private tournamentReportRepo: Repository<TournamentReport>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Match)
    private matchesRepo: Repository<Match>,
    @InjectRepository(Bet)
    private betsRepo: Repository<Bet>,
    private walletService: WalletService,
  ) {}

  async findAll(filters: FilterTournamentDto) {
    const {
      game,
      format,
      tournamentType,
      status,
      region,
      minPrize,
      maxEntryFee,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 12,
      search,
    } = filters;

    const qb = this.tournamentsRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.organizer', 'organizer');

    if (game) qb.andWhere('t.game = :game', { game });
    if (format) qb.andWhere('t.format = :format', { format });
    if (tournamentType) qb.andWhere('t.tournamentType = :tournamentType', { tournamentType });
    if (status) {
      qb.andWhere('t.status = :status', { status });
    } else {
      qb.andWhere('t.status IN (:...statuses)', {
        statuses: [TournamentStatus.OPEN, TournamentStatus.IN_PROGRESS],
      });
    }
    if (region) qb.andWhere('t.region = :region', { region });
    if (minPrize) qb.andWhere('t.prizePool >= :minPrize', { minPrize });
    if (maxEntryFee !== undefined) qb.andWhere('t.entryFee <= :maxEntryFee', { maxEntryFee });
    if (search) qb.andWhere('t.title ILIKE :search', { search: `%${search}%` });

    const validSortFields = ['prizePool', 'startDate', 'entryFee', 'currentParticipants', 'createdAt', 'viewsCount', 'savesCount'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`t.${orderField}`, sortOrder === 'ASC' ? 'ASC' : 'DESC');

    const total = await qb.getCount();
    qb.skip((page - 1) * limit).take(limit);
    const data = await qb.getMany();

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findFeatured(): Promise<Tournament[]> {
    return this.tournamentsRepo.find({
      where: { isFeatured: true },
      order: { featuredOrder: 'ASC', createdAt: 'DESC' },
      take: 10,
    });
  }

  async findOne(id: string): Promise<Tournament> {
    const tournament = await this.tournamentsRepo.findOne({
      where: { id },
      relations: ['organizer'],
    });
    if (!tournament) throw new NotFoundException('Tournament not found');
    return tournament;
  }

  async create(organizerId: string, dto: CreateTournamentDto): Promise<Tournament> {
    // Проверяем что организатор не забанен
    const organizer = await this.usersRepo.findOne({ where: { id: organizerId } });
    if (!organizer) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (organizer.organizerBanUntil && new Date(organizer.organizerBanUntil) > new Date()) {
      const banEndDate = new Date(organizer.organizerBanUntil).toLocaleDateString('ru-RU');
      throw new BadRequestException(`Вы заблокированы до ${banEndDate} за нарушения при организации турниров`);
    }

    // Проверяем лимит активных турниров (максимум 3)
    const activeTournaments = await this.tournamentsRepo.count({
      where: {
        organizerId,
        status: In([TournamentStatus.DRAFT, TournamentStatus.OPEN, TournamentStatus.IN_PROGRESS]),
      },
    });

    if (activeTournaments >= 3) {
      throw new BadRequestException('Нельзя создать больше 3 активных турниров. Завершите существующие турниры.');
    }

    const tournament = this.tournamentsRepo.create({
      ...dto,
      organizerId,
      status: TournamentStatus.OPEN,
      prizePool: 0,
    });
    const saved = await this.tournamentsRepo.save(tournament);

    // Auto-create matches
    const rounds = saved.roundsCount || 3;
    const matchesToCreate = [];
    for (let i = 1; i <= rounds; i++) {
      matchesToCreate.push(
        this.matchesRepo.create({
          tournamentId: saved.id,
          name: `Раунд ${i}`,
          team1Name: `Команда А`,
          team2Name: `Команда Б`,
          team1Odds: 1.85,
          team2Odds: 1.85,
          status: 'pending',
        }),
      );
    }
    await this.matchesRepo.save(matchesToCreate);

    return saved;
  }

  async update(id: string, dto: Partial<CreateTournamentDto>, userId: string): Promise<Tournament> {
    const tournament = await this.findOne(id);
    if (tournament.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can update this tournament');
    }
    await this.tournamentsRepo.update(id, dto as any);
    return this.findOne(id);
  }

  async delete(id: string, userId: string): Promise<void> {
    const tournament = await this.findOne(id);
    if (tournament.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can delete this tournament');
    }
    if (tournament.status === TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot delete an in-progress tournament');
    }
    await this.tournamentsRepo.delete(id);
  }

  async updateStatus(id: string, status: TournamentStatus, userId: string): Promise<Tournament> {
    const tournament = await this.findOne(id);
    if (tournament.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can update status');
    }
    await this.tournamentsRepo.update(id, { status });
    return this.findOne(id);
  }

  async setFeatured(id: string, order: number): Promise<Tournament> {
    await this.tournamentsRepo.update(id, { isFeatured: true, featuredOrder: order });
    return this.findOne(id);
  }

  async addToPrizePool(tournamentId: string, amount: number): Promise<void> {
    await this.tournamentsRepo
      .createQueryBuilder()
      .update(Tournament)
      .set({ prizePool: () => `"prize_pool" + ${amount}` })
      .where('id = :id', { id: tournamentId })
      .execute();
  }

  async incrementParticipants(tournamentId: string): Promise<void> {
    await this.tournamentsRepo
      .createQueryBuilder()
      .update(Tournament)
      .set({ currentParticipants: () => '"current_participants" + 1' })
      .where('id = :id', { id: tournamentId })
      .execute();
  }

  async incrementViews(tournamentId: string): Promise<void> {
    await this.tournamentsRepo
      .createQueryBuilder()
      .update(Tournament)
      .set({ viewsCount: () => '"viewsCount" + 1' })
      .where('id = :id', { id: tournamentId })
      .execute();
  }

  async trackTournamentView(userId: string, tournamentId: string): Promise<void> {
    // Проверяем существование турнира
    await this.findOne(tournamentId);

    // Создаем запись о просмотре
    const view = this.tournamentViewRepo.create({ userId, tournamentId });
    await this.tournamentViewRepo.save(view);

    // Увеличиваем счётчик
    await this.incrementViews(tournamentId);
  }

  async saveTournament(userId: string, tournamentId: string): Promise<{ message: string }> {
    // Check if tournament exists
    const tournament = await this.findOne(tournamentId);
    
    // Check if already saved
    const existing = await this.savedTournamentsRepo.findOne({
      where: { userId, tournamentId },
    });

    if (existing) {
      throw new ConflictException('Tournament already saved');
    }

    // Save tournament
    const saved = this.savedTournamentsRepo.create({ userId, tournamentId });
    await this.savedTournamentsRepo.save(saved);

    // Increment saves count
    await this.tournamentsRepo
      .createQueryBuilder()
      .update(Tournament)
      .set({ savesCount: () => '"savesCount" + 1' })
      .where('id = :id', { id: tournamentId })
      .execute();

    return { message: 'Tournament saved successfully' };
  }

  async unsaveTournament(userId: string, tournamentId: string): Promise<{ message: string }> {
    const saved = await this.savedTournamentsRepo.findOne({
      where: { userId, tournamentId },
    });

    if (!saved) {
      throw new NotFoundException('Saved tournament not found');
    }

    await this.savedTournamentsRepo.delete(saved.id);

    // Decrement saves count
    await this.tournamentsRepo
      .createQueryBuilder()
      .update(Tournament)
      .set({ savesCount: () => '"savesCount" - 1' })
      .where('id = :id', { id: tournamentId })
      .execute();

    return { message: 'Tournament removed from saved' };
  }

  async getSavedTournaments(userId: string): Promise<Tournament[]> {
    const saved = await this.savedTournamentsRepo.find({
      where: { userId },
      relations: ['tournament', 'tournament.organizer'],
      order: { savedAt: 'DESC' },
    });

    return saved.filter((s) => s.tournament !== null).map((s) => s.tournament);
  }

  async isTournamentSaved(userId: string, tournamentId: string): Promise<boolean> {
    const saved = await this.savedTournamentsRepo.findOne({
      where: { userId, tournamentId },
    });
    return !!saved;
  }

  // ========== REPORTS METHODS ==========
  async reportOrganizer(
    reporterId: string,
    tournamentId: string,
    reason: string,
    description?: string,
  ) {
    const tournament = await this.findOne(tournamentId);

    // Нельзя пожаловаться на себя
    if (tournament.organizerId === reporterId) {
      throw new BadRequestException('Нельзя пожаловаться на себя');
    }

    // Проверяем что пользователь был участником турнира
    // (это можно добавить позже через проверку в Participant)

    // Проверяем что уже не было жалобы от этого пользователя на этот турнир
    const existingReport = await this.tournamentReportRepo.findOne({
      where: { reporterId, tournamentId },
    });

    if (existingReport) {
      throw new ConflictException('Вы уже подали жалобу на этот турнир');
    }

    // Создаём жалобу
    const report = this.tournamentReportRepo.create({
      reporterId,
      tournamentId,
      organizerId: tournament.organizerId,
      reason: reason as any,
      description,
    });

    await this.tournamentReportRepo.save(report);

    // Увеличиваем счётчик жалоб организатора
    await this.usersRepo.increment({ id: tournament.organizerId }, 'organizerReportsCount', 1);

    // Снижаем рейтинг организатора
    await this.usersRepo.decrement({ id: tournament.organizerId }, 'organizerRating', 10);

    // Проверяем количество жалоб для автоматической блокировки
    const organizer = await this.usersRepo.findOne({ where: { id: tournament.organizerId } });
    
    if (organizer && organizer.organizerReportsCount >= 5) {
      // Временный бан на 7 дней
      const banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + 7);
      await this.usersRepo.update(organizer.id, { organizerBanUntil: banUntil });
    }

    return { 
      message: 'Жалоба отправлена. Мы рассмотрим её в ближайшее время.',
      organizerRating: Math.max(0, (organizer?.organizerRating || 100) - 10),
    };
  }

  async getOrganizerStats(organizerId: string) {
    const organizer = await this.usersRepo.findOne({ where: { id: organizerId } });
    if (!organizer) {
      throw new NotFoundException('Организатор не найден');
    }

    const totalTournaments = await this.tournamentsRepo.count({
      where: { organizerId },
    });

    const completedTournaments = await this.tournamentsRepo.count({
      where: { organizerId, status: TournamentStatus.COMPLETED },
    });

    const cancelledTournaments = await this.tournamentsRepo.count({
      where: { organizerId, status: TournamentStatus.CANCELLED },
    });

    const activeTournaments = await this.tournamentsRepo.count({
      where: {
        organizerId,
        status: In([TournamentStatus.DRAFT, TournamentStatus.OPEN, TournamentStatus.IN_PROGRESS]),
      },
    });

    const reports = await this.tournamentReportRepo.find({
      where: { organizerId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      organizerRating: organizer.organizerRating,
      reportsCount: organizer.organizerReportsCount,
      isBanned: organizer.organizerBanUntil && new Date(organizer.organizerBanUntil) > new Date(),
      banUntil: organizer.organizerBanUntil,
      totalTournaments,
      completedTournaments,
      cancelledTournaments,
      activeTournaments,
      recentReports: reports,
    };
  }

  async getMatches(tournamentId: string): Promise<Match[]> {
    return this.matchesRepo.find({
      where: { tournamentId },
      order: { name: 'ASC' },
    });
  }

  async updateMatch(
    tournamentId: string,
    matchId: string,
    userId: string,
    data: {
      team1Name?: string;
      team2Name?: string;
      team1Odds?: number;
      team2Odds?: number;
      winnerSide?: number;
    },
  ): Promise<Match> {
    const tournament = await this.findOne(tournamentId);
    if (tournament.organizerId !== userId) {
      throw new ForbiddenException('Только организатор может редактировать матчи');
    }

    const match = await this.matchesRepo.findOne({
      where: { id: matchId, tournamentId },
    });
    if (!match) {
      throw new NotFoundException('Матч не найден');
    }

    // Если объявляется победитель и матч еще не завершен
    if (data.winnerSide && match.status !== 'completed') {
      match.winnerSide = data.winnerSide;
      match.status = 'completed';
      
      // Распределяем ставки
      const bets = await this.betsRepo.find({
        where: { matchId: match.id, status: BetStatus.PENDING },
      });

      const winOdds = data.winnerSide === 1 ? (data.team1Odds || match.team1Odds) : (data.team2Odds || match.team2Odds);

      for (const bet of bets) {
        if (bet.predictedSide === data.winnerSide) {
          // Выигрыш!
          const winAmount = Math.round(Number(bet.amount) * Number(winOdds) * 100) / 100;
          await this.walletService.addCredits(
            bet.bettorId,
            winAmount,
            TransactionType.PRIZE,
            match.id,
            `Выигрыш ставки на матч ${match.name} в турнире ${tournament.title}`,
          );
          bet.status = BetStatus.WON;
          bet.payout = winAmount;
        } else {
          // Проигрыш
          bet.status = BetStatus.LOST;
          bet.payout = 0;
        }
        bet.resolvedAt = new Date();
        await this.betsRepo.save(bet);
      }
    }

    if (data.team1Name !== undefined) match.team1Name = data.team1Name;
    if (data.team2Name !== undefined) match.team2Name = data.team2Name;
    if (data.team1Odds !== undefined) match.team1Odds = data.team1Odds;
    if (data.team2Odds !== undefined) match.team2Odds = data.team2Odds;

    return this.matchesRepo.save(match);
  }
}
