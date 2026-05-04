import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSceneImageOnce } from "./useProgressiveImages";

/**
 * Pure-logic tests for the readyCount / images-array behaviour that
 * useProgressiveImages exposes.  We don't spin up the hook (that would need
 * jsdom + fetch mocks); instead we test the mapping functions directly.
 */

// Mirrors the fill-range logic inside useProgressiveImages
function applySlotToImages(
  images: (string | null)[],
  slotImageIndex: number,
  slotSceneIndex: number,
  allSlots: { imageIndex: number; sceneIndex: number }[],
  paragraphCount: number,
  url: string,
): (string | null)[] {
  const next = [...images];
  const nextSlot = allSlots.find((s) => s.imageIndex === slotImageIndex + 1);
  const endIndex = nextSlot ? nextSlot.sceneIndex : paragraphCount;
  for (let i = slotSceneIndex; i < endIndex; i++) {
    if (i < next.length) next[i] = url;
  }
  return next;
}

function readyCount(images: (string | null)[]): number {
  return images.filter(Boolean).length;
}

describe("progressive image fill logic", () => {
  const slots = [
    { imageIndex: 0, sceneIndex: 0 },
    { imageIndex: 1, sceneIndex: 2 },
    { imageIndex: 2, sceneIndex: 4 },
  ];
  const paragraphCount = 6;
  const initial = Array<string | null>(paragraphCount).fill(null);

  it("starts with all-null images", () => {
    expect(readyCount(initial)).toBe(0);
  });

  it("slot 0 fills scenes 0–1 (readyCount → 2)", () => {
    const after = applySlotToImages(initial, 0, 0, slots, paragraphCount, "url0");
    expect(after[0]).toBe("url0");
    expect(after[1]).toBe("url0");
    expect(after[2]).toBeNull();
    expect(readyCount(after)).toBe(2);
  });

  it("slot 1 fills scenes 2–3 (readyCount → 4, crosses MIN_READY_IMAGES=3)", () => {
    let imgs = applySlotToImages(initial, 0, 0, slots, paragraphCount, "url0");
    imgs = applySlotToImages(imgs, 1, 2, slots, paragraphCount, "url1");
    expect(imgs[2]).toBe("url1");
    expect(imgs[3]).toBe("url1");
    expect(readyCount(imgs)).toBe(4);
  });

  it("slot 2 fills remaining scenes (readyCount → 6 = allDone)", () => {
    let imgs = applySlotToImages(initial, 0, 0, slots, paragraphCount, "url0");
    imgs = applySlotToImages(imgs, 1, 2, slots, paragraphCount, "url1");
    imgs = applySlotToImages(imgs, 2, 4, slots, paragraphCount, "url2");
    expect(readyCount(imgs)).toBe(6);
  });

  it("readyToAdvance gate: becomes true once readyCount >= 3", () => {
    const MIN_READY_IMAGES = 3;
    let imgs = Array<string | null>(paragraphCount).fill(null);
    expect(readyCount(imgs) >= MIN_READY_IMAGES).toBe(false);

    imgs = applySlotToImages(imgs, 0, 0, slots, paragraphCount, "url0");
    expect(readyCount(imgs) >= MIN_READY_IMAGES).toBe(false); // only 2 ready

    imgs = applySlotToImages(imgs, 1, 2, slots, paragraphCount, "url1");
    expect(readyCount(imgs) >= MIN_READY_IMAGES).toBe(true); // 4 ready ≥ 3
  });
});

describe("nextPageGuardCount navigation restriction", () => {
  const GUARD = 3;
  const images: (string | null)[] = ["url0", "url1", null, null, null];

  function isNextDisabled(index: number, pageSource: (string | null)[]): boolean {
    return (
      index === pageSource.length - 1 ||
      (GUARD > 0 && index < GUARD && pageSource[index + 1] === null)
    );
  }

  it("page 0 → Next enabled (page 1 has image)", () => {
    expect(isNextDisabled(0, images)).toBe(false);
  });

  it("page 1 → Next disabled (page 2 has no image, within guard)", () => {
    expect(isNextDisabled(1, images)).toBe(true);
  });

  it("page 2 → Next disabled (page 3 has no image, within guard)", () => {
    expect(isNextDisabled(2, images)).toBe(true);
  });

  it("page 3 → Next enabled even with no image (outside guard range)", () => {
    expect(isNextDisabled(3, images)).toBe(false);
  });

  it("guard lifts when image arrives at page 2", () => {
    const loaded = [...images];
    loaded[2] = "url2";
    expect(isNextDisabled(1, loaded)).toBe(false);
  });

  it("last page always disables Next regardless of guard", () => {
    const allLoaded: (string | null)[] = ["url0", "url1", "url2"];
    expect(isNextDisabled(2, allLoaded)).toBe(true); // last page
  });
});

// ---------------------------------------------------------------------------
// Bug regression: StrictMode double-mount caused slot[0] to be permanently null
// ---------------------------------------------------------------------------

vi.mock("../api/openaiApi", () => ({
  generateSceneImage: vi.fn(),
}));

describe("generateSceneImageOnce deduplication (Bug: stuck images in StrictMode)", () => {
  let generateSceneImage: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Re-import to get the mocked version
    const mod = await import("../api/openaiApi");
    generateSceneImage = mod.generateSceneImage as ReturnType<typeof vi.fn>;
    generateSceneImage.mockReset();
  });

  it("returns the same Promise for concurrent calls with the same prompt", async () => {
    let resolve!: (url: string) => void;
    const deferred = new Promise<string>((r) => { resolve = r; });
    generateSceneImage.mockReturnValueOnce(deferred);

    const p1 = generateSceneImageOnce("prompt-a");
    const p2 = generateSceneImageOnce("prompt-a");

    // Both calls must reference the same Promise — no duplicate network request
    expect(p1).toBe(p2);
    expect(generateSceneImage).toHaveBeenCalledTimes(1);

    resolve("url-a");
    expect(await p1).toBe("url-a");
    expect(await p2).toBe("url-a");
  });

  it("fires separate requests for different prompts", async () => {
    generateSceneImage.mockResolvedValueOnce("url-a").mockResolvedValueOnce("url-b");

    const p1 = generateSceneImageOnce("prompt-a");
    const p2 = generateSceneImageOnce("prompt-b");

    expect(p1).not.toBe(p2);
    expect(generateSceneImage).toHaveBeenCalledTimes(2);
    expect(await p1).toBe("url-a");
    expect(await p2).toBe("url-b");
  });

  it("slot[0] is correctly applied even when a second loop skips calling generateSceneImage", () => {
    // Simulates what happens in StrictMode: Loop 1 is aborted but Loop 2 shares
    // the same Promise. The fill logic must still populate slot[0]'s scene range.
    const slots = [
      { imageIndex: 0, sceneIndex: 0 },
      { imageIndex: 1, sceneIndex: 2 },
      { imageIndex: 2, sceneIndex: 4 },
    ];
    const paragraphCount = 6;

    // Apply slot[0] result (as Loop 2 would after sharing Loop 1's Promise)
    const images = applySlotToImages(
      Array<string | null>(paragraphCount).fill(null),
      0, 0, slots, paragraphCount, "url-from-dedup",
    );

    expect(images[0]).toBe("url-from-dedup");
    expect(images[1]).toBe("url-from-dedup");
    expect(images[2]).toBeNull(); // slot[1] not yet resolved
    expect(readyCount(images)).toBe(2);
  });
});
