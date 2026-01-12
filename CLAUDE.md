wai# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Type-check with svelte-check
npm run check:watch  # Type-check in watch mode
```

## Tech Stack

- **Svelte 5** with runes (`$state`, `$effect`, `$props`)
- **SvelteKit** with adapter-auto
- **Tailwind CSS v4** (via Vite plugin)
- **TypeScript**

## Architecture

This is a small static site for "The Idealists Collective" with file-based routing:

- `/` — Main landing page with animated star, cycling definitions, and DNA principles
- `/library` — Reading list with external links

### Key Patterns

**Theming**: The root layout (`src/routes/+layout.svelte`) manages a theme system with CSS variables (`--bg`, `--text`, `--accent`). The theme toggle is currently commented out.

**Reusable Components**: Located in `src/lib/components/`:
- `Definition.svelte` — Auto-cycling definition carousel with dot navigation
- `DNA.svelte` — Clickable header that cycles through synonyms ("dna", "architecture", "principles", etc.)

**Animation**: Uses Svelte 5 `$effect` for requestAnimationFrame-based animations (see star rotation on homepage).

**Styling**: Mix of Tailwind utility classes and scoped `<style>` blocks. Global styles are minimal and defined in the layout.

## Svelte MCP Server

You have access to the Svelte MCP server with these tools:

1. **list-sections** — Use FIRST to discover available Svelte 5/SvelteKit documentation sections
2. **get-documentation** — Fetch full documentation for specific sections (analyze use_cases from list-sections to determine relevance)
3. **svelte-autofixer** — MUST use when writing Svelte code; keep calling until no issues returned
4. **playground-link** — Generate Svelte Playground links (ask user first, never use if code was written to project files)
