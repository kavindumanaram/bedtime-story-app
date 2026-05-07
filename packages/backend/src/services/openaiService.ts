import { supabaseAdmin } from '../lib/supabaseAdmin.js'

type StoryContent = { title: string; summary: string; text: string[] }

type ContinuationContext = {
  lastTitle: string
  lastSummary: string
  lastEnding: string
  favoriteThemes: string[]
  recurringCharacters: string[]
  episodeNum: number
}

export type StoryCharacter = {
  name: string
  type?: 'human' | 'animal' | 'creature'
  gender?: string
  age?: string
  skinColor?: string
  hairColor?: string
  hairStyle?: string
  visualDescription: string
  clothing?: string
  accessories?: string | null
  species?: string
}

export type StoryContext = {
  setting: string
  environmentStyle: string
  mainCharacter: string
  characters: StoryCharacter[]
  referenceImageUrl?: string
}

const API_KEY = process.env.OPENAI_API_KEY!
const CHAT_MODEL = 'gpt-4o-mini'
const IMAGE_MODEL = 'gpt-image-1-mini'
const IMAGE_SIZE = '1024x1024'

const LENGTH_PARAGRAPHS: Record<string, number> = { short: 3, medium: 4, long: 6 }

/** Throws with the actual OpenAI error message (quota, safety, rate-limit, etc.) */
async function assertOk(res: Response, label: string): Promise<void> {
  if (res.ok) return
  const body = await res.json().catch(() => ({})) as { error?: { message?: string } }
  throw new Error(body.error?.message ?? `${label} failed: ${res.statusText}`)
}

// Tracks buckets already verified/created this process lifetime to avoid per-upload checks
const ensuredBuckets = new Set<string>()

async function ensureStorageBucket(bucket: string): Promise<void> {
  if (ensuredBuckets.has(bucket)) return
  // createBucket is idempotent — ignore error if bucket already exists
  await supabaseAdmin.storage.createBucket(bucket, { public: true }).catch(() => {})
  ensuredBuckets.add(bucket)
}

async function uploadToStorage(bucket: string, path: string, base64: string): Promise<string> {
  await ensureStorageBucket(bucket)
  const buffer = Buffer.from(base64, 'base64')
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType: 'image/png', upsert: true })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function generateStory(
  childName: string,
  age: number,
  theme: string,
  options?: {
    tone?: string
    length?: 'short' | 'medium' | 'long'
    continuation?: ContinuationContext
  },
): Promise<StoryContent> {
  const tone = options?.tone ?? 'calm'
  const length = options?.length ?? 'medium'
  const paragraphCount = LENGTH_PARAGRAPHS[length] ?? 4
  const continuation = options?.continuation

  let userPrompt: string
  if (continuation) {
    const charLine = continuation.recurringCharacters.length > 0
      ? `\nRecurring characters: ${continuation.recurringCharacters.join(', ')}.`
      : ''
    const themeLine = continuation.favoriteThemes.length > 0
      ? `\n${childName}'s favourite themes: ${continuation.favoriteThemes.join(', ')}.`
      : ''
    userPrompt =
      `Write episode ${continuation.episodeNum} of a ${length} bedtime story with a ${tone} tone for ${childName}, age ${age}.\n` +
      `Previous episode: "${continuation.lastTitle}" — ${continuation.lastSummary}\n` +
      `It ended: "${continuation.lastEnding}"` +
      themeLine + charLine +
      `\nContinue naturally with the same characters and world. ` +
      `Return JSON with: title (string), summary (one sentence string), text (array of exactly ${paragraphCount} short paragraphs).`
  } else {
    userPrompt =
      `Write a ${length} bedtime story with a ${tone} tone for ${childName}, age ${age}, about "${theme}". ` +
      `Return JSON with: title (string), summary (one sentence string), text (array of exactly ${paragraphCount} short paragraphs).`
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CHAT_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: "You are a children's bedtime story writer. Reply with JSON only." },
        { role: 'user', content: userPrompt },
      ],
    }),
  })
  await assertOk(res, 'Story generation')
  const data = await res.json() as { choices: [{ message: { content: string } }] }
  const parsed = JSON.parse(data.choices[0].message.content) as StoryContent
  return {
    title: (parsed.title as string) ?? `A Story for ${childName}`,
    summary: (parsed.summary as string) ?? '',
    text: Array.isArray(parsed.text) ? parsed.text as string[] : [],
  }
}

