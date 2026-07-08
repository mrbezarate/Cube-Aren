import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Team } from './team.entity';

export enum TeamRole {
  CAPTAIN = 'captain',
  VICE_CAPTAIN = 'vice_captain',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

@Entity('team_members')
@Index(['teamId', 'userId'], { unique: true })
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'team_id' })
  teamId: string;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', default: 'member' })
  role: string; // Роль участника: captain, vice_captain, moderator, member

  @CreateDateColumn()
  joinedAt: Date;
}
