# The Idealists Collective

A website for a collective embracing the new world of infinite software, with a direction towards utopia.

## Tech Stack

- [Svelte 5](https://svelte.dev/) with runes
- [SvelteKit](https://kit.svelte.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- TypeScript

## Quick Start

```sh
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | Type-check the codebase |

## Project Structure

```
src/
├── routes/
│   ├── +layout.svelte    # Root layout with theming
│   ├── +page.svelte      # Homepage
│   └── library/
│       └── +page.svelte  # Reading list
└── lib/
    └── components/
        ├── Definition.svelte
        └── DNA.svelte
```

## Documentation

- `HUMAN.md` — Getting started guide for developers
- `CLAUDE.md` — Instructions for Claude Code AI assistant
