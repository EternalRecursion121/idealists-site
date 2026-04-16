<script lang="ts">
    import { onMount } from 'svelte';
    import DNA from '$lib/components/DNA.svelte';
    import BottomNav from '$lib/components/BottomNav.svelte';
    import Definition from '$lib/components/Definition.svelte';
    import SiteMap from '$lib/components/SiteMap.svelte';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let definitionRevealed = $state(false);
    const revealDefinition = () => { definitionRevealed = true; };

    let titleEl: HTMLElement | undefined = $state();
    let idealistsEl: HTMLElement | undefined = $state();
    let definitionTopOffset = $state(0);

    function measureDefinitionOffset() {
        if (!idealistsEl || !titleEl) return;
        const idealistsRect = idealistsEl.getBoundingClientRect();
        const titleRect = titleEl.getBoundingClientRect();
        definitionTopOffset = idealistsRect.top - titleRect.top;
    }

    onMount(() => {
        measureDefinitionOffset();
        const ro = new ResizeObserver(measureDefinitionOffset);
        if (titleEl) ro.observe(titleEl);
        window.addEventListener('resize', measureDefinitionOffset);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', measureDefinitionOffset);
        };
    });

    type Segment =
        | { kind: 'text'; value: string }
        | { kind: 'bracket'; ruleId: string }
        | { kind: 'cycle'; index: number };

    const cycleOptions = [
        'worth fighting for',
        'beautiful',
        'ours to define'
    ];

    const expansions: Record<string, Segment[]> = {
        a: [
            { kind: 'text', value: 'philosophers ' },
            { kind: 'bracket', ruleId: 'b' },
            { kind: 'text', value: ' who believe that ' },
            { kind: 'bracket', ruleId: 'c' }
        ],
        b: [
            { kind: 'text', value: 'and artists ' },
            { kind: 'bracket', ruleId: 'd' }
        ],
        c: [
            { kind: 'text', value: 'the future ' },
            { kind: 'bracket', ruleId: 'e' }
        ],
        d: [{ kind: 'text', value: 'and technologists' }]
    };

    let segments = $state<Segment[]>([
        { kind: 'text', value: 'a community of <br>&nbsp;&nbsp;philosophers, <br>&nbsp;&nbsp;&nbsp;&nbsp;artists, <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;and technologists<br>who believe that the future is<br>' },
        { kind: 'bracket', ruleId: 'e' }
    ]);

    function expand(index: number, ruleId: string) {
        if (ruleId === 'e') {
            segments = [
                ...segments.slice(0, index),
                { kind: 'cycle', index: 0 },
                ...segments.slice(index + 1)
            ];
            return;
        }
        const exp = expansions[ruleId];
        if (!exp) return;
        segments = [...segments.slice(0, index), ...exp, ...segments.slice(index + 1)];
    }

    function cycle(index: number) {
        const seg = segments[index];
        if (seg.kind !== 'cycle') return;
        const next = (seg.index + 1) % cycleOptions.length;
        segments = segments.map((s, i) => (i === index ? { kind: 'cycle', index: next } : s));
    }
</script>

<svelte:head>
    <title>The Idealists Collective</title>
</svelte:head>

