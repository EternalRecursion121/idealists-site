<script lang="ts">
	import { onMount } from 'svelte';

	type BaseThemeName = 'dawn' | 'night' | 'twilight' | 'forest';
	let { theme }: { theme: BaseThemeName } = $props();

	let svg: SVGSVGElement;
	let stars: {
		id: number;
		x: number;
		y: number;
		targetX: number;
		targetY: number;
		baseX: number;
		baseY: number;
		size: number;
		targetSize: number;
		opacity: number;
		targetOpacity: number;
		twinklePhase: number;
		twinkleSpeed: number;
		isSunlight: boolean;
		isDiamond: boolean;
	}[] = $state([]);

	let time = $state(0);
	let screenWidth = 0;
	let screenHeight = 0;

	const STAR_COUNT = 120;
	const SUNLIGHT_RATIO = 0.25; // 25% golden sunlight sparkles in dawn mode
	const DIAMOND_RATIO = 0.3; // 30% diamond-shaped stars

	// Theme-specific configuration
	const themeConfig: Record<BaseThemeName, {
		twinkleSpeed: number;
		driftAmount: number;
		minOpacity: number;
		maxOpacity: number;
		visible: boolean;
	}> = {
		night: {
			twinkleSpeed: 0,
			driftAmount: 0,
			minOpacity: 0,
			maxOpacity: 0,
			visible: false
		},
		twilight: {
			twinkleSpeed: 0.006,
			driftAmount: 0,
			minOpacity: 0.2,
			maxOpacity: 1,
			visible: true
		},
		forest: {
			twinkleSpeed: 0.0015,
			driftAmount: 15,
			minOpacity: 0.2,
			maxOpacity: 1,
			visible: true
		},
		dawn: {
			twinkleSpeed: 0.008,
			driftAmount: 6,
			minOpacity: 0.1,
			maxOpacity: 1,
			visible: true
		}
	};

	function getStarSize(theme: BaseThemeName, isSunlight: boolean, isDiamond: boolean): number {
		if (theme === 'forest') {
			// Fireflies - larger, more varied
			return 1.5 + Math.random() * 2;
		} else if (theme === 'dawn') {
			if (isSunlight) {
				// Sunlight sparkles - larger and more prominent
				return 1.2 + Math.random() * 2;
			}
			// Water - smaller, subtler
			return 0.5 + Math.random() * 1.2;
		} else {
			// Regular stars
			const base = isDiamond ? 1.2 : 0.8;
			const variance = isDiamond ? 1.2 : 1.5;
			const size = base + Math.random() * variance;
			return Math.random() > 0.95 ? size + 1 : size;
		}
	}

	function generateStars(width: number, height: number) {
		screenWidth = width;
		screenHeight = height;

		const newStars: typeof stars = [];

		for (let i = 0; i < STAR_COUNT; i++) {
			const x = Math.random() * width;
			const y = Math.random() * height;
			const isSunlight = Math.random() < SUNLIGHT_RATIO;
			const isDiamond = Math.random() < DIAMOND_RATIO;
			const size = getStarSize(theme, isSunlight, isDiamond);
			const config = themeConfig[theme];

			newStars.push({
				id: i,
				x,
				y,
				targetX: x,
				targetY: y,
				baseX: x,
				baseY: y,
				size,
				targetSize: size,
				opacity: config.visible ? Math.random() * 0.8 + 0.2 : 0,
				targetOpacity: config.visible ? 1 : 0,
				twinklePhase: Math.random() * Math.PI * 2,
				twinkleSpeed: config.twinkleSpeed * (0.8 + Math.random() * 0.4),
				isSunlight,
				isDiamond
			});
		}

		stars = newStars;
	}

	function updateStarTargets() {
		const config = themeConfig[theme];

		for (const star of stars) {
			// Update target size based on theme
			star.targetSize = getStarSize(theme, star.isSunlight, star.isDiamond);

			// Update target opacity based on theme
			star.targetOpacity = config.visible ? 1 : 0;

			// Update twinkle speed based on theme
			star.twinkleSpeed = config.twinkleSpeed * (0.8 + Math.random() * 0.4);
		}
	}

	function updateStars() {
		const config = themeConfig[theme];

		for (const star of stars) {
			// Smoothly interpolate size
			const sizeDiff = star.targetSize - star.size;
			star.size += sizeDiff * 0.05; // 5% per frame

			// Smoothly interpolate opacity (base level)
			const opacityDiff = star.targetOpacity - star.opacity;
			star.opacity += opacityDiff * 0.08; // 8% per frame for quicker transitions

			// Update twinkle phase
			star.twinklePhase += star.twinkleSpeed;

			// Calculate displayed opacity from twinkle - MORE DRAMATIC
			let displayOpacity = star.opacity;
			if (config.visible && star.opacity > 0.1) {
				if (theme === 'forest') {
					// Fireflies: smooth pulsing glow
					const pulse = Math.sin(star.twinklePhase);
					displayOpacity = star.opacity * (0.3 + pulse * 0.7);
				} else if (theme === 'dawn') {
					// Water sparkles: quick bright flashes
					const pulse = Math.sin(star.twinklePhase);
					if (star.isSunlight) {
						// Sunlight: very bright dramatic flashes
						displayOpacity = star.opacity * (pulse > 0.5 ? 0.95 + Math.random() * 0.05 : 0.2 + pulse * 0.5);
					} else {
						// Water: subtler rippling effect
						displayOpacity = star.opacity * (pulse > 0.65 ? 0.8 + Math.random() * 0.2 : 0.15 + pulse * 0.4);
					}
				} else if (theme === 'twilight') {
					// Twilight stars: very dramatic twinkling
					const twinkle = Math.sin(star.twinklePhase);
					const flutter = Math.sin(star.twinklePhase * 3.1) * 0.25;
					// Very dramatic range: 0.05 to 1.0
					displayOpacity = star.opacity * Math.max(0.05, 0.2 + (twinkle * 0.5 + 0.5) * 0.8 + flutter);
				}
			}

			// Store display opacity for rendering
			(star as any).displayOpacity = Math.max(0, Math.min(1, displayOpacity));

			// Apply drift for certain themes
			if (config.driftAmount > 0 && star.opacity > 0.1) {
				if (theme === 'forest') {
					// Fireflies: organic floating movement
					star.x = star.baseX + Math.sin(time * 0.3 + star.id * 0.7) * config.driftAmount;
					star.y = star.baseY + Math.cos(time * 0.2 + star.id * 0.5) * config.driftAmount * 1.5;
				} else if (theme === 'dawn') {
					// Water sparkles: gentle wave-like shimmer
					star.x = star.baseX + Math.sin(time * 0.4 + star.id) * config.driftAmount;
					star.y = star.baseY + Math.sin(time * 0.6 + star.id * 0.4) * (config.driftAmount * 0.4);
				}
			} else {
				// Smoothly return to base position
				const dx = star.baseX - star.x;
				const dy = star.baseY - star.y;
				star.x += dx * 0.05;
				star.y += dy * 0.05;
			}
		}

		time += 0.016; // ~60fps worth of time
	}

	// Generate diamond star path (4-pointed concave star)
	function getDiamondPath(x: number, y: number, size: number): string {
		const outerRadius = size;
		const innerRadius = size * 0.4;

		// 4 points at cardinal directions
		const points = [];
		for (let i = 0; i < 4; i++) {
			const angle = (i * Math.PI / 2) - Math.PI / 2; // Start at top
			// Outer point
			points.push({
				x: x + Math.cos(angle) * outerRadius,
				y: y + Math.sin(angle) * outerRadius
			});
			// Inner point (between outer points)
			const innerAngle = angle + Math.PI / 4;
			points.push({
				x: x + Math.cos(innerAngle) * innerRadius,
				y: y + Math.sin(innerAngle) * innerRadius
			});
		}

		// Build path
		let path = `M ${points[0].x} ${points[0].y}`;
		for (let i = 1; i < points.length; i++) {
			path += ` L ${points[i].x} ${points[i].y}`;
		}
		path += ' Z';

		return path;
	}

	let animationInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		generateStars(window.innerWidth, window.innerHeight);

		animationInterval = setInterval(updateStars, 16); // ~60fps

		const handleResize = () => {
			const oldWidth = screenWidth;
			const oldHeight = screenHeight;
			screenWidth = window.innerWidth;
			screenHeight = window.innerHeight;

			// Reposition stars proportionally
			if (oldWidth && oldHeight) {
				for (const star of stars) {
					star.x = (star.x / oldWidth) * screenWidth;
					star.y = (star.y / oldHeight) * screenHeight;
					star.baseX = (star.baseX / oldWidth) * screenWidth;
					star.baseY = (star.baseY / oldHeight) * screenHeight;
					star.targetX = star.x;
					star.targetY = star.y;
				}
			}
		};
		window.addEventListener('resize', handleResize);

		return () => {
			if (animationInterval) clearInterval(animationInterval);
			window.removeEventListener('resize', handleResize);
		};
	});

	// Update star targets when theme changes
	$effect(() => {
		// Track theme dependency
		theme;

		if (stars.length > 0) {
			updateStarTargets();
		}
	});
</script>

<svg
	bind:this={svg}
	class="stars-bg"
	viewBox="0 0 {typeof window !== 'undefined' ? window.innerWidth : 1920} {typeof window !== 'undefined' ? window.innerHeight : 1080}"
	preserveAspectRatio="xMidYMid slice"
>
	{#each stars as star (star.id)}
		{#if star.isDiamond}
			<path
				d={getDiamondPath(star.x, star.y, star.size)}
				fill={theme === 'dawn' && star.isSunlight ? 'var(--star-alt)' : 'currentColor'}
				opacity={(star as any).displayOpacity || star.opacity}
				class="star"
			/>
		{:else}
			<circle
				cx={star.x}
				cy={star.y}
				r={star.size}
				fill={theme === 'dawn' && star.isSunlight ? 'var(--star-alt)' : 'currentColor'}
				opacity={(star as any).displayOpacity || star.opacity}
				class="star"
			/>
		{/if}
	{/each}
</svg>

<style>
	.stars-bg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: -1;
		color: var(--star, #ffffff);
		pointer-events: none;
		transition: color 0.8s ease;
	}

	.star {
		will-change: opacity, transform;
	}
</style>
