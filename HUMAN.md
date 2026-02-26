# Human Developer Guide

This is a practical guide for people contributing to this repo.

## Quick start

```sh
npm install
npm run dev
```

App runs at `http://localhost:5173`.

Useful commands:

```sh
npm run check     # type-check
npm run build     # production build (also regenerates vibes manifest)
npm run preview   # preview production build
```

## Environment setup

Copy `.env.example` to `.env` and fill values.

Core variables:

- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_TOKEN` (recommended to avoid rate limits and support collaborator checks)

GitHub OAuth variables (for annotation login flow):

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

## Project map (important files)

```text
src/
  routes/
    +layout.svelte               global theme + app chrome
    +layout.server.ts            hardcoded nav graph data
    +page.svelte                 homepage
    (standard)/
      +layout.svelte             page wrapper + footer nav
      library/+page.svelte       reading list
      members/+page.server.ts    loads members from CSV
      projects/+page.server.ts   project list (currently hardcoded)
      unconference/+page.svelte
      writings/
        +page.server.ts          writings list metadata
        [slug]/
          +page.server.ts        revision/annotation loader
          +page.svelte           markdown render + timeline + annotations UI
    vibes/+page.server.ts        reads static/vibes/images.json
    sitemap/+page.server.ts      nav descriptions
    api/
      auth/github/*              OAuth entry + callback
      annotations/+server.ts     annotation API
  lib/
    components/                  shared UI components
    server/git-history.ts        GitHub-backed history + annotation persistence
    writings/<slug>/content.md   writing source files
    writings/<slug>/annotations.md (optional)
    data/members.csv             members source
scripts/generate-vibes-manifest.js
static/vibes/images.json
```

## Common content workflows

### Add or edit a writing

Create/update:

- `src/lib/writings/<slug>/content.md`

Supported frontmatter:

```yaml
---
title: Example title
description: Optional subtitle
author: One Person
# or:
# authors:
#   - Person One
#   - Person Two
style: default # or notebook
branches:
  - url: https://example.com/post
    label: example.com
    repo: owner/repo      # optional
    path: path/to/file.md # optional
---
```

Notes:

- Writing detail pages support footnotes and MathJax.
- Revision history comes from GitHub API.
- In dev mode, local-only writings can appear as a draft revision even before GitHub history exists.

### Add or edit annotations

- Optional source file: `src/lib/writings/<slug>/annotations.md`
- Reads happen through `/api/annotations` and GitHub content API.
- Writes require:
  - GitHub login via OAuth
  - user is a collaborator on the repo
  - server-side commit through GitHub API
- Current implementation writes annotation commits to branch `main`.

### Update members list

- Edit `src/lib/data/members.csv`.
- `/members` parses and shuffles this CSV on load.

### Update projects list

- Edit `src/routes/(standard)/projects/+page.server.ts`.
- `src/lib/data/projects.csv` currently exists but is not used by the route.

### Update library links

- Edit `src/routes/(standard)/library/+page.svelte`.

### Add vibes images

1. Add images to `static/vibes/`.
2. Regenerate metadata:

```sh
node scripts/generate-vibes-manifest.js
```

`npm run build` also regenerates this manifest.

## Adding new routes (do not skip this)

This repo uses a manually maintained navigation graph.
If you add/remove a top-level route, update all relevant locations:

1. `src/routes/+layout.server.ts`
   - add route node to `mainPages`
   - adjust `linksTo` relationships
2. `src/routes/sitemap/+page.server.ts`
   - add/update route description
3. `src/routes/(standard)/+layout.svelte`
   - update page-type derivation if needed
4. `src/lib/components/BottomNav.svelte`
   - update ring order if the route belongs in prev/next footer nav

If you add a writing slug and want it visible in graph navigation, also update the hardcoded `writings` array in `src/routes/+layout.server.ts`.

## Pre-merge checklist

```sh
npm run check
npm run build
```

There is no formal automated test suite yet; type-check + build are the baseline safety checks.

## Troubleshooting

- **Writings show no revisions**
  - Check `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_TOKEN`.

- **Annotation saves fail**
  - Check OAuth env vars and verify logged-in user is a repo collaborator.

- **New vibe image not shown**
  - Regenerate `static/vibes/images.json`.

- **Route exists but missing from graph/index navigation**
  - Update `src/routes/+layout.server.ts` and related nav files listed above.

## References

- Svelte 5 docs: https://svelte.dev/docs/svelte/overview
- SvelteKit docs: https://kit.svelte.dev/docs
- Tailwind docs: https://tailwindcss.com/docs
