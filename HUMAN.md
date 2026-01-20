# Human Developer Guide

## Quick Start

```sh
npm install
npm run dev -- --open
```

Dev server runs at `http://localhost:5173`.

## Structure

```
src/
├── routes/
│   ├── +layout.svelte        # Root layout, theming, constellation bg
│   ├── +page.svelte          # Homepage
│   ├── writings/             # Essays with git history tracking
│   │   ├── +page.svelte
│   │   ├── +page.server.ts
│   │   └── [slug]/           # Individual writing with diff viewer
│   ├── vibes/                # Scattered image gallery
│   ├── library/              # Reading list
│   └── join/                 # Membership page with llama animation
└── lib/
    ├── components/
    │   ├── BottomNav.svelte      # Ring navigation between pages
    │   ├── Constellation.svelte  # Background particle effect
    │   ├── Definition.svelte     # Auto-cycling definition carousel
    │   ├── DiffViewer.svelte     # Writing revision viewer
    │   ├── DNA.svelte            # Clickable cycling header
    │   ├── Logo.svelte           # Animated star logo
    │   ├── ScatteredGallery.svelte
    │   └── TimelineSlider.svelte # Writing revision navigator
    ├── server/
    │   └── git-history.ts    # Git revision tracking for writings
    └── types/
        └── writing.ts
```

## Theming

The root layout sets CSS variables:

```css
color: var(--text);
background: var(--bg);
border-color: var(--accent);
color: var(--heading);    /* for headings */
color: var(--network);    /* for constellation */
```

Themes: `night` (default), `cream`, `navy`, `mint`, `lavender`, `forest`, `crimson`.

## Navigation

`BottomNav` creates a ring navigation: writings ↔ home ↔ library ↔ vibes. The "join us" link is always centered.

## Writings System

Writings are markdown files in `src/lib/data/writings/`. The system tracks git history to show revision counts and enable diff viewing between versions.

## Type Check

```sh
npm run check        # one-time
npm run check:watch  # continuous
```

## Docs

- [Svelte 5](https://svelte.dev/docs/svelte/overview)
- [SvelteKit](https://kit.svelte.dev/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
