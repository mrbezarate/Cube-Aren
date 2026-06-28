import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament, TournamentStatus } from '../../entities/tournament.entity';
import { SavedTournament } from '../../entities/saved-tournament.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { FilterTournamentDto } from './dto/filter-tournament.dto';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private tournamentsRepo: Repository<Tournament>,
    @InjectRepository(SavedTournament)
    private savedTournamentsRepo: Repository<SavedTournament>,
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
    const tournament = this.tournamentsRepo.create({
      ...dto,
      organizerId,
      status: TournamentStatus.OPEN,
      prizePool: 0,
    });
    return this.tournamentsRepo.save(tournament);
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

    return saved.map((s) => s.tournament);
  }

  async isTournamentSaved(userId: string, tournamentId: string): Promise<boolean> {
    const saved = await this.savedTournamentsRepo.findOne({
      where: { userId, tournamentId },
    });
    return !!saved;
  }
}
