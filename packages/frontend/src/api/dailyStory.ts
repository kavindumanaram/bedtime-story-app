import type { Child, Profile, DailyStory } from "@bedtime/shared";
import { generateStory, generateCoverImage } from "./openaiApi";
import { pickTonightTemplateWithMemory, renderTemplate } from "../lib/templateEngine";
import { storyTemplates } from "../data/storyTemplates";
import { apiFetch } from "../lib/api";

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

// ── Tonight's assignment ──────────────────────────────────────

export async function getTonightAssignment(
  child: Child,
  _parentId: string,
  dislikedThemes: string[] = [],
): Promise<DailyStory> {
  const today = todayISO();

  try {
    const existing = await apiFetch<DailyStory | null>(
      `/api/daily-story?childId=${child.id}&date=${today}`,
    );
    if (existing) return existing;
  } catch { /* fall through to create */ }

  const template = pickTonightTemplateWithMemory(child, new Date(), dislikedThemes);
  return apiFetch<DailyStory>("/api/daily-story", {
    method: "POST",
    body: JSON.stringify({ childId: child.id, templateId: template.id, date: today }),
  });
}

// ── On-demand generation ──────────────────────────────────────

export async function triggerRead(
  assignment: DailyStory,
  child: Child,
  profile: Profile,
): Promise<string> {
  if (assignment.is_generated && assignment.story_id) {
    return assignment.story_id;
  }

  const plan = profile.plan ?? "free";
  const tone = child.preferences?.tone ?? "calm";
  const length = child.preferences?.length ?? "medium";

  // ── Free tier: render template, no AI ──
  if (plan === "free") {
    const template = storyTemplates.find((t) => t.id === assignment.template_id) ?? storyTemplates[0];
    const rendered = renderTemplate(template, { childName: child.name, age: child.age });

    const story = await apiFetch<{ id: string }>("/api/stories", {
      method: "POST",
      body: JSON.stringify({
        parent_id: profile.id,
        child_id: child.id,
        title: rendered.title,
        summary: rendered.summary,
        paragraphs: rendered.paragraphs,
        theme: template.theme,
        is_template: true,
        template_id: template.id,
      }),
    });

    void apiFetch(`/api/daily-story/${assignment.id}/link`, {
      method: "PATCH",
      body: JSON.stringify({ storyId: story.id }),
    }).catch(() => {});

    return story.id;
  }

  // ── Basic / Premium: quota check ──
  const quota = await apiFetch<{ allowed: boolean; count: number; limit: number }>("/api/quota");
  const limit = PLAN_LIMITS[plan]?.monthly ?? 0;

  if (limit !== Infinity && !quota.allowed) {
    throw new PlanLimitError(
      `You've used all ${limit} AI stories for this month. Upgrade to Premium for unlimited stories.`,
    );
  }

  const storyContent = await generateStory(child.name, child.age,
    storyTemplates.find((t) => t.id === assignment.template_id)?.theme ?? "adventure",
    { tone, length },
  );

  let coverUrl: string | null = null;
  if (plan === "premium") {
    coverUrl = await generateCoverImage(storyContent.title, storyContent.summary);
  }

  const story = await apiFetch<{ id: string }>("/api/stories", {
    method: "POST",
    body: JSON.stringify({
      parent_id: profile.id,
      child_id: child.id,
      title: storyContent.title,
      summary: storyContent.summary,
      paragraphs: storyContent.text,
      theme: storyTemplates.find((t) => t.id === assignment.template_id)?.theme ?? "adventure",
      cover_url: coverUrl,
      image_urls: coverUrl ? [coverUrl] : [],
      is_template: false,
    }),
  });

  void apiFetch(`/api/daily-story/${assignment.id}/link`, {
    method: "PATCH",
    body: JSON.stringify({ storyId: story.id }),
  }).catch(() => {});

  void apiFetch("/api/quota/increment", { method: "POST" }).catch(() => {});

  return story.id;
}

// ── Streak ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateStreak(childId: string, _parentId: string): Promise<void> {
  void apiFetch(`/api/streaks/${childId}`, { method: "POST" }).catch(() => {});
}
