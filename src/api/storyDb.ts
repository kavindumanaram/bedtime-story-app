export type GeneratedStory = {
  id: string;
  title: string;
  summary: string;
  text: string[];
  coverImage: string;
  images?: string[];   // future: 4 AI-generated images; currently [coverImage]
  childName: string;
  age: number;
  theme: string;
  createdAt: string;
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
