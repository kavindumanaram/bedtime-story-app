import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveStory, loadStories, loadStory, updateStoryImages,
  updateStoryCoverUrl, updateStoryCharacterContext,
  type GeneratedStory,
} from "./storyDb";
import type { StoryCharacter } from "./sceneImageApi";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const makeStory = (overrides?: Partial<GeneratedStory>): GeneratedStory => ({
  id: crypto.randomUUID(),
  title: "Test Story",
  summary: "A short test story.",
  text: ["Para 1", "Para 2", "Para 3", "Para 4"],
  coverImage: "data:image/png;base64,abc",
  childName: "Alice",
  age: 5,
  theme: "dragons",
  createdAt: new Date().toISOString(),
  ...overrides,
});

const dbResponse = (stories: GeneratedStory[]) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ stories }),
  } as Response);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("loadStories", () => {
  it("returns empty array when db has no stories", async () => {
    mockFetch.mockReturnValueOnce(dbResponse([]));
    expect(await loadStories()).toEqual([]);
  });

  it("calls GET /api/db", async () => {
    mockFetch.mockReturnValueOnce(dbResponse([]));
    await loadStories();
    expect(mockFetch).toHaveBeenCalledWith("/api/db");
  });

  it("returns stories from the db", async () => {
    const story = makeStory();
    mockFetch.mockReturnValueOnce(dbResponse([story]));
    const result = await loadStories();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(story.id);
  });

  it("returns empty array when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    expect(await loadStories()).toEqual([]);
  });

  it("returns empty array when response is not ok", async () => {
    mockFetch.mockReturnValueOnce(Promise.resolve({ ok: false } as Response));
    expect(await loadStories()).toEqual([]);
  });
});

describe("saveStory", () => {
  it("calls POST /api/db with the new story prepended", async () => {
    const existing = makeStory({ title: "Existing" });
    const newStory = makeStory({ title: "New" });

    // readDb call
    mockFetch.mockReturnValueOnce(dbResponse([existing]));
    // writeDb call
    mockFetch.mockReturnValueOnce(Promise.resolve({ ok: true } as Response));

    await saveStory(newStory);

    const [url, init] = mockFetch.mock.calls[1];
    expect(url).toBe("/api/db");
    expect(init.method).toBe("POST");

    const written = JSON.parse(init.body);
    expect(written.stories[0].title).toBe("New");
    expect(written.stories[1].title).toBe("Existing");
  });
});

describe("loadStory", () => {
  it("returns the correct story by id", async () => {
    const a = makeStory({ title: "Alpha" });
    const b = makeStory({ title: "Beta" });
    mockFetch.mockReturnValueOnce(dbResponse([a, b]));
    expect((await loadStory(a.id))?.title).toBe("Alpha");
  });

  it("returns undefined for an unknown id", async () => {
    mockFetch.mockReturnValueOnce(dbResponse([]));
    expect(await loadStory("does-not-exist")).toBeUndefined();
  });
});

describe("updateStoryImages", () => {
  it("writes the image url at the given index into the story", async () => {
    const story = makeStory({ images: [] });
    mockFetch.mockReturnValueOnce(dbResponse([story])); // readDb
    mockFetch.mockReturnValueOnce(Promise.resolve({ ok: true } as Response)); // writeDb

    await updateStoryImages(story.id, 0, "data:image/png;base64,img0");

    const written = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(written.stories[0].images[0]).toBe("data:image/png;base64,img0");
  });

  it("extends the images array when imageIndex is beyond current length", async () => {
    const story = makeStory({ images: ["img0"] });
    mockFetch.mockReturnValueOnce(dbResponse([story]));
    mockFetch.mockReturnValueOnce(Promise.resolve({ ok: true } as Response));

    await updateStoryImages(story.id, 2, "img2");

    const written = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(written.stories[0].images).toHaveLength(3);
    expect(written.stories[0].images[2]).toBe("img2");
  });

  it("does nothing when the story id is not found", async () => {
    mockFetch.mockReturnValueOnce(dbResponse([])); // readDb — story not found
    await updateStoryImages("unknown-id", 0, "img0");
    // writeDb should NOT have been called
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("preserves other stories when updating images", async () => {
    const a = makeStory({ title: "Alpha" });
    const b = makeStory({ title: "Beta" });
    mockFetch.mockReturnValueOnce(dbResponse([a, b]));
    mockFetch.mockReturnValueOnce(Promise.resolve({ ok: true } as Response));

    await updateStoryImages(a.id, 0, "img0");

    const written = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(written.stories).toHaveLength(2);
    expect(written.stories[1].title).toBe("Beta");
  });
});

// ---------------------------------------------------------------------------
// Regression: non-UUID story IDs (timestamps) must NOT trigger backend PATCH
// calls that would cause "Error creating UUID, invalid length: 13" in Prisma.
// ---------------------------------------------------------------------------

const writeOk = () => Promise.resolve({ ok: true } as Response);
const patchOk = () =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) } as Response);

