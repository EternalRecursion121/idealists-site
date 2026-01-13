<script lang="ts">
	import { onMount } from 'svelte';

	interface ImageData {
		src: string;
		width: number;
		height: number;
	}

	interface PositionedImage {
		src: string;
		x: number;
		y: number;
		width: number;
		height: number;
		loaded: boolean;
	}

	interface Props {
		images: ImageData[];
	}

	let { images }: Props = $props();

	let containerRef: HTMLDivElement | null = $state(null);
	let positions: PositionedImage[] = $state([]);
	let containerHeight = $state(800);
	let isMobile = $state(false);
	let containerWidth = $state(0);

	const TARGET_AREA = 200000; // ~450x330, bigger images
	const MOBILE_BREAKPOINT = 640;
	const PADDING = 4;
	const MAX_ATTEMPTS = 2000;
	const HEIGHT_INCREMENT = 20;

	function scaleImage(
		width: number,
		height: number,
		targetArea: number
	): { w: number; h: number } {
		const area = width * height;
		const scale = Math.sqrt(targetArea / area);
		return {
			w: Math.round(width * scale),
			h: Math.round(height * scale)
		};
	}

	function scaleMobile(
		width: number,
		height: number,
		maxWidth: number
	): { w: number; h: number } {
		const scale = Math.min(maxWidth / width, 1);
		return {
			w: Math.round(width * scale),
			h: Math.round(height * scale)
		};
	}

	function intersects(
		a: { x: number; y: number; width: number; height: number },
		b: { x: number; y: number; width: number; height: number }
	): boolean {
		return !(
			a.x + a.width + PADDING < b.x ||
			b.x + b.width + PADDING < a.x ||
			a.y + a.height + PADDING < b.y ||
			b.y + b.height + PADDING < a.y
		);
	}

	function placeDesktopImages(imgs: ImageData[], width: number): PositionedImage[] {
		const placed: PositionedImage[] = [];
		let maxY = 600;

		// Shuffle for randomness
		const shuffled = [...imgs].sort(() => Math.random() - 0.5);

		for (const img of shuffled) {
			const scaled = scaleImage(img.width, img.height, TARGET_AREA);
			let bestPosition: { x: number; y: number } | null = null;
			let attempts = 0;

			while (!bestPosition && attempts < MAX_ATTEMPTS) {
				const candidate = {
					x: Math.random() * Math.max(0, width - scaled.w - PADDING * 2) + PADDING,
					y: Math.random() * Math.max(0, maxY - scaled.h) + PADDING,
					width: scaled.w,
					height: scaled.h
				};

				const collides = placed.some((p) => intersects(candidate, p));

				if (!collides) {
					bestPosition = { x: candidate.x, y: candidate.y };
				}
				attempts++;
			}

			// If placement failed, expand available height and place at bottom
			if (!bestPosition) {
				maxY += HEIGHT_INCREMENT + scaled.h;
				bestPosition = {
					x: Math.random() * Math.max(0, width - scaled.w - PADDING * 2) + PADDING,
					y: maxY - scaled.h - PADDING
				};
			}

			placed.push({
				src: img.src,
				x: bestPosition.x,
				y: bestPosition.y,
				width: scaled.w,
				height: scaled.h,
				loaded: false
			});
		}

		return placed;
	}

	function placeMobileImages(imgs: ImageData[], width: number): PositionedImage[] {
		const columns = 2;
		const columnWidth = width / columns;
		const placed: PositionedImage[] = [];
		const columnHeights = Array(columns).fill(PADDING);

		// Shuffle for randomness
		const shuffled = [...imgs].sort(() => Math.random() - 0.5);

		for (const img of shuffled) {
			// Find shortest column
			const col = columnHeights.indexOf(Math.min(...columnHeights));

			const maxImgWidth = columnWidth * 0.85;
			const scaled = scaleMobile(img.width, img.height, maxImgWidth);

			// Add some horizontal jitter within column
			const jitterX = (Math.random() - 0.5) * (columnWidth - scaled.w) * 0.3;
			const x = col * columnWidth + (columnWidth - scaled.w) / 2 + jitterX;

			placed.push({
				src: img.src,
				x: Math.max(PADDING / 2, Math.min(width - scaled.w - PADDING / 2, x)),
				y: columnHeights[col],
				width: scaled.w,
				height: scaled.h,
				loaded: false
			});

			columnHeights[col] += scaled.h + PADDING * 1.5;
		}

		return placed;
	}

	function calculateLayout() {
		if (!containerRef || images.length === 0) return;

		const width = containerRef.clientWidth;
		const mobile = window.innerWidth < MOBILE_BREAKPOINT;

		containerWidth = width;
		isMobile = mobile;

		positions = mobile
			? placeMobileImages(images, width)
			: placeDesktopImages(images, width);
	}

	function handleImageLoad(src: string) {
		positions = positions.map((p) => (p.src === src ? { ...p, loaded: true } : p));
	}

	// Calculate container height based on placed images
	$effect(() => {
		if (positions.length > 0) {
			containerHeight = Math.max(...positions.map((p) => p.y + p.height)) + PADDING * 2;
		}
	});

	onMount(() => {
		calculateLayout();

		let resizeTimeout: ReturnType<typeof setTimeout>;
		const handleResize = () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				const newMobile = window.innerWidth < MOBILE_BREAKPOINT;
				const newWidth = containerRef?.clientWidth ?? 0;

				// Re-layout if breakpoint changed or significant width change
				if (newMobile !== isMobile || Math.abs(newWidth - containerWidth) > 100) {
					calculateLayout();
				}
			}, 150);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			clearTimeout(resizeTimeout);
		};
	});

	function lazyLoad(node: HTMLImageElement) {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const img = entry.target as HTMLImageElement;
						if (img.dataset.src) {
							img.src = img.dataset.src;
						}
						observer.unobserve(img);
					}
				});
			},
			{ rootMargin: '200px' }
		);

		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<div bind:this={containerRef} class="gallery-container" style="height: {containerHeight}px;">
	{#each positions as pos (pos.src)}
		<div
			class="image-wrapper"
			style="
				left: {pos.x}px;
				top: {pos.y}px;
				width: {pos.width}px;
				height: {pos.height}px;
			"
		>
			<img
				use:lazyLoad
				data-src={pos.src}
				alt=""
				class:loaded={pos.loaded}
				onload={() => handleImageLoad(pos.src)}
				width={pos.width}
				height={pos.height}
			/>
		</div>
	{/each}
</div>

<style>
	.gallery-container {
		position: relative;
		width: 100%;
		min-height: 100vh;
	}

	.image-wrapper {
		position: absolute;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	img.loaded {
		opacity: 1;
	}
</style>
