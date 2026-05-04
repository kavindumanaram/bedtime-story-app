import { useState, useEffect } from "react";
import { generateSceneImage } from "../api/openaiApi";
import { getFallbackImage } from "../api/sceneImageApi";
import type { SceneSlot } from "../api/sceneImageApi";
import { updateStoryImages } from "../api/storyDb";
import { supabase } from "../lib/supabase";

type Options = {
  slots: SceneSlot[];
  paragraphCount: number;
  storyId: string | null;
  /** Story theme — used to pick a themed gradient fallback when image generation fails. */
  theme?: string;
};

type Return = {
  images: (string | null)[];
  allDone: boolean;
  readyCount: number;
};

async function savePartialImageUrls(
  storyId: string,
  imageIndex: number,
  url: string,
): Promise<void> {
  const { data } = await supabase
    .from("stories")
    .select("image_urls")
    .eq("id", storyId)
    .single();

  const current: (string | null)[] =
    (data?.image_urls as (string | null)[] | null) ?? [];
  const next = [...current];
  while (next.length <= imageIndex) next.push(null);
  next[imageIndex] = url;

  await supabase
    .from("stories")
    .update({ image_urls: next.filter(Boolean) as string[] })
    .eq("id", storyId);
}

/**
 * Module-level deduplication map: prompt → in-flight Promise.
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

export function generateSceneImageOnce(prompt: string): Promise<string> {
  const existing = pendingGenerations.get(prompt);
  if (existing) return existing;
  const p = generateSceneImage(prompt).finally(() => pendingGenerations.delete(prompt));
  pendingGenerations.set(prompt, p);
  return p;
}

export function useProgressiveImages({
  slots,
  paragraphCount,
  storyId,
  theme,
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
      for (const slot of slots) {
        if (aborted) break;

        try {
          // generateSceneImageOnce deduplicates concurrent requests for the same prompt
          // so StrictMode's second mount reuses the first mount's in-flight Promise
          const url = await generateSceneImageOnce(slot.prompt);
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
  }, [slots, storyId, paragraphCount, theme]);

  const readyCount = images.filter(Boolean).length;
  const allDone = slots.length > 0 && readyCount >= slots.length;

  return { images, allDone, readyCount };
}
