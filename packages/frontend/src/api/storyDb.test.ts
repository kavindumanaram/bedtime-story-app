import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveStory, loadStories, loadStory, updateStoryImages, type GeneratedStory } from "./storyDb";

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