export async function generateCoverImage(
  title: string,
  summary: string,
  storyId?: string,
): Promise<string> {
  const prompt =
    `Create a cozy children's bedtime storybook cover illustration for a story called "${title}": ${summary}. ` +
    `Style: modern soft cartoon, pastel colours, warm lighting, high quality. No text, no watermarks, safe for children.`

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: IMAGE_MODEL, prompt, size: IMAGE_SIZE, n: 1 }),
  })
  await assertOk(res, 'Cover image generation')
  const data = await res.json() as { data: Array<{ b64_json: string }> }
  const b64 = data?.data?.[0]?.b64_json
  if (!b64) throw new Error('No image returned from OpenAI')

  const storageId = storyId ?? crypto.randomUUID()
  return uploadToStorage('story-references', `covers/${storageId}.png`, b64)
}

export async function generateSceneImage(
  prompt: string,
  storyId?: string,
  imageIndex?: number,
  referenceImageUrl?: string,
): Promise<string> {
  const body: Record<string, unknown> = { model: IMAGE_MODEL, prompt, size: IMAGE_SIZE, n: 1 }

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  await assertOk(res, 'Scene image generation')
  const data = await res.json() as { data: Array<{ b64_json: string }> }
  const b64 = data?.data?.[0]?.b64_json
  if (!b64) throw new Error('No scene image data returned')

  const storageId = storyId ?? crypto.randomUUID()
  const idx = imageIndex ?? 0
  return uploadToStorage('story-references', `scenes/${storageId}-${idx}.png`, b64)
}

export async function generateReferenceImage(
  storyContext: StoryContext,
  storyId?: string,
): Promise<string> {
  const LOCKED_ART_STYLE =
    "Pixar-style cinematic children's illustration, warm volumetric lighting, " +
    "storybook composition, highly detailed, consistent character design, " +
    "cinematic framing, medium shot, eye-level camera, no text, safe for children"

  const charLines = storyContext.characters.length > 0
    ? storyContext.characters.map((c) => {
        const parts: string[] = [`${c.name}:`]
        if (c.gender) parts.push(c.gender)
        if (c.age) parts.push(c.age)
        if (c.species) parts.push(`(${c.species})`)
        if (c.skinColor) parts.push(`${c.skinColor} skin`)
        const hair = [c.hairStyle, c.hairColor].filter(Boolean).join(' ')
        if (hair) parts.push(`${hair} hair`)
        parts.push(c.visualDescription)
        if (c.clothing) parts.push(`wearing ${c.clothing}`)
        if (c.accessories) parts.push(`with ${c.accessories}`)
        return parts.join(', ')
      }).join('. ')
    : `Main character: ${storyContext.mainCharacter}`

  const prompt =
    `Character reference sheet. ${charLines}. ` +
    `Environment style: ${storyContext.environmentStyle}. ` +
    `${LOCKED_ART_STYLE}. ` +
    `Neutral background, all characters front-facing, full body visible, clear consistent character design.`

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: IMAGE_MODEL, prompt, size: '1024x1024', n: 1 }),
  })
  await assertOk(res, 'Reference image generation')
  const data = await res.json() as { data: Array<{ b64_json: string }> }
  const b64 = data?.data?.[0]?.b64_json
  if (!b64) throw new Error('No reference image data returned')

  const storageId = storyId ?? crypto.randomUUID()
  return uploadToStorage('story-references', `refs/${storageId}.png`, b64)
}

export async function extractStoryCharacters(
  title: string,
  text: string[],
): Promise<StoryCharacter[]> {
  const storyText = text.join('\n\n')
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
    `Return JSON: { "characters": [ ... ] }`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CHAT_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            "You are a visual character designer for children's book illustrations. " +
            "Extract character details from stories and return structured JSON only.",
        },
        { role: 'user', content: userPrompt },
      ],
    }),
  })
  await assertOk(res, 'Character extraction')
  const data = await res.json() as { choices: [{ message: { content: string } }] }
  try {
    const parsed = JSON.parse(data.choices[0].message.content) as { characters: StoryCharacter[] }
    const chars = parsed?.characters
    if (!Array.isArray(chars)) return []
    return chars.filter((c) => typeof (c as StoryCharacter).name === 'string')
  } catch {
    return []
  }
}
