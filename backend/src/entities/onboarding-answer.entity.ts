import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { GameType } from './user.entity';

@Entity('onboarding_answers')
export class OnboardingAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ unique: true })
  userId: string;

  @Column()
  role: string;

  @Column({ type: 'simple-array', nullable: true })
  games: string[];

  @Column({ type: 'simple-array', nullable: true })
  goals: string[];

  @Column({ type: 'enum', enum: GameType, nullable: true })
  mainGame: GameType;

  @Column({ nullable: true })
  source: string;

  @CreateDateColumn()
  completedAt: Date;
}
