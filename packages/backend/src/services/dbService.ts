import { prisma } from '../lib/prisma.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
type PrismaChar = Awaited<ReturnType<typeof prisma.recurringCharacter.findFirst>> & object
import type {
  Profile, Child, DbStory, DailyStory, UsageQuota,
  ChildStreak, RecurringCharacter,
  MemoryContext, DashboardStats, BranchingStoryGraph,
} from '@bedtime/shared'

// ── Helpers ─────────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, { monthly: number; regen: number }> = {
  free:    { monthly: 0,   regen: 0 },
  basic:   { monthly: 30,  regen: 1 },
  premium: { monthly: 9999, regen: 3 },
}

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}
function toDateStr(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null
}

function mapProfile(p: {
  id: string; displayName: string | null; locale: string
  gdprConsentAt: Date | null; plan: string; createdAt: Date
}): Profile {
  return {
    id: p.id, display_name: p.displayName, locale: p.locale,
    gdpr_consent_at: toIso(p.gdprConsentAt), plan: p.plan as Profile['plan'],
    created_at: toIso(p.createdAt)!,
  }
}

function mapChild(c: {
  id: string; parentId: string; name: string; age: number
  avatarColor: string; preferences: unknown; createdAt: Date
}): Child {
  return {
    id: c.id, parent_id: c.parentId, name: c.name, age: c.age,
    avatar_color: c.avatarColor, preferences: c.preferences as Child['preferences'],
    created_at: toIso(c.createdAt)!,
  }
}

function mapStory(s: {
  id: string; parentId: string; childId: string | null; title: string
  summary: string | null; paragraphs: string[]; theme: string | null
  coverUrl: string | null; imageUrls: string[]; isTemplate: boolean
  templateId: string | null; seriesId: string | null; episodeNum: number | null
  characterContext: unknown; isBranching: boolean; storyGraph: unknown; createdAt: Date
}): DbStory {
  return {
    id: s.id, parent_id: s.parentId, child_id: s.childId, title: s.title,
    summary: s.summary, paragraphs: s.paragraphs, theme: s.theme,
    cover_url: s.coverUrl, image_urls: s.imageUrls, is_template: s.isTemplate,
    template_id: s.templateId, series_id: s.seriesId, episode_num: s.episodeNum,
    character_context: s.characterContext,
    is_branching: s.isBranching,
    story_graph: s.storyGraph ?? null,
    created_at: toIso(s.createdAt)!,
  }
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const p = await prisma.profile.findUnique({ where: { id: userId } })
  return p ? mapProfile(p) : null
}

export async function upsertProfile(
  userId: string,
  data: { display_name?: string; gdpr_consent_at?: string },
): Promise<Profile> {
  const p = await prisma.profile.upsert({
    where: { id: userId },
    update: {
      ...(data.display_name !== undefined && { displayName: data.display_name }),
      ...(data.gdpr_consent_at !== undefined && { gdprConsentAt: new Date(data.gdpr_consent_at) }),
    },
    create: {
      id: userId,
      displayName: data.display_name ?? null,
      gdprConsentAt: data.gdpr_consent_at ? new Date(data.gdpr_consent_at) : null,
    },
  })
  return mapProfile(p)
}

// ── Children ─────────────────────────────────────────────────────────────────

