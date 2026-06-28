-- Добавление типа турнира (solo/team)
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS "tournamentType" VARCHAR(10) DEFAULT 'solo';

-- Создание enum типа если его нет
DO $$ BEGIN
  CREATE TYPE tournament_type_enum AS ENUM ('solo', 'team');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Изменение типа колонки на enum
ALTER TABLE tournaments 
ALTER COLUMN "tournamentType" TYPE tournament_type_enum 
USING "tournamentType"::tournament_type_enum;
