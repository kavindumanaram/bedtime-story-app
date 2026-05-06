import { supabase } from "../lib/supabase";
import type { StoryCharacter } from "./sceneImageApi";

export type GeneratedStory = {
  id: string;
  title: string;
  summary: string;
  text: string[];
  coverImage: string;
  images?: string[];
  childName: string;
  age: number;
  theme: string;
  createdAt: string;
  characterContext?: StoryCharacter[];
};

type DbSchema = { stories: GeneratedStory[] };

async function readDb(): Promise<DbSchema> {
  try {
    const res = await fetch('/api/db');
    if (!res.ok) return { stories: [] };
    return await res.json();
  } catch {
    return { stories: [] };
  }
}

async function writeDb(data: DbSchema): Promise<void> {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2),
  });
}

export async function saveStory(story: GeneratedStory): Promise<void> {
  const db = await readDb();
  db.stories.unshift(story);
  await writeDb(db);
}

export async function loadStories(): Promise<GeneratedStory[]> {
  const db = await readDb();
  return db.stories;
}

export async function loadStory(id: string): Promise<GeneratedStory | undefined> {
  const stories = await loadStories();
  return stories.find((s) => s.id === id);
}

export async function updateStoryCoverUrl(id: string, url: string): Promise<void> {
  // Persist to local db.json so Library thumbnails appear immediately
  const db = await readDb();
  const idx = db.stories.findIndex((s) => s.id === id);
  if (idx >= 0) {
    db.stories[idx] = { ...db.stories[idx], coverImage: url };
    await writeDb(db);
  }
  // Also push to Supabase best-effort
  void (async () => { await supabase.from("stories").update({ cover_url: url }).eq("id", id); })();
}

export async function updateStoryCharacterContext(
  id: string,
  characters: StoryCharacter[],
): Promise<void> {
  const db = await readDb();
  const idx = db.stories.findIndex((s) => s.id === id);
  if (idx >= 0) {
    db.stories[idx] = { ...db.stories[idx], characterContext: characters };
    await writeDb(db);
  }
  // Best-effort Supabase save — requires character_context JSONB column (migration 20260503)
  void (async () => {
    await supabase.from("stories").update({ character_context: characters }).eq("id", id);
  })();
}

export async function updateStoryImages(
  id: string,
  imageIndex: number,
  url: string,
): Promise<void> {
  const db = await readDb();
  const idx = db.stories.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const images = [...(db.stories[idx].images ?? [])];
  while (images.length <= imageIndex) images.push("");
  images[imageIndex] = url;
  db.stories[idx] = { ...db.stories[idx], images };
  await writeDb(db);
}
