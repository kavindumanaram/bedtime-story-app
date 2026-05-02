import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Core types ────────────────────────────────────────────────

export type Profile = {
  id: string;
  display_name: string | null;
  locale: string;
  gdpr_consent_at: string | null;
  plan: "free" | "basic" | "premium";
  created_at: string;
};

export type ChildPreferences = {
  interests: string[];
  tone: "calm" | "adventurous" | "educational";
  length: "short" | "medium" | "long";
};

export type Child = {
  id: string;
  parent_id: string;
  name: string;
  age: number;
  avatar_color: string;
  preferences: ChildPreferences | null;
  created_at: string;
};

export type DbStory = {
  id: string;
  parent_id: string;
  child_id: string | null;
  title: string;
  summary: string | null;
  paragraphs: string[];
  theme: string | null;
  cover_url: string | null;
  image_urls: string[] | null;
  is_template: boolean;
  template_id: string | null;
  series_id: string | null;
  episode_num: number | null;
  created_at: string;
};

export type PlaySession = {
  id: string;
  story_id: string;
  child_id: string;
  parent_id: string;
  pages_completed: number;
  fully_completed: boolean;
  played_at: string;
};

// ── Daily story system ────────────────────────────────────────

export type DailyStory = {
  id: string;
  child_id: string;
  parent_id: string;
  story_date: string;
  template_id: string;
  story_id: string | null;
  is_generated: boolean;
  created_at: string;
};

export type UsageQuota = {
  user_id: string;
  plan: "free" | "basic" | "premium";
  monthly_ai_count: number;
  monthly_ai_limit: number;
  daily_regen_limit: number;
  quota_reset_date: string;
};

export type ChildStreak = {
  child_id: string;
  parent_id: string;
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null;
};

// ── Story memory system ───────────────────────────────────────

export type StorySeries = {
  id: string;
  child_id: string;
  parent_id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type ChildStoryMemory = {
  child_id: string;
  parent_id: string;
  last_story_id: string | null;
  last_story_title: string | null;
  last_story_summary: string | null;
  last_story_ending: string | null;
  favorite_themes: string[];
  disliked_themes: string[];
  updated_at: string;
};

export type RecurringCharacter = {
  id: string;
  child_id: string;
  parent_id: string;
  name: string;
  description: string | null;
  times_appeared: number;
  created_at: string;
};

export type FeedbackReaction =
  | "loved"
  | "too_scary"
  | "too_long"
  | "more_animals"
  | "more_adventure";

export type StoryFeedback = {
  id: string;
  story_id: string;
  child_id: string;
  parent_id: string;
  reaction: FeedbackReaction;
  created_at: string;
};
