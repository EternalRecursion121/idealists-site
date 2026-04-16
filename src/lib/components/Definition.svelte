<script lang="ts">
    const definitions = [
        "someone who believes that a much better world is possible, often when this does not seem likely to others",
        "a person who sticks to their principles, choosing integrity over convenience",
        "the belief that ideas are more fundamental than matter, and that subjectivity is the foundation of everything",
        "you?"
    ];
</script>

<section class="definition-hero">
    <div class="word-header">
        <div class="word-row">
            <span class="word">idealist</span>
            <span class="badge">noun</span>
        </div>
        <span class="pronunciation">/ʌɪˈdɪəlɪst/</span>
    </div>

    <ol class="definition-list">
        {#each definitions as def, i (i)}
            <li class="definition-item">
                <span class="definition-number">{i + 1}.</span>
                {#if def === 'you?'}
                    <a href="/join" class="you-link"><em>{def}</em></a>
                {:else}
                    {def}
                {/if}
            </li>
        {/each}
    </ol>
</section>

<style>
    .definition-hero {
        display: block;
    }

    .word-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 1rem;
    }

    .word-row {
        display: flex;
        align-items: baseline;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .word {
        font-size: 2rem;
        font-family: 'Texturina', 'IM Fell DW Pica', 'Sligoil Micro', serif;
        font-weight: 400;
        letter-spacing: 0.01em;
        text-transform: lowercase;
        color: var(--heading);
    }

    @media (min-width: 640px) {
        .word {
            font-size: 2.75rem;
        }
    }

    .pronunciation {
        font-size: 0.8rem;
        font-weight: 400;
        opacity: 0.6;
        color: var(--accent);
    }

    .badge {
        font-size: 0.6rem;
        font-family: 'Sligoil Micro Medium', sans-serif;
        font-weight: 500;
        letter-spacing: 0.08em;
        padding: 0.15rem 0.2rem;
        background: transparent;
        opacity: 0.4;
        text-transform: lowercase;
    }

    .definition-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .definition-item {
        font-family: 'Sligoil Micro Medium', sans-serif;
        font-size: 0.95rem;
        line-height: 1.55;
        max-width: 50ch;
        opacity: 0.85;
        text-transform: lowercase;
    }

    @media (min-width: 640px) {
        .definition-item {
            font-size: 1.05rem;
        }
    }

    .definition-number {
        opacity: 0.5;
        margin-right: 0.3rem;
    }

    .you-link {
        text-decoration: none;
        color: inherit;
    }

    .you-link em {
        font-style: italic;
    }

    .you-link:hover {
        color: var(--accent);
    }
</style>
