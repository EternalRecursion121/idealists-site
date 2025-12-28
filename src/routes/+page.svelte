<script lang="ts">
    import DNA from '$lib/components/DNA.svelte';
    import Definition from '$lib/components/Definition.svelte';

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

<div class="max-w-3xl mx-auto px-6 py-16">

    <div class="word-header mb-6">
        <div class="ideal-title">
            <span>THE IDEALISTS C<span
                class="star"
                style="transform: rotate({starRotation}deg)"
                onmouseenter={() => isHovering = true}
                onmouseleave={() => isHovering = false}
            >✺</span>LLECTIVE</span>
        </div>
    </div>

    <section>
        <p class="opacity-80" style="color: #18440B">we are the SF counterculture. we are embracing the new world of infinite software. we will not be satisfied with any direction other than towards utopia. we are, first and foremost, <i style="color: #BE0000">idealists</i>.</p>
        <br>
        <p style="text-align: center; color: #235613;">✺✺✺✺✺</p>
        <br>
    </section>
    
    <!-- Definition hero -->
    <Definition />

    <!-- DNA -->
    <DNA />

    <section class="mt-16">
        <a href="/library" class="opacity-60 hover:opacity-100">library →</a>
    </section>
</div>

<div class="text-center mt-16">
    <a href="#" class="text-lg italic font-semibold mb-2">join us ✺</a>
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
        font-size: 3rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: #7d0202;
    }

    .star {
        display: inline-block;
        font-size: 1.3em;
        transform-origin: 50% 55%;
        cursor: pointer;
        user-select: none;
    }
</style>
