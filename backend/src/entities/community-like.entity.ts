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
import { CommunityComment } from './community-comment.entity';

@Entity('community_post_likes')
@Index(['postId', 'userId'], { unique: true })
export class CommunityPostLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id' })
  postId: string;

  @ManyToOne(() => CommunityPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: CommunityPost;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('community_comment_likes')
@Index(['commentId', 'userId'], { unique: true })
export class CommunityCommentLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'comment_id' })
  commentId: string;

  @ManyToOne(() => CommunityComment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: CommunityComment;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
