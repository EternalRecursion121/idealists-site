# AGENTS.md

This guide is for autonomous coding agents working in this repository.

## Mandatory Svelte MCP workflow

You can use the Svelte MCP server for Svelte 5/SvelteKit guidance. Follow this strictly:

1. **`list-sections` first**
   - Use this before Svelte/SvelteKit implementation or design decisions.
   - Review `title`, `path`, and especially `use_cases`.
2. **`get-documentation` second**
   - Fetch **all relevant** sections identified from `list-sections`.
   - Do not rely on memory when docs are available.
3. **`svelte-autofixer` for Svelte code**
   - Required whenever writing or changing Svelte code.
   - Keep running until there are no issues/suggestions left.
4. **`playground-link` only on request**
   - Ask the user first.
   - Never use it when code has been written to repository files.

## Repo context that matters

- Framework: SvelteKit + Svelte 5 runes.
- Styling: Tailwind v4 + component-scoped styles.
- Adapter: Vercel (`@sveltejs/adapter-vercel`).
- This project has a manually-maintained nav graph and a GitHub-backed writings/annotations system.

## Critical files to know

- `src/routes/+layout.svelte` - global theme state and app chrome.
- `src/routes/+layout.server.ts` - hardcoded nav graph (`mainPages` and `writings`).
- `src/routes/(standard)/+layout.svelte` - page wrapper and footer-nav page typing.
- `src/routes/sitemap/+page.server.ts` - human descriptions for nav graph.
- `src/lib/components/BottomNav.svelte` - ring order and prev/next behavior.
- `src/lib/server/git-history.ts` - GitHub API integration for writings revisions and annotations.
- `src/routes/api/annotations/+server.ts` - annotation read/write API.
- `scripts/generate-vibes-manifest.js` - rebuilds `static/vibes/images.json`.

## Common workflows

### Add or change a writing

1. Edit/create `src/lib/writings/<slug>/content.md`.
2. Preserve valid frontmatter structure (`title`, `description`, `author`/`authors`, optional `style`, optional `branches`).
3. If this writing should appear in graph nav, update hardcoded entries in `src/routes/+layout.server.ts`.

### Add a new top-level page

1. Create route files.
2. Update `src/routes/+layout.server.ts` route graph and links.
3. Update `src/routes/sitemap/+page.server.ts` description map.
4. If relevant, update:
   - `src/lib/components/BottomNav.svelte` ring,
   - `src/routes/(standard)/+layout.svelte` page-type detection.

### Add vibes images

1. Add files to `static/vibes/`.
2. Regenerate `static/vibes/images.json` using:
   - `node scripts/generate-vibes-manifest.js`, or
   - `npm run build` (runs manifest generation automatically).

## Validation checklist before finishing

1. Run `npm run check`.
2. Run `npm run build` when behavior, loaders, routes, or content pipelines changed.
3. Verify docs if architecture/workflow/env behavior was modified.

## Environment variables

See `.env.example`.

- Core: `GITHUB_OWNER`, `GITHUB_REPO`
- Recommended: `GITHUB_TOKEN` (rate limits + collaborator checks)
- OAuth (annotation login): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

## Common pitfalls

- Navigation is not discovered dynamically in production; it is hand-maintained.
- Annotation writes are committed to the `main` branch in server logic.
- Writings history depends on GitHub API availability and credentials.
