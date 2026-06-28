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

  @Column({ type: 'enum', enum: OAuthProvider, default: OAuthProvider.LOCAL })
  oauthProvider: OAuthProvider;

  @Column({ nullable: true })
  oauthId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1000 })
  credits: number;

  @Column({ default: false })
  onboardingCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
