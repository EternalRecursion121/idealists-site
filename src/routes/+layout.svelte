<script lang="ts">
	import './layout.css';
	import Constellation from '$lib/components/Constellation.svelte';
	let { children } = $props();

	let theme = $state('night');

	const themes = {
		night: { bg: '#0a0e1a', text: '#e8eaf0', accent: '#7eb8da', heading: '#f0d890', network: '#3a5a8a' },
		cream: { bg: '#E9E2D2', text: '#1B367E', accent: '#3F812A', heading: '#7d0202', network: '#1B367E' },
		navy: { bg: '#1B367E', text: '#e0ecfa', accent: '#96E8B3', heading: '#FFD166', network: '#F6E9CD' },
		mint: { bg: '#b8e8c8', text: '#1B367E', accent: '#1B367E', heading: '#1a4d1a', network: '#1B367E' },
		lavender: { bg: '#C3BBFF', text: '#1B367E', accent: '#1B367E', heading: '#4A2C6A', network: '#1B367E' },
		forest: { bg: '#3F812A', text: '#F6E9CD', accent: '#96E8B3', heading: '#FFF8DC', network: '#F6E9CD' },
		crimson: { bg: '#2a0a0a', text: '#e8d0d0', accent: '#6b3030', heading: '#c45050', network: '#e8d0d0' }
	};

	function cycleTheme() {
		const keys = Object.keys(themes);
		const currentIndex = keys.indexOf(theme);
		theme = keys[(currentIndex + 1) % keys.length];
	}

	$effect(() => {
		document.body.style.background = themes[theme].bg;
		document.body.style.backgroundImage = "radial-gradient(circle, var(\"#FFFFFF\") 0.9px, rgba(0,0,0,0) 1px)";
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet" />
</svelte:head>

<div 
	class="app"
	style="--bg: {themes[theme].bg}; --text: {themes[theme].text}; --accent: {themes[theme].accent}; --heading: {themes[theme].heading}; --network: {themes[theme].network};"
>
	<Constellation />
	<!-- <button class="theme-toggle" onclick={cycleTheme}>
		{theme}
	</button> -->
	{@render children()}
</div>

<style>
	:global(html) {
		font-size: 14px;
	}

	:global(html, body) {
		margin: 0;
		padding: 0;
	}

	.app {
		--font-mono: 'Source Code Pro', monospace;
		font-family: var(--font-mono);
		min-height: 100vh;
		padding: 1rem;
		background: transparent;
		color: var(--text);
		transition: color 0.3s;
	}

	@media (min-width: 640px) {
		:global(html) {
			font-size: 17px;
		}

		.app {
			padding: 2rem;
		}
	}

	.theme-toggle {
		position: fixed;
		top: 1rem;
		right: 1rem;
		font-family: inherit;
		font-size: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: 1px solid var(--text);
		color: var(--text);
		cursor: pointer;
		opacity: 0.5;
		transition: opacity 0.2s;
	}

	.theme-toggle:hover {
		opacity: 1;
	}

	:global(a) {
		color: inherit;
	}

	:global(a:hover) {
		color: var(--accent);
	}
</style>
