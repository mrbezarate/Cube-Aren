import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CommunityPost } from '../../entities/community-post.entity';
import { CommunityComment } from '../../entities/community-comment.entity';
import {
  CommunityPostLike,
  CommunityCommentLike,
} from '../../entities/community-like.entity';
import { User } from '../../entities/user.entity';
import { CreatePostDto, CreateCommentDto, ListPostsQueryDto } from './dto/community.dto';

const AUTHOR_FIELDS = [
  'id',
  'username',
  'displayName',
  'avatarUrl',
  'gender',
  'mainGame',
  'level',
] as const;

function publicAuthor(user: User | null | undefined) {
  if (!user) return null;
  const result: Record<string, any> = {};
  for (const field of AUTHOR_FIELDS) {
    result[field] = (user as any)[field];
  }
  return result;
}

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(CommunityPost)
    private postRepo: Repository<CommunityPost>,
    @InjectRepository(CommunityComment)
    private commentRepo: Repository<CommunityComment>,
    @InjectRepository(CommunityPostLike)
    private postLikeRepo: Repository<CommunityPostLike>,
    @InjectRepository(CommunityCommentLike)
    private commentLikeRepo: Repository<CommunityCommentLike>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ---------- Посты ----------

  async listPosts(query: ListPostsQueryDto, userId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const sort = query.sort ?? 'new';

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author');

    if (query.game) {
      qb.andWhere('post.game = :game', { game: query.game });
    }
    if (query.tag) {
      qb.andWhere('post.tag = :tag', { tag: query.tag });
    }
    if (query.search) {
      qb.andWhere('(post.title ILIKE :search OR post.content ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    // Закреплённые всегда сверху
    qb.addOrderBy('post.isPinned', 'DESC');

    if (sort === 'top') {
      qb.addOrderBy('post.likesCount', 'DESC').addOrderBy('post.createdAt', 'DESC');
    } else if (sort === 'hot') {
      // «Горячее»: активность (лайки + комментарии), затем свежесть
      qb.addOrderBy('(post.likesCount + post.commentsCount * 2)', 'DESC').addOrderBy(
        'post.createdAt',
        'DESC',
      );
    } else {
      qb.addOrderBy('post.createdAt', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [posts, total] = await qb.getManyAndCount();

    const likedIds = await this.getLikedPostIds(
      posts.map((p) => p.id),
      userId,
    );

    return {
      data: posts.map((post) => this.serializePost(post, likedIds.has(post.id))),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getBoardsStats() {
    const rows = await this.postRepo
      .createQueryBuilder('post')
      .select('post.game', 'game')
      .addSelect('COUNT(*)', 'posts')
      .addSelect('COALESCE(SUM(post.commentsCount), 0)', 'comments')
      .groupBy('post.game')
      .getRawMany();

    return rows.map((row) => ({
      game: row.game,
      posts: Number(row.posts),
      comments: Number(row.comments),
    }));
  }

  async getPost(id: string, userId?: string, trackView = true) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!post) {
      throw new NotFoundException('Пост не найден');
    }

    if (trackView) {
      await this.postRepo.increment({ id }, 'viewsCount', 1);
      post.viewsCount += 1;
    }

    const likedIds = await this.getLikedPostIds([post.id], userId);
    return this.serializePost(post, likedIds.has(post.id));
  }

  async createPost(userId: string, dto: CreatePostDto) {
    const post = this.postRepo.create({
      authorId: userId,
      game: dto.game,
      title: dto.title.trim(),
      content: dto.content.trim(),
      tag: (dto.tag as any) ?? 'discussion',
    });
    const saved = await this.postRepo.save(post);
    return this.getPost(saved.id, userId, false);
  }

  async deletePost(userId: string, postId: string, userRole?: string) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Пост не найден');
    }
    if (post.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Можно удалять только свои посты');
    }
    await this.postRepo.remove(post);
    return { message: 'Пост удалён' };
  }

  async togglePostLike(userId: string, postId: string) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Пост не найден');
    }

    const existing = await this.postLikeRepo.findOne({
      where: { postId, userId },
    });

    if (existing) {
      await this.postLikeRepo.remove(existing);
      await this.postRepo.decrement({ id: postId }, 'likesCount', 1);
      return { liked: false, likesCount: Math.max(0, post.likesCount - 1) };
    }

    await this.postLikeRepo.save(this.postLikeRepo.create({ postId, userId }));
    await this.postRepo.increment({ id: postId }, 'likesCount', 1);
    return { liked: true, likesCount: post.likesCount + 1 };
  }

  // ---------- Комментарии ----------

  async listComments(postId: string, userId?: string) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Пост не найден');
    }

    const comments = await this.commentRepo.find({
      where: { postId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    const likedIds = await this.getLikedCommentIds(
      comments.map((c) => c.id),
      userId,
    );

    return comments.map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      content: comment.content,
      likesCount: comment.likesCount,
      isLiked: likedIds.has(comment.id),
      author: publicAuthor(comment.author),
      createdAt: comment.createdAt,
    }));
  }

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Пост не найден');
    }
    if (post.isLocked) {
      throw new BadRequestException('Обсуждение закрыто');
    }

    if (dto.parentId) {
      const parent = await this.commentRepo.findOne({
        where: { id: dto.parentId, postId },
      });
      if (!parent) {
        throw new NotFoundException('Родительский комментарий не найден');
      }
    }

    const comment = await this.commentRepo.save(
      this.commentRepo.create({
        postId,
        authorId: userId,
        parentId: dto.parentId ?? null,
        content: dto.content.trim(),
      }),
    );

    await this.postRepo.increment({ id: postId }, 'commentsCount', 1);

    const full = await this.commentRepo.findOne({
      where: { id: comment.id },
      relations: ['author'],
    });

    return {
      id: full.id,
      postId: full.postId,
      parentId: full.parentId,
      content: full.content,
      likesCount: 0,
      isLiked: false,
      author: publicAuthor(full.author),
      createdAt: full.createdAt,
    };
  }

  async deleteComment(userId: string, commentId: string, userRole?: string) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }
    if (comment.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Можно удалять только свои комментарии');
    }
    await this.commentRepo.remove(comment);
    await this.postRepo.decrement({ id: comment.postId }, 'commentsCount', 1);
    return { message: 'Комментарий удалён' };
  }

  async toggleCommentLike(userId: string, commentId: string) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    const existing = await this.commentLikeRepo.findOne({
      where: { commentId, userId },
    });

    if (existing) {
      await this.commentLikeRepo.remove(existing);
      await this.commentRepo.decrement({ id: commentId }, 'likesCount', 1);
      return { liked: false, likesCount: Math.max(0, comment.likesCount - 1) };
    }

    await this.commentLikeRepo.save(
      this.commentLikeRepo.create({ commentId, userId }),
    );
    await this.commentRepo.increment({ id: commentId }, 'likesCount', 1);
    return { liked: true, likesCount: comment.likesCount + 1 };
  }

  // ---------- Вспомогательные ----------

  private async getLikedPostIds(postIds: string[], userId?: string) {
    if (!userId || postIds.length === 0) return new Set<string>();
    const likes = await this.postLikeRepo.find({
      where: { userId, postId: In(postIds) },
    });
    return new Set(likes.map((like) => like.postId));
  }

  private async getLikedCommentIds(commentIds: string[], userId?: string) {
    if (!userId || commentIds.length === 0) return new Set<string>();
    const likes = await this.commentLikeRepo.find({
      where: { userId, commentId: In(commentIds) },
    });
    return new Set(likes.map((like) => like.commentId));
  }

  private serializePost(post: CommunityPost, isLiked: boolean) {
    return {
      id: post.id,
      game: post.game,
      title: post.title,
      content: post.content,
      tag: post.tag,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      viewsCount: post.viewsCount,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      isLiked,
      author: publicAuthor(post.author),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
