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

  @Column()
  tournamentId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'bettor_id' })
  bettor: User;

  @Column()
  bettorId: string;

  @Column()
  predictedWinnerId: string;

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
