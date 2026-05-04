export type SceneImageStatus = "pending" | "loading" | "ready" | "fallback" | "error";

// --- Fallback images -----------------------------------------------------------

const STAR_DOTS =
  '<circle cx="50" cy="80" r="2"/><circle cx="120" cy="160" r="1.5"/>' +
  '<circle cx="280" cy="50" r="3"/><circle cx="450" cy="120" r="1"/>' +
  '<circle cx="620" cy="80" r="2.5"/><circle cx="720" cy="200" r="1.5"/>' +
  '<circle cx="180" cy="300" r="2"/><circle cx="380" cy="280" r="1"/>' +
  '<circle cx="540" cy="360" r="3"/><circle cx="680" cy="320" r="2"/>' +
  '<circle cx="90" cy="450" r="1.5"/><circle cx="400" cy="500" r="2.5"/>';

function makeFallbackSvg(c0: string, c1: string, c2: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0.7" y2="1">` +
    `<stop offset="0%" stop-color="${c0}"/>` +
    `<stop offset="50%" stop-color="${c1}"/>` +
    `<stop offset="100%" stop-color="${c2}"/>` +
    `</linearGradient></defs>` +
    `<rect width="800" height="600" fill="url(#g)"/>` +
    `<g fill="white" opacity="0.3">${STAR_DOTS}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const FALLBACK_TABLE: Array<[RegExp, [string, string, string]]> = [
  [/space|night|star|moon/,   ['#0d0221', '#1a1040', '#2d1b69']],
  [/forest|jungle|tree/,      ['#0d1f0a', '#1a3a14', '#2d6b27']],
  [/ocean|water|sea|lake/,    ['#051525', '#0a2a4a', '#1a5f8f']],
  [/dragon|fire/,             ['#250510', '#6b0f1a', '#c02020']],
  [/magic|fantasy|wizard/,    ['#150a35', '#3a1060', '#7b2ff7']],
  [/adventure|mountain|hero/, ['#0d1a30', '#1a3a6b', '#2d6bc0']],
  [/animals|safari|farm/,     ['#0a1a08', '#1a3a12', '#3d8b1a']],
];
const DEFAULT_FALLBACK: [string, string, string] = ['#10082a', '#2a1060', '#4a1fa8'];

/** Returns a themed gradient SVG data-URI for use when AI image generation fails. */
export function getFallbackImage(theme?: string): string {
  const lower = theme?.toLowerCase() ?? '';
  const hit = FALLBACK_TABLE.find(([re]) => re.test(lower));
  const [c0, c1, c2] = hit?.[1] ?? DEFAULT_FALLBACK;
  return makeFallbackSvg(c0, c1, c2);
}

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
