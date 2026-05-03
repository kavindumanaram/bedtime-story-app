import { useState, useEffect, useRef } from "react";
import { generateSceneImage } from "../api/openaiApi";
import type { SceneSlot } from "../api/sceneImageApi";
import { updateStoryImages } from "../api/storyDb";
import { supabase } from "../lib/supabase";

type Options = {
  slots: SceneSlot[];
  paragraphCount: number;
  storyId: string | null;
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

export function useProgressiveImages({
  slots,
  paragraphCount,
  storyId,
}: Options): Return {
  const [images, setImages] = useState<(string | null)[]>(() =>
    slots.length > 0 ? Array(paragraphCount).fill(null) : [],
  );
  const abortedRef = useRef(false);

  useEffect(() => {
    if (slots.length === 0) return;
    abortedRef.current = false;

    void (async () => {
      for (const slot of slots) {
        if (abortedRef.current) break;
        try {
          const url = await generateSceneImage(slot.prompt);
          if (abortedRef.current) break;

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
        }
      }
    })();

    return () => {
      abortedRef.current = true;
    };
  }, [slots, storyId, paragraphCount]);

  const readyCount = images.filter(Boolean).length;
  const allDone = slots.length > 0 && readyCount >= slots.length;

  return { images, allDone, readyCount };
}
