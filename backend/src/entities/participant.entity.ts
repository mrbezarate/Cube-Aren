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

export enum ParticipantStatus {
  REGISTERED = 'registered',
  CHECKED_IN = 'checked_in',
  PLAYING = 'playing',
  ELIMINATED = 'eliminated',
  WINNER = 'winner',
}

@Entity('tournament_participants')
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tournament)
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column()
  tournamentId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  teamName: string;

  @Column({ type: 'enum', enum: ParticipantStatus, default: ParticipantStatus.REGISTERED })
  status: ParticipantStatus;

  @Column({ nullable: true, type: 'int' })
  placement: number;

  @CreateDateColumn()
  joinedAt: Date;
}
