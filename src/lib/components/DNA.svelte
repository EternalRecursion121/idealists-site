<script lang="ts">
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
            title: "alive",
            description: "dynamic systems over static entities. things that grow, adapt, merge, and die when they need to."
        },
        {
            title: "cooperative",
            description: "we cannot succeed alone. nor would we want to."
        },
        {
            title: "loving",
            description: "don't compromise on your integrity. don't sell your soul. do everything with love."
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
        font-family: var(--font-sans);
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

    @media (min-width: 480px) {
        .principles-grid {
            grid-template-columns: 1fr 1fr;
        }
    }

    .principle-card {
        padding: 1rem 1.25rem;
        position: relative;
        background: color-mix(in srgb, var(--text) 4%, transparent);
        border-radius: 8px;
        transition: background 0.3s, transform 0.2s;
        overflow: hidden;
    }

    .principle-card::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 8px;
        padding: 1px;
        background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--accent) 30%, transparent),
            transparent 60%
        );
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        opacity: 0;
        transition: opacity 0.3s;
    }

    .principle-card:hover::before {
        opacity: 1;
    }

    .principle-card:hover {
        background: color-mix(in srgb, var(--accent) 8%, transparent);
        transform: translateY(-1px);
    }

    .principle-title {
        display: block;
        font-family: var(--font-serif);
        font-style: italic;
        font-size: 1.15rem;
        margin-bottom: 0.35rem;
        color: var(--heading);
    }

    .principle-desc {
        margin: 0;
        font-family: var(--font-mono);
        font-size: 0.7rem;
        line-height: 1.5;
        opacity: 0.55;
    }
</style>
