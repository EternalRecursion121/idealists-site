<script lang="ts">
    import Definition from '$lib/components/Definition.svelte';
    import DNA from '$lib/components/DNA.svelte';
    import BottomNav from '$lib/components/BottomNav.svelte';
</script>

<svelte:head>
    <title>The Idealists Collective</title>
</svelte:head>

<div class="page-container">
    <div class="hero">
        <div class="hero-logo">
            <img src="/flower-logo.png" alt="The Idealists Collective" class="flower" />
        </div>
        <div class="hero-text">
            <h1 class="title">THE IDEALISTS COLLECTIVE</h1>
            <p class="tagline">a community of philosophers, artists and technologists who believe the future is worth fighting for</p>
        </div>
    </div>

    <div class="main-grid">
        <div class="left-col">
            <Definition />

            <nav class="link-grid">
                <a href="/writings" class="link-card">
                    <span class="card-title">writings</span>
                    <span class="card-desc">essays on technology, philosophy, and the future we want to build</span>
                </a>
                <a href="/projects" class="link-card">
                    <span class="card-title">projects</span>
                    <span class="card-desc">tools and experiments born from our principles</span>
                </a>
                <a href="/library" class="link-card">
                    <span class="card-title">library</span>
                    <span class="card-desc">books, talks, and resources that shape our thinking</span>
                </a>
                <a href="/members" class="link-card">
                    <span class="card-title">members</span>
                    <span class="card-desc">the people behind the collective</span>
                </a>
                <a href="/vibes" class="link-card">
                    <span class="card-title">vibes</span>
                    <span class="card-desc">visual fragments of the world we're reaching for</span>
                </a>
                <a href="/join" class="link-card accent">
                    <span class="card-title">join us</span>
                    <span class="card-desc">bring your idealism — we're better together</span>
                </a>
            </nav>
        </div>

        <div class="right-col">
            <DNA />
        </div>
    </div>

    <BottomNav current="home" />
</div>

<style>
    .page-container {
        max-width: 64rem;
        margin: 0 auto;
        padding: 1rem;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    /* Hero — logo + title side by side */
    .hero {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-top: 2.5rem;
        margin-bottom: 2rem;
    }

    @media (min-width: 640px) {
        .hero {
            margin-top: 1rem;
            gap: 2rem;
        }
    }

    .hero-logo {
        flex-shrink: 0;
    }

    .flower {
        width: 100px;
        height: 100px;
        image-rendering: pixelated;
    }

    :global([data-theme="night"]) .flower,
    :global([data-theme="twilight"]) .flower,
    :global([data-theme="forest"]) .flower {
        filter: invert(1);
    }

    @media (min-width: 640px) {
        .flower {
            width: 120px;
            height: 120px;
        }
    }

    .hero-text {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .title {
        font-family: var(--font-serif);
        font-weight: 400;
        font-size: 1.75rem;
        letter-spacing: 0.08em;
        color: var(--heading);
        margin: 0;
        line-height: 1.15;
    }

    @media (min-width: 640px) {
        .title {
            font-size: 2.5rem;
        }
    }

    .tagline {
        font-family: var(--font-serif);
        font-size: 0.95rem;
        opacity: 0.65;
        margin: 0;
        font-style: italic;
    }

    @media (min-width: 640px) {
        .tagline {
            font-size: 1.1rem;
        }
    }

    /* Two-column main grid */
    .main-grid {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        margin-bottom: 2rem;
    }

    @media (min-width: 768px) {
        .main-grid {
            flex-direction: row;
            gap: 3rem;
        }
    }

    .left-col {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .right-col {
        flex: 1;
        min-width: 0;
    }

    /* Navigation grid */
    .link-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
    }

    .link-card {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 0.85rem 1rem;
        border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
        border-radius: 6px;
        text-decoration: none;
        color: inherit;
        transition: border-color 0.2s, transform 0.15s, background 0.2s;
    }

    .link-card:hover {
        border-color: var(--accent);
        transform: translateY(-2px);
        background: color-mix(in srgb, var(--accent) 5%, transparent);
    }

    .link-card.accent {
        border-color: color-mix(in srgb, var(--accent) 35%, transparent);
    }

    .link-card.accent:hover {
        border-color: var(--accent);
        background: color-mix(in srgb, var(--accent) 10%, transparent);
    }

    .card-title {
        font-family: var(--font-serif);
        font-style: italic;
        font-weight: 400;
        font-size: 1.1rem;
    }

    .card-desc {
        font-family: var(--font-mono);
        font-size: 0.7rem;
        line-height: 1.45;
        opacity: 0.5;
    }

    @media (min-width: 640px) {
        .page-container {
            padding: 2rem 1.5rem;
        }
    }
</style>
