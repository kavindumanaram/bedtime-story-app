import type { StoryNode, BranchingStoryGraph } from "@bedtime/shared";
import { apiFetch } from "../lib/api";
import type { StoryCharacter } from "./sceneImageApi";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type GeneratedStory = Omit<StoryNode, "characterContext"> & {
  characterContext?: StoryCharacter[];
  is_branching?: boolean;
  story_graph?: BranchingStoryGraph | null;
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
  if (UUID_RE.test(id)) {
    void apiFetch(`/api/stories/${id}/cover-url`, { method: "PATCH", body: JSON.stringify({ url }) });
  }
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
  if (UUID_RE.test(id)) {
    void apiFetch(`/api/stories/${id}/character-context`, { method: "PATCH", body: JSON.stringify({ characters }) });
  }
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

export async function deleteStory(id: string): Promise<void> {
  const db = await readDb();
  db.stories = db.stories.filter(s => s.id !== id);
  await writeDb(db);
  if (UUID_RE.test(id)) {
    void apiFetch(`/api/stories/${id}`, { method: 'DELETE' });
  }
}

export async function updateGraphNodeImage(
  id: string,
  nodeId: string,
  imageIndex: number,
  url: string,
): Promise<void> {
  const db = await readDb();
  const idx = db.stories.findIndex((s) => s.id === id);
  if (idx >= 0) {
    const story = db.stories[idx];
    if (story.story_graph) {
      const g = story.story_graph as BranchingStoryGraph;
      if (nodeId === g.rootNode.id) {
        g.rootNode.sceneImages[imageIndex] = url;
      } else {
        const leaf = g.leafNodes.find((n) => n.id === nodeId);
        if (leaf) leaf.sceneImages[imageIndex] = url;
      }
      db.stories[idx] = { ...story, story_graph: g };
      await writeDb(db);
    }
  }
  if (!UUID_RE.test(id)) return;
  void apiFetch(`/api/stories/${id}/graph-node-image`, {
    method: "PATCH",
    body: JSON.stringify({ nodeId, imageIndex, url }),
  });
}