export async function getChildren(userId: string): Promise<Child[]> {
  const rows = await prisma.child.findMany({
    where: { parentId: userId },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(mapChild)
}

export async function createChild(
  userId: string,
  data: { name: string; age: number; avatar_color?: string; preferences?: unknown },
): Promise<Child> {
  const c = await prisma.child.create({
    data: {
      parentId: userId,
      name: data.name,
      age: data.age,
      avatarColor: data.avatar_color ?? '#10b981',
      preferences: (data.preferences as object) ?? undefined,
    },
  })
  return mapChild(c)
}

export async function updateChild(
  id: string,
  userId: string,
  data: { name?: string; age?: number; avatar_color?: string; preferences?: unknown },
): Promise<Child> {
  const c = await prisma.child.update({
    where: { id, parentId: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.age !== undefined && { age: data.age }),
      ...(data.avatar_color !== undefined && { avatarColor: data.avatar_color }),
      ...(data.preferences !== undefined && { preferences: data.preferences as object }),
    },
  })
  return mapChild(c)
}

export async function deleteChild(id: string, userId: string): Promise<void> {
  await prisma.child.delete({ where: { id, parentId: userId } })
}

// ── Stories ───────────────────────────────────────────────────────────────────

export async function getStories(childId: string, userId: string): Promise<DbStory[]> {
  const rows = await prisma.story.findMany({
    where: { childId, parentId: userId },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(mapStory)
}

export async function getStory(id: string, userId: string): Promise<DbStory | null> {
  const s = await prisma.story.findFirst({ where: { id, parentId: userId } })
  return s ? mapStory(s) : null
}

export async function createStory(
  userId: string,
  data: {
    title: string; summary: string; paragraphs: string[]; theme: string
    cover_url?: string; image_urls?: string[]; child_id?: string
    is_template?: boolean; template_id?: string
    series_id?: string; episode_num?: number; character_context?: unknown
    is_branching?: boolean; story_graph?: unknown
  },
): Promise<DbStory> {
  const s = await prisma.story.create({
    data: {
      parentId: userId,
      childId: data.child_id ?? null,
      title: data.title,
      summary: data.summary,
      paragraphs: data.paragraphs,
      theme: data.theme,
      coverUrl: data.cover_url ?? null,
      imageUrls: data.image_urls ?? [],
      isTemplate: data.is_template ?? false,
      templateId: data.template_id ?? null,
      seriesId: data.series_id ?? null,
      episodeNum: data.episode_num ?? null,
      characterContext: (data.character_context as object) ?? undefined,
      isBranching: data.is_branching ?? false,
      storyGraph: (data.story_graph as object) ?? undefined,
    },
  })
  return mapStory(s)
}

export async function updateStoryCoverUrl(id: string, url: string, userId: string): Promise<void> {
  await prisma.story.updateMany({ where: { id, parentId: userId }, data: { coverUrl: url } })
}

export async function updateStoryImages(
  id: string,
  imageIndex: number,
  url: string,
  userId: string,
): Promise<void> {
  const story = await prisma.story.findFirst({ where: { id, parentId: userId }, select: { imageUrls: true } })
  if (!story) return
  const urls = [...story.imageUrls]
  urls[imageIndex] = url
  await prisma.story.updateMany({ where: { id, parentId: userId }, data: { imageUrls: urls } })
}

export async function updateStoryCharacterContext(
  id: string,
  characters: unknown,
  userId: string,
): Promise<void> {
  await prisma.story.updateMany({ where: { id, parentId: userId }, data: { characterContext: characters as object } })
}

export async function updateStorySeriesInfo(
  id: string,
  seriesId: string,
  episodeNum: number,
): Promise<void> {
  await prisma.story.update({ where: { id }, data: { seriesId, episodeNum } })
}

export async function updateGraphNodeImage(
  storyId: string,
  nodeId: string,
  imageIndex: number,
  url: string,
  userId: string,
): Promise<void> {
  const row = await prisma.story.findFirst({
    where: { id: storyId, parentId: userId },
    select: { storyGraph: true },
  })
  if (!row?.storyGraph) return
  const graph = row.storyGraph as unknown as BranchingStoryGraph
  if (nodeId === graph.rootNode.id) {
    graph.rootNode.sceneImages[imageIndex] = url
  } else {
    const leaf = graph.leafNodes.find(n => n.id === nodeId)
    if (leaf) leaf.sceneImages[imageIndex] = url
  }
  await prisma.story.updateMany({
    where: { id: storyId, parentId: userId },
    data: { storyGraph: graph as object },
  })
}

export async function appendTrait(childId: string, userId: string, trait: string): Promise<void> {
  const entry = `trait:${trait}`
  const existing = await prisma.childStoryMemory.findUnique({ where: { childId } })
  if (existing) {
    if ((existing.favoriteThemes as string[]).includes(entry)) return
    await prisma.childStoryMemory.update({
      where: { childId },
      data: { favoriteThemes: { push: entry } },
    })
  } else {
    await prisma.childStoryMemory.create({
      data: { childId, parentId: userId, favoriteThemes: [entry] },
    })
  }
}

// ── Daily Story ───────────────────────────────────────────────────────────────

export async function getTodayAssignment(
  childId: string,
  userId: string,
  date: string,
): Promise<DailyStory | null> {
  const row = await prisma.dailyStory.findUnique({
    where: { childId_storyDate: { childId, storyDate: new Date(date) } },
  })
  if (!row || row.parentId !== userId) return null
  return {
    id: row.id, child_id: row.childId, parent_id: row.parentId,
    story_date: toDateStr(row.storyDate)!, template_id: row.templateId,
    story_id: row.storyId, is_generated: row.isGenerated,
    created_at: toIso(row.createdAt)!,
  }
}

export async function createDailyStory(
  childId: string,
  userId: string,
  templateId: string,
  date: string,
): Promise<DailyStory> {
  const row = await prisma.dailyStory.upsert({
    where: { childId_storyDate: { childId, storyDate: new Date(date) } },
    create: { childId, parentId: userId, templateId, storyDate: new Date(date) },
    update: {},
  })
  return {
    id: row.id, child_id: row.childId, parent_id: row.parentId,
    story_date: toDateStr(row.storyDate)!, template_id: row.templateId,
    story_id: row.storyId, is_generated: row.isGenerated,
    created_at: toIso(row.createdAt)!,
  }
}

export async function linkDailyStoryToGenerated(id: string, storyId: string): Promise<void> {
  await prisma.dailyStory.update({ where: { id }, data: { storyId, isGenerated: true } })
}

// ── Usage Quota ───────────────────────────────────────────────────────────────

export async function getOrCreateQuota(userId: string, plan: string): Promise<UsageQuota> {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1)

  let row = await prisma.usageQuota.findUnique({ where: { userId } })

  if (!row) {
    row = await prisma.usageQuota.create({
      data: {
        userId, plan,
        monthlyAiLimit: limits.monthly,
        dailyRegenLimit: limits.regen,
        quotaResetDate: nextMonth,
      },
    })
  } else if (new Date(row.quotaResetDate) <= new Date()) {
    row = await prisma.usageQuota.update({
      where: { userId },
      data: { monthlyAiCount: 0, quotaResetDate: nextMonth, plan, monthlyAiLimit: limits.monthly },
    })
  }

  return {
    user_id: row.userId, plan: row.plan as UsageQuota['plan'],
    monthly_ai_count: row.monthlyAiCount, monthly_ai_limit: row.monthlyAiLimit,
    daily_regen_limit: row.dailyRegenLimit,
    quota_reset_date: toDateStr(row.quotaResetDate)!,
  }
}

export async function checkQuota(userId: string): Promise<{ allowed: boolean; count: number; limit: number }> {
  const row = await prisma.usageQuota.findUnique({ where: { userId } })
  if (!row) return { allowed: false, count: 0, limit: 0 }
  const allowed = row.monthlyAiLimit === 9999 || row.monthlyAiCount < row.monthlyAiLimit
  return { allowed, count: row.monthlyAiCount, limit: row.monthlyAiLimit }
}

export async function incrementQuota(userId: string): Promise<void> {
  await prisma.usageQuota.update({
    where: { userId },
    data: { monthlyAiCount: { increment: 1 } },
  })
}

// ── Streaks ───────────────────────────────────────────────────────────────────

export async function getStreak(childId: string): Promise<ChildStreak | null> {
  const row = await prisma.childStreak.findUnique({ where: { childId } })
  if (!row) return null
  return {
    child_id: row.childId, parent_id: row.parentId,
    current_streak: row.currentStreak, longest_streak: row.longestStreak,
    last_read_date: toDateStr(row.lastReadDate),
  }
}

export async function upsertStreak(childId: string, userId: string): Promise<ChildStreak> {
  const today = new Date().toISOString().slice(0, 10)
  const existing = await prisma.childStreak.findUnique({ where: { childId } })

  let currentStreak = 1
  let longestStreak = 1

  if (existing) {
    const last = toDateStr(existing.lastReadDate)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().slice(0, 10)

    if (last === today) {
      return {
        child_id: existing.childId, parent_id: existing.parentId,
        current_streak: existing.currentStreak, longest_streak: existing.longestStreak,
        last_read_date: last,
      }
    }
    currentStreak = last === yStr ? existing.currentStreak + 1 : 1
    longestStreak = Math.max(currentStreak, existing.longestStreak)
  }

  const row = await prisma.childStreak.upsert({
    where: { childId },
    create: { childId, parentId: userId, currentStreak, longestStreak, lastReadDate: new Date(today) },
    update: { currentStreak, longestStreak, lastReadDate: new Date(today) },
  })

  return {
    child_id: row.childId, parent_id: row.parentId,
    current_streak: row.currentStreak, longest_streak: row.longestStreak,
    last_read_date: toDateStr(row.lastReadDate),
  }
}

// ── Memory ────────────────────────────────────────────────────────────────────

export async function getMemoryContext(childId: string): Promise<MemoryContext> {
  const [mem, chars] = await Promise.all([
    prisma.childStoryMemory.findUnique({ where: { childId } }),
    prisma.recurringCharacter.findMany({
      where: { childId }, orderBy: { timesAppeared: 'desc' }, take: 3,
    }),
  ])
  return {
    last_story_title: mem?.lastStoryTitle ?? null,
    last_story_summary: mem?.lastStorySummary ?? null,
    last_story_ending: mem?.lastStoryEnding ?? null,
    favorite_themes: mem?.favoriteThemes ?? [],
    disliked_themes: mem?.dislikedThemes ?? [],
    characters: chars.map((ch: PrismaChar) => ({ name: ch.name, description: ch.description })),
  }
}

export async function upsertMemory(
  childId: string,
  userId: string,
  data: { storyId: string; summary: string; ending: string },
): Promise<void> {
  await prisma.childStoryMemory.upsert({
    where: { childId },
    create: {
      childId, parentId: userId,
      lastStoryId: data.storyId,
      lastStorySummary: data.summary,
      lastStoryEnding: data.ending,
    },
    update: {
      lastStoryId: data.storyId,
      lastStorySummary: data.summary,
      lastStoryEnding: data.ending,
    },
  })
}

// ── Characters ────────────────────────────────────────────────────────────────

export async function getTopCharacters(childId: string, limit = 3): Promise<RecurringCharacter[]> {
  const rows = await prisma.recurringCharacter.findMany({
    where: { childId }, orderBy: { timesAppeared: 'desc' }, take: limit,
  })
  return rows.map((row: PrismaChar) => ({
    id: row.id, child_id: row.childId, parent_id: row.parentId,
    name: row.name, description: row.description,
    times_appeared: row.timesAppeared, created_at: toIso(row.createdAt)!,
  }))
}

export async function upsertCharacter(
  childId: string,
  userId: string,
  name: string,
  description: string | null,
): Promise<void> {
  const existing = await prisma.recurringCharacter.findFirst({
    where: { childId, name: { equals: name, mode: 'insensitive' } },
  })
  if (existing) {
    await prisma.recurringCharacter.update({
      where: { id: existing.id },
      data: { timesAppeared: { increment: 1 }, ...(description && { description }) },
    })
  } else {
    await prisma.recurringCharacter.create({
      data: { childId, parentId: userId, name, description },
    })
  }
}

// ── Feedback ──────────────────────────────────────────────────────────────────

export async function saveFeedback(
  storyId: string,
  childId: string,
  userId: string,
  reaction: string,
  theme: string | null,
): Promise<void> {
  await prisma.storyFeedback.upsert({
    where: { storyId_childId: { storyId, childId } },
    create: { storyId, childId, parentId: userId, reaction },
    update: { reaction },
  })

  if (theme) {
    const positive = ['loved', 'more_animals', 'more_adventure'].includes(reaction)
    const field = positive ? 'favoriteThemes' : 'dislikedThemes'
    const mem = await prisma.childStoryMemory.findUnique({ where: { childId } })
    if (mem) {
      const current: string[] = (mem[field] as string[]) ?? []
      if (!current.includes(theme)) {
        await prisma.childStoryMemory.update({
          where: { childId },
          data: { [field]: [...current, theme] },
        })
      }
    }
  }
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats(childId: string, userId: string): Promise<DashboardStats> {
  const now = new Date()
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1)

  const [total, weekly, monthly, feedback] = await Promise.all([
    prisma.story.count({ where: { childId, parentId: userId } }),
    prisma.story.count({ where: { childId, parentId: userId, createdAt: { gte: weekAgo } } }),
    prisma.story.count({ where: { childId, parentId: userId, createdAt: { gte: monthAgo } } }),
    prisma.storyFeedback.findMany({
      where: { childId, reaction: 'loved' },
      include: { story: { select: { theme: true } } },
    }),
  ])

  const themeCounts: Record<string, number> = {}
  for (const f of feedback) {
    if (f.story.theme) themeCounts[f.story.theme] = (themeCounts[f.story.theme] ?? 0) + 1
  }
  const favoriteTheme = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return { totalStories: total, weeklyStories: weekly, monthlyStories: monthly, favoriteTheme }
}

// ── Story Series ──────────────────────────────────────────────────────────────

export async function resolveOrCreateSeries(
  storyId: string,
  childId: string,
  userId: string,
  title: string,
): Promise<{ seriesId: string; episodeNum: number }> {
  const existing = await prisma.story.findFirst({
    where: { id: storyId, parentId: userId },
    select: { seriesId: true, episodeNum: true },
  })

  if (existing?.seriesId) {
    const count = await prisma.story.count({ where: { seriesId: existing.seriesId } })
    return { seriesId: existing.seriesId, episodeNum: count + 1 }
  }

  const series = await prisma.storySeries.create({
    data: { childId, parentId: userId, title },
  })
  await prisma.story.update({ where: { id: storyId }, data: { seriesId: series.id, episodeNum: 1 } })
  return { seriesId: series.id, episodeNum: 2 }
}

// ── Storage (Supabase Storage via admin SDK) ──────────────────────────────────

export async function uploadReferenceImage(storyId: string, base64DataUri: string): Promise<string> {
  const BUCKET = 'story-references'
  const base64 = base64DataUri.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64, 'base64')

  const path = `${storyId}.png`
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'image/png', upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
