<script lang="ts">
    import { onMount } from 'svelte';

    const headerOptions = [
        "dna",
        "architecture",
        "principles",
        "non-negotiables",
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
    let measureEl: HTMLElement | null = null;
    let descMeasureEl: HTMLElement | null = null;
    let maxHeight = $state(0);
    let maxDescHeight = $state(0);

    function cycleHeader() {
        currentIndex = (currentIndex + 1) % headerOptions.length;
    }

    onMount(() => {
        if (measureEl) {
            const elements = measureEl.querySelectorAll<HTMLElement>('.measure-item');
            const heights = Array.from(elements, el => Math.ceil(el.getBoundingClientRect().height));
            maxHeight = heights.length ? Math.max(...heights) : 0;
        }
        if (descMeasureEl) {
            const descElements = descMeasureEl.querySelectorAll<HTMLElement>('.measure-desc');
            const descHeights = Array.from(descElements, el => Math.ceil(el.getBoundingClientRect().height));
            maxDescHeight = descHeights.length ? Math.max(...descHeights) : 0;
        }
    });
</script>

<div bind:this={measureEl} class="offscreen-measure">
    {#each headerOptions as option, i (i)}
        <h2 class="measure-item text-sm uppercase tracking-wide opacity-60 mb-6">our {option}</h2>
    {/each}
</div>

<div bind:this={descMeasureEl} class="offscreen-measure">
    {#each items as item (item.title)}
        <p class="measure-desc opacity-80">{item.description}</p>
    {/each}
</div>

<section>
    <button 
        class="caps-header-button"
        style={`min-height: ${maxHeight}px`}
        onclick={cycleHeader}
    >
        <h2 class="text-sm uppercase tracking-wide opacity-60 mb-6">our {headerOptions[currentIndex]}</h2>
    </button>
    <ul class="space-y-8">
        {#each items as item (item.title)}
            <li>
                <h3 class="font-semibold mb-1">{item.title}</h3>
                <p class="opacity-80" style={`min-height: ${maxDescHeight}px`}>{item.description}</p>
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
        text-decoration: solid;
        text-decoration-color: #7d0202;
    }

    .offscreen-measure {
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        height: 0;
        overflow: hidden;
    }
</style>

