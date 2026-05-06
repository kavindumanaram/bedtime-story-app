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

// --- Visual identity lock ---------------------------------------------------

export const LOCKED_ART_STYLE =
  "Pixar-style cinematic children's illustration, warm volumetric lighting, " +
  "storybook composition, highly detailed, consistent character design, " +
  "cinematic framing, medium shot, eye-level camera, no text, safe for children";

// --- Consistent image context types -------------------------------------------

export type StoryCharacter = {
  name: string;
  type?: "human" | "animal" | "creature";
  gender?: string;       // "boy" | "girl" | "man" | "woman"
  age?: string;          // "7-year-old" | "young" | "elderly"
  skinColor?: string;    // humans only
  hairColor?: string;    // humans only
  hairStyle?: string;    // humans only
  visualDescription: string;
  clothing?: string;
  accessories?: string;
  species?: string;      // animals/creatures only
};

export type StoryContext = {
  setting: string;
  environmentStyle: string;
  mainCharacter: string;
  characters: StoryCharacter[];
  referenceImageUrl?: string;
};

function detectSetting(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  if (/space|star|planet|galaxy|rocket/.test(text)) return "outer space, stars and planets";
  if (/ocean|sea|underwater|coral/.test(text)) return "underwater ocean world";
  if (/forest|jungle|tree|wood/.test(text)) return "enchanted forest";
  if (/castle|kingdom|palace|royal/.test(text)) return "magical kingdom";
  if (/mountain|cave|valley|cliff/.test(text)) return "mountain wilderness";
  if (/farm|barn|field|meadow/.test(text)) return "peaceful countryside";
  if (/city|town|village|street/.test(text)) return "cozy village";
  return "magical storybook world";
}

function detectEnvironmentStyle(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  if (/space|star|planet|galaxy|rocket/.test(text)) return "outer space with twinkling stars and glowing nebulae";
  if (/ocean|sea|underwater|coral/.test(text)) return "shimmering underwater ocean world with coral reefs and colourful fish";
  if (/forest|jungle|tree|wood/.test(text)) return "enchanted forest with glowing trees and soft magical light filtering through the leaves";
  if (/castle|kingdom|palace|royal/.test(text)) return "magical kingdom with towering castles, golden spires, and colourful banners";
  if (/mountain|cave|valley|cliff/.test(text)) return "misty mountain wilderness with ancient stone paths and sweeping valley views";
  if (/farm|barn|field|meadow/.test(text)) return "peaceful countryside with rolling green meadows and warm golden sunlight";
  if (/city|town|village|street/.test(text)) return "cozy storybook village with warm lantern-lit cobblestone streets";
  return "magical storybook world bathed in warm golden light with soft glowing details";
}

function extractCharacterTraits(name: string, paragraphs: string[]): string {
  const text = paragraphs.slice(0, 3).join(" ");
  const patterns = [
    new RegExp(`${name}[,\\s]+(?:a|an|the)?\\s*([^.]{5,80}?)(?:\\.|,|\\s+(?:and|who|when))`, "i"),
    new RegExp(`${name}\\s+(?:had|has|wore|wears|with)\\s+([^.]{5,80}?)(?:\\.|,)`, "i"),
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1].trim().slice(0, 80);
  }
  return "";
}

export function buildReferenceImagePrompt(ctx: StoryContext): string {
  const charLines = ctx.characters.length > 0
    ? ctx.characters.map((c) => {
        const parts: string[] = [`${c.name}:`];
        if (c.gender) parts.push(c.gender);
        if (c.age) parts.push(c.age);
        if (c.species) parts.push(`(${c.species})`);
        if (c.skinColor) parts.push(`${c.skinColor} skin`);
        const hair = [c.hairStyle, c.hairColor].filter(Boolean).join(" ");
        if (hair) parts.push(`${hair} hair`);
        parts.push(c.visualDescription);
        if (c.clothing) parts.push(`wearing ${c.clothing}`);
        if (c.accessories) parts.push(`with ${c.accessories}`);
        return parts.join(", ");
      }).join(". ")
    : `Main character: ${ctx.mainCharacter}`;

  return (
    `Character reference sheet. ${charLines}. ` +
    `Environment style: ${ctx.environmentStyle}. ` +
    `${LOCKED_ART_STYLE}. ` +
    `Neutral background, all characters front-facing, full body visible, clear consistent character design.`
  );
}

export function buildStoryContext(
  title: string,
  summary: string,
  paragraphs: string[],
  recurringChars: { name: string; description: string | null }[] = [],
  extractedCharacters?: StoryCharacter[],
): StoryContext {
  const setting = detectSetting(title, summary);
  const environmentStyle = detectEnvironmentStyle(title, summary);

  const match = summary.match(/\b([A-Z][a-z]+(?:\s+the\s+[A-Z][a-z]+)?)\b/);
  const mainCharacter = (extractedCharacters?.[0]?.name) ?? (match ? match[1] : "a young child");

  // Prefer AI-extracted characters; fall back to regex-based extraction
  if (extractedCharacters && extractedCharacters.length > 0) {
    return { setting, environmentStyle, mainCharacter, characters: extractedCharacters };
  }

  const characters: StoryCharacter[] = [];
  for (const rc of recurringChars) {
    if (rc.description) characters.push({ name: rc.name, visualDescription: rc.description });
  }

  const mainInList = characters.some(
    (c) => c.name.toLowerCase() === mainCharacter.toLowerCase(),
  );
  if (!mainInList && mainCharacter !== "a young child") {
    const traits = extractCharacterTraits(mainCharacter, paragraphs);
    if (traits) characters.push({ name: mainCharacter, visualDescription: traits });
  }

  return { setting, environmentStyle, mainCharacter, characters };
}

export function buildConsistentSceneSlots(
  paragraphs: string[],
  storyContext: StoryContext,
  maxImages = 5,
): SceneSlot[] {
  if (paragraphs.length === 0) return [];

  const imageCount = Math.min(paragraphs.length, maxImages);
  const rawIndices: number[] = [];
  for (let i = 0; i < imageCount; i++) {
    rawIndices.push(Math.round((i / (imageCount - 1 || 1)) * (paragraphs.length - 1)));
  }
  const uniqueIndices = [...new Set(rawIndices)];

  const charLock =
    storyContext.characters.length > 0
      ? storyContext.characters.map((c) => {
          let desc = `${c.name}: ${c.visualDescription}`;
          if (c.clothing) desc += `, ${c.clothing}`;
          return desc;
        }).join(". ") + "."
      : `Main character: ${storyContext.mainCharacter}.`;

  return uniqueIndices.map((sceneIndex, imageIndex) => {
    const action = paragraphs[sceneIndex].split(/[.!?]/)[0].trim().slice(0, 200);

    const prompt =
      `${charLock} Environment: ${storyContext.environmentStyle}. ` +
      `Scene: ${action}. Cinematic medium shot, eye-level, storybook framing. ${LOCKED_ART_STYLE}.`;

    return { sceneIndex, imageIndex, prompt, status: "pending" as SceneImageStatus, url: null };
  });
}

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
  maxImages = 5,
): SceneSlot[] {
  if (paragraphs.length === 0) return [];

  const imageCount = Math.min(paragraphs.length, maxImages);

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
