<script lang="ts">
    const PHI = 1.618033988749;

    type Variant = 'dense' | 'taper' | 'filled' | 'pull';
    let { variant = 'dense', size = 30, rotation = 0 }: { variant?: Variant; size?: number; rotation?: number } = $props();

    // Generate path data for each variant
    function generatePaths(variant: Variant): { paths: string[]; dots: { cx: number; cy: number; r: number }[] } {
        const cx = 50, cy = 50;
        const paths: string[] = [];
        const dots: { cx: number; cy: number; r: number }[] = [];

        if (variant === 'dense') {
            // 12 lines with φ lengths
            for (let i = 0; i < 12; i++) {
                const angle = i * Math.PI / 6 + 0.1;
                const maxR = i % 2 === 0 ? 42 : 42 / PHI;
                let d = '';
                for (let r = maxR; r > 8; r -= 3) {
                    const a = angle + (maxR - r) * 0.016;
                    const x = cx + Math.cos(a) * r;
                    const y = cy + Math.sin(a) * r;
                    d += d ? ` L ${x.toFixed(1)} ${y.toFixed(1)}` : `M ${x.toFixed(1)} ${y.toFixed(1)}`;
                }
                paths.push(d);
            }
        } else if (variant === 'taper') {
            // 8 lines with varying stroke (we'll use multiple paths)
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4 + 0.1;
                const maxR = i % 2 === 0 ? 42 : 42 / PHI;
                let d = '';
                for (let r = maxR; r > 8; r -= 2.5) {
                    const a = angle + (maxR - r) * 0.018;
                    const x = cx + Math.cos(a) * r;
                    const y = cy + Math.sin(a) * r;
                    d += d ? ` L ${x.toFixed(1)} ${y.toFixed(1)}` : `M ${x.toFixed(1)} ${y.toFixed(1)}`;
                }
                paths.push(d);
            }
        } else if (variant === 'filled') {
            // 16 lines, very dense
            for (let i = 0; i < 16; i++) {
                const angle = i * Math.PI / 8 + 0.08;
                const maxR = i % 2 === 0 ? 42 : 42 / PHI;
                let d = '';
                for (let r = maxR; r > 8; r -= 3) {
                    const a = angle + (maxR - r) * 0.014;
                    const x = cx + Math.cos(a) * r;
                    const y = cy + Math.sin(a) * r;
                    d += d ? ` L ${x.toFixed(1)} ${y.toFixed(1)}` : `M ${x.toFixed(1)} ${y.toFixed(1)}`;
                }
                paths.push(d);
            }
        } else if (variant === 'pull') {
            // 8 lines with stronger curve toward center
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4 + 0.1;
                const maxR = i % 2 === 0 ? 42 : 42 / PHI;
                let d = '';
                for (let r = maxR; r > 6; r -= 2) {
                    const curveStrength = 0.012 + (1 - r/maxR) * 0.025;
                    const a = angle + (maxR - r) * curveStrength;
                    const x = cx + Math.cos(a) * r;
                    const y = cy + Math.sin(a) * r;
                    d += d ? ` L ${x.toFixed(1)} ${y.toFixed(1)}` : `M ${x.toFixed(1)} ${y.toFixed(1)}`;
                }
                paths.push(d);
            }
        }

        // Center dot
        dots.push({ cx, cy, r: variant === 'pull' ? 30 : 6 });

        return { paths, dots };
    }

    let pathData = $derived(generatePaths(variant));

    function getStrokeWidth(variant: Variant, index: number, total: number): number {
        if (variant === 'taper') {
            // Varying weights for taper
            return 1.2 + (index % 2) * 0.5;
        }
        if (variant === 'filled') return 0.9;
        if (variant === 'dense') return 1.1;
        return 1.2;
    }
</script>

<svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    style="transform: translateY(-0.2em) rotate({rotation}deg)"
    class="logo"
>
    {#each pathData.paths as path, i (i)}
        <path
            d={path}
            fill="none"
            stroke="currentColor"
            stroke-width={getStrokeWidth(variant, i, pathData.paths.length)}
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
