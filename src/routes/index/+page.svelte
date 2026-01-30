<script lang="ts">
	import { onMount } from 'svelte';

	interface PageNode {
		name: string;
		path: string;
		description: string;
		linksTo: string[];
		isWriting?: boolean;
	}

	interface Props {
		data: {
			pages: PageNode[];
			connections: { from: string; to: string }[];
		};
	}

	let { data }: Props = $props();

	interface PositionedPage extends PageNode {
		x: number;
		y: number;
	}

	let containerRef: HTMLDivElement | null = $state(null);
	let positions: PositionedPage[] = $state([]);
	let hoveredPage: string | null = $state(null);
	let isMobile = $state(false);
	let time = $state(0);

	const MOBILE_BREAKPOINT = 640;

	// Assign orbit based on page type and connectivity
	function getOrbit(page: PageNode, allPages: PageNode[]): number {
		if (page.path === '/index') return 0; // index at center
		if (page.isWriting) return 3; // writings in outer cluster

		const connectionCount = page.linksTo.length +
			allPages.filter(p => p.linksTo.includes(page.path)).length;

		if (connectionCount >= 6) return 1;
		if (connectionCount >= 4) return 1;
		return 2;
	}

	// Distribute pages around orbits
	function assignAngles(pages: PageNode[]): Map<string, number> {
		const angles = new Map<string, number>();
		const orbit1: string[] = [];
		const orbit2: string[] = [];
		const orbit3: string[] = []; // writings

		for (const page of pages) {
			if (page.path === '/index') {
				angles.set(page.path, 0);
			} else {
				const orbit = getOrbit(page, pages);
				if (orbit === 1) orbit1.push(page.path);
				else if (orbit === 2) orbit2.push(page.path);
				else if (orbit === 3) orbit3.push(page.path);
			}
		}

		// Distribute evenly around each orbit
		orbit1.forEach((path, i) => {
			angles.set(path, (i / orbit1.length) * Math.PI * 2 - Math.PI / 2);
		});
		orbit2.forEach((path, i) => {
			angles.set(path, (i / orbit2.length) * Math.PI * 2 - Math.PI / 3);
		});
		// Writings cluster around the /writings page area
		const writingsAngle = angles.get('/writings') || -Math.PI / 2;
		// Spread writings across a larger arc to avoid overlap
		const spreadPerWriting = Math.min(0.4, Math.PI * 1.2 / Math.max(1, orbit3.length));
		orbit3.forEach((path, i) => {
			const offset = (i - (orbit3.length - 1) / 2) * spreadPerWriting;
			angles.set(path, writingsAngle + offset);
		});

		return angles;
	}

	function calculatePositions(width: number, height: number, mobile: boolean): PositionedPage[] {
		const centerX = width / 2;
		const centerY = height / 2;
		const baseRadius = Math.min(width, height) * (mobile ? 0.25 : 0.18);
		const orbitRadii = [0, baseRadius, baseRadius * 1.6, baseRadius * 2.4];

		const angles = assignAngles(data.pages);

		return data.pages.map((page) => {
			const orbit = page.path === '/index' ? 0 : getOrbit(page, data.pages);
			const angle = angles.get(page.path) || 0;

			let x: number, y: number;
			if (orbit === 0) {
				x = centerX;
				y = centerY;
			} else {
				const radius = orbitRadii[orbit];
				const angleOffset = Math.sin(time + angle * 2) * 0.03;
				x = centerX + Math.cos(angle + angleOffset) * radius;
				y = centerY + Math.sin(angle + angleOffset) * radius;
			}

			return { ...page, x, y };
		});
	}

	function calculateLayout() {
		if (!containerRef) return;
		const width = containerRef.clientWidth;
		const height = Math.max(500, window.innerHeight - 100);
		const mobile = window.innerWidth < MOBILE_BREAKPOINT;
		isMobile = mobile;
		positions = calculatePositions(width, height, mobile);
	}

	onMount(() => {
		calculateLayout();

		const driftInterval = setInterval(() => {
			time += 0.002;
			if (containerRef) {
				const width = containerRef.clientWidth;
				const height = Math.max(500, window.innerHeight - 100);
				positions = calculatePositions(width, height, isMobile);
			}
		}, 50);

		let resizeTimeout: ReturnType<typeof setTimeout>;
		const handleResize = () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(calculateLayout, 150);
		};

		window.addEventListener('resize', handleResize);
		return () => {
			clearInterval(driftInterval);
			window.removeEventListener('resize', handleResize);
			clearTimeout(resizeTimeout);
		};
	});

	// Get connection lines from auto-generated data
	function getConnectionLines(): { x1: number; y1: number; x2: number; y2: number; key: string; active: boolean }[] {
		const lines: { x1: number; y1: number; x2: number; y2: number; key: string; active: boolean }[] = [];

		for (const conn of data.connections) {
			const fromPage = positions.find(p => p.path === conn.from);
			const toPage = positions.find(p => p.path === conn.to);

			if (fromPage && toPage) {
				const isActive = hoveredPage === conn.from || hoveredPage === conn.to;
				lines.push({
					x1: fromPage.x,
					y1: fromPage.y,
					x2: toPage.x,
					y2: toPage.y,
					key: `${conn.from}-${conn.to}`,
					active: isActive
				});
			}
		}

		return lines;
	}

	function getConnectionCount(page: PageNode): number {
		// Count outgoing + incoming links
		const outgoing = page.linksTo.length;
		const incoming = data.pages.filter(p => p.linksTo.includes(page.path)).length;
		return outgoing + incoming;
	}

	function getSize(page: PageNode): string {
		if (page.isWriting) return '0.75rem'; // writings are smaller
		const count = getConnectionCount(page);
		// Scale from 1rem (0 connections) to 2rem (10+ connections)
		const size = Math.min(2, 1 + count * 0.12);
		return `${size}rem`;
	}

	function getMobileSize(page: PageNode): string {
		if (page.isWriting) return '0.6rem';
		const count = getConnectionCount(page);
		const size = Math.min(1.5, 0.85 + count * 0.08);
		return `${size}rem`;
	}

	let connectionLines = $derived(getConnectionLines());
	let containerHeight = $derived(Math.max(500, typeof window !== 'undefined' ? window.innerHeight - 100 : 600));
