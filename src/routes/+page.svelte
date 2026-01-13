<script lang="ts">
    import DNA from '$lib/components/DNA.svelte';
    import Definition from '$lib/components/Definition.svelte';
    import Logo from '$lib/components/Logo.svelte';

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

<div class="max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-16">

    <div class="word-header mb-6">
        <div class="ideal-title">
            <span>THE IDEALISTS <span class="nowrap">C<span
                class="logo-wrapper"
                onmouseenter={() => isHovering = true}
                onmouseleave={() => isHovering = false}
            ><Logo size={48} rotation={starRotation} /></span>LLECTIVE</span></span>
        </div>
    </div>

    <section>
        <p class="opacity-80 text-lg">we are philosophers, artists, and technologists who believe the future is worth fighting for. we will not be satisfied with any direction other than towards utopia. we are, first and foremost, <i style="color: var(--accent)">idealists</i>.</p>
        <br>
        <p style="text-align: center; opacity: 0.6; color: var(--heading)">✺✺✺✺✺</p>
        <br>
    </section>

    <!-- Definition hero -->
    <Definition />

    <!-- DNA -->
    <DNA />

    <section class="mt-16 flex gap-6 justify-center">
        <a href="/writings" class="opacity-80 hover:opacity-100">← writings</a>
        <span class="opacity-50">•</span>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSeFt80kKtQ81aPR5SscPl99C0br4gPZOG6wo91yVD4Gnu42rg/viewform?usp=dialog" class="opacity-80 hover:opacity-100 italic">join us</a>
        <span class="opacity-50">•</span>
        <a href="/library" class="opacity-80 hover:opacity-100">library →</a>
    </section>
</div>

<style>
    .word-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
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

    @media (min-width: 640px) {
        .ideal-title {
            font-size: 3rem;
        }

        .logo-wrapper :global(svg) {
            width: 72px;
            height: 72px;
        }
    }
</style>
