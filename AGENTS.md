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
- The nav graph is a hand-edited list in `src/lib/nav.ts` (writings are globbed at build time); writings history and annotations are GitHub-backed.

## Critical files to know

- `src/routes/+layout.svelte` - global theme state and app chrome.
- `src/lib/nav.ts` - the one hand-edited source for main pages, descriptions and the footer ring; everything else derives from it.
- `src/routes/+layout.server.ts` - builds the nav graph from `nav.ts` plus a build-time glob of `src/lib/writings/*/content.md`.
- `src/routes/(standard)/+layout.svelte` - page wrapper (header + footer).
- `src/routes/sitemap/+page.server.ts` - attaches the short descriptions from `nav.ts`.
- `src/lib/components/BottomNav.svelte` - prev/next links derived from the ring in `nav.ts`.
- `src/lib/server/git-history.ts` - GitHub API integration for writings revisions and annotations.
- `src/routes/api/annotations/+server.ts` - annotation read/write API.
- `scripts/optimize-vibes.js` - converts `static/vibes/` PNG/JPG/GIF to WebP (deletes originals). `npm run vibes` runs it with the manifest step; `npm run build` only runs it on Vercel/CI.
- `scripts/generate-vibes-manifest.js` - rebuilds `static/vibes/images.json`.
- `scripts/optimize-writings.js` - gives `static/writings/` images a WebP sibling (keeps originals) and writes `src/lib/writings/images.json`. `npm run writing-images`.

## Common workflows

### Add or change a writing

1. Edit/create `src/lib/writings/<slug>/content.md`.
2. Preserve valid frontmatter structure (`title`, `description`, `author`/`authors`, optional `style`, optional `branches`).
3. Nothing to register: the nav graph picks up `content.md` at build time.
4. Images go under `static/writings/<slug>/`; run `npm run writing-images` afterwards.

### Add a new top-level page

1. Create route files.
2. Add the page to `mainPages` in `src/lib/nav.ts`.
3. If it belongs on the footer ring, add its path to `ring` there (or to `ringAliases` if it sits under another ring page).

### Add vibes images

1. Add files to `static/vibes/`.
2. Run `npm run vibes` to convert them and regenerate `static/vibes/images.json` (a local build no longer does this automatically; Vercel/CI does).

## Validation checklist before finishing

1. Run `npm run check`.
2. Run `npm run build` when behavior, loaders, routes, or content pipelines changed.
3. Verify docs if architecture/workflow/env behavior was modified.

## Environment variables

See `.env.example`.

- Core: `GITHUB_OWNER`, `GITHUB_REPO`
- Recommended: `GITHUB_TOKEN` (rate limits + collaborator checks)
- OAuth (annotation login): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Interview page: `PUBLIC_INTERVIEWER_API` (falls back to `http://127.0.0.1:8000`)

## Common pitfalls

- Navigation is not discovered dynamically in production; it is hand-maintained.
- Annotation writes are committed to the `main` branch in server logic.
- Writings history depends on GitHub API availability and credentials.
