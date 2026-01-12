<script lang="ts">
    const PHI = 1.618033988749;

    let { size = 27, rotation = 0 }: { size?: number; rotation?: number } = $props();

    type Segment = { x1: number; y1: number; x2: number; y2: number; strokeWidth: number };

    // Generate 16 spiral curves with taper (thin inner, thick outer)
    function generatePaths(): { segments: Segment[]; dots: { cx: number; cy: number; r: number }[] } {
        const cx = 50, cy = 50;
        const segments: Segment[] = [];
        const dots: { cx: number; cy: number; r: number }[] = [];

        const innerR = 8;

        for (let i = 0; i < 16; i++) {
            const baseAngle = i * Math.PI / 8 + 0.08;
            const maxR = i % 2 === 0 ? 42 : 42 / PHI;

            // Generate points along the spiral from inner to outer
            const points: { x: number; y: number }[] = [];
            for (let r = innerR; r <= maxR; r += 1.5) {
                const a = baseAngle + (maxR - r) * 0.014;
                points.push({
                    x: cx + Math.cos(a) * r,
                    y: cy + Math.sin(a) * r
                });
            }

            // Draw with taper (thin at inner, thick at outer)
            for (let j = 0; j < points.length - 1; j++) {
                const t = j / Math.max(1, points.length - 1);
                const strokeWidth = 0.2 + t * 1.3;
                segments.push({
                    x1: points[j].x, y1: points[j].y,
                    x2: points[j + 1].x, y2: points[j + 1].y,
                    strokeWidth
                });
            }
        }

        // Center dot
        dots.push({ cx, cy, r: 5 });

        return { segments, dots };
    }

    let pathData = $derived(generatePaths());
</script>

<svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    style="transform: translateY(-0.2em) rotate({rotation}deg)"
    class="logo"
>
    {#each pathData.segments as seg, i (i)}
        <line
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke="currentColor"
            stroke-width={seg.strokeWidth}
            stroke-linecap="round"
        />
    {/each}
    {#each pathData.dots as dot, i (i)}
        <circle
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill="currentColor"
        />
    {/each}
</svg>

<style>
    .logo {
        display: inline-block;
        vertical-align: middle;
        transform-origin: center;
    }
</style>
