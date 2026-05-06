import { describe, it, expect } from "vitest";
import { pickThumb } from "./Library";
import type { GeneratedStory } from "../api/storyDb";

const base: GeneratedStory = {
  id: "1",
  title: "Test",
  summary: "A story.",
  text: ["Para 1"],
  coverImage: "",
  childName: "Sam",
  age: 5,
  theme: "dragons",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("pickThumb — thumbnail selection", () => {
  it("returns coverImage when present and no error", () => {
    const story = { ...base, coverImage: "data:image/png;base64,cover" };
    expect(pickThumb(story, false)).toBe("data:image/png;base64,cover");
  });

  it("falls back to images[0] when coverImage is empty string", () => {
    const story = { ...base, coverImage: "", images: ["data:image/png;base64,scene0"] };
    expect(pickThumb(story, false)).toBe("data:image/png;base64,scene0");
  });

  it("falls back to images[0] when coverImage is missing", () => {
    const story = { ...base, images: ["data:image/png;base64,scene0"] };
    expect(pickThumb(story, false)).toBe("data:image/png;base64,scene0");
  });

  it("returns null when no images are available", () => {
    expect(pickThumb(base, false)).toBeNull();
  });

  it("returns null when images array is empty", () => {
    const story = { ...base, images: [] };
    expect(pickThumb(story, false)).toBeNull();
  });

  it("returns null on imgError even if coverImage exists (prevents broken img icon)", () => {
    const story = { ...base, coverImage: "data:image/png;base64,cover" };
    expect(pickThumb(story, true)).toBeNull();
  });

  it("returns null on imgError even if images[0] exists", () => {
    const story = { ...base, images: ["data:image/png;base64,scene0"] };
    expect(pickThumb(story, true)).toBeNull();
  });

  it("prefers coverImage over images[0]", () => {
    const story = {
      ...base,
      coverImage: "data:image/png;base64,cover",
      images: ["data:image/png;base64,scene0"],
    };
    expect(pickThumb(story, false)).toBe("data:image/png;base64,cover");
  });
});
