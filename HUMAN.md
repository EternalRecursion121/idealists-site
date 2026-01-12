# Human Developer Guide

A guide to getting started developing on the Idealists Collective website.

## Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)

## Getting Started

1. **Install dependencies**
   ```sh
   npm install
   ```

2. **Start the dev server**
   ```sh
   npm run dev
   ```
   The site will be available at `http://localhost:5173`

3. **Open in browser with auto-open**
   ```sh
   npm run dev -- --open
   ```

## Understanding the Codebase

### File Structure

**Routes** (`src/routes/`)
- `+layout.svelte` — Wraps all pages, sets up theming and fonts
- `+page.svelte` — The page component for that route
- Folders create URL segments (e.g., `library/+page.svelte` → `/library`)

**Components** (`src/lib/components/`)
- Import with `$lib/components/ComponentName.svelte`
- Currently contains `Definition.svelte` and `DNA.svelte`

### Theming System

The root layout defines a theme system with CSS custom properties:

```svelte
<!-- In +layout.svelte -->
<div style="--bg: {themes[theme].bg}; --text: {themes[theme].text}; --accent: {themes[theme].accent};">
```

Use these variables in your styles:
```css
.my-element {
  color: var(--text);
  background: var(--bg);
}
```

Available themes: `cream`, `navy`, `mint`, `lavender`, `forest`, `crimson` (current default)

### Styling

The project uses both:

1. **Tailwind CSS** — For utility classes
   ```svelte
   <div class="max-w-3xl mx-auto px-6 py-16">
   ```

2. **Scoped styles** — For component-specific styles
   ```svelte
   <style>
     .my-class { /* only applies to this component */ }
   </style>
   ```

Tailwind is imported in `src/routes/layout.css`.

### Animation Pattern

For smooth animations, use `$effect` with `requestAnimationFrame`:

```svelte
<script lang="ts">
  let rotation = $state(0);
  let velocity = $state(0);

  $effect(() => {
    let frameId: number;
    const animate = () => {
      // Update state
      rotation += velocity;
      velocity *= 0.96; // friction
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId); // cleanup
  });
</script>
```

## Common Tasks

### Adding a New Page

1. Create a folder in `src/routes/` with your route name
2. Add a `+page.svelte` file inside it

```
src/routes/
└── about/
    └── +page.svelte  → /about
```

### Adding a New Component

1. Create the component in `src/lib/components/`
2. Import it where needed:
   ```svelte
   <script lang="ts">
     import MyComponent from '$lib/components/MyComponent.svelte';
   </script>
   ```

### Type Checking

Run the type checker before committing:
```sh
npm run check
```

For continuous checking during development:
```sh
npm run check:watch
```

## Resources

- [Svelte 5 Docs](https://svelte.dev/docs/svelte/overview)
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
