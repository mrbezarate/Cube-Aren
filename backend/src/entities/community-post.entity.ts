import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export type CommunityPostTag =
  | 'discussion'
  | 'lfg'
  | 'guide'
  | 'news'
  | 'question'
  | 'meta';

@Entity('community_posts')
@Index(['game', 'createdAt'])
@Index(['authorId'])
export class CommunityPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'author_id' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  // Игровая доска: cs2, dota2, valorant, lol, pubg, apex, custom (общая)
  @Column({ type: 'varchar', length: 20 })
  game: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 20, default: 'discussion' })
  tag: CommunityPostTag;

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ type: 'int', default: 0 })
  viewsCount: number;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'boolean', default: false })
  isLocked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
