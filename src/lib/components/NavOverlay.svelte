<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	interface PageNode {
		name: string;
		path: string;
		linksTo: string[];
		isWriting?: boolean;
	}

	interface Props {
		pages: PageNode[];
		connections: { from: string; to: string }[];
	}

	let { pages, connections }: Props = $props();

	let expanded = $state(false);
	let containerRef: HTMLDivElement | null = $state(null);
	let hoveredPage: string | null = $state(null);

	// Filter to main pages only
	let mainPages = $derived(pages.filter(p => !p.isWriting && p.path !== '/index'));
	let mainConnections = $derived(connections.filter(c => {
		const fromPage = pages.find(p => p.path === c.from);
		const toPage = pages.find(p => p.path === c.to);
		return fromPage && toPage && !fromPage.isWriting && !toPage.isWriting &&
			fromPage.path !== '/index' && toPage.path !== '/index';
	}));

	let currentPath = $derived($page.url.pathname);

	interface PositionedPage extends PageNode {
		x: number;
		y: number;
	}

	let positions: PositionedPage[] = $state([]);

	function getOrbit(pg: PageNode): number {
		if (pg.path === '/') return 0;
		const count = pg.linksTo.length + mainPages.filter(p => p.linksTo.includes(pg.path)).length;
		return count >= 4 ? 1 : 2;
	}

	function calculatePositions(width: number, height: number): PositionedPage[] {
		const centerX = width / 2;
		const centerY = height / 2;
		const baseRadius = Math.min(width, height) * 0.32;
		const orbitRadii = [0, baseRadius * 0.55, baseRadius];

		const orbit1: PageNode[] = [];
		const orbit2: PageNode[] = [];

		for (const pg of mainPages) {
			if (pg.path === '/') continue;
			if (getOrbit(pg) === 1) orbit1.push(pg);
			else orbit2.push(pg);
		}

		const angles = new Map<string, number>();
		angles.set('/', 0);
		orbit1.forEach((p, i) => angles.set(p.path, (i / orbit1.length) * Math.PI * 2 - Math.PI / 2));
		orbit2.forEach((p, i) => angles.set(p.path, (i / orbit2.length) * Math.PI * 2 - Math.PI / 3));

		return mainPages.map((pg) => {
			const orbit = pg.path === '/' ? 0 : getOrbit(pg);
			const angle = angles.get(pg.path) || 0;
			const radius = orbitRadii[orbit];

			return {
				...pg,
				x: centerX + (orbit > 0 ? Math.cos(angle) * radius : 0),
				y: centerY + (orbit > 0 ? Math.sin(angle) * radius : 0)
			};
		});
	}

	function updatePositions() {
		if (!containerRef || !expanded) return;
		positions = calculatePositions(containerRef.clientWidth, containerRef.clientHeight);
	}

	$effect(() => {
		if (expanded) {
			// Small delay to let the container expand
			setTimeout(updatePositions, 50);
		}
	});

	onMount(() => {
		const handleResize = () => updatePositions();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	function getConnectionLines() {
		if (!expanded) return [];
		const lines: { x1: number; y1: number; x2: number; y2: number; key: string; active: boolean }[] = [];

		for (const conn of mainConnections) {
			const from = positions.find(p => p.path === conn.from);
			const to = positions.find(p => p.path === conn.to);
			if (from && to) {
				const isActive = hoveredPage === conn.from || hoveredPage === conn.to;
				lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, key: `${conn.from}-${conn.to}`, active: isActive });
			}
		}
		return lines;
	}

	let connectionLines = $derived(getConnectionLines());
</script>

<div class="nav-overlay" class:expanded>
	<button
		class="nav-toggle"
		onclick={() => expanded = !expanded}
		aria-expanded={expanded}
		aria-label="Toggle navigation"
	>
		{#if expanded}
			<span class="close">×</span>
		{:else}
			<!-- Small constellation icon -->
			<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
				<circle cx="8" cy="8" r="2" opacity="0.8"/>
				<circle cx="3" cy="4" r="1.5" opacity="0.5"/>
				<circle cx="13" cy="5" r="1.5" opacity="0.5"/>
				<circle cx="5" cy="13" r="1.5" opacity="0.5"/>
				<circle cx="12" cy="12" r="1.5" opacity="0.5"/>
			</svg>
			<span class="toggle-label">index</span>
		{/if}
	</button>

	{#if expanded}
		<div bind:this={containerRef} class="nav-content">
			<svg class="connections">
				{#each connectionLines as line (line.key)}
					<line
						x1={line.x1} y1={line.y1}
						x2={line.x2} y2={line.y2}
						stroke={line.active ? 'var(--accent)' : 'var(--text)'}
						stroke-width={line.active ? 1.5 : 0.5}
						opacity={line.active ? 0.5 : 0.15}
					/>
				{/each}
			</svg>

			{#each positions as pg (pg.path)}
				<a
					href={pg.path}
					class="nav-node"
					class:current={pg.path === currentPath}
					class:accent={pg.path === '/join'}
					class:highlighted={hoveredPage && (pg.path === hoveredPage || mainConnections.some(c =>
						(c.from === hoveredPage && c.to === pg.path) || (c.to === hoveredPage && c.from === pg.path)
					))}
					style="left: {pg.x}px; top: {pg.y}px;"
					onmouseenter={() => hoveredPage = pg.path}
					onmouseleave={() => hoveredPage = null}
					onclick={() => expanded = false}
				>
					{pg.name}
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.nav-overlay {
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 100;
		transition: all 0.2s ease;
	}

	.nav-overlay.expanded {
		background: var(--bg);
		border: 1px solid color-mix(in srgb, var(--text) 20%, transparent);
		border-radius: 6px;
		width: 280px;
		height: 220px;
		box-shadow: 0 4px 20px color-mix(in srgb, var(--text) 10%, transparent);
	}

	.nav-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: none;
		border: none;
		color: var(--text);
		font-family: inherit;
		cursor: pointer;
		opacity: 0.62;
		transition: opacity 0.2s;
	}

	.nav-toggle:hover {
		opacity: 0.9;
	}

	.toggle-label {
		font-size: 0.7rem;
		margin-left: 0.3rem;
		letter-spacing: -0.02em;
	}

	.nav-overlay.expanded .nav-toggle {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		padding: 0.3rem 0.5rem;
		font-size: 1rem;
		opacity: 0.5;
		z-index: 10;
	}

	.nav-overlay.expanded .nav-toggle:hover {
		opacity: 1;
	}

	.close {
		line-height: 1;
	}

	.nav-content {
		position: relative;
		width: 100%;
		height: 100%;
		padding: 0.5rem;
	}

	.connections {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.nav-node {
		position: absolute;
		transform: translate(-50%, -50%);
		font-size: 0.65rem;
		color: var(--text);
		text-decoration: none;
		padding: 0.15rem 0.3rem;
		border-radius: 2px;
		transition: color 0.15s, background 0.15s;
		white-space: nowrap;
	}

	.nav-node:hover,
	.nav-node.highlighted {
		color: var(--accent);
	}

	.nav-node.current {
		font-weight: 600;
		background: var(--text);
		color: var(--bg);
	}

	.nav-node.accent {
		color: var(--accent);
	}

	.nav-node.accent.current {
		background: var(--accent);
		color: var(--bg);
	}

	@media (max-width: 640px) {
		.nav-overlay.expanded {
			width: 240px;
			height: 180px;
		}

		.nav-node {
			font-size: 0.6rem;
		}
	}
</style>
