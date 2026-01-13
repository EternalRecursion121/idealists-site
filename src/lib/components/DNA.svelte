<script lang="ts">
    import { onMount } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';

    const headerOptions = [
        "dna",
        "architecture",
        "principles",
        "demands"
    ];

    const items = [
        {
            title: "utopian",
            description: "we are not afraid to be ambitious in our visions of the future. and we are not afraid to try to make it a reality."
        },
        {
            title: "autonomous",
            description: "you control your tools, your data, your attention. decisions happen at the level where they matter."
        },
        {
            title: "playful",
            description: "we create with whimsy and joy. what is life without fun?"
        },
        {
            title: "living",
            description: "dynamic systems over static entities. things that grow, adapt, merge, and die when they need to."
        },
        {
            title: "cooperative",
            description: "we cannot succeed alone. nor would we want to."
        },
        {
            title: "love",
            description: "don't compromise on your integrity. don't sell your soul. do everything with love."
        }
    ];

    let currentIndex = $state(0);
    let expandedItems = new SvelteSet<string>();
    let measureEl: HTMLElement | null = null;
    let maxHeight = $state(0);

    function cycleHeader() {
        currentIndex = (currentIndex + 1) % headerOptions.length;
    }

    function toggleItem(title: string) {
        if (expandedItems.has(title)) {
            expandedItems.delete(title);
        } else {
            expandedItems.add(title);
        }
    }

    onMount(() => {
        if (measureEl) {
            const elements = measureEl.querySelectorAll<HTMLElement>('.measure-item');
            const heights = Array.from(elements, el => Math.ceil(el.getBoundingClientRect().height));
            maxHeight = heights.length ? Math.max(...heights) : 0;
        }

        // Auto-cycle every 10 seconds
        const interval = setInterval(cycleHeader, 10000);
        return () => clearInterval(interval);
    });
</script>

<div bind:this={measureEl} class="offscreen-measure">
    {#each headerOptions as option, i (i)}
        <h2 class="measure-item text-sm uppercase tracking-wide mb-6">our {option}</h2>
    {/each}
</div>

<section>
    <button
        class="caps-header-button"
        style={`min-height: ${maxHeight}px`}
        onclick={cycleHeader}
    >
        <h2 class="text-sm uppercase tracking-wide mb-6" style="color: var(--accent)">our {headerOptions[currentIndex]}</h2>
    </button>
    <ul class="dna-list">
        {#each items as item (item.title)}
            {@const isExpanded = expandedItems.has(item.title)}
            <li class="dna-item">
                <button
                    class="dna-title"
                    class:expanded={isExpanded}
                    onclick={() => toggleItem(item.title)}
                >
                    <span class="title-text">{item.title}</span>
                    <span class="indicator">{isExpanded ? '−' : '+'}</span>
                </button>
                <div class="dna-desc" class:expanded={isExpanded}>
                    <p>{item.description}</p>
                </div>
            </li>
        {/each}
    </ul>
</section>

<style>
    .caps-header-button {
        display: block;
        font-size: 1.25rem;
        line-height: 1.5;
        max-width: 50ch;
        margin-bottom: 1.5rem;
        opacity: 0.85;
        cursor: pointer;
        background: none;
        border: none;
        color: inherit;
        font-family: inherit;
        text-align: left;
        padding: 0;
    }

    .caps-header-button:hover {
        opacity: 1;
        font-style: italic;
    }

    .offscreen-measure {
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        height: 0;
        overflow: hidden;
    }

    .dna-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .dna-item {
        border-bottom: 1px solid var(--accent);
    }

    .dna-item:first-child {
        border-top: 1px solid var(--accent);
    }

    .dna-title {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        background: none;
        border: none;
        color: inherit;
        font-family: inherit;
        font-size: 1.15rem;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
    }

    .dna-title:hover {
        color: var(--accent);
    }

    .dna-title.expanded .title-text {
        font-style: italic;
    }

    .indicator {
        font-weight: 300;
        font-size: 1.25rem;
        color: var(--accent);
    }

    .dna-desc {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
    }

    .dna-desc.expanded {
        max-height: 10rem;
    }

    .dna-desc > p {
        margin: 0;
        padding: 0 0 1rem 0;
        max-width: 50ch;
        font-size: 0.8rem;
        color: var(--text);
    }
</style>

