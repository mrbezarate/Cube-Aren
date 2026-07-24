import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Participant, ParticipantStatus } from '../../entities/participant.entity';
import { Tournament, TournamentStatus, GameMode } from '../../entities/tournament.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../../entities/transaction.entity';
import { BetsService } from '../bets/bets.service';
import { UsersService } from '../users/users.service';
import { ChatGateway } from '../chat/chat.gateway';

export interface JoinTournamentOptions {
  teamSlot?: number;       // Командный слот (1,2,3...) для TWO_TEAM/MULTI_TEAM
  teamLabel?: string;      // Название команды (может задавать только первый/капитан)
  clanId?: string;         // ID клана при клановой регистрации
  clanMemberIds?: string[]; // Все участники клана для заполнения слота
}

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private participantsRepo: Repository<Participant>,
    @InjectRepository(Tournament)
    private tournamentsRepo: Repository<Tournament>,
    private walletService: WalletService,
    private dataSource: DataSource,
    private betsService: BetsService,
    private usersService: UsersService,
    private chatGateway: ChatGateway,
  ) {}

  async join(
    tournamentId: string,
    userId: string,
    options: JoinTournamentOptions = {},
  ): Promise<Participant> {
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

    // ======= Логика по режиму =======
    const gameMode = tournament.gameMode;
    let teamSlot: number | null = null;
    let teamLabel: string | null = null;
    let isTeamCaptain = false;

    if (gameMode === GameMode.TWO_TEAM || gameMode === GameMode.MULTI_TEAM) {
      // Требуется выбор командного слота
      if (!options.teamSlot) {
        throw new BadRequestException(
          'Team slot is required for team tournaments. Please select a team.',
        );
      }

      const maxSlot = gameMode === GameMode.TWO_TEAM ? 2 : (tournament.teamsCount ?? 2);
      if (options.teamSlot < 1 || options.teamSlot > maxSlot) {
        throw new BadRequestException(
          `Invalid team slot. Must be between 1 and ${maxSlot}.`,
        );
      }

      teamSlot = options.teamSlot;

      // Получаем текущих участников в этом слоте
      const slotMembers = await this.participantsRepo.find({
        where: { tournamentId, teamSlot },
      });

      // Проверка: нельзя смешивать клановых и соло в одном слоте
      if (options.clanId) {
        // Проверка: клан не должен быть зарегистрирован в другом слоте
        const existingClan = await this.participantsRepo.findOne({
          where: { tournamentId, clanId: options.clanId },
        });
        if (existingClan && existingClan.teamSlot !== teamSlot) {
          throw new ConflictException('Этот клан уже зарегистрирован в другом командном слоте');
        }

        // Клановая регистрация: слот не должен содержать соло-игроков
        const hasSoloInSlot = slotMembers.some((m) => !m.clanId);
        if (hasSoloInSlot) {
          throw new BadRequestException(
            'Cannot register clan in this team slot: it already contains solo players.',
          );
        }
      } else {
        // Соло: слот не должен быть занят кланом
        const hasClanInSlot = slotMembers.some((m) => m.clanId);
        if (hasClanInSlot) {
          throw new BadRequestException(
            'Cannot join this team slot: it is occupied by a clan.',
          );
        }
      }

      // Проверка вместимости слота
      if (tournament.teamSize) {
        if (slotMembers.length >= tournament.teamSize) {
          throw new BadRequestException('This team slot is full.');
        }
      }

      // Первый в слоте — капитан (может задавать название)
      if (slotMembers.length === 0) {
        isTeamCaptain = true;
        teamLabel = options.teamLabel ?? null;
      } else if (options.teamLabel) {
        // Только капитан может менять название
        const captain = slotMembers.find((m) => m.isTeamCaptain);
        if (captain && captain.userId === userId) {
          // Обновляем teamLabel у всего слота
          await this.participantsRepo.update(
            { tournamentId, teamSlot },
            { teamLabel: options.teamLabel },
          );
        }
        // Не-капитан шлёт teamLabel — просто игнорируем
      } else {
        // Подхватываем label существующей команды
        const captain = slotMembers.find((m) => m.isTeamCaptain);
        if (captain) teamLabel = captain.teamLabel ?? null;
      }
    }
    // FFA: teamSlot = null, teamLabel = null

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Вычитаем взнос
      if (tournament.entryFee > 0) {
        await this.walletService.deductCredits(
          userId,
          Number(tournament.entryFee),
          TransactionType.ENTRY_FEE,
          tournamentId,
          `Entry fee for tournament: ${tournament.title}`,
        );
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
        teamSlot,
        teamLabel,
        isTeamCaptain,
        clanId: options.clanId ?? null,
        status: ParticipantStatus.REGISTERED,
      });
      const saved = await this.participantsRepo.save(participant);
      await queryRunner.commitTransaction();

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

  /**
   * Возвращает участников сгруппированных по командным слотам для TWO_TEAM/MULTI_TEAM.
   * Для FFA возвращает все как teamSlot = null.
   */
  async getByTournamentGrouped(tournamentId: string): Promise<{
    gameMode: GameMode;
    teams: Record<string, Participant[]>;
    participants: Participant[];
  }> {
    const tournament = await this.tournamentsRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Tournament not found');

    const participants = await this.participantsRepo.find({
      where: { tournamentId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });

    if (tournament.gameMode === GameMode.FFA) {
      return { gameMode: GameMode.FFA, teams: {}, participants };
    }

    const teams: Record<string, Participant[]> = {};
    for (const p of participants) {
      const key = String(p.teamSlot ?? 'unassigned');
      if (!teams[key]) teams[key] = [];
      teams[key].push(p);
    }

    return { gameMode: tournament.gameMode, teams, participants };
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

  async declareWinner(
    tournamentId: string,
    options: { winnerParticipantId?: string; winnerTeamSlot?: number },
  ): Promise<void> {
    const tournament = await this.tournamentsRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Турнир не найден');

    const isTeamMode = tournament.gameMode === GameMode.TWO_TEAM || tournament.gameMode === GameMode.MULTI_TEAM;
    let winners: Participant[] = [];

    if (isTeamMode) {
      if (options.winnerTeamSlot === undefined || options.winnerTeamSlot === null) {
        throw new BadRequestException('winnerTeamSlot is required for team tournaments');
      }

      winners = await this.participantsRepo.find({
        where: { tournamentId, teamSlot: options.winnerTeamSlot },
        relations: ['user'],
      });

      if (winners.length === 0) {
        throw new BadRequestException('В выбранной команде нет игроков');
      }

      // Помечаем всех участников победившей команды
      await this.participantsRepo.update(
        { tournamentId, teamSlot: options.winnerTeamSlot },
        { status: ParticipantStatus.WINNER, placement: 1 },
      );

      // Всех остальных помечаем выбывшими
      await this.participantsRepo
        .createQueryBuilder()
        .update(Participant)
        .set({ status: ParticipantStatus.ELIMINATED })
        .where('tournament_id = :tournamentId AND (team_slot != :winnerTeamSlot OR team_slot IS NULL)', {
          tournamentId,
          winnerTeamSlot: options.winnerTeamSlot,
        })
        .execute();

      // Распределяем призовой пул между членами команды
      const prizePool = Number(tournament.prizePool);
      const commission = prizePool * Number(tournament.commissionRate);
      const netPrize = prizePool - commission;

      if (netPrize > 0 && winners.length > 0) {
        const sharePrize = Math.round((netPrize / winners.length) * 100) / 100;
        for (const winner of winners) {
          await this.walletService.addCredits(
            winner.userId,
            sharePrize,
            TransactionType.PRIZE,
            tournamentId,
            `Приз за победу в командном турнире ${tournament.title}`,
          );
        }
      }

      // Обновляем ELO-рейтинги победителям
      for (const winner of winners) {
        await this.usersService.updatePlayerRating(winner.userId, tournament.game as any, 25, true);
      }

      // Рассчитываем ставки
      await this.betsService.resolveBets(tournamentId, null, options.winnerTeamSlot);
    } else {
      if (!options.winnerParticipantId) {
        throw new BadRequestException('winnerParticipantId is required for solo tournaments');
      }

      const winner = await this.participantsRepo.findOne({
        where: { id: options.winnerParticipantId, tournamentId },
        relations: ['user'],
      });

      if (!winner) throw new NotFoundException('Победитель не найден среди участников');
      winners = [winner];

      // Помечаем победителя
      await this.participantsRepo.update(options.winnerParticipantId, {
        status: ParticipantStatus.WINNER,
        placement: 1,
      });

      // Всех остальных помечаем выбывшими
      await this.participantsRepo
        .createQueryBuilder()
        .update(Participant)
        .set({ status: ParticipantStatus.ELIMINATED })
        .where('tournament_id = :tournamentId AND id != :winnerId', {
          tournamentId,
          winnerId: options.winnerParticipantId,
        })
        .execute();

      // Выплачиваем приз победителю
      const prizePool = Number(tournament.prizePool);
      const commission = prizePool * Number(tournament.commissionRate);
      const winnerPrize = prizePool - commission;

      if (winnerPrize > 0) {
        await this.walletService.addCredits(
          winner.userId,
          winnerPrize,
          TransactionType.PRIZE,
          tournamentId,
          `Приз за победу в турнире ${tournament.title}`,
        );
      }

      // Обновляем ELO-рейтинг победителю
      await this.usersService.updatePlayerRating(winner.userId, tournament.game as any, 25, true);

      // Рассчитываем ставки
      await this.betsService.resolveBets(tournamentId, options.winnerParticipantId, null);
    }

    // Снимаем ELO-рейтинги у проигравших участников
    const losers = await this.participantsRepo.find({
      where: { tournamentId, status: ParticipantStatus.ELIMINATED },
    });
    for (const loser of losers) {
      await this.usersService.updatePlayerRating(loser.userId, tournament.game as any, -15, false);
    }

    // Завершаем турнир
    await this.tournamentsRepo.update(tournamentId, { status: TournamentStatus.COMPLETED });

    // Отправляем real-time уведомления
    this.chatGateway.server.emit('tournament_updated', { id: tournamentId });
    this.chatGateway.server.emit('participants_updated', { tournamentId });

    // Обновляем баланс в UI всем участникам
    const allParticipants = await this.participantsRepo.find({ where: { tournamentId } });
    for (const participant of allParticipants) {
      const balance = await this.walletService.getBalance(participant.userId);
      this.chatGateway.sendToUser(participant.userId, 'balance_updated', { balance });
    }
  }
}
