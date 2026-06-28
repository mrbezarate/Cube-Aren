import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum GameType {
  CS2 = 'cs2',
  DOTA2 = 'dota2',
  VALORANT = 'valorant',
  LOL = 'lol',
  PUBG = 'pubg',
  APEX = 'apex',
  FORTNITE = 'fortnite',
  ROCKET_LEAGUE = 'rocket_league',
  OVERWATCH2 = 'overwatch2',
  RAINBOW6 = 'rainbow6',
  FIFA = 'fifa',
  CUSTOM = 'custom',
}

@Entity('player_stats')
@Index(['userId', 'game'], { unique: true })
export class PlayerStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: GameType })
  game: GameType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1000 })
  rating: number; // ELO рейтинг по игре

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @Column({ type: 'int', nullable: true })
  leaderboardRank: number; // Место в таблице лидеров

  @Column({ nullable: true })
  teamId: string; // ID команды (добавим позже)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
