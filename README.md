# The Idealists Collective

Website for a collective of philosophers, artists, and technologists building toward utopia.

## Jazz Coded

This website is jazz coded by the collective. What does that mean?

Jazz musicians don't plan every note — they improvise, respond to each other, and create something that couldn't exist without that specific group of people in that moment. We build this website the same way.

**The rules:**

- Anyone can make whatever changes they want
- You don't need to ask for permission
- You don't need to feel bad about deleting what someone else has done (their code is saved in their commits and they can always re-add it)
- Write clean code and docs to make it easy for others to develop. Refactor other people's code when it is badly organised.
- The website should be in a constant state of flux and growth — why not change the colours just for the sake of it

## Getting Started

```sh
npm install
npm run dev
```

## Stack

- **Svelte 5** with runes
- **SvelteKit** with adapter-vercel
- **Tailwind CSS v4**
- **TypeScript**

## Pages

- `/` — Homepage with animated star logo, cycling definitions, and DNA principles
- `/writings` — Essays with git-tracked revision history
- `/projects` — Things we're building together
- `/vibes` — Scattered image gallery
- `/library` — Reading list
- `/members` — The people
- `/join` — Membership page with animated llama
- `/sitemap` — Constellation graph of the whole site
- `/unconference` — The Idealists Unconference
- `/interview` — A conversation with the collective's interviewer (not in the nav graph; needs `PUBLIC_INTERVIEWER_API`)

## Commands

```sh
npm run dev          # Start development server
npm run build        # Production build (image optimization only runs on Vercel/CI)
npm run preview      # Preview production build
npm run check        # Type-check with svelte-check
npm run vibes        # Convert static/vibes images to WebP + rebuild the manifest
npm run writing-images  # WebP copies for static/writings images
```
