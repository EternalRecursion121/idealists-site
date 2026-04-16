<script lang="ts">
    import Roots from './Roots.svelte';

    type Segment = { text: string; highlight?: boolean };
    type Item = { title: string; segments: Segment[] };

    let aliveActive = $state(false);
    let isTouch = $state(false);
    let accentColor = $state('');
    let aliveCardEl: HTMLDivElement | undefined = $state();

    function readAccentColor() {
        if (!aliveCardEl) return;
        accentColor = getComputedStyle(aliveCardEl).getPropertyValue('--accent').trim();
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
                { text: "cannot succeed alone", highlight: true },
                { text: ", nor would we want to!" }
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
</style>
