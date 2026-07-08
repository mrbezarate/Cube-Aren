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
    const prevLiked = liked;
    setLiked((prev) => !prev);
    setLikesCount((prev) => (prevLiked ? prev - 1 : prev + 1));

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

  // Сокращенный контент для карточки
  const contentSnippet = post.content.length > 180 
    ? post.content.slice(0, 180) + '...' 
    : post.content;

  return (
    <Link href={`/community/${post.id}`} className="block group">
      <article className="rounded-xl border border-white/[0.06] bg-bg-secondary p-5 transition-colors hover:border-white/[0.12] hover:bg-bg-tertiary">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={post.author?.avatarUrl} alt={authorName} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-semibold text-text-primary truncate">{authorName}</span>
                {post.author?.level && (
                  <span className="rounded bg-white/10 px-1 py-0.5 text-[10px] font-bold text-text-secondary shrink-0">
                    LVL {post.author.level}
                  </span>
                )}
              </div>
              <div className="text-xs text-text-tertiary">{timeAgo(post.createdAt)}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {post.isPinned && (
              <span className="inline-flex items-center gap-1 rounded bg-accent-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase text-accent-warning">
                <Pin className="h-3 w-3 fill-current" />
                PIN
              </span>
            )}
            <span className={clsx('rounded px-2.5 py-0.5 text-[10px] font-semibold uppercase', TAG_STYLES[post.tag])}>
              {TAG_LABELS[post.tag]}
            </span>
            <span className="rounded bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold uppercase text-text-secondary">
              {GAME_SHORT_LABELS[post.game]}
            </span>
          </div>
        </div>

        <h3 className="mt-4 text-base font-bold text-text-primary text-pretty group-hover:text-accent-primary transition-colors">
          {post.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary break-words">
          {contentSnippet}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-4 text-xs text-text-tertiary">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={clsx(
                'flex items-center gap-1.5 transition-colors',
                liked 
                  ? 'text-accent-danger font-bold' 
                  : 'hover:text-accent-danger'
              )}
            >
              <Heart className={clsx('h-4 w-4 transition-transform active:scale-125', liked && 'fill-current')} />
              <span>{likesCount}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>{post.commentsCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{post.viewsCount}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
