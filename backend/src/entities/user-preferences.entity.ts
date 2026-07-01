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

export enum Language {
  RU = 'ru',
  EN = 'en',
  UA = 'ua',
}

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
  SYSTEM = 'system',
}

export enum ColorAccent {
  PURPLE = 'purple',
  BLUE = 'blue',
  GREEN = 'green',
  GOLD = 'gold',
}

export enum TimeFormat {
  HOURS_24 = '24h',
  HOURS_12 = '12h',
}

export enum ImageQuality {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Interface
  @Column({ type: 'enum', enum: Language, default: Language.RU })
  language: Language;

  @Column({ type: 'enum', enum: Theme, default: Theme.DARK })
  theme: Theme;

  @Column({ type: 'enum', enum: ColorAccent, default: ColorAccent.PURPLE })
  colorAccent: ColorAccent;

  // Display
  @Column({ nullable: true })
  timezone: string;

  @Column({ default: 'DD.MM.YYYY' })
  dateFormat: string;

  @Column({ type: 'enum', enum: TimeFormat, default: TimeFormat.HOURS_24 })
  timeFormat: TimeFormat;

  // Games
  @Column({ default: false })
  hideUninterestingTournaments: boolean;

  @Column({ default: false })
  showOnlyRegionalTournaments: boolean;

  @Column({ type: 'int', default: 0 })
  minPrizePoolFilter: number;

  // Performance
  @Column({ default: true })
  enableAnimations: boolean;

  @Column({ default: true })
  autoplayVideos: boolean;

  @Column({ default: true })
  preloadImages: boolean;

  @Column({ type: 'enum', enum: ImageQuality, default: ImageQuality.HIGH })
  imageQuality: ImageQuality;

  // Content
  @Column({ default: false })
  showAdultContent: boolean;

  @Column({ default: false })
  filterProfanity: boolean;

  @Column({ default: true })
  hideSpoilers: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
