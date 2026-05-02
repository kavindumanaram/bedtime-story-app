-- Add preferences JSONB column to children table
-- Run this once in the Supabase SQL editor (or via supabase db push)

ALTER TABLE children
  ADD COLUMN IF NOT EXISTS preferences JSONB
  DEFAULT '{"interests":[],"tone":"calm","length":"medium"}';
