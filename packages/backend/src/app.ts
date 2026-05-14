import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { authMiddleware } from './middleware/auth.js'
import * as auth from './services/authService.js'
import * as db from './services/dbService.js'
import * as openai from './services/openaiService.js'
import { buildScenePrompt } from './services/promptBuilderService.js'
import type { StoryCharacter, StoryContext } from './services/openaiService.js'
import { getCommunityStories } from './data/communityStories.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname_local = dirname(__filename)
const DEV_DB_PATH = resolve(__dirname_local, '../../../data/db.json')

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'Lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
}
const ACCESS_MAX_AGE = 60 * 60            // 1 hour
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export const app = new Hono()

app.onError((err, c) => {
  console.error('[backend error]', err.message)
  return c.json({ error: err.message }, 500)
})

// ── Dev-only local db.json routes ─────────────────────────────────────────────

app.get('/api/db', async (c) => {
  try {
    const raw = await readFile(DEV_DB_PATH, 'utf8')
    return c.json(JSON.parse(raw))
  } catch {
    return c.json({ stories: [] })
  }
})

app.post('/api/db', async (c) => {
  const body = await c.req.text()
  await writeFile(DEV_DB_PATH, body, 'utf8')
  return c.json({ ok: true })
})

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post('/api/auth/signup', async (c) => {
  const { email, password, displayName } = await c.req.json<{
    email: string; password: string; displayName?: string
  }>()
  try {
    const { user, accessToken, refreshToken } = await auth.signup(email, password, displayName)
    setCookie(c, 'sb-access-token', accessToken, { ...COOKIE_OPTS, maxAge: ACCESS_MAX_AGE })
    setCookie(c, 'sb-refresh-token', refreshToken, { ...COOKIE_OPTS, maxAge: REFRESH_MAX_AGE })
    return c.json({ user })
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400)
  }
})

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()
  try {
    const { user, accessToken, refreshToken } = await auth.login(email, password)
    setCookie(c, 'sb-access-token', accessToken, { ...COOKIE_OPTS, maxAge: ACCESS_MAX_AGE })
    setCookie(c, 'sb-refresh-token', refreshToken, { ...COOKIE_OPTS, maxAge: REFRESH_MAX_AGE })
    return c.json({ user })
  } catch (e) {
    return c.json({ error: (e as Error).message }, 401)
  }
})

app.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'sb-access-token', { path: '/' })
  deleteCookie(c, 'sb-refresh-token', { path: '/' })
  return c.json({ ok: true })
})

app.get('/api/auth/me', authMiddleware, async (c) => {
  const result = await auth.getMe(c.get('userId'))
  if (!result) return c.json({ error: 'Profile not found' }, 404)
  return c.json(result)
})

app.post('/api/auth/refresh', async (c) => {
  const refreshToken = getCookie(c, 'sb-refresh-token')
  if (!refreshToken) return c.json({ error: 'No refresh token' }, 401)
  try {
    const { accessToken, refreshToken: newRefresh } = await auth.refreshSession(refreshToken)
    setCookie(c, 'sb-access-token', accessToken, { ...COOKIE_OPTS, maxAge: ACCESS_MAX_AGE })
    setCookie(c, 'sb-refresh-token', newRefresh, { ...COOKIE_OPTS, maxAge: REFRESH_MAX_AGE })
    return c.json({ ok: true })
  } catch (e) {
    return c.json({ error: (e as Error).message }, 401)
  }
})

// ── Protected routes ──────────────────────────────────────────────────────────

const api = new Hono()
api.use('*', authMiddleware)

// Profile
api.get('/profile', async (c) => {
  const profile = await db.getProfile(c.get('userId'))
  if (!profile) return c.json({ error: 'Not found' }, 404)
  return c.json(profile)
})

api.patch('/profile', async (c) => {
  const data = await c.req.json<Parameters<typeof db.upsertProfile>[1]>()
  const profile = await db.upsertProfile(c.get('userId'), data)
  return c.json(profile)
})

// Children
api.get('/children', async (c) => c.json(await db.getChildren(c.get('userId'))))

api.post('/children', async (c) => {
  const body = await c.req.json<Parameters<typeof db.createChild>[1]>()
  const child = await db.createChild(c.get('userId'), body)
  return c.json(child, 201)
})

