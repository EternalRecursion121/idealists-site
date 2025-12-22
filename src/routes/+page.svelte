<script lang="ts">
    const definitions = [
        "someone who believes that a much better world is possible, often when this does not seem likely to others",
        "a person who sticks to their principles, choosing integrity over convenience",
        "the belief that ideas are more fundamental than matter, and that subjectivity is the foundation of everything",
        "you?"
    ];

    let currentIndex = $state(0);
    let visible = $state(true);

    function cycleDefinition() {
        visible = false;
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % definitions.length;
            visible = true;
        }, 1000);
    }

    $effect(() => {
        const delay = currentIndex === 3 ? 7000 : 5000; // hold longer on "you?"
        const timeout = setTimeout(cycleDefinition, delay);
        return () => clearTimeout(timeout);
    });
</script>

<svelte:head>
    <title>The Idealists Collective</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-6 py-16">
    
    <!-- Definition hero -->
    <section class="definition-hero mb-20">
        <div class="word-header mb-6">
            <div class="flex items-baseline gap-3 flex-wrap">
                <span class="word">idealist</span>
                <span class="badge">NOUN</span>
            </div>
            <span class="pronunciation">/ʌɪˈdɪəlɪst/</span>
        </div>
        
        <button 
            class="definition-text"
            class:fade-out={!visible}
            onclick={cycleDefinition}
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

    <!-- DNA -->
    <section>
        <h2 class="text-sm uppercase tracking-wide opacity-60 mb-6">our dna</h2>
        <ul class="space-y-8">
            <li>
                <h3 class="font-semibold mb-1">utopian</h3>
                <p class="opacity-80">we are not afraid to be ambitious in our visions of the future. and we are not afraid to try to make it a reality.</p>
            </li>
            <li>
                <h3 class="font-semibold mb-1">autonomous</h3>
                <p class="opacity-80">you control your tools, your data, your attention. decisions happen at the level where they matter.</p>
            </li>
            <li>
                <h3 class="font-semibold mb-1">playful</h3>
                <p class="opacity-80">we create with whimsy and joy. what is life without a little fun?</p>
            </li>
            <li>
                <h3 class="font-semibold mb-1">living</h3>
                <p class="opacity-80">dynamic systems over static entities. things that grow, adapt, and die when they need to.</p>
            </li>
            <li>
                <h3 class="font-semibold mb-1">cooperative</h3>
                <p class="opacity-80">we cannot succeed alone. nor would we want to.</p>
            </li>
            <li>
                <h3 class="font-semibold mb-1">love</h3>
                <p class="opacity-80">don't compromise on your integrity. don't sell your soul. do everything with love.</p>
            </li>
        </ul>
    </section>

    <section class="mt-16">
        <a href="/library" class="opacity-60 hover:opacity-100">library →</a>
    </section>
</div>

<div class="text-center mt-16">
    <a href="#" class="text-lg italic font-semibold mb-2">JOIN THE IDEALISTS COLLECTIVE</a>
</div>


<style>
    .definition-hero {
        min-height: 200px;
    }

    .word-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .word {
        font-size: 3rem;
        font-weight: 600;
        letter-spacing: -0.02em;
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
</style>
