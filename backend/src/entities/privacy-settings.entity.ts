import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';

export enum PrivacyLevel {
  EVERYONE = 'everyone',
  FRIENDS = 'friends',
  NOBODY = 'nobody',
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

@Entity('privacy_settings')
export class PrivacySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ProfileVisibility,
    default: ProfileVisibility.PUBLIC,
  })
  profileVisibility: ProfileVisibility;

  @Column({ type: 'enum', enum: PrivacyLevel, default: PrivacyLevel.EVERYONE })
  canMessageMe: PrivacyLevel;

  @Column({ type: 'enum', enum: PrivacyLevel, default: PrivacyLevel.EVERYONE })
  canSeeStats: PrivacyLevel;

  @Column({ type: 'enum', enum: PrivacyLevel, default: PrivacyLevel.EVERYONE })
  canSeeFriends: PrivacyLevel;

  @Column({ type: 'enum', enum: PrivacyLevel, default: PrivacyLevel.EVERYONE })
  canInviteToTeam: PrivacyLevel;

  @Column({ type: 'enum', enum: PrivacyLevel, default: PrivacyLevel.EVERYONE })
  showOnlineStatus: PrivacyLevel;

  @Column({ default: true })
  showProfileVisitors: boolean;

  @Column({ default: true })
  showTournamentHistory: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