api.patch('/children/:id', async (c) => {
  const body = await c.req.json<Parameters<typeof db.updateChild>[2]>()
  try {
    const child = await db.updateChild(c.req.param('id'), c.get('userId'), body)
    return c.json(child)
  } catch {
    return c.json({ error: 'Not found' }, 404)
  }
})

api.delete('/children/:id', async (c) => {
  await db.deleteChild(c.req.param('id'), c.get('userId'))
  return c.body(null, 204)
})

// Stories
api.get('/stories', async (c) => {
  const childId = c.req.query('childId') ?? ''
  return c.json(await db.getStories(childId, c.get('userId')))
})

api.post('/stories', async (c) => {
  const body = await c.req.json<Parameters<typeof db.createStory>[1]>()
  const story = await db.createStory(c.get('userId'), body)
  return c.json(story, 201)
})

api.get('/stories/:id', async (c) => {
  const story = await db.getStory(c.req.param('id'), c.get('userId'))
  if (!story) return c.json({ error: 'Not found' }, 404)
  return c.json(story)
})

api.delete('/stories/:id', async (c) => {
  await db.deleteStory(c.req.param('id'), c.get('userId'))
  return c.body(null, 204)
})

api.patch('/stories/:id/cover-url', async (c) => {
  const { url } = await c.req.json<{ url: string }>()
  await db.updateStoryCoverUrl(c.req.param('id'), url, c.get('userId'))
  return c.json({ ok: true })
})

api.patch('/stories/:id/images', async (c) => {
  const { imageIndex, url } = await c.req.json<{ imageIndex: number; url: string }>()
  await db.updateStoryImages(c.req.param('id'), imageIndex, url, c.get('userId'))
  return c.json({ ok: true })
})

api.patch('/stories/:id/character-context', async (c) => {
  const { characters } = await c.req.json<{ characters: unknown[] }>()
  await db.updateStoryCharacterContext(c.req.param('id'), characters, c.get('userId'))
  return c.json({ ok: true })
})

api.patch('/stories/:id/graph-node-image', async (c) => {
  const { nodeId, imageIndex, url } = await c.req.json<{ nodeId: string; imageIndex: number; url: string }>()
  await db.updateGraphNodeImage(c.req.param('id'), nodeId, imageIndex, url, c.get('userId'))
  return c.json({ ok: true })
})

// Daily story
api.get('/daily-story', async (c) => {
  const { childId, date } = c.req.query()
  if (!childId) return c.json({ error: 'childId required' }, 400)
  const assignment = await db.getTodayAssignment(childId, c.get('userId'), date ?? new Date().toISOString().slice(0, 10))
  return c.json(assignment)
})

api.post('/daily-story', async (c) => {
  const { childId, templateId, date } = await c.req.json<{
    childId: string; templateId: string; date?: string
  }>()
  const assignment = await db.createDailyStory(
    childId, c.get('userId'), templateId,
    date ?? new Date().toISOString().slice(0, 10),
  )
  return c.json(assignment, 201)
})

api.patch('/daily-story/:id/link', async (c) => {
  const { storyId } = await c.req.json<{ storyId: string }>()
  await db.linkDailyStoryToGenerated(c.req.param('id'), storyId)
  return c.json({ ok: true })
})

// Quota
api.get('/quota', async (c) => {
  const result = await db.checkQuota(c.get('userId'))
  return c.json(result)
})

api.post('/quota/increment', async (c) => {
  await db.incrementQuota(c.get('userId'))
  return c.json({ ok: true })
})

// Streaks
api.get('/streaks/:childId', async (c) => {
  const streak = await db.getStreak(c.req.param('childId'))
  return c.json(streak)
})

api.post('/streaks/:childId', async (c) => {
  const streak = await db.upsertStreak(c.req.param('childId'), c.get('userId'))
  return c.json(streak)
})

// Memory
api.get('/memory/:childId', async (c) => {
  const memory = await db.getMemoryContext(c.req.param('childId'))
  return c.json(memory)
})

api.post('/memory/:childId', async (c) => {
  const body = await c.req.json<Parameters<typeof db.upsertMemory>[2]>()
  await db.upsertMemory(c.req.param('childId'), c.get('userId'), body)
  return c.json({ ok: true })
})

