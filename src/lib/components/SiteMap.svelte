<script lang="ts">
	import { onMount } from 'svelte';

	interface PageNode {
		name: string;
		path: string;
		description: string;
		linksTo: string[];
		isWriting?: boolean;
	}

	interface Connection {
		from: string;
		to: string;
	}

	interface Props {
		pages: PageNode[];
		connections: Connection[];
		height?: number;
		alwaysShowDescriptions?: boolean;
		centerPath?: string;
	}

	let {
		pages,
		connections,
		height,
		alwaysShowDescriptions = false,
		centerPath = '/sitemap'
	}: Props = $props();

	interface PositionedPage extends PageNode {
		x: number;
		y: number;
	}

	let containerRef: HTMLDivElement | null = $state(null);
	let positions: PositionedPage[] = $state([]);
	let hoveredPage: string | null = $state(null);
	let isMobile = $state(false);
	let time = $state(0);
	let measuredHeight = $state(500);

	const MOBILE_BREAKPOINT = 640;

	function getOrbit(page: PageNode, allPages: PageNode[]): number {
		if (page.path === centerPath) return 0;
		if (page.isWriting) return 3;

		const connectionCount =
			page.linksTo.length +
			allPages.filter((p) => p.linksTo.includes(page.path)).length;

		if (connectionCount >= 6) return 1;
		if (connectionCount >= 4) return 1;
		return 2;
	}

	function assignAngles(pagesList: PageNode[]): Map<string, number> {
		const angles = new Map<string, number>();
		const orbit1: string[] = [];
		const orbit2: string[] = [];
		const orbit3: string[] = [];

		for (const page of pagesList) {
			if (page.path === centerPath) {
				angles.set(page.path, 0);
			} else {
				const orbit = getOrbit(page, pagesList);
				if (orbit === 1) orbit1.push(page.path);
				else if (orbit === 2) orbit2.push(page.path);
				else if (orbit === 3) orbit3.push(page.path);
			}
		}

		orbit1.forEach((path, i) => {
			angles.set(path, (i / orbit1.length) * Math.PI * 2 - Math.PI / 2);
		});
		orbit2.forEach((path, i) => {
			angles.set(path, (i / orbit2.length) * Math.PI * 2 - Math.PI / 3);
		});
		const arcStart = -Math.PI * 0.85;
		const arcEnd = -Math.PI * 0.15;
		const arcSpan = arcEnd - arcStart;
		orbit3.forEach((path, i) => {
			const t = orbit3.length > 1 ? i / (orbit3.length - 1) : 0.5;
			angles.set(path, arcStart + t * arcSpan);
		});

		const homeAngle = angles.get('/');
		const writingsAngle = angles.get('/writings');
		if (homeAngle !== undefined && writingsAngle !== undefined) {
			angles.set('/', writingsAngle);
			angles.set('/writings', homeAngle);
		}

		return angles;
	}

	function calculatePositions(width: number, h: number, mobile: boolean): PositionedPage[] {
		const centerX = width / 2;
		const centerY = h / 2;
		const baseRadius = Math.min(width, h) * (mobile ? 0.25 : 0.30);
		const orbitRadii = [0, baseRadius, baseRadius * 1.6, baseRadius * 3];

		const angles = assignAngles(pages);

		return pages.map((page) => {
			const orbit = page.path === centerPath ? 0 : getOrbit(page, pages);
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
		const h = height ?? Math.max(500, window.innerHeight - 100);
		measuredHeight = h;
		const mobile = window.innerWidth < MOBILE_BREAKPOINT;
		isMobile = mobile;
		positions = calculatePositions(width, h, mobile);
	}

	onMount(() => {
		calculateLayout();

		const driftInterval = setInterval(() => {
			time += 0.002;
			if (containerRef) {
				const width = containerRef.clientWidth;
				const h = height ?? Math.max(500, window.innerHeight - 100);
				positions = calculatePositions(width, h, isMobile);
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

	function getConnectionLines() {
		const lines: {
			x1: number;
			y1: number;
			x2: number;
			y2: number;
			key: string;
			active: boolean;
		}[] = [];

		for (const conn of connections) {
			const fromPage = positions.find((p) => p.path === conn.from);
			const toPage = positions.find((p) => p.path === conn.to);

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
		const outgoing = page.linksTo.length;
		const incoming = pages.filter((p) => p.linksTo.includes(page.path)).length;
		return outgoing + incoming;
	}

	function getSize(page: PageNode): string {
		if (page.isWriting) return '0.45rem';
		const count = getConnectionCount(page);
		const size = Math.min(1.2, 0.6 + count * 0.072);
		return `${size}rem`;
	}

	function getMobileSize(page: PageNode): string {
		if (page.isWriting) return '0.36rem';
		const count = getConnectionCount(page);
		const size = Math.min(0.9, 0.51 + count * 0.048);
		return `${size}rem`;
	}

	let connectionLines = $derived(getConnectionLines());
</script>

<div
	bind:this={containerRef}
	class="sitemap-container"
	class:always-visible={alwaysShowDescriptions}
	style="height: {measuredHeight}px;"
>
	<svg class="connections" style="height: {measuredHeight}px;">
		{#if positions.length > 0}
			{@const centerX = containerRef?.clientWidth ? containerRef.clientWidth / 2 : 400}
			{@const centerY = measuredHeight / 2}
			{@const baseRadius =
				Math.min(containerRef?.clientWidth ?? 800, measuredHeight) * (isMobile ? 0.25 : 0.30)}
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
			class="sitemap-link"
			class:accent={page.path === '/join'}
			class:center={page.path === centerPath}
			class:writing={page.isWriting}
			class:highlighted={hoveredPage &&
				(page.path === hoveredPage ||
					connections.some(
						(c) =>
							(c.from === hoveredPage && c.to === page.path) ||
							(c.to === hoveredPage && c.from === page.path)
					))}
			style="left: {page.x}px; top: {page.y}px; font-size: {isMobile
				? getMobileSize(page)
				: getSize(page)};"
			onmouseenter={() => (hoveredPage = page.path)}
			onmouseleave={() => (hoveredPage = null)}
		>
			<span class="link-name">{page.name}</span>
			{#if page.description}
				<span class="link-description">{page.description}</span>
			{/if}
		</a>
	{/each}
</div>

<style>
	.sitemap-container {
		position: relative;
		width: 100%;
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

	.sitemap-link {
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

	.sitemap-link:hover,
	.sitemap-link.highlighted {
		color: var(--accent);
	}

	.sitemap-link.accent {
		color: var(--accent);
	}

	.sitemap-link.center {
		font-weight: 600;
	}

	.sitemap-link.writing {
		opacity: 0.7;
	}

	.sitemap-link.writing .link-name {
		font-weight: 400;
		font-style: italic;
	}

	.link-name {
		font-weight: 500;
		letter-spacing: -0.02em;
		transition: transform 0.2s;
	}

	.sitemap-link:hover .link-name {
		transform: scale(1.05);
	}

	.link-description {
		font-size: 0.7em;
		opacity: 0;
		transform: translateY(-4px);
		transition: opacity 0.2s, transform 0.2s;
		white-space: nowrap;
	}

	.sitemap-link:hover .link-description,
	.sitemap-link.highlighted .link-description {
		opacity: 0.6;
		transform: translateY(0);
	}

	.sitemap-container.always-visible .link-description {
		opacity: 0.55;
		transform: translateY(0);
	}

	.sitemap-container.always-visible .sitemap-link:hover .link-description,
	.sitemap-container.always-visible .sitemap-link.highlighted .link-description {
		opacity: 0.85;
	}
</style>
