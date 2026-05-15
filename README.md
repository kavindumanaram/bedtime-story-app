# HushTales — AI Bedtime Story App

An AI-powered bedtime storytelling app for children. Parents create personalised stories, track reading streaks, and manage child profiles. Built as a pnpm monorepo with a React frontend and a Hono Node.js backend.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5 (strict), Vite 5, TailwindCSS 3 |
| Backend | Hono, Node.js, TypeScript |
| Database | Supabase (PostgreSQL + Auth + Storage) via Prisma |
| AI | OpenAI `gpt-4o-mini` (text) + `gpt-image-1` (images) |
| Routing | React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |
| Animations | Framer Motion |
| Testing | Vitest + @testing-library/react |
| Package manager | pnpm (workspaces) |

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | **22.22.0** | [nodejs.org](https://nodejs.org) or via `nvm install 22` |
| pnpm | **10.28.2** | `npm install -g pnpm@10.28.2` |
| Git | any | [git-scm.com](https://git-scm.com) |

> Using a different Node version? Install [nvm](https://github.com/nvm-sh/nvm) (Mac/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows), then run `nvm use 22`.

---

## 1 — Clone the repository

```bash
git clone <your-repo-url>
cd bedtime-story-app
```

---

## 2 — Install dependencies

Run this once from the repo root. It installs packages for all three workspaces (`frontend`, `backend`, `shared`).

```bash
pnpm install
```

---

## 3 — Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon / public` key (publishable)
   - `service_role` key (secret — backend only)
3. Go to **Project Settings → Database → Connection string (URI)** and copy the pooler connection string.

---

## 4 — Run database migrations

Open the **Supabase SQL Editor** and run each file below **in order** (paste content and click Run):

| Order | File | What it creates |
|---|---|---|
| 1 | `supabase/migrations/20240101_initial_schema.sql` | `profiles`, `children`, `stories`, `play_sessions`, RLS, user trigger |
| 2 | `supabase/migrations/20260502_add_child_preferences.sql` | `preferences` JSONB on `children` |
| 3 | `supabase/migrations/20260502_daily_story_system.sql` | `plan` column, `daily_stories`, `usage_quotas`, `child_streaks` |
| 4 | `supabase/migrations/20260502_story_memory_system.sql` | `story_series`, `child_story_memory`, `recurring_characters`, `story_feedback` |
| 5 | `supabase/migrations/20260503_story_character_context.sql` | Character context columns on `stories` |
| 6 | `supabase/migrations/20260507_storage_bucket.sql` | `story-references` Storage bucket + policies |
| 7 | `supabase/migrations/20260508_branching_story.sql` | Branching interactive story support |

---

## 5 — Configure environment variables

### Frontend — create `.env.local` in the **repo root**

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

### Backend — create `packages/backend/.env`

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

> **Security:** Never put `OPENAI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in frontend env vars. They are backend-only.

---

## 6 — Start the development servers

```bash
pnpm dev
```

This starts both servers concurrently:

| Server | URL | What it does |
|---|---|---|
| Frontend (Vite) | http://localhost:5173 | React SPA with hot reload |
| Backend (Hono) | http://localhost:3000 | REST API + AI generation |

The Vite dev server automatically proxies `/api/*` requests to the backend, so the frontend never needs to know the backend port.

Open **http://localhost:5173** in your browser.

---

## Available Commands

```bash
# From repo root
pnpm dev          # Start frontend + backend concurrently
pnpm build        # Build frontend for production (outputs dist/)
pnpm test         # Run frontend tests in watch mode
pnpm test:run     # Run frontend tests once and exit (71 tests)

# Run a single package
pnpm --filter @bedtime/backend dev     # Backend only (hot reload via tsx)
pnpm --filter @bedtime/frontend dev    # Frontend only
pnpm --filter @bedtime/frontend build  # Frontend production build
```

---

## Project Structure

```
bedtime-story-app/
├── packages/
│   ├── frontend/              # React SPA (Vite)
│   │   └── src/
│   │       ├── api/           # Backend call wrappers (openaiApi, storyDb, etc.)
│   │       ├── components/    # Reusable UI components
│   │       ├── contexts/      # AuthContext, ThemeContext, PlayerContext
│   │       ├── data/          # Mock data + story templates
│   │       ├── hooks/         # Custom React hooks
│   │       ├── lib/           # apiFetch helper, template engine
│   │       └── pages/         # Page components (one per route)
│   ├── backend/               # Hono API server (Node.js)
│   │   └── src/
│   │       ├── middleware/    # Auth middleware (JWT cookie validation)
│   │       ├── services/      # Business logic (auth, db, openai, prompts)
│   │       ├── lib/           # Supabase admin client
│   │       └── app.ts         # All 34+ route definitions
│   └── shared/                # Types shared by frontend + backend
│       └── index.ts           # StoryNode, FeedbackReaction
├── supabase/
│   └── migrations/            # SQL migration files (run in order)
├── data/
│   └── db.json                # Dev-only file-based story store (gitignored)
├── sst.config.ts              # SST v3 AWS infrastructure (future deploy)
├── .env.local                 # Frontend env vars (create this — gitignored)
└── package.json               # Root workspace config
```

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Email + password or Google OAuth |
| `/onboarding` | Onboarding | GDPR consent + add first child (shown once) |
| `/` | Home | Hero story, user stories grid, community stories |
| `/library` | Library | Story cards with per-child filter pills |
| `/create` | Create | AI story generation (New / Continue / Character modes) |
| `/player/:id` | Player | Full-screen story player (direct URL / bookmarks) |
| `/billing` | Billing | Free / Basic / Premium plan cards + invoice history |
| `/settings` | Settings | Notification, playback, and appearance preferences |
| `/profile` | Profile | Parent info + children CRUD with preferences |
| `/profiles` | ProfileSelection | Child switcher shown after login |

Stories in Library are opened via a Netflix-style overlay player — the URL does not change.

---

## Plan Tiers

| Plan | Monthly AI stories | Cover images | Nightly story |
|---|---|---|---|
| `free` | 0 | No | Template only |
| `basic` | 30 | No | AI text |
| `premium` | Unlimited | Yes | AI text + image |

---

## Auth Flow

- Auth uses **HTTP-only cookies** (`sb-access-token`, `sb-refresh-token`) set by the backend.
- The frontend never holds raw tokens.
- On 401, `apiFetch` automatically refreshes the session and retries the request.
- `AuthGuard` redirects unauthenticated users to `/login` and users without GDPR consent to `/onboarding`.

---

## Running Tests

```bash
pnpm test:run
```

71 tests across 7 files covering API wrappers, hooks, and components.

---

## Common Issues

**`Cannot find module` errors after install**
```bash
pnpm install --force
```

**Backend not starting — missing env vars**
Ensure `packages/backend/.env` exists with all four variables filled in.

**Stories not saving**
The backend must be running (`pnpm dev`) for `data/db.json` writes to work. If the backend is down, the frontend will show an error on story generation.

**Supabase auth errors on signup**
Make sure migration `20240101_initial_schema.sql` has been applied — it creates the `handle_new_user` trigger that auto-creates the `profiles` row.

**`pnpm` command not found**
```bash
npm install -g pnpm@10.28.2
```
