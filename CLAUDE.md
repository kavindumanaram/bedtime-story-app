# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install           # Install all workspace dependencies (run from repo root)
pnpm dev               # Start backend (port 3000) + frontend (port 5173) concurrently
pnpm build             # Build frontend production dist/
pnpm test              # Run frontend tests in watch mode (Vitest)
pnpm test:run          # Run frontend tests once and exit

# Run a single package
pnpm --filter @bedtime/backend dev     # Backend only (tsx watch, hot reload)
pnpm --filter @bedtime/frontend dev    # Frontend only
```

TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`, strict null checks) is enabled across all packages. No lint script is configured.

## Environment

**Frontend** — create `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

**Backend** — `packages/backend/.env` (already populated in the repo, do not commit changes):

```
DATABASE_URL=postgresql://...          # Supabase pooler connection string
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...                  # Server-side only — never in the frontend
```

The OpenAI API key lives exclusively on the backend. `VITE_OPENAI_API_KEY` no longer exists.

## Architecture

**HushTales** is a pnpm monorepo (`frontend`, `backend`, `shared`). The React SPA never calls OpenAI or Supabase directly — all AI generation, auth, and database work goes through the Hono backend (port 3000). The Vite dev server proxies `/api/*` to it. Story text is persisted in `data/db.json` (dev) and Supabase `stories` table (prod). Images are generated server-side and stored in Supabase Storage. SST v3 (`sst.config.ts`) defines the future AWS infrastructure (S3 + Lambda).

### Tech Stack

- **React 18** + **TypeScript 5** (strict mode) + **Vite 5**
- **React Router 6** for client-side routing
- **TailwindCSS 3** for styling (custom primary green `#10b981`, navy `#1e293b`; dark mode via `darkMode: 'class'`)
- **Supabase** (`@supabase/supabase-js`) — Auth + PostgreSQL + Row-Level Security
- **Recharts** for dashboard charts, **Lucide React** for icons
- **Vitest** + **@testing-library/react** for unit and component tests

### Routing (`src/App.tsx`)

Routes `/login` and `/onboarding` are public. All others are wrapped in `AuthGuard`.

| Route         | Page       | Purpose                                                                    |
| ------------- | ---------- | -------------------------------------------------------------------------- |
| `/login`      | Login      | Sign in / create account (email+password, Google OAuth)                    |
| `/onboarding` | Onboarding | GDPR consent + add first child (shown once after sign-up)                  |
| `/dashboard`  | Dashboard  | KPIs, Tonight's Story card, Continue card, charts                          |
| `/library`    | Library    | Card grid of stories; per-child filter pills; navigates to Player on click |
| `/create`     | Create     | Story generation with mode selector (New / Continue / Character)           |
| `/player/:id` | Player     | Full-screen story player with feedback footer; sidebar hidden              |
| `/billing`    | Billing    | Free / Basic / Premium plan cards, invoice history                         |
| `/settings`   | Settings   | Notification, playback, appearance (theme) prefs                           |
| `/profile`    | Profile    | Parent info, full children CRUD with preferences UI                        |

### Auth Flow

Auth uses **HTTP-only cookies** (`sb-access-token`, `sb-refresh-token`) set by the Hono backend. The frontend never holds raw tokens.

1. `AuthProvider` (wraps entire app) — calls `GET /api/auth/me` on mount to restore session; holds `profile`, `children[]`, `activeChild` state.
2. `apiFetch` helper in `src/lib/api.ts` — on 401, automatically POSTs to `/api/auth/refresh` then retries the original request.
3. `AuthGuard` — if no session → `/login`; if no `gdpr_consent_at` → `/onboarding`; otherwise renders children.
4. `Onboarding` — Step 1: 3 GDPR checkboxes → upsert profile row with `gdpr_consent_at`. Step 2: add first child → `navigate("/create")`.
5. `ThemeProvider` — stores `"light" | "dark" | "auto"` in `localStorage`, toggles `dark` CSS class on `<html>`.

### Active Child

`useAuth().activeChild` holds the currently selected child. On load it is restored from `localStorage` (`husht_active_child_id`), falling back to the first child in the list. `setActiveChild(child)` updates state and persists the id to `localStorage`.

The **Sidebar** renders a child-switcher section showing each child as a coloured avatar chip. Clicking a chip calls `setActiveChild` instantly; the **Dashboard** resets all state immediately on `activeChild.id` change then re-fetches.

The **Create** page uses `activeChild` automatically — no manual name/age input. The **Library** page shows per-child filter pills. The **Dashboard** shows a "Showing stats for [name]" subtitle.

### Plan Tiers

| Plan      | Monthly AI stories | Cover images | Nightly story   |
| --------- | ------------------ | ------------ | --------------- |
| `free`    | 0                  | No           | Template only   |
| `basic`   | 30                 | No           | AI text         |
| `premium` | Unlimited          | Yes          | AI text + image |

Plan is stored in `profiles.plan`. Quota counts live in `usage_quotas` (reset every 30 days). Exceeding the limit throws `PlanLimitError` which the Dashboard / Create pages catch and show an upgrade banner.

### Daily Story System

- `getTonightAssignment(child, parentId)` — returns or creates today's `daily_stories` row; uses a deterministic template (hash of child.id + ISO date) so the title is known before any AI call.
- `triggerRead(assignment, child, profile)` — called when "Read Now" is tapped. Free: renders template locally. Basic/Premium: calls OpenAI → saves to `stories` → returns `story_id`. Same-day cache hit returns existing story.
- Template title is computed **locally** in Dashboard from `pickTonightTemplateWithMemory` before Supabase responds, so it appears instantly.
- Dashboard gracefully falls back to a virtual local assignment if `daily_stories` table doesn't exist.

### Memory & Continuation System

- `child_story_memory` — one row per child: last story title / summary / ending, favorite/disliked themes. Written by `updateMemoryAfterRead`.
- `recurring_characters` — named characters per child, ranked by `times_appeared`. Written by `upsertCharacter`.
- `story_feedback` — one reaction per (story, child). Positive reactions push to `favorite_themes`; `too_scary` pushes to `disliked_themes`.
- `triggerContinuation(child, profile)` — builds continuation prompt from memory context (~90 extra tokens), saves new story with optional `series_id + episode_num`.
- All memory/series writes are **best-effort** (non-blocking) so failures never block story navigation.

### Data Flow

1. **Mock data** — `src/data/mock.ts` holds sample stories and static chart arrays used by Dashboard.
2. **Story generation** — `src/api/openaiApi.ts` (thin shim) → `POST /api/generate/story` → backend calls OpenAI `gpt-4o-mini` → returns `{ title, summary, text[] }`.
3. **Image generation** — backend calls OpenAI `gpt-image-1`, uploads the result to Supabase Storage bucket `story-references` with path prefixes `covers/`, `scenes/`, `refs/`, returns a public URL. Cover images: Premium plan only. Scene images: generated progressively by `useProgressiveImages` hook. Character reference images: generated once per story for visual consistency.
4. **Persistence (dev)** — `src/api/storyDb.ts` calls `GET /api/db` / `POST /api/db`, served by the Hono backend reading/writing `data/db.json` at the repo root.
5. **Persistence (prod)** — `stories` table in Supabase via Prisma. Daily story system and memory use their own Supabase tables (see migrations).
6. **Create page** — Three modes: New Story (theme input), Continue Previous (reads memory), Favourite Character (chip → pre-fills theme). Saves story locally with `id: String(Date.now())` (timestamp, not UUID) then navigates. Cover image + character context written best-effort in background. Backend calls are guarded with UUID_RE — timestamp IDs only touch `data/db.json`.
7. **Player** — `loadStory(id)` checks `data/db.json` first; on miss, falls through to `GET /api/stories/:id` only if the id is a valid UUID. Renders 3-phase ritual (Preparation → CartoonStoryIntro → Player) for new stories, brief `CinematicIntro` for revisited Library stories. Progressive scene images via `useProgressiveImages`. Streak updated on last page. Feedback footer shown on last page.

### File-based DB (`data/db.json`)

The Hono backend serves two unauthenticated dev-only routes:

- `GET /api/db` — reads `data/db.json` at the repo root, returns `{ stories: [] }` if missing
- `POST /api/db` — writes request body to `data/db.json`

`data/db.json` is gitignored. Only works while the backend is running (`pnpm dev`).

### Supabase Database Schema

All migrations live in `supabase/migrations/`. Run them **in filename order** against your Supabase project — paste into the SQL Editor or use `supabase db push`.

> **Important:** The daily story system, memory/continuation, and streak features require migrations `20260502_daily_story_system.sql` and `20260502_story_memory_system.sql` to be applied. Without them, the app degrades gracefully (template title still shows, story generation still works) but `daily_stories` tracking, streak counts, and "Continue Previous" will not persist.

| File                                 | Description                                                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `20240101_initial_schema.sql`        | Creates `profiles`, `children`, `stories`, `play_sessions`, RLS policies, `handle_new_user` trigger                     |
| `20260502_add_child_preferences.sql` | Adds `preferences` JSONB to `children` (interests, tone, length)                                                        |
| `20260502_daily_story_system.sql`    | `plan` column on `profiles`; `daily_stories`, `usage_quotas`, `child_streaks` tables; RLS; quota trigger                |
| `20260502_story_memory_system.sql`   | `story_series`, `child_story_memory`, `recurring_characters`, `story_feedback` tables; series columns on `stories`; RLS |

> **Note:** The `handle_new_user` trigger automatically creates a `profiles` row when a user signs up, preventing the `gdpr_consent_at` upsert from failing silently in Onboarding.

### Key Files — Frontend (`packages/frontend/src/`)

| File                            | Purpose                                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/api.ts`                    | `apiFetch` — fetch wrapper that sends cookies, auto-refreshes on 401                                                                                                                        |
| `lib/templateEngine.ts`         | `renderTemplate`, `pickTonightTemplate`, `pickTonightTemplateWithMemory`, `pickContinuationTemplate`                                                                                        |
| `data/storyTemplates.ts`        | 40 static story templates (8 categories × 5 stories); used for Free plan and local title preview                                                                                            |
| `contexts/AuthContext.tsx`      | `AuthProvider` + `useAuth()` — profile, children, activeChild, setActiveChild; bootstraps by calling `GET /api/auth/me`                                                                     |
| `contexts/ThemeContext.tsx`     | `ThemeProvider` + `useTheme()` — light/dark/auto, persists to localStorage                                                                                                                  |
| `api/openaiApi.ts`              | Thin shims: `generateStory`, `generateCoverImage`, `generateSceneImage`, `generateReferenceImage`, `extractStoryCharacters` — all delegate to backend via `apiFetch`                        |
| `api/sceneImageApi.ts`          | Pure functions: `buildStoryContext`, `buildConsistentSceneSlots`, `getFallbackImage` — scene image slot construction                                                                         |
| `api/storyDb.ts`                | `saveStory` / `loadStories` / `loadStory` / `updateStoryImages` / `updateStoryCoverUrl` / `updateStoryCharacterContext` — CRUD over `/api/db`; backend PATCH calls are UUID-guarded         |
| `api/dailyStory.ts`             | `getTonightAssignment`, `triggerRead`, `updateStreak`, `PlanLimitError`                                                                                                                     |
| `api/storyMemory.ts`            | `getMemoryContext`, `updateMemoryAfterRead`, `saveFeedback`, `upsertCharacter`, `getChildStreak`, `getTopCharacters`                                                                        |
| `api/storyContinuation.ts`      | `triggerContinuation` — AI or template continuation with series tracking                                                                                                                    |
| `pages/Login.tsx`               | Sign in / create account with email+password and Google OAuth                                                                                                                               |
| `pages/Onboarding.tsx`          | Two-step: GDPR consent → add first child                                                                                                                                                    |
| `pages/Create.tsx`              | Story generation; mode selector (New / Continue Previous / Favourite Character); saves story with timestamp ID locally; UUID-guarded backend writes                                         |
| `pages/Profile.tsx`             | Parent info + full children CRUD (add/edit/delete) with preferences UI                                                                                                                      |
| `pages/Player.tsx`              | 3-phase ritual for new stories; `CinematicIntro` for Library stories; TTS narration; progressive scene images; streak on last page; feedback footer; UUID guard before backend fetch        |
| `pages/Dashboard.tsx`           | Tonight's Story card (title from local template, instant); Continue card; streak KPIs; plan quota badge                                                                                     |
| `vite.config.ts` (frontend)     | Vite config + `/api` proxy to `@bedtime/backend` on port 3000                                                                                                                               |

### Key Files — Backend (`packages/backend/src/`)

| File                                      | Purpose                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `app.ts`                                  | Hono app — 34+ routes: `/api/db` (dev), auth, all protected REST + AI generation endpoints                               |
| `middleware/auth.ts`                      | `authMiddleware` — extracts JWT from `sb-access-token` cookie, validates via Supabase Admin, sets `userId` on context     |
| `services/authService.ts`                 | `signup`, `login`, `getMe`, `refreshSession` via Supabase Admin Auth                                                     |
| `services/dbService.ts`                   | Full Prisma service layer for all 11 tables — every query filters by `parentId = userId` (data isolation replacing RLS)  |
| `services/openaiService.ts`               | `generateStory` (`gpt-4o-mini`), `generateCoverImage`, `generateSceneImage`, `generateReferenceImage`, `extractStoryCharacters` (`gpt-image-1`); uploads to Supabase Storage `story-references` bucket under `covers/`, `scenes/`, `refs/` |
| `services/promptBuilderService.ts`        | `buildScenePrompt` — contextual prompt with locked character descriptions + Action/Background/Composition suffix for image diversity |
| `lib/supabaseAdmin.ts`                    | Supabase Admin client (service-role key) used for auth validation and Storage uploads                                     |

### Key Files — Shared

| File                       | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| `packages/shared/index.ts` | `StoryNode` interface + `FeedbackReaction` type used by both packages |
| `sst.config.ts`            | SST v3 infrastructure — `StoryAssets` S3 + `StoryApi` Lambda (future) |

### Key Components

- **`LargeStoryPlayer`** — Full-screen image carousel with Ken Burns animation, parallax, direction-aware transitions, shimmer placeholders for loading images, sparkle tap effects, `nextPageGuardCount` prop (disables Next while early pages still generating), and ambient music toggle. Fullscreen only triggers when its own container is the fullscreen element.
- **`BedtimePreparationScreen`** — Phase 1 ritual overlay (35 s default). Waits for both `minDurationMs` AND `readyToAdvance` before auto-completing. Lullaby via Web Audio API.
- **`CartoonStoryIntro`** — Phase 2 movie-style intro (18 s, 4 acts). Enters Act 5 waiting state if images not ready after acts complete. Background image fades in once first scene image arrives.
- **`CinematicIntro`** — Brief intro for revisited Library stories (5 s). Calls `document.exitFullscreen()` when dismissing so the player returns to normal mode.
- **`AudioControls`** — TTS play/pause bar with speed selector and narrator picker. Always visible when `hasParagraphs` (narrates `text[]` falling back to `summary`).
- **`GenerationProgress`** — Writing phase loading overlay with rotating messages and star field.
- **`Sidebar`** — Child switcher (coloured avatar chips) + nav links + parent sign-out. Hidden on `/player` routes. Has `dark:` variants.
- **`Topbar`** — Search bar + user avatar. Has `dark:` variants.
- **`Card`** — White card wrapper; has `dark:bg-gray-800` variant.
- **`Badge`** — Pill badges with `new`, `popular`, `downloaded`, `default` variants.
- **`StoryCard`** (inline in `Library.tsx`) — Card with cover image using `pickThumb` fallback chain (`coverImage → images[0] → gradient placeholder`), title, summary, child/theme/age metadata.

### Dark Mode

Tailwind is configured with `darkMode: 'class'`. `ThemeProvider` toggles the `dark` class on `<html>`. Currently `dark:` variants are applied to structural shell components (Sidebar, Topbar, Card, main bg). Page-level content still needs `dark:` variants added.

### Testing

Tests live alongside source files (`*.test.ts` / `*.test.tsx`). Run: `pnpm test:run` (71 tests across 7 files).

- `src/api/openaiApi.test.ts` — mocks `fetch`; covers all 5 generate functions including regression: `generateSceneImage` body must use `referenceImageUrl` not `image`
- `src/api/storyDb.test.ts` — mocks `fetch`; covers all CRUD including regression: `updateStoryCoverUrl` and `updateStoryCharacterContext` must not call backend with non-UUID (timestamp) IDs
- `src/hooks/useProgressiveImages.test.ts` — pure-logic tests for scene image fill, `nextPageGuardCount` navigation guard, and StrictMode deduplication
- `src/components/BedtimePreparationScreen.test.tsx` — timer-based gating via `vi.useFakeTimers()`
- `src/components/LargeStoryPlayer.test.tsx` — carousel rendering and navigation
- `src/pages/Player.test.tsx` — component tests + regression: Player must not call backend for non-UUID story IDs
- `src/pages/Library.test.tsx` — pure-logic tests for `pickThumb` fallback chain

### Deployment

GitHub Actions (`.github/workflows/prod.yml`) triggers on PRs merged to `master`: builds with Yarn 4.12.0, then deploys `dist/` via SSH to `145.79.3.179`. The file-based db is dev-only; production uses Supabase for auth and story persistence.
