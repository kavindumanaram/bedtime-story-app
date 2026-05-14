/**
 * One-time migration: data/db.json → Supabase stories table
 *
 * Run from repo root:
 *   pnpm --filter @bedtime/backend exec tsx src/scripts/migrate-db-json.ts
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_JSON_PATH = resolve(__dirname, '../../../../data/db.json')

// ── Load credentials from backend .env ────────────────────────────────────────
function getEnvVar(raw: string, key: string): string {
  const match = raw.match(new RegExp(`^${key}="?([^"\n]+)"?`, 'm'))
  if (!match) throw new Error(`Missing ${key} in .env`)
  return match[1].trim()
}

const envRaw = readFileSync(resolve(__dirname, '../../.env'), 'utf-8')
const DATABASE_URL          = getEnvVar(envRaw, 'DATABASE_URL')
const SUPABASE_URL          = getEnvVar(envRaw, 'SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = getEnvVar(envRaw, 'SUPABASE_SERVICE_ROLE_KEY')

// ── Clients ───────────────────────────────────────────────────────────────────
const prisma    = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } })
const supabase  = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── db.json story shape (local format) ───────────────────────────────────────
interface LocalStory {
  id: string
  title: string
  summary?: string
  text: string[]
  coverImage?: string
  images?: string[]
  childName: string
  age: number
  theme: string
  createdAt: string
  characterContext?: unknown
  is_branching?: boolean
  story_graph?: unknown
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Read stories from db.json
  let localStories: LocalStory[] = []
  try {
    const raw = readFileSync(DB_JSON_PATH, 'utf-8')
    localStories = JSON.parse(raw).stories ?? []
  } catch {
    console.error('❌  Could not read data/db.json — make sure the backend is stopped and the file exists.')
    process.exit(1)
  }

  console.log(`\n📖  Found ${localStories.length} stories in db.json\n`)

  // 2. List all users via Supabase Admin Auth
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers()
  if (usersErr || !usersData?.users?.length) {
    console.error('❌  Could not list Supabase users:', usersErr?.message)
    process.exit(1)
  }
  console.log(`👥  Found ${usersData.users.length} user(s) in Supabase Auth`)

  // 3. Load all children from Supabase (via Prisma)
  const allChildren = await prisma.child.findMany({ select: { id: true, parentId: true, name: true } })
  console.log(`👧  Found ${allChildren.length} child record(s) in Supabase\n`)

  // Group stories by childName
  const byChild = new Map<string, LocalStory[]>()
  for (const s of localStories) {
    const key = s.childName.trim().toLowerCase()
    byChild.set(key, [...(byChild.get(key) ?? []), s])
  }

  let inserted = 0
  let skipped  = 0

  for (const [childNameKey, stories] of byChild) {
    // Find matching child record (case-insensitive)
    const childRow = allChildren.find(c => c.name.trim().toLowerCase() === childNameKey)

    if (!childRow) {
      console.warn(`⚠️   No child named "${childNameKey}" found in Supabase — skipping ${stories.length} story/ies`)
      skipped += stories.length
      continue
    }

    console.log(`\n📚  Migrating ${stories.length} story/ies for "${childRow.name}" (child ${childRow.id})`)

    for (const story of stories) {
      try {
        const newId = randomUUID()

        await prisma.story.create({
          data: {
            id:               newId,
            parentId:         childRow.parentId,
            childId:          childRow.id,
            title:            story.title,
            summary:          story.summary ?? null,
            paragraphs:       story.text,
            theme:            story.theme ?? null,
            coverUrl:         story.coverImage || null,
            imageUrls:        story.images ?? [],
            isTemplate:       false,
            characterContext: (story.characterContext as object) ?? undefined,
            isBranching:      story.is_branching ?? false,
            storyGraph:       (story.story_graph as object) ?? undefined,
            createdAt:        new Date(story.createdAt),
          },
        })

        console.log(`  ✅  "${story.title}"  [local id: ${story.id} → new UUID: ${newId}]`)
        inserted++
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`  ❌  "${story.title}" — ${msg}`)
        skipped++
      }
    }
  }

  console.log(`\n🎉  Done — ${inserted} inserted, ${skipped} skipped\n`)
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Fatal:', err)
  prisma.$disconnect()
  process.exit(1)
})
