import { apiFetch } from "../lib/api";

export async function uploadReferenceImage(
  storyId: string,
  base64DataUri: string,
): Promise<string> {
  const { url } = await apiFetch<{ url: string }>("/api/upload/reference-image", {
    method: "POST",
    body: JSON.stringify({ storyId, base64: base64DataUri }),
  });
  return url;
}
