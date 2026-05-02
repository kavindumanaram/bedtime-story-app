import { supabase, type Child, type Profile } from "../lib/supabase";
import { generateStory, generateCoverImage } from "./openaiApi";
import { getMemoryContext, updateMemoryAfterRead } from "./storyMemory";
import { pickContinuationTemplate, renderTemplate } from "../lib/templateEngine";
import { storyTemplates } from "../data/storyTemplates";
import { PlanLimitError } from "./dailyStory";

const PLAN_AI_LIMITS: Record<string, number> = {
  free: 0, basic: 30, premium: Infinity,
};

async function getQuotaCount(userId: string): Promise<number> {
  const { data } = await supabase
    .from("usage_quotas")
    .select("monthly_ai_count, monthly_ai_limit, quota_reset_date")
    .eq("user_id", userId)
    .single();
  return data?.monthly_ai_count ?? 0;
}

async function incrementQuota(userId: string): Promise<void> {
  const { data } = await supabase
    .from("usage_quotas")
    .select("monthly_ai_count")
    .eq("user_id", userId)
    .single();
  if (data) {
    await supabase
      .from("usage_quotas")
      .update({ monthly_ai_count: (data.monthly_ai_count ?? 0) + 1 })
      .eq("user_id", userId);
  }
}

// Resolve or create a series for this child (keyed by last story's series_id or creates new)
async function resolveOrCreateSeries(
  childId: string,
  parentId: string,
  lastStoryId: string,
  seriesTitle: string,
): Promise<{ seriesId: string; episodeNum: number }> {
  // Check if last story belongs to an existing series
  const { data: lastStory } = await supabase
    .from("stories")
    .select("series_id, episode_num")
    .eq("id", lastStoryId)
    .single();

  if (lastStory?.series_id) {
    const { data: count } = await supabase
      .from("stories")
      .select("id", { count: "exact" })
      .eq("series_id", lastStory.series_id);
    return {
      seriesId: lastStory.series_id,
      episodeNum: ((count as unknown as { count: number })?.count ?? 1) + 1,
    };
  }

  // Create new series
  const { data: series } = await supabase
    .from("story_series")
    .insert({ child_id: childId, parent_id: parentId, title: seriesTitle })
    .select()
    .single();

  if (!series) throw new Error("Failed to create story series");

  // Tag the original story as episode 1
  await supabase
    .from("stories")
    .update({ series_id: series.id, episode_num: 1 })
    .eq("id", lastStoryId);

  return { seriesId: series.id, episodeNum: 2 };
}

export async function triggerContinuation(
  child: Child,
  profile: Profile,
): Promise<string> {
  const plan = profile.plan ?? "free";
  const memory = await getMemoryContext(child.id);

  if (!memory) throw new Error("No previous story found to continue.");

  const tone = child.preferences?.tone ?? "calm";
  const length = child.preferences?.length ?? "medium";

  // ── Free tier: template continuation (same category, no AI) ──
  if (plan === "free") {
    const prevTemplateId = memory.lastTemplateId ?? "";
    const prevTemplate = storyTemplates.find((t) => t.id === prevTemplateId);
    const nextTemplate = pickContinuationTemplate(child, prevTemplate?.category ?? "adventure", prevTemplateId);
    const rendered = renderTemplate(nextTemplate, { childName: child.name, age: child.age });

    // Series tracking is best-effort — story_series table may not exist yet
    let seriesId: string | null = null;
    let episodeNum = 1;
    try {
      const lastStoryId = await getLastStoryId(child.id);
      const series = await resolveOrCreateSeries(child.id, profile.id, lastStoryId, `${child.name}'s Story Adventures`);
      seriesId = series.seriesId;
      episodeNum = series.episodeNum;
    } catch { /* continue without series tracking */ }

    const { data: story } = await supabase
      .from("stories")
      .insert({
        parent_id: profile.id,
        child_id: child.id,
        title: rendered.title,
        summary: rendered.summary,
        paragraphs: rendered.paragraphs,
        theme: nextTemplate.theme,
        is_template: true,
        template_id: nextTemplate.id,
        ...(seriesId ? { series_id: seriesId, episode_num: episodeNum } : {}),
      })
      .select()
      .single();

    if (!story) throw new Error("Failed to save continuation story");

    updateMemoryAfterRead(
      child.id, profile.id, story.id,
      rendered.summary, rendered.paragraphs[rendered.paragraphs.length - 1],
    ).catch(() => {});
    return story.id;
  }

  // ── Basic / Premium: AI continuation with memory context ──
  const currentCount = await getQuotaCount(profile.id);
  const limit = PLAN_AI_LIMITS[plan] ?? 0;
  if (limit !== Infinity && currentCount >= limit) {
    throw new PlanLimitError(
      `You've used all ${limit} AI stories for this month. Upgrade to Premium for unlimited stories.`,
    );
  }

  // Series tracking is best-effort
  let seriesId: string | null = null;
  let episodeNum = 1;
  try {
    const lastStoryId = await getLastStoryId(child.id);
    const series = await resolveOrCreateSeries(child.id, profile.id, lastStoryId, `${child.name}'s Story Adventures`);
    seriesId = series.seriesId;
    episodeNum = series.episodeNum;
  } catch { /* continue without series tracking */ }

  const storyContent = await generateStory(child.name, child.age, "", {
    tone, length,
    continuation: {
      lastTitle: memory.lastTitle,
      lastSummary: memory.lastSummary,
      lastEnding: memory.lastEnding,
      favoriteThemes: memory.favoriteThemes,
      recurringCharacters: memory.recurringCharacters,
      episodeNum,
    },
  });

  let coverUrl: string | null = null;
  if (plan === "premium") {
    coverUrl = await generateCoverImage(storyContent.title, storyContent.summary);
  }

  const { data: story } = await supabase
    .from("stories")
    .insert({
      parent_id: profile.id,
      child_id: child.id,
      title: storyContent.title,
      summary: storyContent.summary,
      paragraphs: storyContent.text,
      theme: memory.favoriteThemes[0] ?? "adventure",
      cover_url: coverUrl,
      image_urls: coverUrl ? [coverUrl] : null,
      is_template: false,
      ...(seriesId ? { series_id: seriesId, episode_num: episodeNum } : {}),
    })
    .select()
    .single();

  if (!story) throw new Error("Failed to save continuation story");

  // Both are best-effort; don't block navigation
  updateMemoryAfterRead(
    child.id, profile.id, story.id,
    storyContent.summary, storyContent.text[storyContent.text.length - 1] ?? "",
  ).catch(() => {});
  incrementQuota(profile.id).catch(() => {});

  return story.id;
}

async function getLastStoryId(childId: string): Promise<string> {
  const { data } = await supabase
    .from("child_story_memory")
    .select("last_story_id")
    .eq("child_id", childId)
    .single();
  if (!data?.last_story_id) throw new Error("No previous story found");
  return data.last_story_id;
}
