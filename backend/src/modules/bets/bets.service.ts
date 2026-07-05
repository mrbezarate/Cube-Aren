import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bet, BetStatus } from '../../entities/bet.entity';
import { Tournament, TournamentStatus, GameMode } from '../../entities/tournament.entity';
import { Participant } from '../../entities/participant.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../../entities/transaction.entity';
import { CreateBetDto } from './dto/create-bet.dto';
import { ChatGateway } from '../chat/chat.gateway';

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
    private chatGateway: ChatGateway,
  ) {}

  async placeBet(bettorId: string, dto: CreateBetDto): Promise<Bet> {
    const tournament = await this.tournamentsRepo.findOne({ where: { id: dto.tournamentId } });
    if (!tournament) throw new NotFoundException('Турнир не найден');
    if (tournament.status !== TournamentStatus.OPEN) {
      throw new BadRequestException('Ставки можно делать только на открытые турниры до их начала');
    }

    // Запрещаем участникам турнира делать ставки на него
    const isParticipant = await this.participantsRepo.findOne({
      where: { tournamentId: dto.tournamentId, userId: bettorId },
    });
    if (isParticipant) {
      throw new BadRequestException('Участники турнира не могут делать ставки на этот турнир');
    }

    if (dto.matchId) {
      if (dto.predictedSide !== 1 && dto.predictedSide !== 2) {
        throw new BadRequestException('predictedSide must be 1 or 2');
      }

      await this.walletService.deductCredits(
        bettorId,
        dto.amount,
        TransactionType.BET,
        dto.tournamentId,
        `Ставка на матч в турнире ${tournament.title}`,
      );

      const bet = this.betsRepo.create({
        bettorId,
        tournamentId: dto.tournamentId,
        matchId: dto.matchId,
        predictedSide: dto.predictedSide,
        amount: dto.amount,
        status: BetStatus.PENDING,
      });

      const savedBet = await this.betsRepo.save(bet);
      this.notifyUpdates(bettorId, dto.tournamentId);
      return savedBet;
    } else {
      // Ставка на победителя турнира
      const isTeamMode = tournament.gameMode === GameMode.TWO_TEAM || tournament.gameMode === GameMode.MULTI_TEAM;

      if (isTeamMode) {
        if (dto.predictedTeamSlot === undefined || dto.predictedTeamSlot === null) {
          throw new BadRequestException('predictedTeamSlot is required for team tournaments');
        }
        const maxSlot = tournament.gameMode === GameMode.TWO_TEAM ? 2 : (tournament.teamsCount ?? 2);
        if (dto.predictedTeamSlot < 1 || dto.predictedTeamSlot > maxSlot) {
          throw new BadRequestException(`Неверный командный слот. Должен быть от 1 до ${maxSlot}`);
        }
      } else {
        if (!dto.predictedWinnerId) {
          throw new BadRequestException('predictedWinnerId is required for solo tournaments');
        }
        const participant = await this.participantsRepo.findOne({
          where: { id: dto.predictedWinnerId, tournamentId: dto.tournamentId },
        });
        if (!participant) throw new NotFoundException('Участник не найден в этом турнире');
      }

      // Проверяем, есть ли уже ставка на победителя у этого пользователя на данный турнир
      const existingBet = await this.betsRepo.findOne({
        where: { tournamentId: dto.tournamentId, bettorId, matchId: null },
      });

      if (existingBet) {
        // Изменение / повторная ставка
        const diff = Number(dto.amount) - Number(existingBet.amount);
        if (diff > 0) {
          await this.walletService.deductCredits(
            bettorId,
            diff,
            TransactionType.BET,
            dto.tournamentId,
            `Увеличение ставки на турнир ${tournament.title}`,
          );
        } else if (diff < 0) {
          await this.walletService.addCredits(
            bettorId,
            -diff,
            TransactionType.REFUND,
            dto.tournamentId,
            `Уменьшение ставки на турнир ${tournament.title}`,
          );
        }

        existingBet.amount = dto.amount;
        existingBet.predictedWinnerId = isTeamMode ? null : dto.predictedWinnerId;
        existingBet.predictedTeamSlot = isTeamMode ? dto.predictedTeamSlot : null;
        existingBet.placedAt = new Date();

        const savedBet = await this.betsRepo.save(existingBet);
        this.notifyUpdates(bettorId, dto.tournamentId);
        return savedBet;
      } else {
        // Новая ставка
        await this.walletService.deductCredits(
          bettorId,
          dto.amount,
          TransactionType.BET,
          dto.tournamentId,
          `Ставка на победителя турнира ${tournament.title}`,
        );

        const bet = this.betsRepo.create({
          bettorId,
          tournamentId: dto.tournamentId,
          predictedWinnerId: isTeamMode ? null : dto.predictedWinnerId,
          predictedTeamSlot: isTeamMode ? dto.predictedTeamSlot : null,
          amount: dto.amount,
          status: BetStatus.PENDING,
        });

        const savedBet = await this.betsRepo.save(bet);
        this.notifyUpdates(bettorId, dto.tournamentId);
        return savedBet;
      }
    }
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
    const tournament = await this.tournamentsRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) return [];

    const bets = await this.betsRepo.find({ where: { tournamentId, status: BetStatus.PENDING, matchId: null } });
    const totalPool = bets.reduce((sum, b) => sum + Number(b.amount), 0);

    const isTeamMode = tournament.gameMode === GameMode.TWO_TEAM || tournament.gameMode === GameMode.MULTI_TEAM;

    if (isTeamMode) {
      const maxSlot = tournament.gameMode === GameMode.TWO_TEAM ? 2 : (tournament.teamsCount ?? 2);
      const oddsList = [];
      
      for (let s = 1; s <= maxSlot; s++) {
        const slotBets = bets.filter((b) => b.predictedTeamSlot === s);
        const slotTotal = slotBets.reduce((sum, b) => sum + Number(b.amount), 0);
        // Если ставок нет, базовые коэффициенты рассчитываются как равное деление пула
        const odds = slotTotal > 0 ? totalPool / slotTotal : maxSlot;
        
        oddsList.push({
          teamSlot: s,
          teamLabel: `Команда ${s}`,
          totalBets: slotTotal,
          bettorCount: slotBets.length,
          odds: Math.round(odds * 100) / 100,
        });
      }
      return oddsList;
    } else {
      const participants = await this.participantsRepo.find({
        where: { tournamentId },
        relations: ['user'],
      });

      return participants.map((p) => {
        const participantBets = bets.filter((b) => b.predictedWinnerId === p.id);
        const participantTotal = participantBets.reduce((sum, b) => sum + Number(b.amount), 0);
        const odds = participantTotal > 0 ? totalPool / participantTotal : participants.length;

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
  }

  async resolveBets(
    tournamentId: string,
    winnerParticipantId?: string,
    winnerTeamSlot?: number,
  ): Promise<void> {
    const bets = await this.betsRepo.find({
      where: { tournamentId, status: BetStatus.PENDING, matchId: null },
    });

    if (bets.length === 0) return;

    const tournament = await this.tournamentsRepo.findOne({ where: { id: tournamentId } });
    const commissionRate = Number(tournament?.commissionRate || 0.1);

    const totalPool = bets.reduce((sum, b) => sum + Number(b.amount), 0);
    const netPool = totalPool * (1 - commissionRate);

    // Определяем выигрышные ставки
    let winnerBets: Bet[] = [];
    if (winnerParticipantId) {
      winnerBets = bets.filter((b) => b.predictedWinnerId === winnerParticipantId);
    } else if (winnerTeamSlot) {
      winnerBets = bets.filter((b) => b.predictedTeamSlot === winnerTeamSlot);
    }

    // Если нет победителей (никто не поставил правильно), возвращаем деньги всем участникам ставок
    if (winnerBets.length === 0) {
      for (const bet of bets) {
        await this.walletService.addCredits(
          bet.bettorId,
          Number(bet.amount),
          TransactionType.REFUND,
          tournamentId,
          `Возврат ставки: нет победителей по ставкам в турнире ${tournament?.title}`,
        );

        await this.betsRepo.update(bet.id, {
          status: BetStatus.REFUNDED,
          payout: Number(bet.amount),
          resolvedAt: new Date(),
        });

        const balance = await this.walletService.getBalance(bet.bettorId);
        this.chatGateway.sendToUser(bet.bettorId, 'balance_updated', { balance });
      }

      this.chatGateway.server.emit('bets_updated', { tournamentId });
      return;
    }

    const winnerPool = winnerBets.reduce((sum, b) => sum + Number(b.amount), 0);

    // Выплачиваем выигрыши победителям пропорционально их доле
    for (const bet of winnerBets) {
      const share = winnerPool > 0 ? Number(bet.amount) / winnerPool : 0;
      const payout = netPool * share;
      const roundedPayout = Math.round(payout * 100) / 100;

      await this.walletService.addCredits(
        bet.bettorId,
        roundedPayout,
        TransactionType.PAYOUT,
        tournamentId,
        `Выплата по ставке на турнир: ${tournament?.title}`,
      );

      await this.betsRepo.update(bet.id, {
        status: BetStatus.WON,
        payout: roundedPayout,
        resolvedAt: new Date(),
      });

      const balance = await this.walletService.getBalance(bet.bettorId);
      this.chatGateway.sendToUser(bet.bettorId, 'balance_updated', { balance });
    }

    // Помечаем проигравшие ставки
    const loserBets = bets.filter((b) => {
      if (winnerParticipantId) return b.predictedWinnerId !== winnerParticipantId;
      if (winnerTeamSlot) return b.predictedTeamSlot !== winnerTeamSlot;
      return true;
    });

    if (loserBets.length > 0) {
      await this.betsRepo
        .createQueryBuilder()
        .update(Bet)
        .set({ status: BetStatus.LOST, resolvedAt: new Date(), payout: 0 })
        .where('id IN (:...ids)', { ids: loserBets.map((b) => b.id) })
        .execute();
    }

    this.chatGateway.server.emit('bets_updated', { tournamentId });
  }

  async refundAllTournamentBets(tournamentId: string): Promise<void> {
    const bets = await this.betsRepo.find({
      where: { tournamentId, status: BetStatus.PENDING },
    });

    for (const bet of bets) {
      await this.walletService.addCredits(
        bet.bettorId,
        Number(bet.amount),
        TransactionType.REFUND,
        tournamentId,
        `Возврат ставки в связи с отменой турнира`,
      );

      await this.betsRepo.update(bet.id, {
        status: BetStatus.REFUNDED,
        payout: Number(bet.amount),
        resolvedAt: new Date(),
      });

      const balance = await this.walletService.getBalance(bet.bettorId);
      this.chatGateway.sendToUser(bet.bettorId, 'balance_updated', { balance });
    }

    this.chatGateway.server.emit('bets_updated', { tournamentId });
  }

  private async notifyUpdates(bettorId: string, tournamentId: string) {
    const balance = await this.walletService.getBalance(bettorId);
    this.chatGateway.sendToUser(bettorId, 'balance_updated', { balance });
    this.chatGateway.server.emit('bets_updated', { tournamentId });
  }
}
