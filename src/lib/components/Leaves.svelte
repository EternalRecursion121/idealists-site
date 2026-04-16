<script lang="ts">
    import { onMount } from 'svelte';

    interface Props {
        active: boolean;
        color: string;
        altColor?: string;
    }

    let { active, color, altColor }: Props = $props();

    let canvasEl: HTMLCanvasElement | undefined = $state();
    let ctx: CanvasRenderingContext2D | null = null;
    let buffer: OffscreenCanvas | null = null;
    let bufCtx: OffscreenCanvasRenderingContext2D | null = null;
    let animId: number = 0;
    let leaves: Leaf[] = [];
    let growing = false;
    let animating = false;
    let fadeAlpha = 0;
    let containerLeft = $state(0);

    // Same buffer dimensions as Roots so the visual scale matches
    const BUF_W = 2400;
    const BUF_H = 1600;
    let spawnLeft = 0;
    let spawnWidth = 0;

    let srcX = 0;
    let srcY = 0;
    let visW = 0;
    let visH = 0;

    // Primary trunks spawn at the base; branches cascade from forks.
    // Density params are set per-session in startGrowing based on viewport width.
    const MAX_DEPTH = 5;
    const SPAWN_WIDTH_MULTIPLIER = 2.0;
    let SPAWN_INTERVAL_FRAMES = 40;
    let MAX_PRIMARY = 7;
    let FORK_SCALE = 1; // multiplier on FORK_CHANCE denominators; higher = fewer forks
    let spawnCounter = 0;
    let spawnedCount = 0;

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

    class Leaf {
        x: number;
        y: number;
        spawnX: number;
        spawnY: number;
        baseSize: number;
        taperRate: number;
        size: number;
        noiseX: (t: number) => number;
        noiseY: (t: number) => number;
        noiseOffsetX: number;
        noiseOffsetY: number;
        xrandomizer: number;
        yrandomizer: number;
        depth: number;
        done: boolean;

        constructor(
            x: number,
            y: number,
            depth: number = 0,
            baseSize?: number,
            xrandomizer?: number,
            yrandomizer?: number
        ) {
            this.x = x;
            this.y = y;
            this.spawnX = x;
            this.spawnY = y;
            this.depth = depth;

            // Per-level defaults that create clear fractal hierarchy
            if (depth === 0) {
                this.baseSize = baseSize ?? Math.random() * 3 + 5;            // 5–8 px thick trunk
                this.taperRate = Math.random() * 0.004 + 0.003;                // 0.003–0.007
                this.xrandomizer = xrandomizer ?? (Math.random() * 2 - 1) * 0.7;
                this.yrandomizer = yrandomizer ?? -(Math.random() * 0.7 + 1.1); // 1.1–1.8 upward
            } else if (depth === 1) {
                this.baseSize = baseSize ?? Math.random() * 2 + 3;            // 3–5 px (thicker)
                this.taperRate = Math.random() * 0.003 + 0.002;                // 0.002–0.005 (slower taper)
                this.xrandomizer = xrandomizer ?? (Math.random() * 2 - 1) * 0.9;
                this.yrandomizer = yrandomizer ?? -(Math.random() * 0.35 + 0.3);
            } else if (depth === 2) {
                this.baseSize = baseSize ?? Math.random() * 1.5 + 2;          // 2–3.5 px
                this.taperRate = Math.random() * 0.004 + 0.003;                // 0.003–0.007
                this.xrandomizer = xrandomizer ?? (Math.random() * 2 - 1) * 0.6;
                this.yrandomizer = yrandomizer ?? -(Math.random() * 0.18 + 0.12);
            } else {
                this.baseSize = baseSize ?? Math.random() * 1 + 1.5;          // 1.5–2.5 px
                this.taperRate = Math.random() * 0.006 + 0.005;                // 0.005–0.011
                this.xrandomizer = xrandomizer ?? (Math.random() * 2 - 1) * 0.3;
                this.yrandomizer = yrandomizer ?? -(Math.random() * 0.08 + 0.05);
            }

            this.size = this.baseSize;
            this.noiseX = makeNoise();
            this.noiseY = makeNoise();
            this.noiseOffsetX = Math.random() * 100;
            this.noiseOffsetY = Math.random() * 100;
            this.done = false;
        }

        step(bufCtx: OffscreenCanvasRenderingContext2D, leafColor: string, leafColorAlt: string) {
            if (this.done) return;

            // Branch direction for perpendicular leaf orientation
            const branchAngle = Math.atan2(this.yrandomizer, this.xrandomizer);
            const perpAngle = branchAngle + Math.PI / 2;

            // Terminal leaf tip when branch runs out of thickness
            if (this.size < 0.4) {
                const useAlt = Math.random() < 0.4;
                bufCtx.fillStyle = useAlt && leafColorAlt ? leafColorAlt : leafColor;
                bufCtx.globalAlpha = 0.35 + Math.random() * 0.25; // 0.35–0.6 per leaf
                const sizeScale = 0.7 + Math.random() * 0.7;      // ±35% size variance
                const w = (3.5 + Math.random() * 2.5) * sizeScale;
                const h = (1.4 + Math.random() * 0.9) * sizeScale;
                const leafAngle = perpAngle + (Math.random() - 0.5) * 0.7; // ±0.35 rad jitter
                bufCtx.beginPath();
                bufCtx.ellipse(this.x, this.y, w, h, leafAngle, 0, Math.PI * 2);
                bufCtx.fill();
                this.done = true;
                return;
            }

            // Trunk/branch stroke
            bufCtx.fillStyle = leafColor;
            bufCtx.globalAlpha = 0.28;
            bufCtx.beginPath();
            bufCtx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            bufCtx.fill();

            // Occasional leaflet along the branch (not trunks) — perpendicular to branch
            if (this.depth > 0 && Math.random() < 0.005) {
                const useAlt = Math.random() < 0.4;
                bufCtx.fillStyle = useAlt && leafColorAlt ? leafColorAlt : leafColor;
                bufCtx.globalAlpha = 0.3 + Math.random() * 0.2; // 0.3–0.5 per leaflet
                const sizeScale = 0.7 + Math.random() * 0.7;
                const ox = (Math.random() - 0.5) * 4;
                const oy = (Math.random() - 0.5) * 4;
                const w = (3 + Math.random() * 2) * sizeScale;
                const h = (1.2 + Math.random() * 0.8) * sizeScale;
                const leafAngle = perpAngle + (Math.random() - 0.5) * 0.7;
                bufCtx.beginPath();
                bufCtx.ellipse(this.x + ox, this.y + oy, w, h, leafAngle, 0, Math.PI * 2);
                bufCtx.fill();
            }

            this.x += this.noiseX(this.noiseOffsetX) * this.xrandomizer;
            this.y += this.noiseY(this.noiseOffsetY) * this.yrandomizer;

            this.noiseOffsetX += 0.02;
            this.noiseOffsetY += 0.02;

            // Taper based on total distance traveled (branches bend sideways too)
            const dx = this.x - this.spawnX;
            const dy = this.spawnY - this.y;
            const traveled = Math.sqrt(dx * dx + dy * dy);
            this.size = Math.max(0, this.baseSize * (1 - traveled * this.taperRate));
        }
    }

    // Fork probability per step, per depth tier. Lower denominator = more forks.
    const FORK_CHANCE: Record<number, number> = { 0: 180, 1: 130, 2: 90, 3: 70, 4: 55 };

    function initLeaves() {
        leaves = [];
        spawnCounter = 0;
        spawnedCount = 0;
    }

    function draw() {
        if (!ctx || !canvasEl || !bufCtx || !buffer) return;

        if (growing) {
            fadeAlpha = Math.min(1, fadeAlpha + 0.05);

            // Spawn primary trunks one at a time, capped at MAX_PRIMARY
            if (spawnedCount < MAX_PRIMARY) {
                spawnCounter++;
                if (spawnCounter >= SPAWN_INTERVAL_FRAMES) {
                    spawnCounter = 0;
                    spawnedCount++;
                    // Tighter bell: averaging 6 randoms clusters trunks strongly toward center
                    const r =
                        (Math.random() +
                            Math.random() +
                            Math.random() +
                            Math.random() +
                            Math.random() +
                            Math.random()) /
                        6;
                    const x = spawnLeft + r * spawnWidth;
                    leaves.push(new Leaf(x, BUF_H - 1));
                }
            }

            for (let i = leaves.length - 1; i >= 0; i--) {
                const leaf = leaves[i];
                if (!leaf.done) {
                    leaf.step(bufCtx, color, altColor ?? color);

                    // Fractal branching: each branch can fork into sub-branches
                    const baseForkChance = FORK_CHANCE[leaf.depth];
                    const forkChance =
                        baseForkChance !== undefined
                            ? Math.round(baseForkChance * FORK_SCALE)
                            : undefined;
                    if (
                        forkChance !== undefined &&
                        leaf.depth < MAX_DEPTH &&
                        leaf.size > 0.8 &&
                        Math.floor(Math.random() * forkChance) === 0
                    ) {
                        // Pick a side for this fork and bias lateral motion that way
                        const side = Math.random() < 0.5 ? -1 : 1;

                        // Child base size scales down ~55–75% of parent's current size
                        const childBase = leaf.size * (0.55 + Math.random() * 0.2);

                        const child = new Leaf(leaf.x, leaf.y, leaf.depth + 1, childBase);
                        // Force the lateral wobble to one side so the fork actually angles off
                        child.xrandomizer = Math.abs(child.xrandomizer) * side;
                        leaves.push(child);
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

        visW = document.documentElement.clientWidth;
        visH = Math.min(600, window.innerHeight);

        canvasEl.width = visW;
        canvasEl.height = visH;

        // Scale density down on smaller viewports (mobile/tablet)
        const isMobile = visW < 768;
        const isNarrow = visW < 480;
        if (isNarrow) {
            MAX_PRIMARY = 3;
            SPAWN_INTERVAL_FRAMES = 60;
            FORK_SCALE = 1.8;
        } else if (isMobile) {
            MAX_PRIMARY = 5;
            SPAWN_INTERVAL_FRAMES = 50;
            FORK_SCALE = 1.4;
        } else {
            MAX_PRIMARY = 5;
            SPAWN_INTERVAL_FRAMES = 50;
            FORK_SCALE = 1.3;
        }

        // Position container at viewport left edge (offset from card)
        containerLeft = -cardRect.left;

        // In buffer: card horizontally centered as in Roots, but spawn area is wider
        spawnWidth = cardRect.width * SPAWN_WIDTH_MULTIPLIER;
        spawnLeft = (BUF_W - spawnWidth) / 2;

        const cardCenterScreen = cardRect.left + cardRect.width / 2;
        srcX = Math.max(0, Math.floor(BUF_W / 2 - cardCenterScreen));
        // Anchor visible canvas to BOTTOM of buffer so spawn at y = BUF_H - 1
        // sits at the bottom of the visible canvas (= top edge of card).
        srcY = Math.max(0, BUF_H - visH);

        buffer = new OffscreenCanvas(BUF_W, BUF_H);
        bufCtx = buffer.getContext('2d');
        if (!bufCtx) return;

        ctx = canvasEl.getContext('2d');
        if (!ctx) return;

        initLeaves();
        fadeAlpha = 0;

        cancelAnimationFrame(animId);
        animating = false;
        startAnimation();
    }

    function stopGrowing() {
        growing = false;
        for (const leaf of leaves) leaf.done = true;
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

<div class="leaves-container" style="left: {containerLeft}px;">
    <canvas bind:this={canvasEl}></canvas>
</div>

<style>
    .leaves-container {
        position: absolute;
        bottom: 100%;
        pointer-events: none;
        z-index: -1;
    }

    canvas {
        display: block;
    }
</style>
