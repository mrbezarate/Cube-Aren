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

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column({ name: 'tournament_id' })
  tournamentId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ nullable: true })
  teamName: string;

  // Номер командного слота (1, 2, 3...). Null для FFA.
  @Column({ name: 'team_slot', type: 'int', nullable: true })
  teamSlot: number;

  // Пользовательское название команды (может ставить только капитан)
  @Column({ name: 'team_label', nullable: true })
  teamLabel: string;

  // Является ли первым в своей команде (капитан, может менять название)
  @Column({ name: 'is_team_captain', default: false })
  isTeamCaptain: boolean;

  // ID клана, если участник зарегистрирован от лица клана
  @Column({ name: 'clan_id', nullable: true })
  clanId: string;

  @Column({ type: 'enum', enum: ParticipantStatus, default: ParticipantStatus.REGISTERED })
  status: ParticipantStatus;

  @Column({ nullable: true, type: 'int' })
  placement: number;

  @CreateDateColumn()
  joinedAt: Date;
}
