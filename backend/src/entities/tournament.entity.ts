import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum TournamentGame {
  CS2 = 'cs2',
  DOTA2 = 'dota2',
  VALORANT = 'valorant',
  LOL = 'lol',
  PUBG = 'pubg',
  APEX = 'apex',
  CUSTOM = 'custom',
}

export enum TournamentFormat {
  ONE_VS_ONE = '1v1',
  FIVE_VS_FIVE = '5v5',
  BATTLE_ROYALE = 'battle_royale',
  CUSTOM = 'custom',
}

export enum TournamentStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TournamentGame })
  game: TournamentGame;

  @Column({ type: 'enum', enum: TournamentFormat })
  format: TournamentFormat;

  @Column({ type: 'enum', enum: TournamentStatus, default: TournamentStatus.OPEN })
  status: TournamentStatus;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column()
  organizerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  entryFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  prizePool: number;

  @Column({ type: 'int' })
  maxParticipants: number;

  @Column({ type: 'int', default: 0 })
  currentParticipants: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0.1 })
  commissionRate: number;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true, type: 'int' })
  featuredOrder: number;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'text', nullable: true })
  rules: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
