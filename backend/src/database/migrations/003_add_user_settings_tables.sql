-- Migration: Add user settings tables
-- Created: 2026-07-02

-- Privacy Settings
CREATE TABLE IF NOT EXISTS privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    "profileVisibility" VARCHAR(20) DEFAULT 'public' CHECK ("profileVisibility" IN ('public', 'friends', 'private')),
    "canMessageMe" VARCHAR(20) DEFAULT 'everyone' CHECK ("canMessageMe" IN ('everyone', 'friends', 'nobody')),
    "canSeeStats" VARCHAR(20) DEFAULT 'everyone' CHECK ("canSeeStats" IN ('everyone', 'friends', 'nobody')),
    "canSeeFriends" VARCHAR(20) DEFAULT 'everyone' CHECK ("canSeeFriends" IN ('everyone', 'friends', 'nobody')),
    "canInviteToTeam" VARCHAR(20) DEFAULT 'everyone' CHECK ("canInviteToTeam" IN ('everyone', 'friends', 'nobody')),
    "showOnlineStatus" VARCHAR(20) DEFAULT 'everyone' CHECK ("showOnlineStatus" IN ('everyone', 'friends', 'nobody')),
    "showProfileVisitors" BOOLEAN DEFAULT TRUE,
    "showTournamentHistory" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Settings
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    "emailNewTournament" BOOLEAN DEFAULT TRUE,
    "emailTournamentStart" BOOLEAN DEFAULT TRUE,
    "emailBetResult" BOOLEAN DEFAULT TRUE,
    "emailTeamRequest" BOOLEAN DEFAULT TRUE,
    "emailTeamInvite" BOOLEAN DEFAULT TRUE,
    "emailNewMessage" BOOLEAN DEFAULT FALSE,
    "emailWeeklyDigest" BOOLEAN DEFAULT TRUE,
    "emailMarketing" BOOLEAN DEFAULT FALSE,
    "pushNewMessage" BOOLEAN DEFAULT TRUE,
    "pushNewFollower" BOOLEAN DEFAULT TRUE,
    "pushTournamentStart" BOOLEAN DEFAULT TRUE,
    "pushBetResult" BOOLEAN DEFAULT TRUE,
    "pushTeamRequest" BOOLEAN DEFAULT TRUE,
    "inAppShowBadges" BOOLEAN DEFAULT TRUE,
    "inAppShowRequests" BOOLEAN DEFAULT TRUE,
    "inAppShowNotifications" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'ru' CHECK (language IN ('ru', 'en', 'ua')),
    theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
    "colorAccent" VARCHAR(20) DEFAULT 'purple' CHECK ("colorAccent" IN ('purple', 'blue', 'green', 'gold')),
    timezone VARCHAR(50),
    "dateFormat" VARCHAR(20) DEFAULT 'DD.MM.YYYY',
    "timeFormat" VARCHAR(10) DEFAULT '24h' CHECK ("timeFormat" IN ('24h', '12h')),
    "hideUninterestingTournaments" BOOLEAN DEFAULT FALSE,
    "showOnlyRegionalTournaments" BOOLEAN DEFAULT FALSE,
    "minPrizePoolFilter" INTEGER DEFAULT 0,
    "enableAnimations" BOOLEAN DEFAULT TRUE,
    "autoplayVideos" BOOLEAN DEFAULT TRUE,
    "preloadImages" BOOLEAN DEFAULT TRUE,
    "imageQuality" VARCHAR(20) DEFAULT 'high' CHECK ("imageQuality" IN ('high', 'medium', 'low')),
    "showAdultContent" BOOLEAN DEFAULT FALSE,
    "filterProfanity" BOOLEAN DEFAULT FALSE,
    "hideSpoilers" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blocked Users
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "blockedUserId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    "blockedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "blockedUserId"),
    CHECK ("userId" != "blockedUserId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON privacy_settings("userId");
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings("userId");
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences("userId");
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users("userId");
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON blocked_users("blockedUserId");

-- Create triggers for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_privacy_settings_updated_at BEFORE UPDATE ON privacy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default settings for existing users
INSERT INTO privacy_settings ("userId")
SELECT id FROM users
WHERE id NOT IN (SELECT "userId" FROM privacy_settings);

INSERT INTO notification_settings ("userId")
SELECT id FROM users
WHERE id NOT IN (SELECT "userId" FROM notification_settings);

INSERT INTO user_preferences ("userId")
SELECT id FROM users
WHERE id NOT IN (SELECT "userId" FROM user_preferences);