api.post('/memory/:childId/trait', async (c) => {
  const { trait } = await c.req.json<{ trait: string; choiceLabel?: string }>()
  try { await db.appendTrait(c.req.param('childId'), c.get('userId'), trait) } catch { /* best effort */ }
  return c.body(null, 204)
})

// Characters
api.get('/characters/:childId', async (c) => {
  const limit = Number(c.req.query('limit') ?? 5)
  return c.json(await db.getTopCharacters(c.req.param('childId'), limit))
})

api.post('/characters', async (c) => {
  const { childId, name, description } = await c.req.json<{
    childId: string; name: string; description?: string
  }>()
  await db.upsertCharacter(childId, c.get('userId'), name, description ?? null)
  return c.json({ ok: true })
})

// Feedback
api.post('/feedback', async (c) => {
  const { storyId, childId, reaction, theme } = await c.req.json<{
    storyId: string; childId: string; reaction: string; theme?: string
  }>()
  await db.saveFeedback(storyId, childId, c.get('userId'), reaction, theme ?? null)
  return c.json({ ok: true })
})

// Stats
api.get('/stats/:childId', async (c) => {
  return c.json(await db.getDashboardStats(c.req.param('childId'), c.get('userId')))
})

// Upload
api.post('/upload/reference-image', async (c) => {
  const { storyId, base64 } = await c.req.json<{ storyId: string; base64: string }>()
  const url = await db.uploadReferenceImage(storyId, base64)
  return c.json({ url })
})

// AI Generation
api.post('/generate/story', async (c) => {
  const { childName, age, theme, options } = await c.req.json<{
    childName: string
    age: number
    theme: string
    options?: {
      tone?: string
      length?: 'short' | 'medium' | 'long'
      narrative?: boolean
      continuation?: {
        lastTitle: string; lastSummary: string; lastEnding: string
        favoriteThemes: string[]; recurringCharacters: string[]; episodeNum: number
      }
    }
  }>()

  // Linear story: continuation flow or explicit narrative mode
  if (options?.continuation || options?.narrative) {
    const story = await openai.generateStory(childName, age, theme, options)
    return c.json(story)
  }

  const branching = await openai.generateBranchingStory(childName, age, theme, options)
  return c.json({
    title: branching.title,
    summary: branching.summary,
    text: branching.story_graph.rootNode.paragraphs,
    is_branching: true,
    story_graph: branching.story_graph,
  })
})

api.post('/generate/cover-image', async (c) => {
  const { title, summary, storyId } = await c.req.json<{
    title: string; summary: string; storyId?: string
  }>()
  const url = await openai.generateCoverImage(title, summary, storyId)
  return c.json({ url })
})

api.post('/generate/scene-image', async (c) => {
  const body = await c.req.json<{
    prompt?: string
    characterProfile?: StoryCharacter[]
    nodeText?: string
    environmentStyle?: string
    choiceMade?: string
    storyId?: string
    imageIndex?: number
    referenceImageUrl?: string
    imageModel?: string
  }>()

  const prompt = (body.characterProfile && body.nodeText && body.environmentStyle)
    ? buildScenePrompt(body.characterProfile, body.nodeText, body.environmentStyle, body.choiceMade)
    : (body.prompt ?? '')

  const url = await openai.generateSceneImage(prompt, body.storyId, body.imageIndex, body.referenceImageUrl, body.imageModel)
  return c.json({ url })
})

api.post('/generate/reference-image', async (c) => {
  const { storyContext, storyId } = await c.req.json<{
    storyContext: StoryContext; storyId?: string
  }>()
  const url = await openai.generateReferenceImage(storyContext, storyId)
  return c.json({ url })
})

api.post('/generate/characters', async (c) => {
  const { title, text } = await c.req.json<{ title: string; text: string[] }>()
  const characters = await openai.extractStoryCharacters(title, text)
  return c.json({ characters })
})

// Series
api.post('/series/resolve', async (c) => {
  const { storyId, childId, title } = await c.req.json<{
    storyId: string; childId: string; title: string
  }>()
  const result = await db.resolveOrCreateSeries(storyId, childId, c.get('userId'), title)
  return c.json(result)
})

// ── Public community stories route (no auth required) ────────────────────────

app.get('/api/community/stories', (c) => {
  const region = c.req.query('region') || undefined
  const limit = Math.min(Number(c.req.query('limit') ?? 10), 20)
  return c.json(getCommunityStories(region, limit))
})

app.route('/api', api)
