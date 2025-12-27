<script lang="ts">
    // MAPPING FOR ALT TEXTS
    // 0 = definition
    // 1 = name of dna
    const alt_texts = [
        [
            "someone who believes that a much better world is possible, often when this does not seem likely to others",
            "a person who sticks to their principles, choosing integrity over convenience",
            "the belief that ideas are more fundamental than matter, and that subjectivity is the foundation of everything",
            "you?"
        ],
        [
            "dna",
            "architecture",
            "principles",
            "non-negotiables",
            "demands"
        ]
    ];

    let currentIndexes = $state([0,0]);
    let visible = $state(true);

    // Star rotation physics
    let starRotation = $state(0);
    let starVelocity = $state(0);
    let isHovering = $state(false);
    let isDragging = $state(false);
    let lastMouseY = $state(0);
    let lastTime = $state(0);

    function cycleDefinition(divid: number) {
        if (divid == 0){
            visible = false;
            setTimeout(() => {
                currentIndexes[divid] = (currentIndexes[divid] + 1) % alt_texts[divid].length;
                visible = true;
            }, 1000);
        }
        else {
            currentIndexes[divid] = (currentIndexes[divid] + 1) % alt_texts[divid].length;
        }
    }

    $effect(() => {
        const delay = currentIndexes[0] === 3 ? 7000 : 5000; // hold longer on "you?" - I LIKE THIS A LOT!
        const timeout = setTimeout(() => cycleDefinition(0), delay);
        return () => clearTimeout(timeout);
    });

    // Star momentum effect
    $effect(() => {
        let frameId: number;
        const animate = () => {
            // Accelerate while hovering
            if (isHovering) {
                starVelocity += 0.5;
                starVelocity = Math.min(starVelocity, 15); // max speed
            } else {
                // Apply friction when not hovering
                starVelocity *= 0.96;
                if (Math.abs(starVelocity) < 0.05) {
                    starVelocity = 0;
                }
            }
            starRotation += starVelocity;
            frameId = requestAnimationFrame(animate);
        };
        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    });

    // Star momentum effect
    $effect(() => {
        let frameId: number;
        const animate = () => {
            if (!isDragging) {
                // Apply friction
                starVelocity *= 0.95;
                if (Math.abs(starVelocity) < 0.1) {
                    starVelocity = 0;
                }
            }
            starRotation += starVelocity;
            if (starVelocity !== 0 || isDragging) {
                frameId = requestAnimationFrame(animate);
            }
        };
        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    });

    function handleStarMouseDown(e: MouseEvent) {
        isDragging = true;
        lastMouseY = e.clientY;
        lastTime = Date.now();
        starVelocity = 0;
    }

    function handleStarMouseMove(e: MouseEvent) {
        if (!isDragging) return;
        const currentTime = Date.now();
        const deltaY = e.clientY - lastMouseY;
        const deltaTime = Math.max(currentTime - lastTime, 1);

        // Calculate velocity based on vertical mouse movement
        starVelocity = (deltaY / deltaTime) * -0.5; // negative for natural direction

        lastMouseY = e.clientY;
        lastTime = currentTime;
    }

    function handleStarMouseUp() {
        isDragging = false;
    }

    import { onMount } from 'svelte';

    let measureEl: HTMLElement | null = null;
    let maxHeights: number[] = [0,0];

    onMount(() => {
        if (!measureEl) return;
        for (var i = 0; i < alt_texts.length; i ++){
            const items = measureEl.querySelectorAll<HTMLElement>(`.measure${i}`);
            const heights = Array.from(items, el => Math.ceil(el.getBoundingClientRect().height));
            maxHeights[i] = heights.length ? Math.max(...heights) : 0;
        }
    });

</script>

<svelte:head>
    <title>The Idealists Collective</title>
</svelte:head>

<div bind:this={measureEl} class="definition-measure">
    {#each alt_texts as alts,j}
        {#each alts as def, i}
            <div class="definition-text measure{j}">
            <span class="definition-number">{i + 1}.</span>
            {def}
            </div>
        {/each}
    {/each}
</div>


<div class="max-w-3xl mx-auto px-6 py-16">

    <div class="word-header mb-6">
        <div class="ideal-title">
            <span>THE IDEALISTS C<span
                class="star"
                style="transform: rotate({starRotation}deg)"
                onmouseenter={() => isHovering = true}
                onmouseleave={() => isHovering = false}
            >✺</span>LLECTIVE</span>
        </div>
    </div>

    <section>
        <p class="opacity-80" style="color: #18440B">we are the SF counterculture. we are embracing the new world of infinite software. we will not be satisfied with any direction other than towards utopia. we are, first and foremost, <i style="color: #BE0000">idealists</i>.</p>
        <br>
        <p style="text-align: center; color: #235613;">✺✺✺✺✺</p>
        <br>
    </section>
    
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
            style={`min-height: ${maxHeights[0]}px`}
            class:fade-out={!visible}
            onclick={() => cycleDefinition(0)}
        >
            <span class="definition-number">{currentIndexes[0] + 1}.</span>
            {alt_texts[0][currentIndexes[0]]}
        </button>
        
        <div class="definition-dots">
            {#each alt_texts[0] as _, i (i)}
                <button 
                    class="dot"
                    class:active={i === currentIndexes[0]}
                    onclick={() => { currentIndexes[0] = i; visible = true; }}
                    aria-label="Definition {i + 1}"
                ></button>
            {/each}
        </div>
    </section>

    <!-- DNA -->
    <section>
        <button class="caps-header-button"
            style={`min-height: ${maxHeights[1]}px`}
            class:fade-out={!visible}
            onclick={() => cycleDefinition(1)}
        >
            <h2 class="text-sm uppercase tracking-wide opacity-60 mb-6">our {alt_texts[1][currentIndexes[1]]}</h2>
        </button>
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
                <p class="opacity-80">dynamic systems over static entities. things that grow, adapt, merge, and die when they need to.</p>
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
    <a href="#" class="text-lg italic font-semibold mb-2">join us ✺</a>
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
        font-size: 2.5rem;
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

    .ideal-title{
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 3rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: #7d0202
    }

    .side-rectangle {
        width: 20%;
        min-height: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 20px 10px;
        flex-shrink: 0;
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
        font-style:italic;
        text-decoration: solid;
        text-decoration-color:#7d0202;

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

    .star {
        display: inline-block;
        font-size: 1.3em;
        transform-origin: 50% 55%;
        cursor: pointer;
        user-select: none;
    }

</style>
