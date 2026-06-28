-- Add viewsCount and savesCount to tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;

-- Create saved_tournaments table
CREATE TABLE IF NOT EXISTS saved_tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, tournament_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_tournaments_user ON saved_tournaments(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_tournaments_tournament ON saved_tournaments(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_views ON tournaments(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_tournaments_saves ON tournaments(saves_count DESC);
