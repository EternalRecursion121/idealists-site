<script lang="ts">
	import { onMount } from 'svelte';

	let svg: SVGSVGElement;
	let paths: string[] = $state([]);
	let nodes: { id: number; x: number; y: number; baseX: number; baseY: number; size: number; opacity: number; fadeDirection: 'in' | 'out' | 'stable' }[] = $state([]);
	let time = $state(0);
	let nextNodeId = $state(0);

	const NODE_COUNT = 45;
	const CONNECTION_DISTANCE = 180;
	const LINE_OPACITY = 0.3;
	const DRIFT_AMOUNT = 12;
	const DRIFT_SPEED = 0.00002;
	const REFRESH_INTERVAL = 4000; // Add/remove a node every 6 seconds
	const FADE_DURATION = 2000; // 2 second fade

	let clusters: { x: number; y: number; strength: number }[] = [];
	let screenWidth = 0;
	let screenHeight = 0;

	function generateNetwork(width: number, height: number) {
		screenWidth = width;
		screenHeight = height;
		const newNodes: typeof nodes = [];

		// Create 3-5 cluster centers
		const clusterCount = 3 + Math.floor(Math.random() * 3);
		clusters = [];

		for (let i = 0; i < clusterCount; i++) {
			clusters.push({
				x: width * (0.15 + Math.random() * 0.7),
				y: height * (0.15 + Math.random() * 0.7),
				strength: 0.3 + Math.random() * 0.5
			});
		}

		// Generate nodes with cluster-influenced positions
		for (let i = 0; i < NODE_COUNT; i++) {
			newNodes.push(createNode());
		}

		nodes = newNodes;
		updatePositions();
	}

	function createNode(): typeof nodes[0] {
		// Pick a cluster to gravitate toward (or none)
		const clusterIndex = Math.floor(Math.random() * (clusters.length + 2));

		let baseX: number, baseY: number;

		if (clusterIndex < clusters.length) {
			// Near a cluster
			const cluster = clusters[clusterIndex];
			const angle = Math.random() * Math.PI * 2;
			const dist = Math.random() * 150 + 30;
			baseX = cluster.x + Math.cos(angle) * dist * cluster.strength;
			baseY = cluster.y + Math.sin(angle) * dist * cluster.strength;
		} else {
			// Scattered freely
			baseX = screenWidth * (0.05 + Math.random() * 0.9);
			baseY = screenHeight * (0.05 + Math.random() * 0.9);
		}

		// Keep in bounds with padding
		baseX = Math.max(40, Math.min(screenWidth - 40, baseX));
		baseY = Math.max(40, Math.min(screenHeight - 40, baseY));

		// Vary node sizes - some larger "hub" nodes
		const size = Math.random() < 0.15 ? 2.5 + Math.random() * 1.5 : 1 + Math.random() * 1;

		const id = nextNodeId++;
		return { id, x: baseX, y: baseY, baseX, baseY, size, opacity: 0, fadeDirection: 'in' };
	}

	function refreshNode() {
		if (nodes.length === 0) return;

		// Pick a random stable node to fade out
		const stableNodes = nodes.filter(n => n.fadeDirection === 'stable');
		if (stableNodes.length === 0) return;

		const nodeToRemove = stableNodes[Math.floor(Math.random() * stableNodes.length)];
		nodeToRemove.fadeDirection = 'out';

		// Add a new node that fades in
		const newNode = createNode();
		nodes = [...nodes, newNode];
	}

	const FADE_STEP = 50 / FADE_DURATION; // Amount to change opacity per 50ms tick

	function updatePositions() {
		// Apply slow sinusoidal drift and update fade state for each node
		const nodesToKeep: typeof nodes = [];

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			// Each node drifts with a unique phase based on its id
			const phase = node.id * 0.7;
			node.x = node.baseX + Math.sin(time + phase) * DRIFT_AMOUNT;
			node.y = node.baseY + Math.cos(time * 0.7 + phase) * DRIFT_AMOUNT;

			// Handle fading
			if (node.fadeDirection === 'in') {
				node.opacity = Math.min(1, node.opacity + FADE_STEP);
				if (node.opacity >= 1) {
					node.fadeDirection = 'stable';
				}
			} else if (node.fadeDirection === 'out') {
				node.opacity = Math.max(0, node.opacity - FADE_STEP);
				if (node.opacity <= 0) {
					continue; // Remove this node
				}
			}
			nodesToKeep.push(node);
		}

		nodes = nodesToKeep;

		// Regenerate paths based on new positions (only for visible nodes)
		const newPaths: string[] = [];
		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				const dx = nodes[j].x - nodes[i].x;
				const dy = nodes[j].y - nodes[i].y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < CONNECTION_DISTANCE) {
					const midX = (nodes[i].x + nodes[j].x) / 2;
					const midY = (nodes[i].y + nodes[j].y) / 2;
					const perpX = -dy / dist * 8;
					const perpY = dx / dist * 8;

					newPaths.push(
						`M ${nodes[i].x.toFixed(1)} ${nodes[i].y.toFixed(1)} Q ${(midX + perpX).toFixed(1)} ${(midY + perpY).toFixed(1)} ${nodes[j].x.toFixed(1)} ${nodes[j].y.toFixed(1)}`
					);
				}
			}
		}
		paths = newPaths;
	}

	onMount(() => {
		generateNetwork(window.innerWidth, window.innerHeight);

		// Set initial nodes to fully visible
		for (const node of nodes) {
			node.opacity = 1;
			node.fadeDirection = 'stable';
		}

		// Very slow update interval (every 50ms = 20fps, plenty smooth for slow drift)
		const driftInterval = setInterval(() => {
			time += DRIFT_SPEED * 50;
			updatePositions();
		}, 50);

		// Periodically add/remove a node
		const refreshInterval = setInterval(refreshNode, REFRESH_INTERVAL);

		const handleResize = () => generateNetwork(window.innerWidth, window.innerHeight);
		window.addEventListener('resize', handleResize);

		return () => {
			clearInterval(driftInterval);
			clearInterval(refreshInterval);
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<svg
	bind:this={svg}
	class="network-bg"
	viewBox="0 0 {typeof window !== 'undefined' ? window.innerWidth : 1920} {typeof window !== 'undefined' ? window.innerHeight : 1080}"
	preserveAspectRatio="xMidYMid slice"
>
	{#each paths as path, i (i)}
		<path
			d={path}
			fill="none"
			stroke="currentColor"
			stroke-width="0.5"
			opacity={LINE_OPACITY}
		/>
	{/each}

	{#each nodes as node (node.id)}
		<circle
			cx={node.x}
			cy={node.y}
			r={node.size}
			fill="currentColor"
			opacity={LINE_OPACITY * 1.5 * node.opacity}
			class="node"
		/>
	{/each}
</svg>

<style>
	.network-bg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: -1;
		color: var(--network, var(--text, #005a42));
	}

	.node {
		transition: opacity 0.5s ease;
	}
</style>
