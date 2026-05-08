import { useState, useEffect } from "react";
import { generateSceneImage, generateReferenceImage } from "../api/openaiApi";
import { getFallbackImage, buildReferenceImagePrompt, type StoryContext } from "../api/sceneImageApi";
import type { SceneSlot } from "../api/sceneImageApi";
import { updateStoryImages } from "../api/storyDb";
import { apiFetch } from "../lib/api";
import { getDevSettings } from "../lib/devSettings";

type Options = {
  slots: SceneSlot[];
  paragraphCount: number;
  storyId: string | null;
  theme?: string;
  storyContext?: StoryContext;
};

type Return = {
  images: (string | null)[];
  allDone: boolean;
  readyCount: number;
};

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

export function generateSceneImageOnce(
  prompt: string,
  referenceImage?: string,
  storyId?: string,
  imageIndex?: number,
  imageModel?: string,
): Promise<string> {
  const key = `${prompt}::${referenceImage ?? ""}`;
  const existing = pendingGenerations.get(key);
  if (existing) return existing;
  const p = generateSceneImage(prompt, referenceImage, storyId, imageIndex, imageModel)
    .finally(() => pendingGenerations.delete(key));
  pendingGenerations.set(key, p);
  return p;
}

const pendingReferenceGenerations = new Map<string, Promise<string>>();

function generateReferenceImageOnce(ctx: StoryContext, storyId?: string): Promise<string> {
  const key = buildReferenceImagePrompt(ctx);
  const existing = pendingReferenceGenerations.get(key);
  if (existing) return existing;
  const p = generateReferenceImage(ctx, storyId)
    .finally(() => pendingReferenceGenerations.delete(key));
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

    const settings = getDevSettings();

    // Static image mode: skip all API calls and fill every slot with a local fallback immediately.
    if (settings.useStaticImage) {
      setImages(Array(paragraphCount).fill(getFallbackImage(theme)));
      return;
    }

    let aborted = false;

    void (async () => {
      // Fire reference image in background only when enabled in dev settings (default: off).
      if (storyContext && settings.generateReferenceImage) {
        generateReferenceImageOnce(storyContext, storyId ?? undefined).catch((err: unknown) => {
          console.warn("Reference image generation failed:", err);
        });
      }

      // Generate each scene image sequentially — backend generates + uploads, returns URL.
      for (const slot of slots) {
        if (aborted) break;

        try {
          const url = await generateSceneImageOnce(
            slot.prompt,
            undefined,
            storyId ?? undefined,
            slot.imageIndex,
            settings.imageModel,
          );
          if (aborted) break;

          setImages((prev) => {
            const next = [...prev];
            const nextSlot = slots.find((s) => s.imageIndex === slot.imageIndex + 1);
            const endIndex = nextSlot ? nextSlot.sceneIndex : paragraphCount;
            for (let i = slot.sceneIndex; i < endIndex; i++) {
              if (i < next.length) next[i] = url;
            }
            return next;
          });

          if (storyId) {
            updateStoryImages(storyId, slot.imageIndex, url).catch(() => {});
            savePartialImageUrls(storyId, slot.imageIndex, url).catch(() => {});
          }
        } catch (err) {
          console.warn(`Scene ${slot.sceneIndex} image failed:`, err);
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
