-- Daily Story System: plan tiers, nightly assignments, usage quotas, streaks

-- Add plan tier to parent profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

-- Add template metadata to stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS is_template  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS template_id  TEXT;

-- One Tonight's Story assignment per child per calendar day
CREATE TABLE IF NOT EXISTS daily_stories (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID    NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id    UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_date   DATE    NOT NULL DEFAULT CURRENT_DATE,
  template_id  TEXT    NOT NULL,
  story_id     UUID    REFERENCES stories(id) ON DELETE SET NULL,
  is_generated BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (child_id, story_date)
);

-- Per-user AI generation quota (resets monthly)
CREATE TABLE IF NOT EXISTS usage_quotas (
  user_id            UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  plan               TEXT NOT NULL DEFAULT 'free',
  monthly_ai_count   INT  NOT NULL DEFAULT 0,
  monthly_ai_limit   INT  NOT NULL DEFAULT 0,   -- 0 = templates only (free)
  daily_regen_limit  INT  NOT NULL DEFAULT 0,
  quota_reset_date   DATE NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month')::DATE
);

-- Per-child reading streak
CREATE TABLE IF NOT EXISTS child_streaks (
  child_id        UUID PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  parent_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak  INT  NOT NULL DEFAULT 0,
  longest_streak  INT  NOT NULL DEFAULT 0,
  last_read_date  DATE
);

-- Row-level security
ALTER TABLE daily_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_quotas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own data" ON daily_stories USING (parent_id = auth.uid());
CREATE POLICY "own data" ON usage_quotas  USING (user_id   = auth.uid());
CREATE POLICY "own data" ON child_streaks USING (parent_id = auth.uid());

-- Auto-create quota row (free tier) when a profile row is created
CREATE OR REPLACE FUNCTION handle_new_profile_quota()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO usage_quotas (user_id, plan, monthly_ai_limit, daily_regen_limit)
  VALUES (NEW.id, 'free', 0, 0)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_quota
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile_quota();
