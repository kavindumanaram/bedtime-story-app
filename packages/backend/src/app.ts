import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { authMiddleware } from './middleware/auth.js'
import * as auth from './services/authService.js'
import * as db from './services/dbService.js'

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
  console.error('[backend error]', err)
  return c.json({ error: err.message }, 500)
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

// Series
api.post('/series/resolve', async (c) => {
  const { storyId, childId, title } = await c.req.json<{
    storyId: string; childId: string; title: string
  }>()
  const result = await db.resolveOrCreateSeries(storyId, childId, c.get('userId'), title)
  return c.json(result)
})

app.route('/api', api)
