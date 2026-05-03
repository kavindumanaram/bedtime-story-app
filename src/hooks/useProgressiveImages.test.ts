import { describe, it, expect } from "vitest";

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
