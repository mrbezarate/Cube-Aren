import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('blocked_users')
export class BlockedUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  blockedUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'blockedUserId' })
  blockedUser: User;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn()
  blockedAt: Date;
}
