<script lang="ts">
    import { onMount } from 'svelte';

    interface Props {
        active: boolean;
        color: string;
    }

    let { active, color }: Props = $props();

    let canvasEl: HTMLCanvasElement | undefined = $state();
    let ctx: CanvasRenderingContext2D | null = null;
    let buffer: OffscreenCanvas | null = null;
    let bufCtx: OffscreenCanvasRenderingContext2D | null = null;
    let animId: number = 0;
    let roots: Root[] = [];
    let growing = false;
    let animating = false;
    let fadeAlpha = 0;
    let containerLeft = $state(0);

    // Large buffer so roots never clip
    const BUF_W = 2400;
    const BUF_H = 1600;
    let spawnLeft = 0;
    let spawnWidth = 0;

    // Offset: which region of the buffer to show on the visible canvas
    let srcX = 0;
    let srcY = 0;
    let visW = 0;
    let visH = 0;

    function makeNoise() {
        const size = 256;
        const perm = new Float64Array(size);
        for (let i = 0; i < size; i++) perm[i] = Math.random();
        return (t: number) => {
            const idx = ((Math.floor(t) % size) + size) % size;
            const f = t - Math.floor(t);
            const a = perm[idx];
            const b = perm[(idx + 1) % size];
            const u = f * f * (3 - 2 * f);
            return a + (b - a) * u;
        };
    }

    class Root {
        x: number;
        y: number;
        size: number;
        noiseX: (t: number) => number;
        noiseY: (t: number) => number;
        noiseOffsetX: number;
        noiseOffsetY: number;
        xrandomizer: number;
        yrandomizer: number;
        shrinkRate: number;
        done: boolean;

        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 3 + 1;
            this.noiseX = makeNoise();
            this.noiseY = makeNoise();
            this.noiseOffsetX = Math.random() * 100;
            this.noiseOffsetY = Math.random() * 100;
            this.xrandomizer = Math.random() * 2 - 1;
            this.yrandomizer = Math.random() * 3 + 2;
            this.shrinkRate = 0.994;
            this.done = false;
        }

        step(bufCtx: OffscreenCanvasRenderingContext2D, rootColor: string) {
            if (this.done) return;
            if (this.size < 0.3) { this.done = true; return; }

            bufCtx.fillStyle = rootColor;
            bufCtx.globalAlpha = 0.2;
            bufCtx.beginPath();
            bufCtx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            bufCtx.fill();

            this.x += this.noiseX(this.noiseOffsetX) * this.xrandomizer;
            this.y += this.noiseY(this.noiseOffsetY) * this.yrandomizer;

            this.noiseOffsetX += 0.02;
            this.noiseOffsetY += 0.02;

            this.size *= this.shrinkRate;
        }
    }

    function initRoots() {
        roots = [];
        for (let i = 0; i < 40; i++) {
            const x = spawnLeft + Math.random() * spawnWidth;
            roots.push(new Root(x, 0));
        }
    }

    function draw() {
        if (!ctx || !canvasEl || !bufCtx || !buffer) return;

        if (growing) {
            fadeAlpha = Math.min(1, fadeAlpha + 0.05);

            for (let i = roots.length - 1; i >= 0; i--) {
                const root = roots[i];
                if (!root.done) {
                    root.step(bufCtx, color);

                    if (Math.floor(Math.random() * 150) + 1 === 10) {
                        const nr = new Root(root.x, root.y);
                        nr.size = root.size;
                        nr.xrandomizer = Math.random() * 2 - 1;
                        nr.yrandomizer = Math.random() * 1 + 2;
                        roots.push(nr);
                    }
                }
            }
        } else {
            fadeAlpha = Math.max(0, fadeAlpha - 0.01);
            if (fadeAlpha <= 0) {
                ctx.clearRect(0, 0, visW, visH);
                animating = false;
                return;
            }
        }

        // Draw the viewport-mapped portion of the buffer
        const sw = Math.min(BUF_W - srcX, visW);
        const sh = Math.min(BUF_H - srcY, visH);

        ctx.clearRect(0, 0, visW, visH);
        ctx.globalAlpha = fadeAlpha;
        ctx.drawImage(buffer, srcX, srcY, sw, sh, 0, 0, sw, sh);
        ctx.globalAlpha = 1;

        animId = requestAnimationFrame(draw);
    }

    function startAnimation() {
        if (animating) return;
        animating = true;
        animId = requestAnimationFrame(draw);
    }

    function startGrowing() {
        if (!canvasEl) return;
        growing = true;

        const card = canvasEl.closest('.alive-card');
        if (!card) return;
        const cardRect = card.getBoundingClientRect();

        // Visible canvas = viewport width, capped height
        visW = document.documentElement.clientWidth;
        visH = Math.min(600, window.innerHeight);

        canvasEl.width = visW;
        canvasEl.height = visH;

        // Position the container at viewport left edge (offset from card)
        containerLeft = -cardRect.left;

        // In buffer: card is centered at BUF_W/2
        spawnWidth = cardRect.width;
        spawnLeft = (BUF_W - spawnWidth) / 2;

        // The visible canvas x=0 corresponds to viewport left (x=0 on screen).
        // The card center on screen is at cardRect.left + cardRect.width/2.
        // The card center in buffer is BUF_W/2.
        // So buffer x = screen x + (BUF_W/2 - cardCenterScreen)
        // visible canvas x=0 (screen left) maps to buffer x = BUF_W/2 - cardCenterScreen
        const cardCenterScreen = cardRect.left + cardRect.width / 2;
        srcX = Math.max(0, Math.floor(BUF_W / 2 - cardCenterScreen));
        srcY = 0;

        buffer = new OffscreenCanvas(BUF_W, BUF_H);
        bufCtx = buffer.getContext('2d');
        if (!bufCtx) return;

        ctx = canvasEl.getContext('2d');
        if (!ctx) return;

        initRoots();
        fadeAlpha = 0;

        cancelAnimationFrame(animId);
        animating = false;
        startAnimation();
    }

    function stopGrowing() {
        growing = false;
        for (const root of roots) root.done = true;
        startAnimation();
    }

    $effect(() => {
        if (active) {
            startGrowing();
        } else {
            stopGrowing();
        }
    });

    onMount(() => {
        return () => {
            cancelAnimationFrame(animId);
        };
    });
</script>

<div class="roots-container" style="left: {containerLeft}px;">
    <canvas bind:this={canvasEl}></canvas>
</div>

<style>
    .roots-container {
        position: absolute;
        top: 100%;
        pointer-events: none;
        z-index: -1;
    }

    canvas {
        display: block;
    }
</style>
