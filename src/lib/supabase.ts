import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types matching the DB schema ──────────────────────────────

export type Profile = {
  id: string;
  display_name: string | null;
  locale: string;
  gdpr_consent_at: string | null;
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
