<script lang="ts">
	import './layout.css';
	let { children } = $props();

	let theme = $state('cream');

	const themes = {
		cream: { bg: '#F6E9CD', text: '#1B367E', accent: '#3F812A' },
		navy: { bg: '#1B367E', text: '#F6E9CD', accent: '#96E8B3' },
		mint: { bg: '#b8e8c8', text: '#1B367E', accent: '#1B367E' },
		lavender: { bg: '#C3BBFF', text: '#1B367E', accent: '#1B367E' },
		forest: { bg: '#3F812A', text: '#F6E9CD', accent: '#96E8B3' },
		crimson: { bg: '#2a0a0a', text: '#e8d0d0', accent: '#6b3030' }
	};

	function cycleTheme() {
		const keys = Object.keys(themes);
		const currentIndex = keys.indexOf(theme);
		theme = keys[(currentIndex + 1) % keys.length];
	}

	$effect(() => {
		document.body.style.background = themes[theme].bg;
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet" />
</svelte:head>

<div 
	class="app"
	style="--bg: {themes[theme].bg}; --text: {themes[theme].text}; --accent: {themes[theme].accent};"
>
	<button class="theme-toggle" onclick={cycleTheme}>
		{theme}
	</button>
	{@render children()}
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
	}

	.app {
		font-family: 'Source Code Pro', monospace;
		min-height: 100vh;
		padding: 2rem;
		background: var(--bg);
		color: var(--text);
		transition: background 0.3s, color 0.3s;
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
