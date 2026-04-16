<script lang="ts">
    const items = [
        {
            title: "utopian",
            description: "we are not afraid to be ambitious in our visions of the future. and we are not afraid to try to make it a reality."
        },
        {
            title: "autonomous",
            description: "you control your tools, your data, your attention. you should have the power to build the world you want to live in."
        },
        {
            title: "playful",
            description: "we create with whimsy and joy. what is life without fun?"
        },
        {
            title: "alive",
            description: "we believe in making things that grow, adapt, breathe, have imperfections, and die, when they need to."
        },
        {
            title: "cooperative",
            description: "we cannot succeed alone, nor would we want to!"
        },
        {
            title: "loving",
            description: "don't compromise on your integrity. don't sell your soul. do everything with love <3"
        }
    ];
</script>

<section>
    <h2 class="section-header">our dna</h2>
    <div class="principles-grid">
        {#each items as item (item.title)}
            <div class="principle-card">
                <span class="principle-title">{item.title}</span>
                <p class="principle-desc">{item.description}</p>
            </div>
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
    }

    .principle-title {
        display: block;
        font-family: 'Texturina', 'IM Fell DW Pica', 'Resistance', var(--font-display);
        font-weight: 400;
        font-size: 1.15rem;
        margin-bottom: 0.35rem;
        color: var(--heading);
    }

    .principle-desc {
        margin: 0;
        font-family: 'Sligoil Micro Medium', var(--font-grotesk);
        font-size: 0.7rem;
        line-height: 1.5;
        opacity: 0.6;
        text-transform: lowercase;
    }
</style>
