import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bet, BetStatus } from '../../entities/bet.entity';
import { Tournament, TournamentStatus } from '../../entities/tournament.entity';
import { Participant } from '../../entities/participant.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../../entities/transaction.entity';
import { CreateBetDto } from './dto/create-bet.dto';

@Injectable()
export class BetsService {
  constructor(
    @InjectRepository(Bet)
    private betsRepo: Repository<Bet>,
    @InjectRepository(Tournament)
    private tournamentsRepo: Repository<Tournament>,
    @InjectRepository(Participant)
    private participantsRepo: Repository<Participant>,
    private walletService: WalletService,
  ) {}

  async placeBet(bettorId: string, dto: CreateBetDto): Promise<Bet> {
    const tournament = await this.tournamentsRepo.findOne({ where: { id: dto.tournamentId } });
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.status !== TournamentStatus.OPEN && tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Bets can only be placed on open or active tournaments');
    }

    const participant = await this.participantsRepo.findOne({
      where: { id: dto.predictedWinnerId, tournamentId: dto.tournamentId },
    });
    if (!participant) throw new NotFoundException('Participant not found in this tournament');

    // Check user isn't betting on themselves
    if (participant.userId === bettorId) {
      throw new BadRequestException('You cannot bet on yourself');
    }

    // Deduct credits
    await this.walletService.deductCredits(
      bettorId,
      dto.amount,
      TransactionType.BET,
      dto.tournamentId,
      `Bet on ${tournament.title}`,
    );

    const bet = this.betsRepo.create({
      bettorId,
      tournamentId: dto.tournamentId,
      predictedWinnerId: dto.predictedWinnerId,
      amount: dto.amount,
      status: BetStatus.PENDING,
    });

    return this.betsRepo.save(bet);
  }

  async getMyBets(userId: string, page = 1, limit = 10) {
    const [data, total] = await this.betsRepo.findAndCount({
      where: { bettorId: userId },
      relations: ['tournament'],
      order: { placedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async getTournamentBets(tournamentId: string) {
    return this.betsRepo.find({
      where: { tournamentId },
      relations: ['bettor'],
      order: { placedAt: 'DESC' },
    });
  }

  async getOdds(tournamentId: string) {
    const bets = await this.betsRepo.find({ where: { tournamentId, status: BetStatus.PENDING } });
    const participants = await this.participantsRepo.find({
      where: { tournamentId },
      relations: ['user'],
    });

    const totalPool = bets.reduce((sum, b) => sum + Number(b.amount), 0);

    return participants.map((p) => {
      const participantBets = bets.filter((b) => b.predictedWinnerId === p.id);
      const participantTotal = participantBets.reduce((sum, b) => sum + Number(b.amount), 0);
      const odds = participantTotal > 0 ? totalPool / participantTotal : 0;

      return {
        participantId: p.id,
        teamName: p.teamName,
        username: p.user?.username,
        totalBets: participantTotal,
        bettorCount: participantBets.length,
        odds: Math.round(odds * 100) / 100,
      };
    });
  }

  async resolveBets(tournamentId: string, winnerParticipantId: string): Promise<void> {
    const bets = await this.betsRepo.find({
      where: { tournamentId, status: BetStatus.PENDING },
    });

    const tournament = await this.tournamentsRepo.findOne({ where: { id: tournamentId } });
    const commissionRate = Number(tournament?.commissionRate || 0.1);

    const winnerBets = bets.filter((b) => b.predictedWinnerId === winnerParticipantId);
    const loserBets = bets.filter((b) => b.predictedWinnerId !== winnerParticipantId);

    const loserPool = loserBets.reduce((sum, b) => sum + Number(b.amount), 0);
    const winnerPool = winnerBets.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalPool = loserPool + winnerPool;
    const netPool = totalPool * (1 - commissionRate);

    // Resolve winner bets: they get their stake back + proportional share of loser pool
    for (const bet of winnerBets) {
      const share = winnerPool > 0 ? Number(bet.amount) / winnerPool : 0;
      const payout = Number(bet.amount) + loserPool * (1 - commissionRate) * share;
      const roundedPayout = Math.round(payout * 100) / 100;

      await this.walletService.addCredits(
        bet.bettorId,
        roundedPayout,
        TransactionType.PAYOUT,
        tournamentId,
        `Bet payout for tournament: ${tournament?.title}`,
      );

      await this.betsRepo.update(bet.id, {
        status: BetStatus.WON,
        payout: roundedPayout,
        resolvedAt: new Date(),
      });
    }

    // Mark loser bets as lost
    if (loserBets.length > 0) {
      await this.betsRepo
        .createQueryBuilder()
        .update(Bet)
        .set({ status: BetStatus.LOST, resolvedAt: new Date() })
        .where('id IN (:...ids)', { ids: loserBets.map((b) => b.id) })
        .execute();
    }
  }
}
