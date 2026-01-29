<script lang="ts">
    import { onMount } from 'svelte';

    const definitions = [
        "someone who believes that a much better world is possible, often when this does not seem likely to others",
        "a person who sticks to their principles, choosing integrity over convenience",
        "the belief that ideas are more fundamental than matter, and that subjectivity is the foundation of everything",
        "you?"
    ];

    let currentIndex = $state(0);
    let visible = $state(true);
    let dragOffset = $state(0);
    let isDragging = $state(false);
    let isTouchDevice = $state(false);
    let containerEl: HTMLElement | null = null;
    let maxHeight = $state(0);

    let startX = 0;
    let startY = 0;
    let isHorizontalDrag = $state<boolean | null>(null);

    function cycleDefinition() {
        visible = false;
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % definitions.length;
            visible = true;
        }, 300);
    }

    function goToDefinition(index: number) {
        currentIndex = Math.max(0, Math.min(definitions.length - 1, index));
        dragOffset = 0;
    }

    function handlePointerDown(e: PointerEvent) {
        // Only enable drag on touch devices
        if (e.pointerType !== 'touch') return;

        isTouchDevice = true;
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

        if (isHorizontalDrag === null && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
            isHorizontalDrag = Math.abs(deltaX) > Math.abs(deltaY);
        }

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
            if (isTouchDevice) {
                goToDefinition((currentIndex + 1) % definitions.length);
            } else {
                cycleDefinition();
            }
        }, delay);
        return () => clearTimeout(timeout);
    });

    onMount(() => {
        if (!containerEl) return;
        const items = containerEl.querySelectorAll<HTMLElement>('.measure-item');
        const heights = Array.from(items, el => Math.ceil(el.getBoundingClientRect().height));
        maxHeight = heights.length ? Math.max(...heights) : 0;
    });
</script>

<!-- Hidden measurement for consistent height -->
<div bind:this={containerEl} class="definition-measure">
    {#each definitions as def, i (i)}
        <div class="measure-item">
            <span class="definition-number">{i + 1}.</span>
            {def}
        </div>
    {/each}
</div>

<section class="definition-hero mb-20">
    <div class="word-header mb-6">
        <div class="flex items-baseline gap-3 flex-wrap">
            <span class="word">idealist</span>
            <span class="badge">NOUN</span>
        </div>
        <span class="pronunciation">/ʌɪˈdɪəlɪst/</span>
    </div>

    {#if isTouchDevice}
        <!-- Mobile: draggable carousel -->
        <div
            class="carousel"
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
                    <div class="slide">
                        <span class="definition-number">{i + 1}.</span>
                        {#if def === 'you?'}
                            <a href="/join" class="you-link">{def}</a>
                        {:else}
                            {def}
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {:else}
        <!-- Desktop: click to fade -->
        <div onpointerdown={handlePointerDown}>
            <button
                class="definition-text"
                style="min-height: {maxHeight}px"
                class:fade-out={!visible}
                onclick={() => cycleDefinition()}
            >
                <span class="definition-number">{currentIndex + 1}.</span>
                {#if definitions[currentIndex] === 'you?'}
                    <a href="/join" class="you-link" onclick={(e) => e.stopPropagation()}>{definitions[currentIndex]}</a>
                {:else}
                    {definitions[currentIndex]}
                {/if}
            </button>
        </div>
    {/if}

    <div class="definition-dots">
        {#each definitions as _, i (i)}
            <button
                class="dot"
                class:active={i === currentIndex}
                onclick={() => {
                    if (isTouchDevice) {
                        goToDefinition(i);
                    } else {
                        visible = false;
                        setTimeout(() => {
                            currentIndex = i;
                            visible = true;
                        }, 300);
                    }
                }}
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
        font-family: var(--font-mono);
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

    /* Desktop: fade transition */
    .definition-text {
        display: block;
        font-family: var(--font-serif);
        font-size: 1.1rem;
        line-height: 1.5;
        max-width: 50ch;
        margin-bottom: 1.5rem;
        opacity: 0.85;
        cursor: pointer;
        background: none;
        border: none;
        color: inherit;
        text-align: left;
        padding: 0;
        transition: opacity 0.3s ease;
    }

    @media (min-width: 640px) {
        .definition-text {
            font-size: 1.25rem;
        }
    }

    .definition-text:hover {
        opacity: 1;
    }

    .definition-text.fade-out {
        opacity: 0;
    }

    /* Mobile: carousel */
    .carousel {
        overflow: hidden;
        margin-bottom: 1.5rem;
        touch-action: pan-y pinch-zoom;
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
        width: 100%;
        font-family: var(--font-serif);
        font-size: 1.1rem;
        line-height: 1.5;
        opacity: 0.85;
        text-align: left;
        padding-right: 1rem;
        box-sizing: border-box;
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

    .definition-measure {
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        height: 0;
        overflow: hidden;
    }

    .measure-item {
        font-family: var(--font-serif);
        font-size: 1.1rem;
        line-height: 1.5;
        max-width: 50ch;
    }

    @media (min-width: 640px) {
        .measure-item {
            font-size: 1.25rem;
        }
    }

    .you-link {
        text-decoration: none;
        color: inherit;
    }

    .you-link:hover {
        color: var(--accent);
    }
</style>
