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
import { GameType } from './player-stats.entity';


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

export enum TournamentType {
  SOLO = 'solo',
  TEAM = 'team',
}

export enum GameMode {
  FFA = 'ffa',           // Free-for-all: каждый сам за себя, ставки на каждого игрока
  TWO_TEAM = 'two_team', // 2 команды: 5v5, 1v1, ставки на команду
  MULTI_TEAM = 'multi_team', // Много команд: 4v4v4, ставки на каждую команду
}

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: GameType })
  game: GameType;

  @Column({ type: 'enum', enum: TournamentFormat })
  format: TournamentFormat;

  @Column({ type: 'enum', enum: TournamentStatus, default: TournamentStatus.OPEN })
  status: TournamentStatus;

  @Column({ type: 'enum', enum: TournamentType, default: TournamentType.SOLO })
  tournamentType: TournamentType;

  @Column({ name: 'rounds_count', type: 'int', default: 3 })
  roundsCount: number;

  @Column({ name: 'game_mode', type: 'enum', enum: GameMode, default: GameMode.FFA })
  gameMode: GameMode;

  // Для TWO_TEAM: всегда 2. Для MULTI_TEAM: 3, 4, ...
  @Column({ name: 'teams_count', type: 'int', nullable: true })
  teamsCount: number;

  // Игроков в одной команде. maxParticipants = teamsCount * teamSize
  @Column({ name: 'team_size', type: 'int', nullable: true })
  teamSize: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column({ name: 'organizer_id' })
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

  @Column({ type: 'int', default: 0 })
  viewsCount: number;

  @Column({ type: 'int', default: 0 })
  savesCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
