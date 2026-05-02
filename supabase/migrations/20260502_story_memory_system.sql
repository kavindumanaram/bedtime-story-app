-- Story Memory System: series, per-child memory, recurring characters, feedback
-- Run AFTER 20260502_daily_story_system.sql

-- Story series: groups multiple episodes under one title per child
CREATE TABLE IF NOT EXISTS story_series (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Add episode columns to stories (run after story_series exists)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS series_id    UUID REFERENCES story_series(id) ON DELETE SET NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS episode_num  INT;

-- Per-child condensed memory for AI continuation (never stores full text)
CREATE TABLE IF NOT EXISTS child_story_memory (
  child_id           UUID PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  parent_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_story_id      UUID REFERENCES stories(id) ON DELETE SET NULL,
  last_story_title   TEXT,
  last_story_summary TEXT,   -- max 2 sentences
  last_story_ending  TEXT,   -- max 1 sentence (last paragraph, truncated)
  favorite_themes    TEXT[]  NOT NULL DEFAULT '{}',
  disliked_themes    TEXT[]  NOT NULL DEFAULT '{}',
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- Named recurring characters per child
CREATE TABLE IF NOT EXISTS recurring_characters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id       UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  times_appeared INT  NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- One feedback reaction per story per child
CREATE TABLE IF NOT EXISTS story_feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  child_id   UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction   TEXT NOT NULL,  -- 'loved'|'too_scary'|'too_long'|'more_animals'|'more_adventure'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (story_id, child_id)
);

-- Row-level security
ALTER TABLE story_series          ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_story_memory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_characters  ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_feedback        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own data" ON story_series         USING (parent_id = auth.uid());
CREATE POLICY "own data" ON child_story_memory   USING (parent_id = auth.uid());
CREATE POLICY "own data" ON recurring_characters USING (parent_id = auth.uid());
CREATE POLICY "own data" ON story_feedback       USING (parent_id = auth.uid());
