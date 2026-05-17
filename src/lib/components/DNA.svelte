<script lang="ts">
    import Roots from './Roots.svelte';
    import Leaves from './Leaves.svelte';

    type Segment = { text: string; highlight?: boolean };
    type Item = { title: string; segments: Segment[] };

    let aliveActive = $state(false);
    let isTouch = $state(false);
    let playfulBouncing = $state(false);
    let accentColor = $state('');
    let headingColor = $state('');
    let aliveCardEl: HTMLDivElement | undefined = $state();

    function readAccentColor() {
        if (!aliveCardEl) return;
        const style = getComputedStyle(aliveCardEl);
        accentColor = style.getPropertyValue('--accent').trim();
        headingColor = style.getPropertyValue('--heading').trim();
    }

    const items: Item[] = [
        {
            title: "utopian",
            segments: [
                { text: "we are not afraid to be " },
                { text: "ambitious", highlight: true },
                { text: " in our visions of the future. and we are not afraid to try to " },
                { text: "make it a reality", highlight: true },
                { text: "." }
            ]
        },
        {
            title: "autonomous",
            segments: [
                { text: "you " },
                { text: "control", highlight: true },
                { text: " your tools, your data, your attention. you should have the power to " },
                { text: "build the world you want to live in", highlight: true },
                { text: "." }
            ]
        },
        {
            title: "playful",
            segments: [
                { text: "we create with " },
                { text: "whimsy and joy", highlight: true },
                { text: ". what is life without " },
                { text: "fun", highlight: true },
                { text: "?" }
            ]
        },
        {
            title: "alive",
            segments: [
                { text: "we believe in making things that " },
                { text: "grow, adapt, breathe", highlight: true },
                { text: ", have " },
                { text: "imperfections", highlight: true },
                { text: ", and " },
                { text: "die", highlight: true },
                { text: " when they need to." }
            ]
        },
        {
            title: "cooperative",
            segments: [
                { text: "we " },
                { text: "cannot succeed alone,", highlight: true },
                { text: " nor would we want to!" }
            ]
        },
        {
            title: "loving",
            segments: [
                { text: "don't compromise on your " },
                { text: "integrity", highlight: true },
                { text: ". don't sell your " },
                { text: "soul", highlight: true },
                { text: ". do everything with " },
                { text: "love <3", highlight: true }
            ]
        }
    ];
</script>

