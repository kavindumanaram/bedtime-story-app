import { type Child } from "./supabase";
import { storyTemplates, type StoryTemplate } from "../data/storyTemplates";

export type TemplateVars = {
  childName: string;
  age: number;
  theme?: string;
};

export type RenderedStory = {
  title: string;
  summary: string;
  paragraphs: string[];
  templateId: string;
};

function interpolate(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{childName\}\}/g, vars.childName)
    .replace(/\{\{age\}\}/g, String(vars.age))
    .replace(/\{\{theme\}\}/g, vars.theme ?? "");
}

export function renderTemplate(template: StoryTemplate, vars: TemplateVars): RenderedStory {
  const paragraphs = template.paragraphTemplates.map((p) => interpolate(p, vars));
  return {
    title: interpolate(template.titleTemplate, vars),
    summary: paragraphs[0].slice(0, 140).replace(/\s\S+$/, "…"),
    paragraphs,
    templateId: template.id,
  };
}

// Deterministic but stable hash so a child always gets the same story on a given date.
function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickTonightTemplate(child: Child, date: Date): StoryTemplate {
  const iso = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const interests = child.preferences?.interests ?? [];
  const disliked: string[] = []; // caller can filter separately if child_story_memory is available

  // Prefer templates that match at least one interest; fall back to full pool
  const preferred = interests.length > 0
    ? storyTemplates.filter((t) => t.tags.some((tag) => interests.includes(tag)))
    : [];
  const pool = preferred.length > 0 ? preferred : storyTemplates;

  // Filter out disliked themes (none by default here — caller passes filtered pool if needed)
  const filtered = disliked.length > 0
    ? pool.filter((t) => !disliked.includes(t.theme))
    : pool;

  const candidates = filtered.length > 0 ? filtered : storyTemplates;
  const idx = hashCode(`${child.id}-${iso}`) % candidates.length;
  return candidates[idx];
}

// Variant used when we know the child's disliked themes from memory
export function pickTonightTemplateWithMemory(
  child: Child,
  date: Date,
  dislikedThemes: string[],
): StoryTemplate {
  const iso = date.toISOString().slice(0, 10);
  const interests = child.preferences?.interests ?? [];

  const preferred = interests.length > 0
    ? storyTemplates.filter((t) => t.tags.some((tag) => interests.includes(tag)))
    : [];
  const base = preferred.length > 0 ? preferred : storyTemplates;
  const pool = dislikedThemes.length > 0
    ? base.filter((t) => !dislikedThemes.includes(t.theme))
    : base;
  const candidates = pool.length > 0 ? pool : storyTemplates;
  const idx = hashCode(`${child.id}-${iso}`) % candidates.length;
  return candidates[idx];
}

// Pick template from same category as a given theme (for free-tier continuations)
export function pickContinuationTemplate(
  child: Child,
  previousCategory: string,
  previousTemplateId: string,
): StoryTemplate {
  const sameCategory = storyTemplates.filter(
    (t) => t.category === previousCategory && t.id !== previousTemplateId,
  );
  const pool = sameCategory.length > 0 ? sameCategory : storyTemplates.filter((t) => t.id !== previousTemplateId);
  const candidates = pool.length > 0 ? pool : storyTemplates;
  const idx = hashCode(`${child.id}-continue-${previousTemplateId}`) % candidates.length;
  return candidates[idx];
}