</script>

<svelte:head>
	<title>Index — The Idealists Collective</title>
</svelte:head>

<div class="index-page">
	<div bind:this={containerRef} class="index-container" style="height: {containerHeight}px;">
		<svg class="connections" style="height: {containerHeight}px;">
			{#if positions.length > 0}
				{@const centerX = containerRef?.clientWidth ? containerRef.clientWidth / 2 : 400}
				{@const centerY = containerHeight / 2}
				{@const baseRadius = Math.min(containerRef?.clientWidth ?? 800, containerHeight) * (isMobile ? 0.25 : 0.18)}
				<circle
					cx={centerX}
					cy={centerY}
					r={baseRadius}
					fill="none"
					stroke="var(--text)"
					stroke-width="0.5"
					opacity="0.08"
					stroke-dasharray="4 8"
				/>
				<circle
					cx={centerX}
					cy={centerY}
					r={baseRadius * 1.6}
					fill="none"
					stroke="var(--text)"
					stroke-width="0.5"
					opacity="0.05"
					stroke-dasharray="4 12"
				/>
				<circle
					cx={centerX}
					cy={centerY}
					r={baseRadius * 2.4}
					fill="none"
					stroke="var(--text)"
					stroke-width="0.5"
					opacity="0.03"
					stroke-dasharray="2 8"
				/>
			{/if}

			{#each connectionLines as line (line.key)}
				<line
					x1={line.x1}
					y1={line.y1}
					x2={line.x2}
					y2={line.y2}
					stroke={line.active ? 'var(--accent)' : 'var(--text)'}
					stroke-width={line.active ? 1.5 : 0.5}
					opacity={line.active ? 0.5 : 0.15}
					class="connection-line"
				/>
			{/each}

			<!-- Node dots where lines connect -->
			{#each positions as page (page.path + '-dot')}
				<circle
					cx={page.x}
					cy={page.y}
					r={page.path === '/' ? 4 : 2.5}
					fill="var(--text)"
					opacity={hoveredPage === page.path ? 0.6 : 0.25}
					class="node-dot"
				/>
			{/each}
		</svg>

		{#each positions as page (page.path)}
			<a
				href={page.path}
				class="index-link"
				class:accent={page.path === '/join'}
				class:center={page.path === '/index'}
				class:writing={page.isWriting}
				class:highlighted={hoveredPage && (page.path === hoveredPage || data.connections.some(c => (c.from === hoveredPage && c.to === page.path) || (c.to === hoveredPage && c.from === page.path)))}
				style="
					left: {page.x}px;
					top: {page.y}px;
					font-size: {isMobile ? getMobileSize(page) : getSize(page)};
				"
				onmouseenter={() => hoveredPage = page.path}
				onmouseleave={() => hoveredPage = null}
			>
				<span class="link-name">{page.name}</span>
				<span class="link-description">{page.description}</span>
			</a>
		{/each}
	</div>
</div>

<style>
	.index-page {
		width: 100%;
		min-height: 100vh;
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.index-container {
		position: relative;
		width: 100%;
		max-width: 900px;
	}

	.connections {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		pointer-events: none;
		z-index: 0;
	}

	.connection-line {
		transition: stroke 0.3s, opacity 0.3s, stroke-width 0.3s;
	}

	.index-link {
		position: absolute;
		transform: translate(-50%, -50%);
		text-decoration: none;
		color: var(--text);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		transition: color 0.2s, opacity 0.2s;
		z-index: 1;
		text-align: center;
		padding: 0.5rem;
	}

	.index-link:hover,
	.index-link.highlighted {
		color: var(--accent);
	}

	.index-link.accent {
		color: var(--accent);
	}

	.index-link.center {
		font-weight: 600;
	}

	.index-link.writing {
		opacity: 0.7;
	}

	.index-link.writing .link-name {
		font-weight: 400;
		font-style: italic;
	}

	.link-name {
		font-weight: 500;
		letter-spacing: -0.02em;
		transition: transform 0.2s;
	}

	.index-link:hover .link-name {
		transform: scale(1.05);
	}

	.link-description {
		font-size: 0.65em;
		opacity: 0;
		transform: translateY(-4px);
		transition: opacity 0.2s, transform 0.2s;
		white-space: nowrap;
	}

	.index-link:hover .link-description,
	.index-link.highlighted .link-description {
		opacity: 0.6;
		transform: translateY(0);
	}

	@media (max-width: 640px) {
		.index-page {
			padding: 1rem 0.5rem;
		}

		.link-description {
			font-size: 0.7em;
		}
	}

	@media (min-width: 640px) {
		.index-page {
			padding: 2rem;
		}
	}
</style>
