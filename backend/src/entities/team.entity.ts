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

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  tag: string; // Короткий тег команды (2-5 символов)

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string; // Создатель и капитан команды

  @ManyToOne(() => User)
  @JoinColumn({ name: 'captain_id' })
  captain: User;

  @Column({ type: 'enum', enum: GameType })
  game: GameType; // По какой игре команда

  @Column({ type: 'simple-array', nullable: true })
  supportedGames: GameType[];

  @Column({ type: 'int', default: 0 })
  membersCount: number;

  @Column({ type: 'int', default: 10 })
  maxMembers: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1000 })
  rating: number; // TRP - Team Rating Points

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @Column({ type: 'int', nullable: true })
  leaderboardRank: number;

  @Column({ default: true })
  isRecruiting: boolean; // Открыт ли набор

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
