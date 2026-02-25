<script lang="ts">
    import Logo from '$lib/components/Logo.svelte';
    import BottomNav from '$lib/components/BottomNav.svelte';

    let starRotation = $state(0);
    let starVelocity = $state(0);
    let isHovering = $state(false);

    $effect(() => {
        let frameId: number;
        const animate = () => {
            if (isHovering) {
                starVelocity += 0.5;
                starVelocity = Math.min(starVelocity, 15);
            } else {
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

    const sections = [
        { name: 'writings', href: '/writings', description: 'essays & ideas from the collective' },
        { name: 'projects', href: '/projects', description: 'things we are building together' },
        { name: 'library', href: '/library', description: 'readings & manifestos that move us' },
        { name: 'glossary', href: '/glossary', description: 'our vocabulary for a better world' },
        { name: 'members', href: '/members', description: 'the people behind the collective' },
        { name: 'vibes', href: '/vibes', description: 'visual fragments & energy' }
    ];
</script>

<svelte:head>
    <title>The Idealists Collective</title>
</svelte:head>

<div class="page-container">
    <div class="hero">
        <div class="ideal-title">
            <span>THE IDEALISTS <span class="nowrap">C<span
                class="logo-wrapper"
                onmouseenter={() => isHovering = true}
                onmouseleave={() => isHovering = false}
            ><Logo size={48} rotation={starRotation} /></span>LLECTIVE</span></span>
        </div>

        <p class="intro-text">we are philosophers, artists, and technologists who believe the future is worth fighting for. we will not be satisfied with any direction other than towards utopia. we are, first and foremost, <i class="accent">idealists</i>.</p>
    </div>

    <nav class="explore" aria-label="Explore the collective">
        {#each sections as section (section.name)}
            <a href={section.href} class="explore-link">
                <span class="link-name">{section.name}</span>
                <span class="link-desc">{section.description}</span>
            </a>
        {/each}
    </nav>

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

    .hero {
        margin-top: 2.5rem;
        margin-bottom: 3rem;
    }

    @media (min-width: 640px) {
        .hero {
            margin-top: 0;
            margin-bottom: 4rem;
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
        margin-bottom: 1.5rem;
    }

    .logo-wrapper {
        display: inline-block;
        cursor: pointer;
        user-select: none;
        vertical-align: middle;
        margin: 0 -0.1em;
    }

    .nowrap {
        white-space: nowrap;
    }

    .intro-text {
        font-family: var(--font-serif);
        font-size: 1.15rem;
        line-height: 1.7;
        opacity: 0.85;
        max-width: 52ch;
    }

    .accent {
        color: var(--accent);
    }

    .explore {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .explore-link {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 1rem;
        padding: 1rem 0;
        border-top: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
        text-decoration: none;
        color: inherit;
        transition: transform 0.15s ease;
    }

    .explore-link:last-child {
        border-bottom: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
    }

    .explore-link:hover {
        transform: translateX(6px);
        color: inherit;
    }

    .explore-link:hover .link-name {
        color: var(--accent);
    }

    .link-name {
        font-family: var(--font-sans);
        font-weight: 600;
        font-size: 1.1rem;
        letter-spacing: 0.01em;
        transition: color 0.15s ease;
        flex-shrink: 0;
    }

    .link-desc {
        font-family: var(--font-serif);
        font-size: 0.85rem;
        opacity: 0.5;
        text-align: right;
        transition: opacity 0.15s ease;
    }

    .explore-link:hover .link-desc {
        opacity: 0.75;
    }

    @media (max-width: 640px) {
        .intro-text {
            font-size: 1rem;
        }

        .explore-link {
            flex-direction: column;
            gap: 0.2rem;
            padding: 0.85rem 0;
        }

        .link-desc {
            text-align: left;
            font-size: 0.8rem;
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

        .link-name {
            font-size: 1.2rem;
        }
    }
</style>
