import type { FeedbackReaction } from "@bedtime/shared";
import { apiFetch } from "../lib/api";

// ── Memory context (small, for AI use only) ───────────────────

export type MemoryContext = {
  lastTitle: string;
  lastSummary: string;
  lastEnding: string;
  favoriteThemes: string[];
  recurringCharacters: string[];
  lastTemplateId: string | null;
  lastCategory: string | null;
};

export async function getMemoryContext(childId: string): Promise<MemoryContext | null> {
  const data = await apiFetch<{
    last_story_title: string | null;
    last_story_summary: string | null;
    last_story_ending: string | null;
    favorite_themes: string[];
    disliked_themes: string[];
    characters: Array<{ name: string; description: string | null }>;
  }>(`/api/memory/${childId}`);

  if (!data.last_story_title) return null;

  return {
    lastTitle: data.last_story_title ?? "",
    lastSummary: data.last_story_summary ?? "",
    lastEnding: data.last_story_ending ?? "",
    favoriteThemes: data.favorite_themes.slice(0, 3),
    recurringCharacters: data.characters.map((c) =>
      c.description ? `${c.name} (${c.description})` : c.name,
    ),
    lastTemplateId: null,
    lastCategory: null,
  };
}

// ── Update memory after a story is read ──────────────────────

export async function updateMemoryAfterRead(
  childId: string,
  _parentId: string,
  storyId: string,
  summary: string,
  lastParagraph: string,
): Promise<void> {
  const ending = lastParagraph.split(/[.!?]/)[0].trim().slice(0, 200);
  void apiFetch(`/api/memory/${childId}`, {
    method: "POST",
    body: JSON.stringify({ storyId, summary: summary.slice(0, 280), ending }),
  }).catch(() => {});
}

// ── Feedback ──────────────────────────────────────────────────

export async function saveFeedback(
  storyId: string,
  childId: string,
  _parentId: string,
  reaction: FeedbackReaction,
  theme: string,
): Promise<void> {
  void apiFetch("/api/feedback", {
    method: "POST",
    body: JSON.stringify({ storyId, childId, reaction, theme }),
  }).catch(() => {});
}

// ── Recurring characters ──────────────────────────────────────

export async function upsertCharacter(
  childId: string,
  _parentId: string,
  name: string,
  description?: string,
): Promise<void> {
  void apiFetch("/api/characters", {
    method: "POST",
    body: JSON.stringify({ childId, name: name.trim(), description }),
  }).catch(() => {});
}

// ── Fetch helpers used by UI ──────────────────────────────────

export async function getChildStreak(childId: string) {
  try {
    const data = await apiFetch<{
      current_streak: number; longest_streak: number; last_read_date: string | null;
    }>(`/api/streaks/${childId}`);
    return data ?? { current_streak: 0, longest_streak: 0, last_read_date: null };
  } catch {
    return { current_streak: 0, longest_streak: 0, last_read_date: null };
  }
}

export async function getTopCharacters(childId: string, limit = 2) {
  try {
    return await apiFetch<Array<{ name: string; description: string | null }>>(
      `/api/characters/${childId}?limit=${limit}`,
    );
  } catch {
    return [];
  }
}

// ── Personality trait tracking ────────────────────────────────

export async function persistChoiceSelection(
  childId: string,
  choiceLabel: string,
  trait: "brave" | "kind" | "curious" | "creative" | "helpful",
): Promise<void> {
  void apiFetch(`/api/memory/${childId}/trait`, {
    method: "POST",
    body: JSON.stringify({ trait, choiceLabel }),
  }).catch(() => {});
}

// ── Dashboard statistics ──────────────────────────────────────

export type DashboardStats = {
  totalStoriesRead: number;
  minutesListenedThisWeek: number;
  storiesThisMonth: number;
  topTheme: string | null;
  weekOverWeekStoriesDelta: number;
};

export async function getDashboardStats(childId: string, _parentId: string): Promise<DashboardStats> {
  const data = await apiFetch<{
    totalStories: number;
    weeklyStories: number;
    monthlyStories: number;
    favoriteTheme: string | null;
  }>(`/api/stats/${childId}`);

  return {
    totalStoriesRead: data.totalStories,
    minutesListenedThisWeek: data.weeklyStories * 5,
    storiesThisMonth: data.monthlyStories,
    topTheme: data.favoriteTheme,
    weekOverWeekStoriesDelta: 0,
  };
}
