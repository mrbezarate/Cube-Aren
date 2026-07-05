import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tournament } from './tournament.entity';
import { Match } from './match.entity';

export enum BetStatus {
  PENDING = 'pending',
  WON = 'won',
  LOST = 'lost',
  REFUNDED = 'refunded',
}

@Entity('bets')
export class Bet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tournament, { eager: true })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column({ name: 'tournament_id' })
  tournamentId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'bettor_id' })
  bettor: User;

  @Column({ name: 'bettor_id' })
  bettorId: string;

  @ManyToOne(() => Match, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'match_id', nullable: true })
  matchId: string;

  @Column({ name: 'predicted_side', type: 'int', nullable: true })
  predictedSide: number;

  @Column({ nullable: true })
  predictedWinnerId: string;

  // Для ставок на командный слот в TWO_TEAM/MULTI_TEAM (1, 2, 3...)
  @Column({ name: 'predicted_team_slot', type: 'int', nullable: true })
  predictedTeamSlot: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: BetStatus, default: BetStatus.PENDING })
  status: BetStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  payout: number;

  @CreateDateColumn()
  placedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt: Date;
}
