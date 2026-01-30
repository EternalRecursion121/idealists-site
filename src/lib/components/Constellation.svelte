<script lang="ts">
	import { onMount } from 'svelte';

	type BaseThemeName = 'dawn' | 'night' | 'twilight' | 'forest';
	let { theme }: { theme: BaseThemeName } = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	// Grid dimensions (low res for performance, scaled up)
	const CELL_SIZE = 8;
	let gridWidth = 0;
	let gridHeight = 0;

	// Brian's Brain states: 0 = off, 1 = on, 2 = dying, 3 = dormant (visible but inactive)
	let grid: Uint8Array;
	let nextGrid: Uint8Array;

	// Mouse position for interaction
	let mouseX = -1000;
	let mouseY = -1000;
	let mouseGridX = -1;
	let mouseGridY = -1;
	const HOVER_ACTIVATION_RADIUS = 8; // Grid cells - radius to activate dormant clusters

	// Seed cluster positions (relative 0-1 coordinates)
	interface SeedCluster {
		x: number;
		y: number;
		activated: boolean;
	}
	let seedClusters: SeedCluster[] = [];

	// Theme colors - very subtle so text remains readable
	const themeColors: Record<BaseThemeName, { on: string; dying: string; dormant: string }> = {
		dawn: {
			on: 'rgba(255, 176, 136, 0.35)',
			dying: 'rgba(255, 220, 180, 0.18)',
			dormant: 'rgba(255, 176, 136, 0.2)'
		},
		night: {
			on: 'rgba(140, 130, 200, 0.18)',
			dying: 'rgba(100, 90, 160, 0.08)',
			dormant: 'rgba(140, 130, 200, 0.1)'
		},
		twilight: {
			on: 'rgba(199, 146, 146, 0.18)',
			dying: 'rgba(180, 160, 200, 0.08)',
			dormant: 'rgba(199, 146, 146, 0.1)'
		},
		forest: {
			on: 'rgba(144, 224, 96, 0.18)',
			dying: 'rgba(100, 180, 70, 0.08)',
			dormant: 'rgba(144, 224, 96, 0.1)'
		}
	};

	function initGrid(width: number, height: number) {
		gridWidth = Math.ceil(width / CELL_SIZE);
		gridHeight = Math.ceil(height / CELL_SIZE);
		grid = new Uint8Array(gridWidth * gridHeight);
		nextGrid = new Uint8Array(gridWidth * gridHeight);

		// Create seed cluster positions
		seedClusters = [
			{ x: 0.15, y: 0.2, activated: false },
			{ x: 0.85, y: 0.15, activated: false },
			{ x: 0.1, y: 0.6, activated: false },
			{ x: 0.9, y: 0.55, activated: false },
			{ x: 0.2, y: 0.85, activated: false },
			{ x: 0.75, y: 0.8, activated: false },
			{ x: 0.5, y: 0.4, activated: false },
		];

		// Place dormant cells at each cluster
		for (const cluster of seedClusters) {
			placeDormantCluster(cluster);
		}
	}

	function placeDormantCluster(cluster: SeedCluster) {
		const centerX = Math.floor(cluster.x * gridWidth);
		const centerY = Math.floor(cluster.y * gridHeight);
		const clusterSize = 4;

		// Create a small cluster of dormant cells
		for (let i = 0; i < 12; i++) {
			const angle = Math.random() * Math.PI * 2;
			const dist = Math.random() * clusterSize;
			const x = Math.floor(centerX + Math.cos(angle) * dist);
			const y = Math.floor(centerY + Math.sin(angle) * dist);
			if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
				grid[y * gridWidth + x] = 3; // Dormant state
			}
		}
	}

	function activateCluster(cluster: SeedCluster) {
		if (cluster.activated) return;
		cluster.activated = true;

		const centerX = Math.floor(cluster.x * gridWidth);
		const centerY = Math.floor(cluster.y * gridHeight);
		const activationRadius = 5;

		// Convert dormant cells to active and add some new active cells
		for (let dy = -activationRadius; dy <= activationRadius; dy++) {
			for (let dx = -activationRadius; dx <= activationRadius; dx++) {
				if (dx * dx + dy * dy > activationRadius * activationRadius) continue;
				const x = centerX + dx;
				const y = centerY + dy;
				if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
					const idx = y * gridWidth + x;
					if (grid[idx] === 3 || Math.random() < 0.3) {
						grid[idx] = 1; // Activate
					}
				}
			}
		}
	}

	function countOnNeighbors(x: number, y: number): number {
		let count = 0;
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				if (dx === 0 && dy === 0) continue;
				const nx = (x + dx + gridWidth) % gridWidth;
				const ny = (y + dy + gridHeight) % gridHeight;
				if (grid[ny * gridWidth + nx] === 1) count++;
			}
		}
		return count;
	}

	function updateGrid() {
		for (let y = 0; y < gridHeight; y++) {
			for (let x = 0; x < gridWidth; x++) {
				const idx = y * gridWidth + x;
				const state = grid[idx];

				// Dormant cells stay dormant until activated
				if (state === 3) {
					nextGrid[idx] = 3;
					continue;
				}

				// Brian's Brain rules:
				// OFF (0) -> ON (1) if exactly 2 neighbors are ON
				// ON (1) -> DYING (2)
				// DYING (2) -> OFF (0)
				if (state === 0) {
					const neighbors = countOnNeighbors(x, y);
					nextGrid[idx] = neighbors === 2 ? 1 : 0;
				} else if (state === 1) {
					nextGrid[idx] = 2;
				} else {
					nextGrid[idx] = 0;
				}
			}
		}

		// Swap grids
		[grid, nextGrid] = [nextGrid, grid];
	}

	function render() {
		if (!ctx) return;

		const colors = themeColors[theme];

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw cells
		for (let y = 0; y < gridHeight; y++) {
			for (let x = 0; x < gridWidth; x++) {
				const state = grid[y * gridWidth + x];
				if (state === 0) continue;

				if (state === 3) {
					ctx.fillStyle = colors.dormant;
				} else {
					ctx.fillStyle = state === 1 ? colors.on : colors.dying;
				}

				ctx.beginPath();
				const cx = x * CELL_SIZE + CELL_SIZE / 2;
				const cy = y * CELL_SIZE + CELL_SIZE / 2;
				const radius = state === 1 ? CELL_SIZE * 0.35 : (state === 3 ? CELL_SIZE * 0.3 : CELL_SIZE * 0.25);
				ctx.arc(cx, cy, radius, 0, Math.PI * 2);
				ctx.fill();
			}
		}
	}

	let animationId: number | null = null;
	let lastFrameTime = 0;
	const targetFPS = 12;
	const frameInterval = 1000 / targetFPS;

	function animationLoop(currentTime: number) {
		animationId = requestAnimationFrame(animationLoop);

		const elapsed = currentTime - lastFrameTime;
		if (elapsed < frameInterval) return;

		lastFrameTime = currentTime - (elapsed % frameInterval);

		// Check if mouse is near any dormant cluster
		if (mouseGridX >= 0 && mouseGridY >= 0) {
			for (const cluster of seedClusters) {
				if (cluster.activated) continue;
				const clusterGridX = Math.floor(cluster.x * gridWidth);
				const clusterGridY = Math.floor(cluster.y * gridHeight);
				const dx = mouseGridX - clusterGridX;
				const dy = mouseGridY - clusterGridY;
				if (dx * dx + dy * dy < HOVER_ACTIVATION_RADIUS * HOVER_ACTIVATION_RADIUS) {
					activateCluster(cluster);
				}
			}
		}

		updateGrid();
		render();
	}

	function handleMouseMove(e: MouseEvent) {
		mouseX = e.clientX;
		mouseY = e.clientY;
		mouseGridX = Math.floor(mouseX / CELL_SIZE);
		mouseGridY = Math.floor(mouseY / CELL_SIZE);
	}

	function handleMouseLeave() {
		mouseX = -1000;
		mouseY = -1000;
		mouseGridX = -1;
		mouseGridY = -1;
	}

	function handleClick(e: MouseEvent) {
		// Spawn a burst of cells on click
		const clickGridX = Math.floor(e.clientX / CELL_SIZE);
		const clickGridY = Math.floor(e.clientY / CELL_SIZE);
		const burstRadius = 4;

		for (let dy = -burstRadius; dy <= burstRadius; dy++) {
			for (let dx = -burstRadius; dx <= burstRadius; dx++) {
				if (dx * dx + dy * dy > burstRadius * burstRadius) continue;
				const x = clickGridX + dx;
				const y = clickGridY + dy;
				if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
					if (Math.random() < 0.4) {
						grid[y * gridWidth + x] = 1;
					}
				}
			}
		}
	}

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length > 0) {
			const touch = e.touches[0];
			mouseX = touch.clientX;
			mouseY = touch.clientY;
			mouseGridX = Math.floor(mouseX / CELL_SIZE);
			mouseGridY = Math.floor(mouseY / CELL_SIZE);

			// Check cluster activation on touch
			for (const cluster of seedClusters) {
				if (cluster.activated) continue;
				const clusterGridX = Math.floor(cluster.x * gridWidth);
				const clusterGridY = Math.floor(cluster.y * gridHeight);
				const dx = mouseGridX - clusterGridX;
				const dy = mouseGridY - clusterGridY;
				if (dx * dx + dy * dy < HOVER_ACTIVATION_RADIUS * HOVER_ACTIVATION_RADIUS) {
					activateCluster(cluster);
				}
			}

			// Also spawn cells on touch
			const burstRadius = 4;
			for (let dy = -burstRadius; dy <= burstRadius; dy++) {
				for (let dx = -burstRadius; dx <= burstRadius; dx++) {
					if (dx * dx + dy * dy > burstRadius * burstRadius) continue;
					const x = mouseGridX + dx;
					const y = mouseGridY + dy;
					if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
						if (Math.random() < 0.4) {
							grid[y * gridWidth + x] = 1;
						}
					}
				}
			}
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (e.touches.length > 0) {
			const touch = e.touches[0];
			mouseX = touch.clientX;
			mouseY = touch.clientY;
			mouseGridX = Math.floor(mouseX / CELL_SIZE);
			mouseGridY = Math.floor(mouseY / CELL_SIZE);
		}
	}

	function handleTouchEnd() {
		mouseX = -1000;
		mouseY = -1000;
		mouseGridX = -1;
		mouseGridY = -1;
	}

	function handleResize() {
		if (!canvas) return;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		initGrid(canvas.width, canvas.height);
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		initGrid(canvas.width, canvas.height);

		animationId = requestAnimationFrame(animationLoop);

		window.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseleave', handleMouseLeave);
		window.addEventListener('click', handleClick);
		window.addEventListener('touchstart', handleTouchStart);
		window.addEventListener('touchmove', handleTouchMove);
		window.addEventListener('touchend', handleTouchEnd);
		window.addEventListener('resize', handleResize);

		return () => {
			if (animationId) cancelAnimationFrame(animationId);
			window.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseleave', handleMouseLeave);
			window.removeEventListener('click', handleClick);
			window.removeEventListener('touchstart', handleTouchStart);
			window.removeEventListener('touchmove', handleTouchMove);
			window.removeEventListener('touchend', handleTouchEnd);
			window.removeEventListener('resize', handleResize);
		};
	});

	// Re-render when theme changes
	$effect(() => {
		theme;
		render();
	});
</script>

<canvas
	bind:this={canvas}
	class="automata-bg"
	aria-hidden="true"
></canvas>

<style>
	.automata-bg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: -1;
		pointer-events: auto;
		touch-action: none;
	}
</style>
