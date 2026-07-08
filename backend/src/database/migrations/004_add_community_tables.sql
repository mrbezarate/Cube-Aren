-- Migration: Add community tables (posts, comments, likes)
-- Created: 2026-07-09

-- Community posts (одна доска на игру)
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game VARCHAR(20) NOT NULL CHECK (game IN ('cs2', 'dota2', 'valorant', 'lol', 'pubg', 'apex', 'custom')),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    tag VARCHAR(20) NOT NULL DEFAULT 'discussion' CHECK (tag IN ('discussion', 'lfg', 'guide', 'news', 'question', 'meta')),
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT FALSE,
    "isLocked" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Community comments (с поддержкой ответов через parent_id)
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES community_comments(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Post likes
CREATE TABLE IF NOT EXISTS community_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Comment likes
CREATE TABLE IF NOT EXISTS community_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_game_created ON community_posts(game, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_created ON community_comments(post_id, "createdAt");
CREATE INDEX IF NOT EXISTS idx_community_post_likes_user ON community_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comment_likes_user ON community_comment_likes(user_id);
