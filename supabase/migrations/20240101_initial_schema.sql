-- Initial schema: all tables, RLS policies, and triggers

-- Parent profiles (one per auth.users row)
CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name     TEXT,
  locale           TEXT DEFAULT 'en',
  gdpr_consent_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Children belonging to a parent
CREATE TABLE children (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  age          INT  NOT NULL CHECK (age BETWEEN 1 AND 17),
  avatar_color TEXT DEFAULT '#10b981',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Generated stories
CREATE TABLE stories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  child_id    UUID REFERENCES children(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  summary     TEXT,
  paragraphs  TEXT[] NOT NULL,
  theme       TEXT,
  cover_url   TEXT,
  image_urls  TEXT[],
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Playback sessions (tracks child engagement for dashboard)
CREATE TABLE play_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id         UUID REFERENCES stories(id) ON DELETE CASCADE,
  child_id         UUID REFERENCES children(id) ON DELETE CASCADE,
  parent_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pages_completed  INT DEFAULT 0,
  fully_completed  BOOLEAN DEFAULT false,
  played_at        DATE DEFAULT CURRENT_DATE
);

-- Row-level security: users see only their own rows
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE children      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own data" ON profiles      USING (id = auth.uid());
CREATE POLICY "own data" ON children      USING (parent_id = auth.uid());
CREATE POLICY "own data" ON stories       USING (parent_id = auth.uid());
CREATE POLICY "own data" ON play_sessions USING (parent_id = auth.uid());

-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
