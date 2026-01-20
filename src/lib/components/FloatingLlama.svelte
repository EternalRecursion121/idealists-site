<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	// Llama state
	let visible = $state(false);
	let x = $state(0);
	let y = $state(0);
	let direction: 'left' | 'right' = $state('right');
	let bobOffset = $state(0);

	const SPAWN_CHANCE = 1 / 1800; // ~0.05% per second, expect once per 30 min
	const CHECK_INTERVAL = 1000; // Check every second
	const TRAVEL_DURATION = 15000; // 15 seconds to cross screen
	const BOB_SPEED = 0.003;
	const BOB_AMOUNT = 20;

	let animationFrame: number;
	let startTime: number;
	let startX: number;
	let endX: number;

	function spawnLlama() {
		if (visible) return;

		// Random Y position (20% - 80% of viewport)
		y = window.innerHeight * (0.2 + Math.random() * 0.6);

		// Random direction
		direction = Math.random() < 0.5 ? 'left' : 'right';

		if (direction === 'right') {
			startX = -100;
			endX = window.innerWidth + 100;
		} else {
			startX = window.innerWidth + 100;
			endX = -100;
		}

		x = startX;
		startTime = performance.now();
		visible = true;

		animate();
	}

	function animate() {
		if (!visible) return;

		const elapsed = performance.now() - startTime;
		const progress = Math.min(elapsed / TRAVEL_DURATION, 1);

		// Linear movement across screen
		x = startX + (endX - startX) * progress;

		// Gentle bobbing
		bobOffset = Math.sin(elapsed * BOB_SPEED) * BOB_AMOUNT;

		if (progress >= 1) {
			visible = false;
		} else {
			animationFrame = requestAnimationFrame(animate);
		}
	}

	function handleClick() {
		visible = false;
		if (animationFrame) cancelAnimationFrame(animationFrame);
		goto('/join');
	}

	onMount(() => {
		// Debug mode: force llama to appear
		if (browser) {
			const params = new URLSearchParams(window.location.search);
			if (params.get('debug') === 'llama') {
				spawnLlama();
			}
		}

		// Random spawn check
		const interval = setInterval(() => {
			if (!visible && Math.random() < SPAWN_CHANCE) {
				spawnLlama();
			}
		}, CHECK_INTERVAL);

		return () => {
			clearInterval(interval);
			if (animationFrame) cancelAnimationFrame(animationFrame);
		};
	});
</script>

{#if visible}
	<button
		class="llama"
		style="left: {x}px; top: {y + bobOffset}px; transform: scaleX({direction === 'left' ? -1 : 1})"
		onclick={handleClick}
		aria-label="Mysterious llama"
	>
		🦙
	</button>
{/if}

<style>
	.llama {
		position: fixed;
		font-size: 2.5rem;
		opacity: 0.4;
		z-index: 1000;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		transition: opacity 0.3s;
		filter: grayscale(0.5);
	}

	.llama:hover {
		opacity: 0.7;
		filter: grayscale(0);
	}
</style>
