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
import { CommunityPost } from './community-post.entity';

@Entity('community_comments')
@Index(['postId', 'createdAt'])
export class CommunityComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id' })
  postId: string;

  @ManyToOne(() => CommunityPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: CommunityPost;

  @Column({ name: 'author_id' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  // Ответ на другой комментарий (одноуровневые треды)
  @Column({ name: 'parent_id', nullable: true })
  parentId: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
