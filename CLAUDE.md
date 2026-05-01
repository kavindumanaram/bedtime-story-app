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
```

Vite exposes `VITE_` prefixed variables to the browser via `import.meta.env`. All keys and model names are centralised in `src/config.ts`.

## Architecture

**HushTales** is a React + TypeScript SPA that calls OpenAI APIs directly from the browser. There is no dedicated backend server. Story data is persisted in `data/db.json` inside the project via a Vite dev server middleware.

### Tech Stack

- **React 18** + **TypeScript 5** (strict mode) + **Vite 5**
- **React Router 6** for client-side routing
- **TailwindCSS 3** for styling (custom primary green `#10b981`, navy `#1e293b`)
- **Recharts** for dashboard charts, **Lucide React** for icons
- **Vitest** + **@testing-library/react** for unit and component tests

### Routing (`src/App.tsx`)

Six routes, root redirects to `/dashboard`:

| Route | Page | Purpose |
|-------|------|---------|
| `/dashboard` | Dashboard | KPIs, charts, featured story cards |
| `/library` | Library | Card grid of AI-generated stories loaded from `storyDb`; skeleton loading, empty state with create CTA, navigates to Player on click |
| `/player/:id` | Player | Story player + AI generation form; sidebar hidden on this route for full-width layout |
| `/billing` | Billing | Subscription plans, invoice history |
| `/settings` | Settings | Notification, playback, appearance prefs |
| `/profile` | Profile | Parent info, children management |

### Data Flow

1. **Mock data** — `src/data/mock.ts` holds 10 sample stories and static chart arrays used by Dashboard. Library and Player use real db data.
2. **Story generation** — `src/api/openaiApi.ts` → `generateStory()` calls `POST https://api.openai.com/v1/chat/completions` (model: `gpt-4o-mini`) and returns `{ title, summary, text[] }`.
3. **Image generation** — `src/api/openaiApi.ts` → `generateCoverImage()` calls `POST https://api.openai.com/v1/images/generations` (model: `gpt-image-1`) and returns a base64 data URL.
4. **Persistence** — `src/api/storyDb.ts` calls `GET /api/db` (read) and `POST /api/db` (write), which are handled by a Vite middleware plugin in `vite.config.ts` that reads/writes `data/db.json`.
5. **Library** — calls `loadStories()` on mount to display all generated stories as a card grid.
6. **On player mount** — `loadStory(id)` uses the URL `:id` param to check `data/db.json`; if a generated story exists it replaces the mock story.

### File-based DB (`data/db.json`)

The Vite `db-api` plugin in `vite.config.ts` adds two middleware routes to the dev server:
- `GET /api/db` — reads `data/db.json`, returns `{ stories: [] }` if the file doesn't exist
- `POST /api/db` — writes the request body to `data/db.json`

`data/db.json` is gitignored (contains large base64 images). This only works while `npm run dev` is running.

### Key Files

| File | Purpose |
|------|---------|
| `src/config.ts` | OpenAI API key, model names, image size — single source of truth |
| `src/api/openaiApi.ts` | `generateStory()` + `generateCoverImage()` — direct OpenAI fetch calls |
| `src/api/storyDb.ts` | `saveStory()` / `loadStories()` / `loadStory(id)` — CRUD over `/api/db` |
| `src/pages/Player.tsx` | Generation form → story + image → save to db → display |
| `vite.config.ts` | Vite config + inline `db-api` middleware plugin for file-based persistence |

### Key Components

- **`LargeStoryPlayer`** — Full-screen image carousel with text overlays, TTS via Web Speech API, fullscreen toggle, and page navigation.
- **`AudioControls`** — UI for play/pause, playback speed, and voice selection (not connected to real audio).
- **`Sidebar`** + **`Topbar`** — Shell layout; sidebar is always `fixed`, `lg:pl-64` on the content wrapper offsets it on desktop. Sidebar is hidden on `/player` routes to maximise space.
- **`StoryCard`** (inline in `Library.tsx`) — Card with cover image, title, summary, child/theme/age metadata, and a "Play Story" button. Navigates to `/player/:id`.

### Testing

Tests live alongside source files (`*.test.ts` / `*.test.tsx`):

- `src/api/openaiApi.test.ts` — mocks `fetch` with `vi.stubGlobal`, tests URL, headers, response parsing, and error handling for both OpenAI calls
- `src/api/storyDb.test.ts` — mocks `fetch`, tests all CRUD operations against `/api/db`
- `src/pages/Player.test.tsx` — component tests using `@testing-library/react`, mocks `openaiApi` and `storyDb` modules

### Deployment

GitHub Actions (`.github/workflows/prod.yml`) triggers on PRs merged to `master`: builds with Yarn 4.12.0, then deploys `dist/` via SSH to `145.79.3.179`. The file-based db is dev-only; a production deployment would need a real persistence layer.
