import type { Child, Profile } from "@bedtime/shared";
import { generateStory, generateCoverImage } from "./openaiApi";
import { getMemoryContext, updateMemoryAfterRead } from "./storyMemory";
import { pickContinuationTemplate, renderTemplate } from "../lib/templateEngine";
import { storyTemplates } from "../data/storyTemplates";
import { PlanLimitError } from "./dailyStory";
import { apiFetch } from "../lib/api";

const PLAN_AI_LIMITS: Record<string, number> = {
  free: 0, basic: 30, premium: Infinity,
};

export async function triggerContinuation(
  child: Child,
  profile: Profile,
): Promise<string> {
  const plan = profile.plan ?? "free";
  const memory = await getMemoryContext(child.id);

  if (!memory) throw new Error("No previous story found to continue.");

  const tone = child.preferences?.tone ?? "calm";
  const length = child.preferences?.length ?? "medium";

  // ── Free tier: template continuation ──
  if (plan === "free") {
    const prevTemplate = storyTemplates.find((t) => t.id === memory.lastTemplateId);
    const nextTemplate = pickContinuationTemplate(child, prevTemplate?.category ?? "adventure", memory.lastTemplateId ?? "");
    const rendered = renderTemplate(nextTemplate, { childName: child.name, age: child.age });

    let seriesId: string | null = null;
    let episodeNum = 1;
    try {
      const result = await apiFetch<{ seriesId: string; episodeNum: number }>("/api/series/resolve", {
        method: "POST",
        body: JSON.stringify({
          storyId: "", childId: child.id,
          title: `${child.name}'s Story Adventures`,
        }),
      });
      seriesId = result.seriesId;
      episodeNum = result.episodeNum;
    } catch { /* continue without series tracking */ }

    const story = await apiFetch<{ id: string }>("/api/stories", {
      method: "POST",
      body: JSON.stringify({
        parent_id: profile.id,
        child_id: child.id,
        title: rendered.title,
        summary: rendered.summary,
        paragraphs: rendered.paragraphs,
        theme: nextTemplate.theme,
        is_template: true,
        template_id: nextTemplate.id,
        ...(seriesId ? { series_id: seriesId, episode_num: episodeNum } : {}),
      }),
    });

    updateMemoryAfterRead(
      child.id, profile.id, story.id,
      rendered.summary, rendered.paragraphs[rendered.paragraphs.length - 1],
    ).catch(() => {});
    return story.id;
  }

  // ── Basic / Premium: AI continuation ──
  const quota = await apiFetch<{ allowed: boolean; count: number; limit: number }>("/api/quota");
  const limit = PLAN_AI_LIMITS[plan] ?? 0;
  if (limit !== Infinity && !quota.allowed) {
    throw new PlanLimitError(
      `You've used all ${limit} AI stories for this month. Upgrade to Premium for unlimited stories.`,
    );
  }

  let seriesId: string | null = null;
  let episodeNum = 1;
  try {
    const result = await apiFetch<{ seriesId: string; episodeNum: number }>("/api/series/resolve", {
      method: "POST",
      body: JSON.stringify({
        storyId: "", childId: child.id,
        title: `${child.name}'s Story Adventures`,
      }),
    });
    seriesId = result.seriesId;
    episodeNum = result.episodeNum;
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

  const story = await apiFetch<{ id: string }>("/api/stories", {
    method: "POST",
    body: JSON.stringify({
      parent_id: profile.id,
      child_id: child.id,
      title: storyContent.title,
      summary: storyContent.summary,
      paragraphs: storyContent.text,
      theme: memory.favoriteThemes[0] ?? "adventure",
      cover_url: coverUrl,
      image_urls: coverUrl ? [coverUrl] : [],
      is_template: false,
      ...(seriesId ? { series_id: seriesId, episode_num: episodeNum } : {}),
    }),
  });

  updateMemoryAfterRead(
    child.id, profile.id, story.id,
    storyContent.summary, storyContent.text[storyContent.text.length - 1] ?? "",
  ).catch(() => {});
  void apiFetch("/api/quota/increment", { method: "POST" }).catch(() => {});

  return story.id;
}
