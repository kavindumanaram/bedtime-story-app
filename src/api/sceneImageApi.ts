export type SceneImageStatus = "pending" | "loading" | "ready" | "error";

export type SceneSlot = {
  sceneIndex: number;
  imageIndex: number;
  prompt: string;
  status: SceneImageStatus;
  url: string | null;
};

export type StyleContext = {
  artStyle: string;
  mainCharacter: string;
  characterDescriptions: string;
};

export function buildStyleContext(
  _title: string,
  summary: string,
  recurringChars: { name: string; description: string | null }[] = [],
): StyleContext {
  const match = summary.match(/\b([A-Z][a-z]+(?:\s+the\s+[A-Z][a-z]+)?)\b/);
  const mainCharacter = match ? match[1] : "a young child";

  const characterDescriptions = recurringChars
    .filter((c) => c.description)
    .map((c) => `${c.name}: ${c.description}`)
    .join(". ");

  const artStyle =
    "soft watercolor children's book illustration, warm pastel colours, " +
    "gentle lighting, no text, safe for children";

  return { artStyle, mainCharacter, characterDescriptions };
}

export function buildScenePrompts(
  paragraphs: string[],
  styleContext: StyleContext,
): SceneSlot[] {
  if (paragraphs.length === 0) return [];

  const MAX_IMAGES = 5;
  const imageCount = Math.min(paragraphs.length, MAX_IMAGES);

  const rawIndices: number[] = [];
  for (let i = 0; i < imageCount; i++) {
    rawIndices.push(
      Math.round((i / (imageCount - 1 || 1)) * (paragraphs.length - 1)),
    );
  }
  const uniqueIndices = [...new Set(rawIndices)];

  return uniqueIndices.map((sceneIndex, imageIndex) => {
    const paragraph = paragraphs[sceneIndex];
    const gist = paragraph.split(/[.!?]/)[0].trim().slice(0, 200);
    const charPart = styleContext.characterDescriptions
      ? `${styleContext.characterDescriptions}. `
      : "";
    const prompt = `${charPart}${styleContext.mainCharacter}: ${gist}. ${styleContext.artStyle}.`;
    return {
      sceneIndex,
      imageIndex,
      prompt,
      status: "pending" as SceneImageStatus,
      url: null,
    };
  });
}

export function paragraphToImageIndex(
  slots: SceneSlot[],
  paragraphIndex: number,
): number {
  let best = 0;
  for (const slot of slots) {
    if (slot.sceneIndex <= paragraphIndex) best = slot.imageIndex;
  }
  return best;
}
