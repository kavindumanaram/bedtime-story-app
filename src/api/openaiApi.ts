import { config } from "../config";
import { buildReferenceImagePrompt, type StoryContext, type StoryCharacter } from "./sceneImageApi";

export type StoryContent = {
  title: string;
  summary: string;
  text: string[];
};

export type ContinuationContext = {
  lastTitle: string;
  lastSummary: string;
  lastEnding: string;
  favoriteThemes: string[];
  recurringCharacters: string[]; // "Luna the Rabbit", "Milo the Dragon"
  episodeNum: number;
};

const LENGTH_PARAGRAPHS: Record<string, number> = { short: 3, medium: 4, long: 6 };

export async function generateStory(
  childName: string,
  age: number,
  theme: string,
  options?: {
    tone?: string;
    length?: "short" | "medium" | "long";
    continuation?: ContinuationContext;
  },
): Promise<StoryContent> {
  const tone = options?.tone ?? "calm";
  const length = options?.length ?? "medium";
  const paragraphCount = LENGTH_PARAGRAPHS[length] ?? 4;
  const continuation = options?.continuation;

  let userPrompt: string;

  if (continuation) {
    const charLine = continuation.recurringCharacters.length > 0
      ? `\nRecurring characters: ${continuation.recurringCharacters.join(", ")}.`
      : "";
    const themeLine = continuation.favoriteThemes.length > 0
      ? `\n${childName}'s favourite themes: ${continuation.favoriteThemes.join(", ")}.`
      : "";
    userPrompt =
      `Write episode ${continuation.episodeNum} of a ${length} bedtime story with a ${tone} tone for ${childName}, age ${age}.\n` +
      `Previous episode: "${continuation.lastTitle}" — ${continuation.lastSummary}\n` +
      `It ended: "${continuation.lastEnding}"` +
      themeLine +
      charLine +
      `\nContinue naturally with the same characters and world. ` +
      `Return JSON with: title (string), summary (one sentence string), text (array of exactly ${paragraphCount} short paragraphs).`;
  } else {
    userPrompt =
      `Write a ${length} bedtime story with a ${tone} tone for ${childName}, age ${age}, about "${theme}". ` +
      `Return JSON with: title (string), summary (one sentence string), text (array of exactly ${paragraphCount} short paragraphs).`;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openai.chatModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a children's bedtime story writer. Reply with JSON only." },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Story generation failed: ${res.statusText}`);

  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return {
    title: parsed.title ?? `A Story for ${childName}`,
    summary: parsed.summary ?? "",
    text: Array.isArray(parsed.text) ? parsed.text : [],
  };
}

export async function generateCoverImage(title: string, summary: string): Promise<string> {
  const prompt = `Create a cozy children's bedtime storybook cover illustration for a story called "${title}": ${summary}. Style: modern soft cartoon, pastel colours, warm lighting, high quality. No text, no watermarks, safe for children.`;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openai.imageModel,
      prompt,
      size: config.openai.imageSize,
      n: 1,
    }),
  });

  if (!res.ok) throw new Error(`Image generation failed: ${res.statusText}`);

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned from OpenAI");

  return `data:image/png;base64,${b64}`;
}

export async function generateSceneImage(
  prompt: string,
  referenceImageUrl?: string,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: config.openai.imageModel,
    prompt,
    size: config.openai.imageSize,
    n: 1,
  };
  if (referenceImageUrl) {
    body.image = referenceImageUrl;
  }
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Scene image failed: ${res.statusText}`);
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned");
  return `data:image/png;base64,${b64}`;
}

export async function generateReferenceImage(ctx: StoryContext): Promise<string> {
  const prompt = buildReferenceImagePrompt(ctx);
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openai.imageModel,
      prompt,
      size: config.openai.imageSize,
      n: 1,
    }),
  });
  if (!res.ok) throw new Error(`Reference image failed: ${res.statusText}`);
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No reference image data returned");
  return `data:image/png;base64,${b64}`;
}

export async function extractStoryCharacters(
  title: string,
  text: string[],
): Promise<StoryCharacter[]> {
  const storyText = text.join("\n\n");
  const userPrompt =
    `Story title: "${title}"\n\nStory text:\n${storyText}\n\n` +
    `Extract ALL named characters. For each return:\n` +
    `- name (string)\n` +
    `- type: "human" | "animal" | "creature"\n` +
    `- gender (humans only): "boy" | "girl" | "man" | "woman"\n` +
    `- age: approximate e.g. "7-year-old", "young", "elderly" — infer if not stated\n` +
    `- skinColor (humans only): e.g. "light brown", "dark", "pale"\n` +
    `- hairColor (humans only): e.g. "black", "golden", "red"\n` +
    `- hairStyle (humans only): e.g. "long curly", "short", "braided"\n` +
    `- clothing: primary outfit e.g. "blue striped pyjamas, bare feet"\n` +
    `- accessories: notable items e.g. "red collar", "wooden wand" (null if none)\n` +
    `- species (animals/creatures only): e.g. "golden retriever", "purple dragon"\n` +
    `- visualDescription: one sentence combining all visual details\n\n` +
    `Skip unnamed groups. Infer reasonable visual defaults for details not in the text.\n` +
    `Return JSON: { "characters": [ ... ] }`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openai.chatModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a visual character designer for children's book illustrations. " +
            "Extract character details from stories and return structured JSON only.",
        },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Character extraction failed: ${res.statusText}`);
  const data = await res.json();
  try {
    const parsed = JSON.parse(data.choices[0].message.content);
    const chars = parsed?.characters;
    if (!Array.isArray(chars)) return [];
    return chars.filter((c: unknown) => typeof (c as StoryCharacter).name === "string") as StoryCharacter[];
  } catch {
    return [];
  }
}
