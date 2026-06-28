import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament, TournamentStatus } from '../../entities/tournament.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { FilterTournamentDto } from './dto/filter-tournament.dto';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private tournamentsRepo: Repository<Tournament>,
  ) {}

  async findAll(filters: FilterTournamentDto) {
    const {
      game,
      format,
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
    if (status) qb.andWhere('t.status = :status', { status });
    if (region) qb.andWhere('t.region = :region', { region });
    if (minPrize) qb.andWhere('t.prizePool >= :minPrize', { minPrize });
    if (maxEntryFee !== undefined) qb.andWhere('t.entryFee <= :maxEntryFee', { maxEntryFee });
    if (search) qb.andWhere('t.title ILIKE :search', { search: `%${search}%` });

    const validSortFields = ['prizePool', 'startDate', 'entryFee', 'currentParticipants', 'createdAt'];
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
}
