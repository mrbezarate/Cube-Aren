'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { CommunityPost, CommunityTag, GameType } from '@/types';
import { COMMUNITY_GAMES, COMMUNITY_TAGS, GAME_LABELS, TAG_LABELS } from '@/lib/community';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGame?: GameType;
  onCreated: (post: CommunityPost) => void;
}

export default function CreatePostModal({ isOpen, onClose, defaultGame, onCreated }: CreatePostModalProps) {
  const [game, setGame] = useState<GameType>(defaultGame ?? 'cs2');
  const [tag, setTag] = useState<CommunityTag>('discussion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (title.trim().length < 4) {
      toast.error('Заголовок должен быть не короче 4 символов');
      return;
    }
    if (content.trim().length < 4) {
      toast.error('Текст поста должен быть не короче 4 символов');
      return;
    }

    setSubmitting(true);
    try {
      const post = await api.community.createPost({
        game,
        tag,
        title: title.trim(),
        content: content.trim(),
      });
      toast.success('Пост опубликован');
      setTitle('');
      setContent('');
      onCreated(post);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось создать пост'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Новый пост">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-text-tertiary">Доска</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMUNITY_GAMES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGame(g)}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs transition-all border border-border-default',
                  game === g
                    ? 'bg-accent-primary text-white border-accent-primary'
                    : 'bg-white/[0.04] text-text-secondary hover:text-text-primary hover:bg-white/[0.08]',
                )}
              >
                {GAME_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-text-tertiary">Тема</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMUNITY_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs transition-all border border-border-default',
                  tag === t
                    ? 'bg-accent-purple text-white border-accent-purple font-medium'
                    : 'bg-white/[0.04] text-text-secondary hover:text-text-primary hover:bg-white/[0.08]',
                )}
              >
                {TAG_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="post-title" className="mb-1.5 block text-xs font-semibold uppercase text-text-tertiary">
            Заголовок
          </label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="О чём хотите рассказать?"
            className="w-full rounded-lg border border-border-default bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="post-content" className="mb-1.5 block text-xs font-semibold uppercase text-text-tertiary">
            Текст
          </label>
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={10000}
            rows={6}
            placeholder="Поделитесь мыслями, тактикой или найдите тиммейтов..."
            className="w-full resize-y rounded-lg border border-border-default bg-bg-primary px-3 py-2.5 text-sm leading-relaxed text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Опубликовать
          </Button>
        </div>
      </form>
    </Modal>
  );
}
