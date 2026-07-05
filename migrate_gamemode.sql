DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='game_mode') THEN
    ALTER TABLE tournaments ADD COLUMN game_mode VARCHAR(20) DEFAULT 'ffa';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='teams_count') THEN
    ALTER TABLE tournaments ADD COLUMN teams_count INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='team_size') THEN
    ALTER TABLE tournaments ADD COLUMN team_size INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_participants' AND column_name='team_slot') THEN
    ALTER TABLE tournament_participants ADD COLUMN team_slot INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_participants' AND column_name='team_label') THEN
    ALTER TABLE tournament_participants ADD COLUMN team_label VARCHAR(100) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_participants' AND column_name='is_team_captain') THEN
    ALTER TABLE tournament_participants ADD COLUMN is_team_captain BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_participants' AND column_name='clan_id') THEN
    ALTER TABLE tournament_participants ADD COLUMN clan_id VARCHAR(255) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bets' AND column_name='predicted_team_slot') THEN
    ALTER TABLE bets ADD COLUMN predicted_team_slot INT NULL;
  END IF;
END $$;
SELECT 'Migration OK' as result;
