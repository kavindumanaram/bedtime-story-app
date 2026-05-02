import { supabase, type ChildStoryMemory, type FeedbackReaction } from "../lib/supabase";

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
  const [{ data: memory }, { data: chars }] = await Promise.all([
    supabase.from("child_story_memory").select("*").eq("child_id", childId).single(),
    supabase
      .from("recurring_characters")
      .select("name, description")
      .eq("child_id", childId)
      .order("times_appeared", { ascending: false })
      .limit(3),
  ]);

  if (!memory || !memory.last_story_id) return null;

  const characterLines = (chars ?? []).map((c) =>
    c.description ? `${c.name} (${c.description})` : c.name,
  );

  // Fetch template_id from the last story so we know the category
  const { data: lastStory } = await supabase
    .from("stories")
    .select("template_id")
    .eq("id", memory.last_story_id)
    .single();

  return {
    lastTitle: memory.last_story_title ?? "",
    lastSummary: memory.last_story_summary ?? "",
    lastEnding: memory.last_story_ending ?? "",
    favoriteThemes: (memory.favorite_themes ?? []).slice(0, 3),
    recurringCharacters: characterLines,
    lastTemplateId: lastStory?.template_id ?? null,
    lastCategory: null,
  };
}

// ── Update memory after a story is read ──────────────────────

export async function updateMemoryAfterRead(
  childId: string,
  parentId: string,
  storyId: string,
  summary: string,
  lastParagraph: string,
): Promise<void> {
  // Truncate ending to ~1 sentence (first sentence of last paragraph)
  const ending = lastParagraph.split(/[.!?]/)[0].trim().slice(0, 200);

  const mem: Partial<ChildStoryMemory> & { child_id: string; parent_id: string } = {
    child_id: childId,
    parent_id: parentId,
    last_story_id: storyId,
    last_story_summary: summary.slice(0, 280),
    last_story_ending: ending,
    updated_at: new Date().toISOString(),
  };

  // Fetch current title for memory
  const { data: story } = await supabase
    .from("stories")
    .select("title")
    .eq("id", storyId)
    .single();
  if (story) mem.last_story_title = story.title;

  await supabase
    .from("child_story_memory")
    .upsert(mem, { onConflict: "child_id" });
}

// ── Feedback ──────────────────────────────────────────────────

const POSITIVE_REACTIONS: FeedbackReaction[] = ["loved", "more_animals", "more_adventure"];
const NEGATIVE_REACTIONS: FeedbackReaction[] = ["too_scary"];

export async function saveFeedback(
  storyId: string,
  childId: string,
  parentId: string,
  reaction: FeedbackReaction,
  theme: string,
): Promise<void> {
  // Upsert feedback (ignore duplicate taps)
  await supabase
    .from("story_feedback")
    .upsert({ story_id: storyId, child_id: childId, parent_id: parentId, reaction },
      { onConflict: "story_id,child_id" });

  // Update child_story_memory themes
  const { data: mem } = await supabase
    .from("child_story_memory")
    .select("favorite_themes, disliked_themes")
    .eq("child_id", childId)
    .single();

  const favorite: string[] = mem?.favorite_themes ?? [];
  const disliked: string[] = mem?.disliked_themes ?? [];

  if (POSITIVE_REACTIONS.includes(reaction) && !favorite.includes(theme)) {
    const updated = [...favorite, theme].slice(-5); // keep last 5
    await supabase
      .from("child_story_memory")
      .upsert({ child_id: childId, parent_id: parentId, favorite_themes: updated },
        { onConflict: "child_id" });
  } else if (NEGATIVE_REACTIONS.includes(reaction) && !disliked.includes(theme)) {
    const updated = [...disliked, theme].slice(-10);
    await supabase
      .from("child_story_memory")
      .upsert({ child_id: childId, parent_id: parentId, disliked_themes: updated },
        { onConflict: "child_id" });
  }
}

// ── Recurring characters ──────────────────────────────────────

export async function upsertCharacter(
  childId: string,
  parentId: string,
  name: string,
  description?: string,
): Promise<void> {
  const normalised = name.trim();
  const { data: existing } = await supabase
    .from("recurring_characters")
    .select("id, times_appeared")
    .eq("child_id", childId)
    .ilike("name", normalised)
    .single();

  if (existing) {
    await supabase
      .from("recurring_characters")
      .update({ times_appeared: existing.times_appeared + 1 })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("recurring_characters")
      .insert({ child_id: childId, parent_id: parentId, name: normalised, description });
  }
}

// ── Fetch helpers used by UI ──────────────────────────────────

export async function getChildStreak(childId: string) {
  const { data } = await supabase
    .from("child_streaks")
    .select("current_streak, longest_streak, last_read_date")
    .eq("child_id", childId)
    .single();
  return data ?? { current_streak: 0, longest_streak: 0, last_read_date: null };
}

export async function getTopCharacters(childId: string, limit = 2) {
  const { data } = await supabase
    .from("recurring_characters")
    .select("name, description, times_appeared")
    .eq("child_id", childId)
    .order("times_appeared", { ascending: false })
    .limit(limit);
  return data ?? [];
}
