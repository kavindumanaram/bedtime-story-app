import { supabase, type Child, type Profile, type DailyStory } from "../lib/supabase";
import { generateStory, generateCoverImage } from "./openaiApi";
import { pickTonightTemplateWithMemory, renderTemplate } from "../lib/templateEngine";
import { storyTemplates } from "../data/storyTemplates";

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

const PLAN_LIMITS: Record<string, { monthly: number; dailyRegen: number }> = {
  free:    { monthly: 0,  dailyRegen: 0 },
  basic:   { monthly: 30, dailyRegen: 1 },
  premium: { monthly: Infinity, dailyRegen: 3 },
};

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Quota helpers ─────────────────────────────────────────────

async function getOrCreateQuota(userId: string, plan: string) {
  const { data } = await supabase
    .from("usage_quotas")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (data) {
    // Reset count if quota period expired
    if (data.quota_reset_date <= todayISO()) {
      const nextReset = new Date();
      nextReset.setDate(nextReset.getDate() + 30);
      const { data: reset } = await supabase
        .from("usage_quotas")
        .update({ monthly_ai_count: 0, quota_reset_date: nextReset.toISOString().slice(0, 10) })
        .eq("user_id", userId)
        .select()
        .single();
      return reset ?? data;
    }
    return data;
  }

  // Bootstrap row (should exist via trigger but just in case)
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const nextReset = new Date();
  nextReset.setDate(nextReset.getDate() + 30);
  const { data: created } = await supabase
    .from("usage_quotas")
    .insert({
      user_id: userId, plan,
      monthly_ai_count: 0,
      monthly_ai_limit: limits.monthly === Infinity ? 99999 : limits.monthly,
      daily_regen_limit: limits.dailyRegen,
      quota_reset_date: nextReset.toISOString().slice(0, 10),
    })
    .select()
    .single();
  return created;
}

async function incrementQuota(userId: string) {
  await supabase.rpc("increment_ai_count", { p_user_id: userId }).maybeSingle();
  // Fallback if RPC not available: manual increment
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

// ── Tonight's assignment ──────────────────────────────────────

export async function getTonightAssignment(
  child: Child,
  parentId: string,
  dislikedThemes: string[] = [],
): Promise<DailyStory> {
  const today = todayISO();

  // Check for existing row
  const { data: existing } = await supabase
    .from("daily_stories")
    .select("*")
    .eq("child_id", child.id)
    .eq("story_date", today)
    .single();

  if (existing) return existing as DailyStory;

  // Pick template and create row
  const template = pickTonightTemplateWithMemory(child, new Date(), dislikedThemes);
  const { data: created, error } = await supabase
    .from("daily_stories")
    .insert({
      child_id: child.id,
      parent_id: parentId,
      story_date: today,
      template_id: template.id,
      is_generated: false,
    })
    .select()
    .single();

  if (error) {
    // Race condition: another tab created it — fetch and return
    const { data: raced } = await supabase
      .from("daily_stories")
      .select("*")
      .eq("child_id", child.id)
      .eq("story_date", today)
      .single();
    if (raced) return raced as DailyStory;
    throw new Error("Failed to create tonight's story assignment");
  }

  return created as DailyStory;
}

// ── On-demand generation ──────────────────────────────────────

export async function triggerRead(
  assignment: DailyStory,
  child: Child,
  profile: Profile,
): Promise<string> {
  // Cache hit — story already generated today
  if (assignment.is_generated && assignment.story_id) {
    return assignment.story_id;
  }

  const plan = profile.plan ?? "free";
  const tone = child.preferences?.tone ?? "calm";
  const length = child.preferences?.length ?? "medium";

  // ── Free tier: render template, no AI ──
  if (plan === "free") {
    const template = storyTemplates.find((t) => t.id === assignment.template_id)
      ?? storyTemplates[0];
    const rendered = renderTemplate(template, { childName: child.name, age: child.age });

    const { data: story } = await supabase
      .from("stories")
      .insert({
        parent_id: profile.id,
        child_id: child.id,
        title: rendered.title,
        summary: rendered.summary,
        paragraphs: rendered.paragraphs,
        theme: template.theme,
        is_template: true,
        template_id: template.id,
      })
      .select()
      .single();

    if (!story) throw new Error("Failed to save template story");

    await supabase
      .from("daily_stories")
      .update({ story_id: story.id, is_generated: true })
      .eq("id", assignment.id);

    return story.id;
  }

  // ── Basic / Premium: quota check first ──
  const quota = await getOrCreateQuota(profile.id, plan);
  const limit = PLAN_LIMITS[plan]?.monthly ?? 0;

  if (limit !== Infinity && (quota?.monthly_ai_count ?? 0) >= limit) {
    throw new PlanLimitError(
      `You've used all ${limit} AI stories for this month. Upgrade to Premium for unlimited stories.`,
    );
  }

  // Generate AI story
  const storyContent = await generateStory(child.name, child.age,
    storyTemplates.find((t) => t.id === assignment.template_id)?.theme ?? "adventure",
    { tone, length },
  );

  // Generate cover image for Premium only
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
      theme: storyTemplates.find((t) => t.id === assignment.template_id)?.theme ?? "adventure",
      cover_url: coverUrl,
      image_urls: coverUrl ? [coverUrl] : null,
      is_template: false,
    })
    .select()
    .single();

  if (!story) throw new Error("Failed to save AI story");

  await Promise.all([
    supabase
      .from("daily_stories")
      .update({ story_id: story.id, is_generated: true })
      .eq("id", assignment.id),
    incrementQuota(profile.id),
  ]);

  return story.id;
}

// ── Streak ────────────────────────────────────────────────────

export async function updateStreak(childId: string, parentId: string): Promise<void> {
  const today = todayISO();

  const { data: existing } = await supabase
    .from("child_streaks")
    .select("*")
    .eq("child_id", childId)
    .single();

  if (existing) {
    if (existing.last_read_date === today) return; // already counted today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().slice(0, 10);

    const newStreak = existing.last_read_date === yesterdayISO
      ? existing.current_streak + 1
      : 1;
    const longest = Math.max(newStreak, existing.longest_streak);

    await supabase
      .from("child_streaks")
      .update({ current_streak: newStreak, longest_streak: longest, last_read_date: today })
      .eq("child_id", childId);
  } else {
    await supabase
      .from("child_streaks")
      .insert({ child_id: childId, parent_id: parentId, current_streak: 1, longest_streak: 1, last_read_date: today });
  }
}
