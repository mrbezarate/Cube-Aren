import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Participant, ParticipantStatus } from '../../entities/participant.entity';
import { Tournament, TournamentStatus } from '../../entities/tournament.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../../entities/transaction.entity';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private participantsRepo: Repository<Participant>,
    @InjectRepository(Tournament)
    private tournamentsRepo: Repository<Tournament>,
    private walletService: WalletService,
    private dataSource: DataSource,
  ) {}

  async join(tournamentId: string, userId: string, teamName?: string): Promise<Participant> {
    const tournament = await this.tournamentsRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.status !== TournamentStatus.OPEN) {
      throw new BadRequestException('Tournament is not open for registration');
    }
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      throw new BadRequestException('Tournament is full');
    }

    const existing = await this.participantsRepo.findOne({
      where: { tournamentId, userId },
    });
    if (existing) throw new ConflictException('Already registered for this tournament');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Deduct entry fee
      if (tournament.entryFee > 0) {
        await this.walletService.deductCredits(
          userId,
          Number(tournament.entryFee),
          TransactionType.ENTRY_FEE,
          tournamentId,
          `Entry fee for tournament: ${tournament.title}`,
        );
        // Add to prize pool
        await this.tournamentsRepo.update(tournamentId, {
          prizePool: () => `"prizePool" + ${tournament.entryFee}`,
          currentParticipants: () => '"currentParticipants" + 1',
        });
      } else {
        await this.tournamentsRepo.update(tournamentId, {
          currentParticipants: () => '"currentParticipants" + 1',
        });
      }

      const participant = this.participantsRepo.create({
        tournamentId,
        userId,
        teamName,
        status: ParticipantStatus.REGISTERED,
      });
      const saved = await this.participantsRepo.save(participant);
      await queryRunner.commitTransaction();
      
      // Загружаем participant с user relation
      return this.participantsRepo.findOne({
        where: { id: saved.id },
        relations: ['user'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getByTournament(tournamentId: string): Promise<Participant[]> {
    return this.participantsRepo.find({
      where: { tournamentId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async updateStatus(
    tournamentId: string,
    participantId: string,
    status: ParticipantStatus,
    placement?: number,
  ): Promise<Participant> {
    const participant = await this.participantsRepo.findOne({
      where: { id: participantId, tournamentId },
    });
    if (!participant) throw new NotFoundException('Participant not found');

    await this.participantsRepo.update(participantId, {
      status,
      placement: placement ?? participant.placement,
    });
    return this.participantsRepo.findOne({ where: { id: participantId }, relations: ['user'] });
  }

  async declareWinner(tournamentId: string, winnerParticipantId: string): Promise<void> {
    const tournament = await this.tournamentsRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Tournament not found');

    const winner = await this.participantsRepo.findOne({
      where: { id: winnerParticipantId, tournamentId },
      relations: ['user'],
    });
    if (!winner) throw new NotFoundException('Participant not found');

    // Mark winner
    await this.participantsRepo.update(winnerParticipantId, {
      status: ParticipantStatus.WINNER,
      placement: 1,
    });

    // Mark everyone else eliminated
    await this.participantsRepo
      .createQueryBuilder()
      .update(Participant)
      .set({ status: ParticipantStatus.ELIMINATED })
      .where('tournament_id = :tournamentId AND id != :winnerId', {
        tournamentId,
        winnerId: winnerParticipantId,
      })
      .execute();

    // Distribute prize pool (commission deducted)
    const prizePool = Number(tournament.prizePool);
    const commission = prizePool * Number(tournament.commissionRate);
    const winnerPrize = prizePool - commission;

    if (winnerPrize > 0) {
      await this.walletService.addCredits(
        winner.userId,
        winnerPrize,
        TransactionType.PRIZE,
        tournamentId,
        `Prize for winning: ${tournament.title}`,
      );
    }

    // Mark tournament completed
    await this.tournamentsRepo.update(tournamentId, { status: TournamentStatus.COMPLETED });
  }
}
