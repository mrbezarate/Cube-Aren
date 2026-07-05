import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tournament } from './tournament.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column({ name: 'tournament_id' })
  tournamentId: string;

  @Column()
  name: string;

  @Column({ name: 'team1_name', default: 'Команда А' })
  team1Name: string;

  @Column({ name: 'team2_name', default: 'Команда Б' })
  team2Name: string;

  @Column({ name: 'team1_odds', type: 'decimal', precision: 10, scale: 2, default: 1.85 })
  team1Odds: number;

  @Column({ name: 'team2_odds', type: 'decimal', precision: 10, scale: 2, default: 1.85 })
  team2Odds: number;

  @Column({ name: 'winner_side', type: 'int', nullable: true })
  winnerSide: number;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
