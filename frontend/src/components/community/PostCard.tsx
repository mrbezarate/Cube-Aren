'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Heart, MessageSquare, Pin } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { useAuthStore } from '@/lib/store/auth.store';
import { CommunityPost } from '@/types';
import { GAME_SHORT_LABELS, TAG_LABELS, TAG_STYLES, timeAgo } from '@/lib/community';
import Avatar from '@/components/ui/Avatar';

interface PostCardProps {
  post: CommunityPost;
}

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [liking, setLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (liking) return;

    setLiking(true);
    // Оптимистичное обновление
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      const result = await api.community.togglePostLike(post.id);
      setLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch (error) {
      // Откат
      setLiked(post.isLiked);
      setLikesCount(post.likesCount);
      toast.error(getErrorMessage(error, 'Не удалось поставить лайк'));
    } finally {
      setLiking(false);
    }
  };

  const authorName = post.author?.displayName || post.author?.username || 'Аноним';

  return (
    <Link href={`/community/${post.id}`} className="block group">
      <article className="rounded-xl border border-white/[0.06] bg-bg-secondary p-5 transition-colors hover:border-white/[0.12] hover:bg-bg-tertiary">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={post.author?.avatarUrl} alt={authorName} size="sm" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{authorName}</div>
              <div className="text-xs text-text-tertiary">{timeAgo(post.createdAt)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {post.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-warning/10 px-2 py-1 text-[10px] font-medium uppercase text-accent-warning">
                <Pin className="h-3 w-3" />
                Закреплено
              </span>
            )}
            <span className={clsx('rounded-full px-2.5 py-1 text-[10px] font-medium uppercase', TAG_STYLES[post.tag])}>
              {TAG_LABELS[post.tag]}
            </span>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium uppercase text-text-secondary">
              {GAME_SHORT_LABELS[post.game]}
            </span>
          </div>
        </div>

        <h3 className="mt-4 text-base font-semibold text-text-primary text-pretty group-hover:text-accent-primary transition-colors">
          {post.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary line-clamp-2">{post.content}</p>

        <div className="mt-4 flex items-center gap-4 text-xs text-text-tertiary">
          <button
            type="button"
            onClick={handleLike}
            aria-pressed={liked}
            aria-label={liked ? 'Убрать лайк' : 'Поставить лайк'}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-white/[0.06]',
              liked ? 'text-accent-danger' : 'hover:text-text-primary',
            )}
          >
            <Heart className={clsx('h-4 w-4', liked && 'fill-current')} />
            {likesCount}
          </button>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            {post.commentsCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {post.viewsCount}
          </span>
        </div>
      </article>
    </Link>
  );
}
