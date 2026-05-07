import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateStory, generateCoverImage, generateSceneImage,
  generateReferenceImage, extractStoryCharacters,
} from "./openaiApi";
import type { StoryContext } from "./sceneImageApi";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const okJson = (body: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    json: () => Promise.resolve(body),
  } as Response);

const errorResponse = (status = 500, statusText = "Internal Server Error") =>
  Promise.resolve({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({ error: statusText }),
  } as Response);

describe("generateStory", () => {
  it("calls the backend generate/story endpoint with correct payload", async () => {
    mockFetch.mockReturnValueOnce(
      okJson({
        title: "Dragon Night",
        summary: "A dragon finds a friend.",
        text: ["P1", "P2", "P3", "P4"],
      }),
    );

    await generateStory("Alice", 5, "dragons");

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/generate/story");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.childName).toBe("Alice");
    expect(body.age).toBe(5);
    expect(body.theme).toBe("dragons");
  });

  it("parses the response into title, summary, and text", async () => {
    mockFetch.mockReturnValueOnce(
      okJson({
        title: "Moon Song",
        summary: "The moon sings a lullaby.",
        text: ["Once", "Upon", "A", "Time"],
      }),
    );

    const result = await generateStory("Bob", 6, "moon");
    expect(result.title).toBe("Moon Song");
    expect(result.summary).toBe("The moon sings a lullaby.");
    expect(result.text).toEqual(["Once", "Upon", "A", "Time"]);
  });

  it("throws when the backend returns a non-ok status", async () => {
    mockFetch.mockReturnValueOnce(errorResponse(500, "Internal Server Error"));
    await expect(generateStory("Eve", 4, "stars")).rejects.toThrow();
  });
});

describe("generateCoverImage", () => {
  it("calls the backend generate/cover-image endpoint", async () => {
    const storageUrl = "https://zxhbmvyyqyjjbijzdbzy.supabase.co/storage/v1/object/public/story-covers/abc.png";
    mockFetch.mockReturnValueOnce(okJson({ url: storageUrl }));

    await generateCoverImage("Moon Song", "The moon sings.");

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/generate/cover-image");
    const body = JSON.parse(init.body as string);
    expect(body.title).toBe("Moon Song");
    expect(body.summary).toBe("The moon sings.");
  });

  it("returns the storage URL from the backend", async () => {
    const storageUrl = "https://zxhbmvyyqyjjbijzdbzy.supabase.co/storage/v1/object/public/story-covers/abc.png";
    mockFetch.mockReturnValueOnce(okJson({ url: storageUrl }));

    const result = await generateCoverImage("Title", "Summary");
    expect(result).toBe(storageUrl);
  });

  it("throws when the backend returns a non-ok status", async () => {
    mockFetch.mockReturnValueOnce(errorResponse(500, "Internal Server Error"));
    await expect(generateCoverImage("Title", "Summary")).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Regression: scene image body must use "referenceImageUrl", not "image".
// Sending "image" caused OpenAI to reject with "Unknown parameter: 'image'".
// ---------------------------------------------------------------------------

describe("generateSceneImage", () => {
  const storageUrl = "https://example.supabase.co/storage/v1/object/public/story-references/scenes/abc-0.png";

  it("calls /api/generate/scene-image with POST", async () => {
    mockFetch.mockReturnValueOnce(okJson({ url: storageUrl }));
    await generateSceneImage("A dragon flies over the forest.");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/generate/scene-image");
    expect(init.method).toBe("POST");
  });

  it("sends prompt in the request body", async () => {
    mockFetch.mockReturnValueOnce(okJson({ url: storageUrl }));
    await generateSceneImage("A dragon flies over the forest.");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.prompt).toBe("A dragon flies over the forest.");
  });

  it("sends referenceImageUrl (not 'image') in the request body", async () => {
    mockFetch.mockReturnValueOnce(okJson({ url: storageUrl }));
    await generateSceneImage("prompt", "https://example.com/ref.png", "story-id", 1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.referenceImageUrl).toBe("https://example.com/ref.png");
    expect(body).not.toHaveProperty("image");
  });

  it("sends storyId and imageIndex when provided", async () => {
    mockFetch.mockReturnValueOnce(okJson({ url: storageUrl }));
    await generateSceneImage("prompt", undefined, "story-abc", 2);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.storyId).toBe("story-abc");
    expect(body.imageIndex).toBe(2);
  });

  it("returns the storage URL from the backend", async () => {
    mockFetch.mockReturnValueOnce(okJson({ url: storageUrl }));
    const result = await generateSceneImage("prompt");
    expect(result).toBe(storageUrl);
  });

  it("throws when the backend returns a non-ok status", async () => {
    mockFetch.mockReturnValueOnce(errorResponse(500));
    await expect(generateSceneImage("prompt")).rejects.toThrow();
  });
});

describe("generateReferenceImage", () => {
  const refUrl = "https://example.supabase.co/storage/v1/object/public/story-references/refs/abc.png";
  const ctx: StoryContext = {
    setting: "enchanted forest",
    environmentStyle: "soft watercolour",
    mainCharacter: "Lily",
    characters: [],
  };

  it("calls /api/generate/reference-image with the story context", async () => {
    mockFetch.mockReturnValueOnce(okJson({ url: refUrl }));
    await generateReferenceImage(ctx);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/generate/reference-image");
    const body = JSON.parse(init.body as string);
    expect(body.storyContext).toMatchObject({ setting: "enchanted forest" });
  });

  it("returns the storage URL", async () => {
    mockFetch.mockReturnValueOnce(okJson({ url: refUrl }));
    expect(await generateReferenceImage(ctx)).toBe(refUrl);
  });
});

describe("extractStoryCharacters", () => {
  it("calls /api/generate/characters with title and text array", async () => {
    mockFetch.mockReturnValueOnce(okJson({ characters: [{ name: "Leo", visualDescription: "A lion" }] }));
    await extractStoryCharacters("Leo's Adventure", ["Leo the lion roared."]);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/generate/characters");
    const body = JSON.parse(init.body as string);
    expect(body.title).toBe("Leo's Adventure");
    expect(body.text).toEqual(["Leo the lion roared."]);
  });

  it("returns the characters array from the response", async () => {
    const chars = [{ name: "Leo", visualDescription: "A brave lion" }];
    mockFetch.mockReturnValueOnce(okJson({ characters: chars }));
    const result = await extractStoryCharacters("Title", ["text"]);
    expect(result).toEqual(chars);
  });
});
