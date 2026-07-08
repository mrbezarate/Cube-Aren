'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Eye, Heart, MessageSquare, Pin, Reply, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { useAuthStore } from '@/lib/store/auth.store';
import { CommunityPost, CommunityComment } from '@/types';
import { GAME_LABELS, GAME_SHORT_LABELS, TAG_LABELS, TAG_STYLES, timeAgo } from '@/lib/community';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const postId = params.id as string;

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Like states for post
  const [postLiked, setPostLiked] = useState(false);
  const [postLikesCount, setPostLikesCount] = useState(0);
  const [postLiking, setPostLiking] = useState(false);

  // Comments form states
  const [newCommentText, setNewCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // Fetch post details & comments
  const loadData = useCallback(async () => {
    try {
      const [fetchedPost, fetchedComments] = await Promise.all([
        api.community.getPost(postId),
        api.community.listComments(postId),
      ]);
      setPost(fetchedPost);
      setPostLiked(!!fetchedPost.isLiked);
      setPostLikesCount(fetchedPost.likesCount);
      setComments(fetchedComments);
    } catch (err) {
      console.error('Failed to load post data', err);
      toast.error(getErrorMessage(err, 'Не удалось загрузить тему'));
      router.push('/community');
    } finally {
      setLoading(false);
    }
  }, [postId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tree structure for comments (1 level nesting)
  const commentTree = useMemo(() => {
    const roots = comments.filter((c) => !c.parentId);
    const children = comments.filter((c) => !!c.parentId);
    
    const childrenMap: Record<string, CommunityComment[]> = {};
    children.forEach((c) => {
      const pId = c.parentId!;
      if (!childrenMap[pId]) childrenMap[pId] = [];
      childrenMap[pId].push(c);
    });

    return { roots, childrenMap };
  }, [comments]);

  // Likes management
  const handlePostLike = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (postLiking || !post) return;

    setPostLiking(true);
    const prevLiked = postLiked;
    setPostLiked((prev) => !prev);
    setPostLikesCount((prev) => (prevLiked ? prev - 1 : prev + 1));

    try {
      const res = await api.community.togglePostLike(post.id);
      setPostLiked(res.liked);
      setPostLikesCount(res.likesCount);
    } catch (err) {
      setPostLiked(prevLiked);
      setPostLikesCount(post.likesCount);
      toast.error(getErrorMessage(err, 'Не удалось лайкнуть пост'));
    } finally {
      setPostLiking(false);
    }
  };

  const handleCommentLike = async (commentId: string, currentLiked: boolean) => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Оптимистичное обновление
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: !currentLiked,
            likesCount: currentLiked ? c.likesCount - 1 : c.likesCount + 1,
          };
        }
        return c;
      })
    );

    try {
      const res = await api.community.toggleCommentLike(commentId);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return { ...c, isLiked: res.liked, likesCount: res.likesCount };
          }
          return c;
        })
      );
    } catch (err) {
      // Откат
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              isLiked: currentLiked,
              likesCount: currentLiked ? c.likesCount + 1 : c.likesCount - 1,
            };
          }
          return c;
        })
      );
      toast.error(getErrorMessage(err, 'Не удалось лайкнуть комментарий'));
    }
  };

  // Creation/Deletion logic
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (commenting || !newCommentText.trim() || !post) return;

    setCommenting(true);
    try {
      const newComment = await api.community.createComment(post.id, {
        content: newCommentText.trim(),
      });
      setComments((prev) => [...prev, newComment]);
      setNewCommentText('');
      setPost((prev) => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
      toast.success('Комментарий добавлен');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Не удалось отправить комментарий'));
    } finally {
      setCommenting(false);
    }
  };

  const submitReply = async (parentId: string) => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (replying || !replyText.trim() || !post) return;

    setReplying(true);
    try {
      const newComment = await api.community.createComment(post.id, {
        content: replyText.trim(),
        parentId,
      });
      setComments((prev) => [...prev, newComment]);
      setReplyText('');
      setReplyToId(null);
      setPost((prev) => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
      toast.success('Ответ добавлен');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Не удалось отправить ответ'));
    } finally {
      setReplying(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    if (!confirm('Вы уверены, что хотите удалить этот пост?')) return;

    try {
      await api.community.deletePost(post.id);
      toast.success('Пост успешно удален');
      router.push('/community');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Не удалось удалить пост'));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Удалить комментарий?')) return;

    try {
      await api.community.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((prev) => prev ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) } : null);
      toast.success('Комментарий удален');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Не удалось удалить комментарий'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-3 text-text-secondary">
        <svg className="animate-spin h-8 w-8 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm">Загрузка темы...</span>
      </div>
    );
  }

  if (!post) return null;

  const authorName = post.author?.displayName || post.author?.username || 'Аноним';
  const isPostOwner = user && post.author && user.id === post.author.id;
  const isAdmin = user && user.role === 'admin';

  return (
    <div className="min-h-screen bg-bg-primary py-8 text-text-primary">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        
        {/* Back Link */}
        <div>
          <Link href="/community" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Назад в Сообщество
          </Link>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main Area: Post + Comments */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Post Card */}
            <article className="rounded-xl border border-white/[0.06] bg-bg-secondary p-6 space-y-6">
              
              {/* Meta information */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <Avatar src={post.author?.avatarUrl} alt={authorName} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{authorName}</span>
                      {post.author?.level && (
                        <span className="rounded bg-white/10 px-1 py-0.5 text-[9px] font-bold text-text-secondary shrink-0">
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

              {/* Title & Body */}
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-white leading-tight break-words">{post.title}</h1>
                <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap break-words">{post.content}</p>
              </div>

              {/* Operations Footer */}
              <div className="flex items-center justify-between border-t border-white/[0.04] pt-5 text-xs text-text-tertiary">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePostLike}
                    className={clsx(
                      'flex items-center gap-2 transition-colors py-1 px-3.5 rounded-full border border-border-default hover:bg-white/[0.04]',
                      postLiked 
                        ? 'text-accent-danger border-accent-danger/30 bg-accent-danger/5 font-bold' 
                        : 'hover:text-accent-danger'
                    )}
                  >
                    <Heart className={clsx('h-4 w-4', postLiked && 'fill-current')} />
                    <span>{postLiked ? 'Нравится' : 'Лайк'} • {postLikesCount}</span>
                  </button>
                  <div className="flex items-center gap-1.5 py-1 px-3 border border-transparent">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.commentsCount} ответов</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{post.viewsCount} просмотров</span>
                  </div>
                  {(isPostOwner || isAdmin) && (
                    <button
                      onClick={handleDeletePost}
                      className="text-text-muted hover:text-accent-danger transition-colors p-1.5 rounded hover:bg-white/[0.04]"
                      title="Удалить пост"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

            </article>

            {/* Comments Thread Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold font-orbitron uppercase tracking-wider text-white">Обсуждение</h2>

              {/* Add root comment */}
              {isAuthenticated ? (
                <form onSubmit={submitComment} className="flex gap-3 items-start bg-bg-secondary p-4 rounded-xl border border-white/[0.04]">
                  <Avatar src={user?.avatarUrl} alt={user?.displayName || user?.username || 'Я'} size="sm" />
                  <div className="flex-1 space-y-3">
                    <textarea
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      maxLength={3000}
                      rows={3}
                      placeholder="Написать комментарий..."
                      className="w-full resize-none rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <Button type="submit" size="sm" loading={commenting} disabled={!newCommentText.trim()}>
                        Отправить
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <Card className="p-4 border border-dashed border-white/[0.06] bg-bg-secondary/20 text-center">
                  <span className="text-xs text-text-secondary">
                    Пожалуйста,{' '}
                    <Link href="/auth/login" className="text-accent-primary font-bold hover:underline">
                      войдите
                    </Link>
                    , чтобы оставлять комментарии.
                  </span>
                </Card>
              )}

              {/* Comments list tree */}
              <div className="space-y-4 mt-2">
                {commentTree.roots.map((comment) => {
                  const commentAuthor = comment.author?.displayName || comment.author?.username || 'Аноним';
                  const isCommentOwner = user && comment.author && user.id === comment.author.id;
                  const isCommentLiking = !!comment.isLiked;

                  const isReplyingThis = replyToId === comment.id;
                  const rootReplies = commentTree.childrenMap[comment.id] || [];

                  return (
                    <div key={comment.id} className="space-y-2.5">
                      
                      {/* Root Comment Card */}
                      <div className="bg-bg-secondary/40 border border-white/[0.04] p-4 rounded-xl flex gap-3 items-start transition-colors hover:bg-bg-secondary/60">
                        <Avatar src={comment.author?.avatarUrl} alt={commentAuthor} size="sm" />
                        <div className="flex-1 space-y-2 min-w-0">
                          {/* Top row */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-semibold text-text-primary truncate">{commentAuthor}</span>
                              {comment.author?.level && (
                                <span className="rounded bg-white/10 px-1 py-0.5 text-[9px] font-bold text-text-secondary shrink-0">
                                  LVL {comment.author.level}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-text-tertiary shrink-0">{timeAgo(comment.createdAt)}</span>
                          </div>
                          
                          {/* Content */}
                          <p className="text-sm text-text-secondary whitespace-pre-wrap break-words leading-relaxed">
                            {comment.content}
                          </p>

                          {/* Footer options */}
                          <div className="flex items-center justify-between border-t border-white/[0.02] pt-2 mt-2 text-[11px] text-text-tertiary">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleCommentLike(comment.id, isCommentLiking)}
                                className={clsx(
                                  'flex items-center gap-1 transition-colors hover:text-accent-danger',
                                  isCommentLiking && 'text-accent-danger font-bold'
                                )}
                              >
                                <Heart className={clsx('h-3.5 w-3.5', isCommentLiking && 'fill-current')} />
                                <span>{comment.likesCount}</span>
                              </button>
                              
                              {isAuthenticated && !post.isLocked && (
                                <button
                                  onClick={() => {
                                    setReplyToId(isReplyingThis ? null : comment.id);
                                    setReplyText('');
                                  }}
                                  className={clsx(
                                    'flex items-center gap-1 transition-colors hover:text-white',
                                    isReplyingThis && 'text-accent-purple font-bold'
                                  )}
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                  <span>Ответить</span>
                                </button>
                              )}
                            </div>

                            {(isCommentOwner || isAdmin) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-text-muted hover:text-accent-danger transition-colors p-1"
                                title="Удалить комментарий"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reply form (Root Comment Level) */}
                      {isReplyingThis && (
                        <div className="ml-10 flex gap-3 items-start bg-bg-secondary/20 p-3 rounded-lg border border-white/[0.02]">
                          <Avatar src={user?.avatarUrl} alt="Я" size="xs" />
                          <div className="flex-1 space-y-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              maxLength={3000}
                              rows={2}
                              placeholder={`Ответить пользователю ${commentAuthor}...`}
                              className="w-full resize-none rounded-lg border border-border-default bg-bg-primary px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setReplyToId(null)}>
                                Отмена
                              </Button>
                              <Button size="sm" loading={replying} disabled={!replyText.trim()} onClick={() => submitReply(comment.id)}>
                                Ответить
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Nested Replies List (1 Level deep) */}
                      {rootReplies.map((reply) => {
                        const replyAuthor = reply.author?.displayName || reply.author?.username || 'Аноним';
                        const isReplyOwner = user && reply.author && user.id === reply.author.id;
                        const isReplyLiking = !!reply.isLiked;

                        return (
                          <div key={reply.id} className="ml-10 bg-bg-secondary/20 border-l-2 border-white/[0.04] p-3 pl-4 rounded-r-xl flex gap-2.5 items-start">
                            <Avatar src={reply.author?.avatarUrl} alt={replyAuthor} size="xs" className="mt-0.5" />
                            <div className="flex-1 space-y-1.5 min-w-0">
                              {/* Top row */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[11px] font-semibold text-text-primary truncate">{replyAuthor}</span>
                                  {reply.author?.level && (
                                    <span className="rounded bg-white/10 px-1 py-0.5 text-[8px] font-bold text-text-secondary shrink-0">
                                      LVL {reply.author.level}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-text-tertiary shrink-0">{timeAgo(reply.createdAt)}</span>
                              </div>

                              {/* Content */}
                              <p className="text-xs text-text-secondary whitespace-pre-wrap break-words leading-relaxed">
                                {reply.content}
                              </p>

                              {/* Footer details */}
                              <div className="flex items-center justify-between pt-1 border-t border-white/[0.02] text-[10px] text-text-tertiary">
                                <button
                                  onClick={() => handleCommentLike(reply.id, isReplyLiking)}
                                  className={clsx(
                                    'flex items-center gap-1 transition-colors hover:text-accent-danger',
                                    isReplyLiking && 'text-accent-danger font-bold'
                                  )}
                                >
                                  <Heart className={clsx('h-3 w-3', isReplyLiking && 'fill-current')} />
                                  <span>{reply.likesCount}</span>
                                </button>

                                {(isReplyOwner || isAdmin) && (
                                  <button
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="text-text-muted hover:text-accent-danger transition-colors p-1"
                                    title="Удалить ответ"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Sidebar: Author Details & Rules */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Author Profile Card */}
            <Card className="p-5 border border-white/[0.06] bg-bg-secondary text-center space-y-4">
              <div className="px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary border-b border-white/[0.04] pb-2">
                Автор публикации
              </div>
              <div className="flex flex-col items-center gap-2">
                <Avatar src={post.author?.avatarUrl} alt={authorName} size="lg" />
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-sm font-bold text-white">{authorName}</span>
                    {post.author?.level && (
                      <span className="rounded bg-white/10 px-1 py-0.5 text-[9px] font-bold text-text-secondary shrink-0">
                        LVL {post.author.level}
                      </span>
                    )}
                  </div>
                  {post.author?.mainGame && (
                    <div className="text-[10px] text-text-tertiary uppercase font-semibold">
                      Играет в: {GAME_LABELS[post.author.mainGame]}
                    </div>
                  )}
                </div>
              </div>

              {post.author?.gender && (
                <div className="text-xs text-text-secondary mt-1">
                  Пол: {post.author.gender === 'male' ? 'Мужской' : post.author.gender === 'female' ? 'Женский' : 'Другой'}
                </div>
              )}
            </Card>

            {/* Board Information Card */}
            <Card className="p-5 border border-white/[0.06] bg-bg-secondary space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary border-b border-white/[0.04] pb-2">
                О правилах доски
              </div>
              <div className="text-xs text-text-secondary space-y-2 leading-relaxed">
                <p>• Будьте уважительны к остальным игрокам.</p>
                <p>• Не допускается спам, реклама, токсичность и оскорбления.</p>
                <p>• Обсуждения должны соответствовать тематике доски ({GAME_SHORT_LABELS[post.game]}).</p>
              </div>
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
}