<div class="page-container">
    <div class="hero-grid">
        <div class="title-col">
            <h1 class="title" bind:this={titleEl}>
                <img class="flower-underlay" src="/flower-logo.png" alt="" aria-hidden="true" />
                <span>THE</span>
                <span bind:this={idealistsEl} class="with-footnote"
                    >IDEALISTS<button
                        type="button"
                        class="footnote"
                        aria-label="what is this?"
                        onmouseenter={revealDefinition}
                        onfocus={revealDefinition}
                        onclick={revealDefinition}>&#123;?&#125;</button
                    ></span
                >
                <span>COLLECTIVE</span>
            </h1>

            <p class="community-text">
                {#each segments as seg, i (i)}
                    {#if seg.kind === 'text'}<span>{@html seg.value}</span>{:else if seg.kind === 'bracket'}<button
                            type="button"
                            class="bracket"
                            aria-label="reveal more"
                            onclick={() => expand(i, seg.ruleId)}>&#123;?&#125;</button
                        >{:else}<button
                            type="button"
                            class="bracket filled"
                            aria-label="cycle phrase"
                            onclick={() => cycle(i)}>&#123;{cycleOptions[seg.index]}&#125;</button
                        >{/if}
                {/each}
            </p>
        </div>

        <div
            class="definition-col"
            class:revealed={definitionRevealed}
            style="--def-top: {definitionTopOffset}px;"
        >
            {#if definitionRevealed}
                <Definition />
            {/if}
        </div>
    </div>

    <div class="main-grid">
        <div class="dna-row">
            <DNA />
        </div>

        <aside class="random-page">
            <a href={data.randomRoute}>here</a> is a random page from this site, just for you &lt;3
        </aside>

        <div class="index-col">
            <SiteMap
                pages={data.mainNavPages}
                connections={data.mainNavConnections}
                height={760}
            />
        </div>
    </div>

    <BottomNav current="home" />
</div>

<style>
    .page-container {
        max-width: 72rem;
        margin: 0 auto;
        padding: 1rem;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    /* Hero — two columns: giant title + interactive community text */
    .hero-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;
        margin-top: 2rem;
        margin-bottom: 3.5rem;
        align-items: start;
    }

    @media (min-width: 1280px) {
        .hero-grid {
            grid-template-columns: 1.2fr 1fr;
            gap: 6rem;
            margin-top: 3.5rem;
        }
    }

    .title-col {
        text-align: left;
    }

    .title {
        font-family: 'Texturina', 'IM Fell DW Pica', 'Resistance', var(--font-display);
        font-weight: 400;
        font-size: clamp(4rem, 11vw, 6rem);
        line-height: 1;
        letter-spacing: 0.01em;
        color: var(--heading);
        margin: 0;
        display: flex;
        flex-direction: column;
        position: relative;
        isolation: isolate;
    }

    .title span {
        display: block;
        position: relative;
        z-index: 1;
    }

    .flower-underlay {
        position: absolute;
        top: 0.5em;
        left: 0.33em;
        width: 5em;
        height: 5em;
        transform: translate(-50%, -50%);
        opacity: 0.22;
        pointer-events: none;
        user-select: none;
        z-index: 0;
    }

    .community-text {
        font-family: 'Sligoil Micro Medium', var(--font-grotesk);
        font-size: clamp(0.95rem, 1.4vw, 1.2rem);
        line-height: 1.55;
        color: var(--text);
        margin: 1.5rem 0 0 0;
        text-transform: lowercase;
        font-weight: 400;
    }

    .with-footnote {
        position: relative;
        display: inline-block;
        width: fit-content;
        align-self: flex-start;
    }

    .footnote {
        position: absolute;
        left: 100%;
        top: 60%;
        font-family: var(--font-body);
        font-size: 1rem;
        line-height: 1;
        margin-left: 0.35rem;
        padding: 0;
        background: none;
        border: none;
        color: var(--accent);
        cursor: help;
        opacity: 0.85;
        transition: opacity 0.2s;
        white-space: nowrap;
    }

    @media (min-width: 640px) {
        .footnote {
            font-size: 1.2rem;
        }
    }

    .footnote:hover,
    .footnote:focus-visible {
        opacity: 1;
        outline: none;
    }

    .definition-col {
        align-self: start;
        min-height: 0;
        opacity: 0;
        transition: opacity 0.5s ease;
    }

    .definition-col.revealed {
        opacity: 1;
    }

    @media (min-width: 1280px) {
        .definition-col {
            padding-top: var(--def-top, 0);
        }
    }

    .bracket {
        font: inherit;
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        color: var(--accent);
        cursor: pointer;
        text-transform: lowercase;
    }

    .bracket:hover {
        color: var(--heading);
    }

    .bracket.filled {
        color: var(--heading);
    }

    /* Main grid — DNA row on top, index below, both full width */
    .main-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 3rem;
        margin-top: 0;
        margin-bottom: 2rem;
    }

    .dna-row {
        min-width: 0;
    }

    .index-col {
        min-width: 0;
    }

    .random-page {
        font-family: var(--font-body);
        font-size: 0.8rem;
        line-height: 1.55;
        opacity: 0.7;
        color: var(--text);
        text-transform: lowercase;
        margin: -1rem 0 0;
        text-align: right;
    }

    .random-page a {
        color: var(--accent);
        text-decoration: none;
        border-bottom: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
        transition: color 0.2s, border-color 0.2s;
    }

    .random-page a:hover {
        color: var(--heading);
        border-bottom-color: var(--heading);
    }

    @media (min-width: 640px) {
        .page-container {
            padding: 2rem 1.5rem;
        }
    }
</style>