<section class="dna-section">
    <h2 class="section-header">our dna</h2>
    <div class="principles-grid">
        {#each items as item (item.title)}
            {#if item.title === 'alive'}
                <div
                    class="principle-card alive-card"
                    bind:this={aliveCardEl}
                    onmouseenter={() => { if (!isTouch) { aliveActive = true; readAccentColor(); } }}
                    onmouseleave={() => { if (!isTouch) { aliveActive = false; } }}
                    ontouchstart={() => { isTouch = true; }}
                    onclick={() => { aliveActive = !aliveActive; readAccentColor(); }}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { aliveActive = !aliveActive; readAccentColor(); } }}
                    role="button"
                    tabindex="0"
                >
                    <span class="principle-title">{item.title}</span>
                    <p class="principle-desc"
                        >{#each item.segments as seg, i (i)}{#if seg.highlight}<span class="highlight"
                                    >{seg.text}</span
                                >{:else}{seg.text}{/if}{/each}</p
                    >
                    <Roots active={aliveActive} color={accentColor} />
                    <Leaves
                        active={aliveActive}
                        color={accentColor}
                        altColor={headingColor}
                    />
                </div>
            {:else if item.title === 'playful'}
                <div
                    class="principle-card playful-card"
                    onmouseenter={() => { playfulBouncing = true; }}
                    onclick={() => { playfulBouncing = true; }}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { playfulBouncing = true; } }}
                    role="button"
                    tabindex="0"
                >
                    <span
                        class="principle-title"
                        class:bouncing={playfulBouncing}
                        onanimationend={() => { playfulBouncing = false; }}
                    >{item.title}</span>
                    <p class="principle-desc"
                        >{#each item.segments as seg, i (i)}{#if seg.highlight}<span class="highlight"
                                    >{seg.text}</span
                                >{:else}{seg.text}{/if}{/each}</p
                    >
                </div>
            {:else if item.title === 'autonomous'}
                <div class="principle-card autonomous-card">
                    <span class="principle-title">{item.title}</span>
                    <p class="principle-desc"
                        >{#each item.segments as seg, i (i)}{#if seg.highlight}<span class="highlight chunk chunk-{i}"
                                    >{seg.text}</span
                                >{:else}<span class="chunk chunk-{i}">{seg.text}</span>{/if}{/each}</p
                    >
                </div>
            {:else if item.title === 'cooperative'}
                <div class="principle-card cooperative-card">
                    <span class="principle-title">{item.title}</span>
                    <p class="principle-desc"
                        >{#each item.segments as seg, i (i)}{#if seg.highlight}<span class="highlight"
                                    >{seg.text}</span
                                >{:else if i === item.segments.length - 1}<span class="tail"
                                    >{seg.text}</span
                                >{:else}{seg.text}{/if}{/each}</p
                    >
                </div>
            {:else}
                <div class="principle-card">
                    <span class="principle-title">{item.title}</span>
                    <p class="principle-desc"
                        >{#each item.segments as seg, i (i)}{#if seg.highlight}<span class="highlight"
                                    >{seg.text}</span
                                >{:else}{seg.text}{/if}{/each}</p
                    >
                </div>
            {/if}
        {/each}
    </div>
</section>

<style>
    .section-header {
        font-family: var(--font-display);
        font-weight: bold;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: var(--accent);
        margin-bottom: 1rem;
    }

    .principles-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }

    @media (min-width: 768px) {
        .principles-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (min-width: 1280px) {
        .principles-grid {
            grid-template-columns: repeat(6, 1fr);
        }
    }

    .principle-card {
        padding: 1rem 1.25rem;
        position: relative;
        border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
        border-radius: 0;
        overflow: hidden;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .alive-card {
        overflow: visible;
        cursor: pointer;
    }

    .principle-card:hover {
        border-color: color-mix(in srgb, var(--accent) 55%, transparent);
    }

    .principle-title {
        display: block;
        font-family: 'Texturina', 'IM Fell DW Pica', 'Resistance', var(--font-display);
        font-weight: 400;
        font-size: 1.15rem;
        margin-bottom: 0.35rem;
        color: var(--heading);
        transition: color 0.3s ease, text-shadow 0.3s ease;
    }


    .principle-desc {
        margin: 0;
        font-family: 'Sligoil Micro Medium', var(--font-grotesk);
        font-size: 0.7rem;
        line-height: 1.5;
        color: color-mix(in srgb, var(--text) 55%, transparent);
        text-transform: lowercase;
        transition: color 0.3s ease;
    }

    .principle-card:hover .principle-desc {
        color: color-mix(in srgb, var(--text) 65%, transparent);
    }

    .highlight {
        color: inherit;
        transition: color 0.3s ease;
    }

    .principle-card:hover .highlight {
        color: var(--heading);
    }

    .playful-card {
        cursor: pointer;
    }

    .playful-card .principle-title.bouncing {
        display: inline-block;
        animation: playful-bounce 0.6s ease-in-out;
        transform-origin: bottom center;
    }

    @keyframes playful-bounce {
        0%, 100% { transform: translateY(0) rotate(-2deg); }
        25% { transform: translateY(-6px) rotate(2deg); }
        50% { transform: translateY(0) rotate(-2deg); }
        75% { transform: translateY(-3px) rotate(2deg); }
    }

    .autonomous-card .principle-title {
        display: inline-block;
        will-change: transform;
    }

    .autonomous-card:hover .principle-title {
        animation: autonomous-wander 2.4s ease-out 1 both;
    }

    @keyframes autonomous-wander {
        0%   { transform: translate(0, 0) rotate(0deg); }
        30%  { transform: translate(5px, -2px) rotate(2deg); }
        65%  { transform: translate(-3px, 2px) rotate(-2deg); }
        100% { transform: translate(2px, 0) rotate(1deg); }
    }

    .autonomous-card .chunk {
        display: inline;
        transition: margin 1.2s ease-out, padding 1.2s ease-out;
    }

    .autonomous-card:hover .chunk-0 { padding-right: 0.25em; }
    .autonomous-card:hover .chunk-1 { padding-right: 0.5em; padding-left: 0.1em; }
    .autonomous-card:hover .chunk-2 { padding-right: 0.4em; }
    .autonomous-card:hover .chunk-3 { padding-right: 0.3em; padding-left: 0.2em; }
    .autonomous-card:hover .chunk-4 { padding-left: 0.15em; }

    .cooperative-card .principle-title {
        display: inline-block;
        transition: transform 0.4s ease;
    }

    .cooperative-card .highlight {
        display: inline-block;
        transition: transform 0.4s ease;
    }

    .cooperative-card:hover .principle-title {
        transform: translateY(8px) translateX(6px) rotate(7deg);
    }

    .cooperative-card:hover .highlight {
        transform: translateY(-6px) translateX(-4px) rotate(-7deg);
    }

    .cooperative-card .tail {
        display: inline-block;
        transition: transform 0.4s ease;
    }

    .cooperative-card:hover .tail {
        transform: translateY(-6px) translateX(-4px) rotate(-7deg);
    }

    @media (prefers-reduced-motion: reduce) {
        .playful-card .principle-title.bouncing,
        .autonomous-card .principle-title,
        .autonomous-card .chunk,
        .cooperative-card .principle-title,
        .cooperative-card .highlight,
        .cooperative-card .tail {
            animation: none;
            transform: none !important;
            transition: none;
        }
    }
</style>
