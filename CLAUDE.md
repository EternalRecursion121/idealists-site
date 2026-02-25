# CLAUDE.md

This file is a practical guide for Claude Code when working in this repository.

## Project snapshot

- Project: The Idealists Collective website.
- Stack: Svelte 5 (runes), SvelteKit, Tailwind CSS v4, TypeScript.
- Adapter: `@sveltejs/adapter-vercel` (see `svelte.config.js`).
- Content-heavy site with custom navigation graph, writings history, and annotation support.

## Commands

```bash
npm install
npm run dev          # local dev server
npm run check        # type-check via svelte-check
npm run check:watch  # watch mode for type-checking
npm run build        # production build (+ vibes manifest generation)
npm run preview      # preview build output
```

Useful one-off script:

```bash
node scripts/generate-vibes-manifest.js
```

Use this after adding/removing files under `static/vibes/`.

## High-signal file map

### Layout and navigation

- `src/routes/+layout.svelte`
  - Global theme system (`dawn`, `twilight`, `night`, `forest`, `auto`).
  - Global chrome: `Constellation`, `FloatingLlama`, `NavOverlay`.
- `src/routes/+layout.server.ts`
  - Hardcoded `mainPages` and `writings` graph used by nav overlay/sitemap.
  - Must be updated when adding pages/writings that should appear in graph nav.
- `src/routes/(standard)/+layout.svelte`
  - Standard page wrapper with `PageHeader` and `BottomNav`.
  - Derives current page category from pathname.
- `src/lib/components/BottomNav.svelte`
  - Ring ordering and previous/next links.

### Main routes

- `src/routes/+page.svelte` - homepage.
- `src/routes/(standard)/writings/+page.server.ts` - writings list metadata from git history.
- `src/routes/(standard)/writings/[slug]/+page.server.ts` - writing body/revisions/annotations loader.
- `src/routes/(standard)/writings/[slug]/+page.svelte` - markdown rendering, timeline, annotations UI.
- `src/routes/vibes/+page.server.ts` - reads `/vibes/images.json`.
- `src/routes/sitemap/+page.server.ts` - per-route descriptions for graph page.

### Data and server logic

- `src/lib/server/git-history.ts`
  - GitHub API access for writings history and annotations persistence.
  - Frontmatter extraction (`title`, `description`, `author`/`authors`, `style`, `branches`).
  - `PATH_RENAMES` for historical file rename continuity.
- `src/lib/writings/<slug>/content.md`
  - Writing source files.
- `src/lib/writings/<slug>/annotations.md`
  - Optional annotation storage files.
- `src/lib/data/members.csv`
  - Members list consumed by `/members`.
- `src/routes/(standard)/projects/+page.server.ts`
  - Projects are currently hardcoded here.

### API routes

- `src/routes/api/auth/github/+server.ts`
- `src/routes/api/auth/github/callback/+server.ts`
- `src/routes/api/annotations/+server.ts`

## Common task checklists

### Add a writing

1. Create `src/lib/writings/<slug>/content.md`.
2. Include frontmatter (`title`, optional `description`, `author` or `authors`, optional `style`, optional `branches`).
3. Update hardcoded writings in `src/routes/+layout.server.ts` if you want it represented in graph navigation.
4. Optional: add `annotations.md` seed file in the same folder.

### Add a new top-level route

1. Add route files under `src/routes/...`.
2. Update `src/routes/+layout.server.ts`:
   - `mainPages`
   - relevant `linksTo` arrays
3. Update `src/routes/sitemap/+page.server.ts` description map.
4. If it belongs to the footer ring, update `src/lib/components/BottomNav.svelte`.
5. If it needs explicit page-type handling, update `src/routes/(standard)/+layout.svelte`.

### Add vibe images

1. Add files under `static/vibes/`.
2. Regenerate `static/vibes/images.json` with:
   - `node scripts/generate-vibes-manifest.js` or
   - `npm run build` (runs generation automatically).

## Environment variables

See `.env.example`.

Required for full writings/annotations functionality:

- `GITHUB_OWNER`
- `GITHUB_REPO`

Strongly recommended:

- `GITHUB_TOKEN` (avoids rate limits and enables collaborator checks/annotation writes).

Needed for GitHub OAuth annotation login:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

## Gotchas

- Docs historically drifted from implementation; trust source files over old docs.
- Nav graph is intentionally hardcoded for production reliability on Vercel.
- Annotation saves currently commit to branch `"main"` in `git-history.ts`.
- In dev, writing detail loader can synthesize a local draft revision if GitHub has no history yet.
- Build wipes `.vercel/output` and `.svelte-kit` before rebuilding.

## Completion checklist for code changes

1. Run `npm run check`.
2. Run `npm run build` for route/content or server-side behavior changes.
3. Keep docs synchronized if route graph, env vars, or workflows changed.

## Svelte MCP server

You have access to the Svelte MCP server with these tools:

1. `list-sections` - Use first to discover relevant Svelte/SvelteKit documentation sections.
2. `get-documentation` - Fetch all relevant sections after reviewing `use_cases`.
3. `svelte-autofixer` - Must be used when writing Svelte code; repeat until no issues/suggestions remain.
4. `playground-link` - Ask the user first; do not use when code was written directly to project files.
