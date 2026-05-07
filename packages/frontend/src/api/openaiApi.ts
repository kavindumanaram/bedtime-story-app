import { apiFetch } from '../lib/api'
import type { StoryCharacter, StoryContext } from './sceneImageApi'

export type StoryContent = {
  title: string
  summary: string
  text: string[]
}

export type ContinuationContext = {
  lastTitle: string
  lastSummary: string
  lastEnding: string
  favoriteThemes: string[]
  recurringCharacters: string[]
  episodeNum: number
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
  return apiFetch<StoryContent>('/api/generate/story', {
    method: 'POST',
    body: JSON.stringify({ childName, age, theme, options }),
  })
}

export async function generateCoverImage(
  title: string,
  summary: string,
  storyId?: string,
): Promise<string> {
  const { url } = await apiFetch<{ url: string }>('/api/generate/cover-image', {
    method: 'POST',
    body: JSON.stringify({ title, summary, storyId }),
  })
  return url
}

export async function generateSceneImage(
  prompt: string,
  referenceImageUrl?: string,
  storyId?: string,
  imageIndex?: number,
): Promise<string> {
  const { url } = await apiFetch<{ url: string }>('/api/generate/scene-image', {
    method: 'POST',
    body: JSON.stringify({ prompt, referenceImageUrl, storyId, imageIndex }),
  })
  return url
}

export async function generateReferenceImage(
  ctx: StoryContext,
  storyId?: string,
): Promise<string> {
  const { url } = await apiFetch<{ url: string }>('/api/generate/reference-image', {
    method: 'POST',
    body: JSON.stringify({ storyContext: ctx, storyId }),
  })
  return url
}

export async function extractStoryCharacters(
  title: string,
  text: string[],
): Promise<StoryCharacter[]> {
  const { characters } = await apiFetch<{ characters: StoryCharacter[] }>('/api/generate/characters', {
    method: 'POST',
    body: JSON.stringify({ title, text }),
  })
  return characters
}
