# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install         # Install dependencies
npm run dev         # Start dev server at http://localhost:5173
npm run build       # Build production dist/
npm run preview     # Preview production build locally
npm run test        # Run tests in watch mode (Vitest)
npm run test:run    # Run tests once and exit
```

TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`, strict null checks) is enabled. No lint script is configured.

## Environment

Create `.env.local` in the project root (no quotes, no spaces around `=`):

```
VITE_OPENAI_API_KEY=sk-...
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

Vite exposes `VITE_` prefixed variables to the browser via `import.meta.env`. All keys and model names are centralised in `src/config.ts`. The Supabase client tries `VITE_SUPABASE_PUBLISHABLE_KEY` first, then falls back to `VITE_SUPABASE_ANON_KEY`.

## Architecture

**HushTales** is a React + TypeScript SPA that calls OpenAI APIs and Supabase directly from the browser. There is no dedicated backend server. Story data is persisted in `data/db.json` via a Vite dev server middleware (dev-only) and in Supabase `stories` table (production target).

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

1. `AuthProvider` (wraps entire app) — holds `session`, `profile`, `children[]`, `activeChild` state; listens to `supabase.auth.onAuthStateChange`.
2. `AuthGuard` — if no session → `/login`; if no `gdpr_consent_at` → `/onboarding`; otherwise renders children.
3. `Onboarding` — Step 1: 3 GDPR checkboxes → `upsert` profile row with `gdpr_consent_at`. Step 2: add first child → `navigate("/create")`.
4. `ThemeProvider` — stores `"light" | "dark" | "auto"` in `localStorage`, toggles `dark` CSS class on `<html>`.

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
2. **Story generation** — `src/api/openaiApi.ts` → `generateStory()` calls OpenAI chat completions (model: `gpt-4o-mini`) → returns `{ title, summary, text[] }`. Accepts optional `continuation` context for episode continuity.
3. **Image generation** — `src/api/openaiApi.ts` → `generateCoverImage()` calls OpenAI images (model: `gpt-image-1`) → returns base64 data URL. Premium plan only.
4. **Persistence (dev)** — `src/api/storyDb.ts` calls `GET /api/db` / `POST /api/db`, handled by a Vite middleware plugin in `vite.config.ts` that reads/writes `data/db.json`.
5. **Persistence (prod target)** — `stories` table in Supabase. Daily story system and memory use their own Supabase tables (see migrations).
6. **Create page** — Three modes: New Story (theme input), Continue Previous (reads memory), Favourite Character (chip → pre-fills theme). All modes: idle → writing → painting → done → navigate to Player.
7. **Player** — `loadStory(id)` checks `data/db.json`; renders `LargeStoryPlayer` carousel + text reader. Streak updated on last page. Feedback footer shown on last page.

### File-based DB (`data/db.json`)

The Vite `db-api` plugin in `vite.config.ts` adds two middleware routes:

- `GET /api/db` — reads `data/db.json`, returns `{ stories: [] }` if missing
- `POST /api/db` — writes request body to `data/db.json`

`data/db.json` is gitignored (large base64 images). Only works while `npm run dev` is running.

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

### Key Files

| File                            | Purpose                                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/config.ts`                 | OpenAI API key, model names, image size — single source of truth                                                                                                                            |
| `src/lib/supabase.ts`           | Supabase client singleton + all TypeScript types (`Profile`, `Child`, `ChildPreferences`, `DbStory`, `DailyStory`, `ChildStreak`, `StorySeries`, `ChildStoryMemory`, `FeedbackReaction`, …) |
| `src/lib/templateEngine.ts`     | `renderTemplate`, `pickTonightTemplate`, `pickTonightTemplateWithMemory`, `pickContinuationTemplate`                                                                                        |
| `src/data/storyTemplates.ts`    | 40 static story templates (8 categories × 5 stories); used for Free plan and local title preview                                                                                            |
| `src/contexts/AuthContext.tsx`  | `AuthProvider` + `useAuth()` — session, profile, children, activeChild, setActiveChild                                                                                                      |
| `src/contexts/ThemeContext.tsx` | `ThemeProvider` + `useTheme()` — light/dark/auto, persists to localStorage                                                                                                                  |
| `src/api/openaiApi.ts`          | `generateStory(name, age, theme, options?)` (supports `continuation` context) + `generateCoverImage()`                                                                                      |
| `src/api/storyDb.ts`            | `saveStory()` / `loadStories()` / `loadStory(id)` — CRUD over `/api/db` (dev)                                                                                                               |
| `src/api/dailyStory.ts`         | `getTonightAssignment`, `triggerRead`, `updateStreak`, `PlanLimitError`                                                                                                                     |
| `src/api/storyMemory.ts`        | `getMemoryContext`, `updateMemoryAfterRead`, `saveFeedback`, `upsertCharacter`, `getChildStreak`, `getTopCharacters`                                                                        |
| `src/api/storyContinuation.ts`  | `triggerContinuation` — AI or template continuation with series tracking                                                                                                                    |
| `src/pages/Login.tsx`           | Sign in / create account with email+password and Google OAuth                                                                                                                               |
| `src/pages/Onboarding.tsx`      | Two-step: GDPR consent → add first child                                                                                                                                                    |
| `src/pages/Create.tsx`          | Story generation; mode selector (New / Continue Previous / Favourite Character); uses `activeChild` automatically                                                                           |
| `src/pages/Profile.tsx`         | Parent info + full children CRUD (add/edit/delete) with preferences UI                                                                                                                      |
| `src/pages/Player.tsx`          | Full-screen story player; streak updated on last page; feedback footer on last page                                                                                                         |
| `src/pages/Dashboard.tsx`       | Tonight's Story card (title from local template, instant); Continue card; streak KPIs; plan quota badge                                                                                     |
| `vite.config.ts`                | Vite config + inline `db-api` middleware plugin for file-based persistence                                                                                                                  |

### Key Components

- **`LargeStoryPlayer`** — Full-screen image carousel with text overlays, TTS via Web Speech API, fullscreen toggle, and page navigation.
- **`Sidebar`** — Child switcher (coloured avatar chips) + nav links + parent sign-out. Hidden on `/player` routes. Has `dark:` variants.
- **`Topbar`** — Search bar + user avatar. Has `dark:` variants.
- **`Card`** — White card wrapper; has `dark:bg-gray-800` variant.
- **`Badge`** — Pill badges with `new`, `popular`, `downloaded`, `default` variants.
- **`StoryCard`** (inline in `Library.tsx`) — Card with cover image, title, summary, child/theme/age metadata.

### Dark Mode

Tailwind is configured with `darkMode: 'class'`. `ThemeProvider` toggles the `dark` class on `<html>`. Currently `dark:` variants are applied to structural shell components (Sidebar, Topbar, Card, main bg). Page-level content still needs `dark:` variants added.

### Testing

Tests live alongside source files (`*.test.ts` / `*.test.tsx`):

- `src/api/openaiApi.test.ts` — mocks `fetch`, tests URL, headers, response parsing, error handling
- `src/api/storyDb.test.ts` — mocks `fetch`, tests all CRUD operations against `/api/db`
- `src/pages/Player.test.tsx` — component tests using `@testing-library/react`, mocks `openaiApi`, `storyDb`, `AuthContext`, `dailyStory`, and `storyMemory` modules

### Deployment

GitHub Actions (`.github/workflows/prod.yml`) triggers on PRs merged to `master`: builds with Yarn 4.12.0, then deploys `dist/` via SSH to `145.79.3.179`. The file-based db is dev-only; production uses Supabase for auth and story persistence.
