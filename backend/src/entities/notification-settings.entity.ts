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

@Entity('notification_settings')
export class NotificationSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Email notifications
  @Column({ default: true })
  emailNewTournament: boolean;

  @Column({ default: true })
  emailTournamentStart: boolean;

  @Column({ default: true })
  emailBetResult: boolean;

  @Column({ default: true })
  emailTeamRequest: boolean;

  @Column({ default: true })
  emailTeamInvite: boolean;

  @Column({ default: false })
  emailNewMessage: boolean;

  @Column({ default: true })
  emailWeeklyDigest: boolean;

  @Column({ default: false })
  emailMarketing: boolean;

  // Push notifications
  @Column({ default: true })
  pushNewMessage: boolean;

  @Column({ default: true })
  pushNewFollower: boolean;

  @Column({ default: true })
  pushTournamentStart: boolean;

  @Column({ default: true })
  pushBetResult: boolean;

  @Column({ default: true })
  pushTeamRequest: boolean;

  // In-app notifications
  @Column({ default: true })
  inAppShowBadges: boolean;

  @Column({ default: true })
  inAppShowRequests: boolean;

  @Column({ default: true })
  inAppShowNotifications: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
