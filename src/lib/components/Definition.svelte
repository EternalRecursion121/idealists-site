<script lang="ts">
    import { onMount } from 'svelte';

    const definitions = [
        "someone who believes that a much better world is possible, often when this does not seem likely to others",
        "a person who sticks to their principles, choosing integrity over convenience",
        "the belief that ideas are more fundamental than matter, and that subjectivity is the foundation of everything",
        "you?"
    ];

    let currentIndex = $state(0);
    let dragOffset = $state(0);
    let isDragging = $state(false);
    let containerEl: HTMLElement | null = null;
    let maxHeight = $state(0);

    let startX = 0;
    let startY = 0;
    let isHorizontalDrag = $state<boolean | null>(null);

    function goToDefinition(index: number) {
        currentIndex = Math.max(0, Math.min(definitions.length - 1, index));
        dragOffset = 0;
    }

    function handlePointerDown(e: PointerEvent) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        isDragging = true;
        isHorizontalDrag = null;
        startX = e.clientX;
        startY = e.clientY;
        dragOffset = 0;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e: PointerEvent) {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Determine drag direction on first significant movement
        if (isHorizontalDrag === null && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
            isHorizontalDrag = Math.abs(deltaX) > Math.abs(deltaY);
        }

        // Only handle horizontal drags
        if (isHorizontalDrag) {
            e.preventDefault();
            dragOffset = deltaX;
        }
    }

    function handlePointerUp(e: PointerEvent) {
        if (!isDragging) return;
        isDragging = false;

        if (!isHorizontalDrag) {
            dragOffset = 0;
            return;
        }

        const threshold = 50;

        if (dragOffset < -threshold && currentIndex < definitions.length - 1) {
            goToDefinition(currentIndex + 1);
        } else if (dragOffset > threshold && currentIndex > 0) {
            goToDefinition(currentIndex - 1);
        } else {
            dragOffset = 0;
        }

        isHorizontalDrag = null;
    }

    // Auto-cycle
    $effect(() => {
        if (isDragging) return;
        const delay = currentIndex === 3 ? 7000 : 5000;
        const timeout = setTimeout(() => {
            goToDefinition((currentIndex + 1) % definitions.length);
        }, delay);
        return () => clearTimeout(timeout);
    });

    onMount(() => {
        if (!containerEl) return;
        const items = containerEl.querySelectorAll<HTMLElement>('.slide');
        const heights = Array.from(items, el => Math.ceil(el.getBoundingClientRect().height));
        maxHeight = heights.length ? Math.max(...heights) : 0;
    });
</script>

<section class="definition-hero mb-20">
    <div class="word-header mb-6">
        <div class="flex items-baseline gap-3 flex-wrap">
            <span class="word">idealist</span>
            <span class="badge">NOUN</span>
        </div>
        <span class="pronunciation">/ʌɪˈdɪəlɪst/</span>
    </div>

    <div
        class="carousel"
        bind:this={containerEl}
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointercancel={handlePointerUp}
        style="height: {maxHeight || 'auto'}px"
    >
        <div
            class="carousel-track"
            class:dragging={isDragging && isHorizontalDrag}
            style="transform: translateX(calc(-{currentIndex * 100}% + {dragOffset}px))"
        >
            {#each definitions as def, i (i)}
                <button
                    class="slide"
                    onclick={() => !isDragging && goToDefinition((currentIndex + 1) % definitions.length)}
                >
                    <span class="definition-number">{i + 1}.</span>
                    {def}
                </button>
            {/each}
        </div>
    </div>

    <div class="definition-dots">
        {#each definitions as _, i (i)}
            <button
                class="dot"
                class:active={i === currentIndex}
                onclick={() => goToDefinition(i)}
                aria-label="Definition {i + 1}"
            ></button>
        {/each}
    </div>
</section>

<style>
    .definition-hero {
        min-height: 150px;
    }

    @media (min-width: 640px) {
        .definition-hero {
            min-height: 200px;
        }
    }

    .word-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .word {
        font-size: 1.75rem;
        font-weight: 600;
        letter-spacing: -0.02em;
    }

    @media (min-width: 640px) {
        .word {
            font-size: 2.5rem;
        }
    }

    .pronunciation {
        font-size: 0.875rem;
        font-style: italic;
        opacity: 0.6;
        color: var(--accent);
    }

    .badge {
        font-size: 0.6rem;
        font-weight: 500;
        letter-spacing: 0.08em;
        padding: 0.15rem 0.2rem;
        background: transparent;
        opacity: 0.4;
    }

    .carousel {
        overflow: hidden;
        margin-bottom: 1.5rem;
        touch-action: pan-y pinch-zoom;
        cursor: grab;
    }

    .carousel:active {
        cursor: grabbing;
    }

    .carousel-track {
        display: flex;
        transition: transform 0.3s ease-out;
    }

    .carousel-track.dragging {
        transition: none;
    }

    .slide {
        flex: 0 0 100%;
        font-family: var(--font-mono);
        font-size: 1.1rem;
        line-height: 1.5;
        max-width: 50ch;
        opacity: 0.85;
        cursor: pointer;
        background: none;
        border: none;
        color: inherit;
        text-align: left;
        padding: 0;
        user-select: none;
    }

    @media (min-width: 640px) {
        .slide {
            font-size: 1.25rem;
        }
    }

    .slide:hover {
        opacity: 1;
    }

    .definition-number {
        opacity: 0.5;
        margin-right: 0.25rem;
    }

    .definition-dots {
        display: flex;
        gap: 0.5rem;
    }

    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text);
        opacity: 0.25;
        border: none;
        padding: 0;
        cursor: pointer;
        transition: opacity 0.2s, transform 0.2s;
    }

    .dot:hover {
        opacity: 0.5;
        transform: scale(1.2);
    }

    .dot.active {
        opacity: 0.8;
    }
</style>
