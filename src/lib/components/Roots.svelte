<script lang="ts">
    import { onMount } from 'svelte';

    interface Props {
        active: boolean;
        color: string;
    }

    let { active, color }: Props = $props();

    let canvasEl: HTMLCanvasElement | undefined = $state();
    let ctx: CanvasRenderingContext2D | null = null;
    // Offscreen buffer where roots accumulate — drawn once, never redrawn
    let buffer: OffscreenCanvas | null = null;
    let bufCtx: OffscreenCanvasRenderingContext2D | null = null;
    let animId: number = 0;
    let roots: Root[] = [];
    let growing = false;
    let animating = false;
    let fadeAlpha = 0;
    let padX = 0;
    let cardW = 0;

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

        // Draw one new circle onto the buffer and advance position
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
            const x = padX + Math.random() * cardW;
            roots.push(new Root(x, 0));
        }
    }

    function draw() {
        if (!ctx || !canvasEl || !bufCtx || !buffer) return;
        const w = canvasEl.width;
        const h = canvasEl.height;

        if (growing) {
            fadeAlpha = Math.min(1, fadeAlpha + 0.05);

            // Step each root — draws one circle onto the buffer
            for (let i = roots.length - 1; i >= 0; i--) {
                const root = roots[i];
                if (!root.done) {
                    root.step(bufCtx, color);

                    // Splitting — matching the p5 sketch
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
                ctx.clearRect(0, 0, w, h);
                animating = false;
                return;
            }
        }

        // Composite: clear visible canvas, draw buffer at current fade alpha
        ctx.clearRect(0, 0, w, h);
        ctx.globalAlpha = fadeAlpha;
        ctx.drawImage(buffer, 0, 0);
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

        padX = 1200;
        cardW = cardRect.width;
        const totalW = cardW + padX * 2;
        const totalH = 1600;

        canvasEl.width = totalW;
        canvasEl.height = totalH;

        ctx = canvasEl.getContext('2d');
        if (!ctx) return;

        buffer = new OffscreenCanvas(totalW, totalH);
        bufCtx = buffer.getContext('2d');
        if (!bufCtx) return;

        initRoots();
        fadeAlpha = 0;

        cancelAnimationFrame(animId);
        animating = false;
        startAnimation();
    }

    function stopGrowing() {
        growing = false;
        // Stop all root growth immediately
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

<div class="roots-container">
    <canvas bind:this={canvasEl}></canvas>
</div>

<style>
    .roots-container {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: none;
        z-index: -1;
        overflow: visible;
    }

    canvas {
        display: block;
    }
</style>
