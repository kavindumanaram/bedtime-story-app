import { supabase } from "../lib/supabase";

const BUCKET = "story-references";

/**
 * Uploads a base64 data URI to Supabase Storage and returns its public URL.
 * Bucket "story-references" must exist and be public.
 */
export async function uploadReferenceImage(
  storyId: string,
  base64DataUri: string,
): Promise<string> {
  const res = await fetch(base64DataUri);
  const blob = await res.blob();

  const path = `${storyId}.png`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/png", upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
