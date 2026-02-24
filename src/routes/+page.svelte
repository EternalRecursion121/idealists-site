<script lang="ts">
    import DNA from '$lib/components/DNA.svelte';
    import Logo from '$lib/components/Logo.svelte';
    import BottomNav from '$lib/components/BottomNav.svelte';

    // Star rotation physics
    let starRotation = $state(0);
    let starVelocity = $state(0);
    let isHovering = $state(false);

    // Star momentum effect - animation loop requires imperative state updates
    $effect(() => {
        let frameId: number;
        const animate = () => {
            // Accelerate while hovering
            if (isHovering) {
                starVelocity += 0.5;
                starVelocity = Math.min(starVelocity, 15); // max speed
            } else {
                // Apply friction when not hovering
                starVelocity *= 0.96;
                if (Math.abs(starVelocity) < 0.05) {
                    starVelocity = 0;
                }
            }
            starRotation += starVelocity;
            frameId = requestAnimationFrame(animate);
        };
        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    });

    const navLinks = [
        {
            href: '/writings',
            title: 'writings',
            description: 'essays and explorations'
        },
        {
            href: '/library',
            title: 'library',
            description: 'readings that inspire us'
        },
        {
            href: '/glossary',
            title: 'glossary',
            description: 'our vocabulary'
        },
        {
            href: '/projects',
            title: 'projects',
            description: 'what we are building'
        }
    ];
</script>

<svelte:head>
    <title>The Idealists Collective</title>
</svelte:head>

<div class="page-container">

    <div class="word-header">
        <div class="ideal-title">
            <span>THE IDEALISTS <span class="nowrap">C<button
                class="logo-wrapper"
                onmouseenter={() => isHovering = true}
                onmouseleave={() => isHovering = false}
                aria-label="Spin logo"
            ><Logo size={48} rotation={starRotation} /></button>LLECTIVE</span></span>
        </div>
    </div>

    <section class="intro-section">
        <p class="intro-text">we are philosophers, artists, and technologists who believe the future is worth fighting for. we will not be satisfied with any direction other than towards utopia. we are, first and foremost, <i class="accent-text">idealists</i>.</p>
    </section>

    <section class="explore-section">
        <h2 class="section-header">explore</h2>
        <nav class="nav-grid">
            {#each navLinks as link (link.href)}
                <a href={link.href} class="nav-card">
                    <span class="nav-title">{link.title}</span>
                    <span class="nav-desc">{link.description}</span>
                </a>
            {/each}
        </nav>
    </section>

    <!-- DNA -->
    <DNA />

    <BottomNav current="home" />
</div>

<style>
    .page-container {
        max-width: 48rem;
        margin: 0 auto;
        padding: 1rem;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .word-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-top: 2.5rem;
        margin-bottom: 1.5rem;
    }

    @media (min-width: 640px) {
        .word-header {
            margin-top: 0;
        }
    }

    .ideal-title {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-family: var(--font-sans);
        font-weight: bold;
        font-size: 2rem;
        letter-spacing: .05em;
        color: var(--heading);
    }

    .logo-wrapper {
        display: inline-block;
        cursor: pointer;
        user-select: none;
        vertical-align: middle;
        margin: 0 -0.1em;
        background: none;
        border: none;
        padding: 0;
        color: inherit;
    }

    .nowrap {
        white-space: nowrap;
    }

    .intro-section {
        margin-bottom: 2.5rem;
    }

    .intro-text {
        font-family: var(--font-serif);
        font-size: 1.1rem;
        line-height: 1.6;
        opacity: 0.85;
    }

    .accent-text {
        color: var(--accent);
    }

    .explore-section {
        margin-bottom: 3rem;
    }

    .section-header {
        font-family: var(--font-sans);
        font-weight: bold;
        font-size: 0.75rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 1.25rem;
        opacity: 0.85;
    }

    .nav-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .nav-card {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 1.25rem 1rem;
        border: 1px solid color-mix(in srgb, var(--text) 20%, transparent);
        border-radius: 0.25rem;
        text-decoration: none;
        color: inherit;
        transition: border-color 0.2s, transform 0.15s;
        background: transparent;
    }

    .nav-card:hover {
        border-color: var(--accent);
        transform: translateY(-2px);
    }

    .nav-card:hover .nav-title {
        color: var(--accent);
    }

    .nav-title {
        font-family: var(--font-serif);
        font-weight: 600;
        font-size: 1.25rem;
        transition: color 0.2s;
    }

    .nav-desc {
        font-family: var(--font-serif);
        font-size: 0.85rem;
        opacity: 0.6;
    }

    @media (max-width: 640px) {
        .intro-text {
            font-size: 1rem;
        }

        .nav-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 400px) {
        .ideal-title {
            font-size: 1.5rem;
        }

        .logo-wrapper :global(svg) {
            width: 36px;
            height: 36px;
        }
    }

    /* Desktop */
    @media (min-width: 640px) {
        .page-container {
            padding: 2rem 1.5rem;
        }

        .ideal-title {
            font-size: 3rem;
        }

        .logo-wrapper :global(svg) {
            width: 72px;
            height: 72px;
        }
    }

</style>
