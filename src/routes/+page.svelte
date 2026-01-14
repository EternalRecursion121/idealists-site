<script lang="ts">
    import DNA from '$lib/components/DNA.svelte';
    import Definition from '$lib/components/Definition.svelte';
    import Logo from '$lib/components/Logo.svelte';
    import BottomNav from '$lib/components/BottomNav.svelte';

    // Star rotation physics
    let starRotation = $state(0);
    let starVelocity = $state(0);
    let isHovering = $state(false);

    // Star momentum effect
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
</script>

<svelte:head>
    <title>The Idealists Collective</title>
</svelte:head>

<div class="page-container">

    <div class="word-header">
        <div class="ideal-title">
            <span>THE IDEALISTS <span class="nowrap">C<span
                class="logo-wrapper"
                onmouseenter={() => isHovering = true}
                onmouseleave={() => isHovering = false}
            ><Logo size={48} rotation={starRotation} /></span>LLECTIVE</span></span>
        </div>
    </div>

    <section class="intro-section">
        <p class="intro-text">we are philosophers, artists, and technologists who believe the future is worth fighting for. we will not be satisfied with any direction other than towards utopia. we are, first and foremost, <i style="color: var(--accent)">idealists</i>.</p>
    </section>

    <!-- Definition hero -->
    <Definition />

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
        margin-bottom: 1.5rem;
    }

    .ideal-title {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 2rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: var(--heading);
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

    .intro-section {
        margin-bottom: 1.5rem;
    }

    .intro-text {
        font-family: var(--font-mono);
        font-size: 1.1rem;
        line-height: 1.6;
        opacity: 0.85;
    }

    @media (max-width: 640px) {
        .intro-text {
            font-size: 1rem;
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
