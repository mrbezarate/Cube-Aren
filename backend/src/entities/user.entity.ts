import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  PARTICIPANT = 'participant',
  ORGANIZER = 'organizer',
  ADMIN = 'admin',
}

export enum OAuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  DISCORD = 'discord',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

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

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PARTICIPANT })
  role: UserRole;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  tagline: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ type: 'enum', enum: OAuthProvider, default: OAuthProvider.LOCAL })
  oauthProvider: OAuthProvider;

  @Column({ nullable: true })
  oauthId: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.OTHER, nullable: true })
  gender: Gender;

  // Профиль расширение
  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1000 })
  rating: number; // Общий ELO рейтинг

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @Column({ type: 'int', default: 0 })
  followersCount: number;

  @Column({ type: 'int', default: 0 })
  followingCount: number;

  @Column({ type: 'enum', enum: GameType, nullable: true })
  mainGame: GameType;

  @Column({ type: 'timestamp', nullable: true })
  lastUsernameChange: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastAvatarChange: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1000 })
  credits: number;

  @Column({ default: false })
  onboardingCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
