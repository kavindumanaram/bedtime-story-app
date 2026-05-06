import { useState, useEffect } from "react";
import { generateSceneImage, generateReferenceImage } from "../api/openaiApi";
import { getFallbackImage, buildReferenceImagePrompt, type StoryContext } from "../api/sceneImageApi";
import type { SceneSlot } from "../api/sceneImageApi";
import { uploadReferenceImage } from "../api/storageApi";
import { updateStoryImages } from "../api/storyDb";
import { apiFetch } from "../lib/api";

type Options = {
  slots: SceneSlot[];
  paragraphCount: number;
  storyId: string | null;
  /** Story theme — used to pick a themed gradient fallback when image generation fails. */
  theme?: string;
  /** When provided, a canonical reference image is generated first and reused for all scene calls. */
  storyContext?: StoryContext;
};

type Return = {
  images: (string | null)[];
  allDone: boolean;
  readyCount: number;
};

// PostgREST validates UUID format strictly — passing a timestamp ID causes a 400.
// Local dev stories use String(Date.now()) as id, which is not a UUID, so skip them.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function savePartialImageUrls(
  storyId: string,
  imageIndex: number,
  url: string,
): Promise<void> {
  if (!UUID_RE.test(storyId)) return;

  await apiFetch(`/api/stories/${storyId}/images`, {
    method: "PATCH",
    body: JSON.stringify({ imageIndex, url }),
  });
}

/**
 * Module-level deduplication map: key → in-flight Promise.
 *
 * This solves the React StrictMode double-mount problem where:
 * 1. Mount 1 starts the async loop, adds slot[0] to inFlightRef, fires the fetch
 * 2. StrictMode cleanup runs (aborted₁=true) — but the fetch is already in-flight
 * 3. Mount 2 starts a new loop — it would skip slot[0] if inFlightRef was the guard,
 *    leaving it permanently null (loading spinner forever)
 *
 * With deduplication, both loops share the same Promise for slot[0]:
 * - Loop 1 creates the Promise and the network request
 * - Loop 2 finds the existing Promise and waits on it
 * - Loop 1's result is discarded (aborted), Loop 2 updates state correctly
 * - Exactly ONE network request per slot, zero stuck images
 */
const pendingGenerations = new Map<string, Promise<string>>();

export function generateSceneImageOnce(prompt: string, referenceImage?: string): Promise<string> {
  const key = `${prompt}::${referenceImage ?? ""}`;
  const existing = pendingGenerations.get(key);
  if (existing) return existing;
  const p = generateSceneImage(prompt, referenceImage).finally(() => pendingGenerations.delete(key));
  pendingGenerations.set(key, p);
  return p;
}

// Separate dedup map for the reference image — keyed on the character-sheet prompt.
const pendingReferenceGenerations = new Map<string, Promise<string>>();

function generateReferenceImageOnce(ctx: StoryContext): Promise<string> {
  const key = buildReferenceImagePrompt(ctx);
  const existing = pendingReferenceGenerations.get(key);
  if (existing) return existing;
  const p = generateReferenceImage(ctx).finally(() => pendingReferenceGenerations.delete(key));
  pendingReferenceGenerations.set(key, p);
  return p;
}

export function useProgressiveImages({
  slots,
  paragraphCount,
  storyId,
  theme,
  storyContext,
}: Options): Return {
  const [images, setImages] = useState<(string | null)[]>(() =>
    slots.length > 0 ? Array(paragraphCount).fill(null) : [],
  );

  useEffect(() => {
    if (slots.length === 0) return;

    // Local flag — each effect invocation gets its own abort state.
    // A shared useRef would be reset by the second StrictMode mount before the first
    // loop checks it, causing both loops to run to completion (double generation).
    let aborted = false;

    void (async () => {
      // Step 1: generate and upload the canonical reference image before any scene.
      // All scene requests reuse this public URL so the model locks visual identity.
      let referenceImageUrl: string | undefined;
      if (storyContext) {
        try {
          const base64 = await generateReferenceImageOnce(storyContext);
          if (!aborted && storyId) {
            referenceImageUrl = await uploadReferenceImage(storyId, base64);
          }
        } catch (err) {
          console.warn("Reference image generation/upload failed — using text-only prompts:", err);
        }
      }

      // Step 2: generate each scene image, passing the reference URL for visual consistency.
      for (const slot of slots) {
        if (aborted) break;

        try {
          // generateSceneImageOnce deduplicates concurrent requests for the same prompt+reference
          // so StrictMode's second mount reuses the first mount's in-flight Promise
          const url = await generateSceneImageOnce(slot.prompt, referenceImageUrl);
          if (aborted) break;

          setImages((prev) => {
            const next = [...prev];
            // Fill this slot's scene and all scenes up to the next slot
            const nextSlot = slots.find((s) => s.imageIndex === slot.imageIndex + 1);
            const endIndex = nextSlot ? nextSlot.sceneIndex : paragraphCount;
            for (let i = slot.sceneIndex; i < endIndex; i++) {
              if (i < next.length) next[i] = url;
            }
            return next;
          });

          if (storyId) {
            // Persist to local db.json (dev) and Supabase (prod) — both best-effort
            updateStoryImages(storyId, slot.imageIndex, url).catch(() => {});
            savePartialImageUrls(storyId, slot.imageIndex, url).catch(() => {});
          }
        } catch (err) {
          console.warn(`Scene ${slot.sceneIndex} image failed:`, err);
          // Resolve with a themed gradient so the player never waits forever on a null slot
          const fallbackUrl = getFallbackImage(theme);
          if (aborted) break;
          setImages((prev) => {
            const next = [...prev];
            const nextSlot = slots.find((s) => s.imageIndex === slot.imageIndex + 1);
            const endIndex = nextSlot ? nextSlot.sceneIndex : paragraphCount;
            for (let i = slot.sceneIndex; i < endIndex; i++) {
              if (i < next.length) next[i] = fallbackUrl;
            }
            return next;
          });
          if (storyId) {
            updateStoryImages(storyId, slot.imageIndex, fallbackUrl).catch(() => {});
          }
        }
      }
    })();

    return () => {
      aborted = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, storyId, paragraphCount, theme, storyContext]);

  const readyCount = images.filter(Boolean).length;
  const allDone = slots.length > 0 && readyCount >= slots.length;

  return { images, allDone, readyCount };
}
