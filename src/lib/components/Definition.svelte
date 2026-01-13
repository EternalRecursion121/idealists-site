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
    let measureEl: HTMLElement | null = null;
    let maxHeight = $state(0);
    let touchStartX = 0;
    let touchEndX = 0;

    function cycleDefinition() {
        visible = false;
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % definitions.length;
            visible = true;
        }, 300);
    }

    function goToDefinition(index: number) {
        visible = false;
        setTimeout(() => {
            currentIndex = index;
            visible = true;
        }, 300);
    }

    function handleTouchStart(e: TouchEvent) {
        touchStartX = e.touches[0].clientX;
    }

    function handleTouchEnd(e: TouchEvent) {
        touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe left - next
                goToDefinition((currentIndex + 1) % definitions.length);
            } else {
                // Swipe right - previous
                goToDefinition((currentIndex - 1 + definitions.length) % definitions.length);
            }
        }
    }

    $effect(() => {
        const delay = currentIndex === 3 ? 7000 : 5000; // hold longer on "you?"
        const timeout = setTimeout(() => cycleDefinition(), delay);
        return () => clearTimeout(timeout);
    });

    onMount(() => {
        if (!measureEl) return;
        const items = measureEl.querySelectorAll<HTMLElement>('.measure-item');
        const heights = Array.from(items, el => Math.ceil(el.getBoundingClientRect().height));
        maxHeight = heights.length ? Math.max(...heights) : 0;
    });
</script>

<div bind:this={measureEl} class="definition-measure">
    {#each definitions as def, i (i)}
        <div class="definition-text measure-item">
            <span class="definition-number">{i + 1}.</span>
            {def}
        </div>
    {/each}
</div>

<section
    class="definition-hero mb-20"
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
>
    <div class="word-header mb-6">
        <div class="flex items-baseline gap-3 flex-wrap">
            <span class="word">idealist</span>
            <span class="badge">NOUN</span>
        </div>
        <span class="pronunciation">/ʌɪˈdɪəlɪst/</span>
    </div>
    <button 
        class="definition-text"
        style={`min-height: ${maxHeight}px`}
        class:fade-out={!visible}
        onclick={() => cycleDefinition()}
    >
        <span class="definition-number">{currentIndex + 1}.</span>
        {definitions[currentIndex]}
    </button>
    
    <div class="definition-dots">
        {#each definitions as _, i (i)}
            <button 
                class="dot"
                class:active={i === currentIndex}
                onclick={() => { currentIndex = i; visible = true; }}
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

    .definition-text {
        display: block;
        font-family: var(--font-mono);
        font-size: 1.25rem;
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
    
    .definition-text:hover {
        opacity: 1;
    }

    .definition-text.fade-out {
        opacity: 0;
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
</style>