describe("updateStoryCoverUrl", () => {
  it("writes the new cover url into db.json", async () => {
    const story = makeStory({ coverImage: "" });
    mockFetch.mockReturnValueOnce(dbResponse([story]));
    mockFetch.mockReturnValueOnce(writeOk());
    mockFetch.mockReturnValueOnce(patchOk());

    await updateStoryCoverUrl(story.id, "https://cdn.example.com/cover.png");

    const written = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(written.stories[0].coverImage).toBe("https://cdn.example.com/cover.png");
  });

  it("does NOT call the backend when id is a timestamp (non-UUID)", async () => {
    const story = makeStory({ id: String(Date.now()) });
    mockFetch.mockReturnValueOnce(dbResponse([story]));
    mockFetch.mockReturnValueOnce(writeOk());

    await updateStoryCoverUrl(story.id, "https://cdn.example.com/cover.png");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    mockFetch.mock.calls.forEach(([url]: [string]) => expect(url).toBe("/api/db"));
  });

  it("calls PATCH /api/stories/:id/cover-url when id is a valid UUID", async () => {
    const story = makeStory();
    mockFetch.mockReturnValueOnce(dbResponse([story]));
    mockFetch.mockReturnValueOnce(writeOk());
    mockFetch.mockReturnValueOnce(patchOk());

    await updateStoryCoverUrl(story.id, "https://cdn.example.com/cover.png");

    const patch = mockFetch.mock.calls.find(([u]: [string]) => u.includes("/cover-url"));
    expect(patch).toBeDefined();
    expect(patch![0]).toBe(`/api/stories/${story.id}/cover-url`);
    expect(patch![1].method).toBe("PATCH");
    expect(JSON.parse(patch![1].body).url).toBe("https://cdn.example.com/cover.png");
  });
});

describe("updateStoryCharacterContext", () => {
  const chars: StoryCharacter[] = [
    { name: "Alice", visualDescription: "A young girl with brown hair" },
  ];

  it("writes character context into db.json", async () => {
    const story = makeStory({ id: String(Date.now()) });
    mockFetch.mockReturnValueOnce(dbResponse([story]));
    mockFetch.mockReturnValueOnce(writeOk());

    await updateStoryCharacterContext(story.id, chars);

    const written = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(written.stories[0].characterContext).toEqual(chars);
  });

  it("does NOT call the backend when id is a timestamp (non-UUID)", async () => {
    const story = makeStory({ id: String(Date.now()) });
    mockFetch.mockReturnValueOnce(dbResponse([story]));
    mockFetch.mockReturnValueOnce(writeOk());

    await updateStoryCharacterContext(story.id, chars);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    mockFetch.mock.calls.forEach(([url]: [string]) => expect(url).toBe("/api/db"));
  });

  it("calls PATCH /api/stories/:id/character-context when id is a valid UUID", async () => {
    const story = makeStory();
    mockFetch.mockReturnValueOnce(dbResponse([story]));
    mockFetch.mockReturnValueOnce(writeOk());
    mockFetch.mockReturnValueOnce(patchOk());

    await updateStoryCharacterContext(story.id, chars);

    const patch = mockFetch.mock.calls.find(([u]: [string]) => u.includes("/character-context"));
    expect(patch).toBeDefined();
    expect(patch![0]).toBe(`/api/stories/${story.id}/character-context`);
    expect(patch![1].method).toBe("PATCH");
    expect(JSON.parse(patch![1].body).characters).toEqual(chars);
  });
});
