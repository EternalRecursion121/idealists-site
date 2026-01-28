<script lang="ts">
	import './layout.css';
	import Constellation from '$lib/components/Constellation.svelte';
	import FloatingLlama from '$lib/components/FloatingLlama.svelte';
	import { browser } from '$app/environment';
	let { children } = $props();

	const themes = {
		dawn: { bg: '#FFF8F3', text: '#3D2C29', accent: '#C94A35', heading: '#C08050', network: '#F0B8A8' },
		night: { bg: '#08090d', text: '#d8dce8', accent: '#a08cd8', heading: '#d8c8a0', network: '#181428' },

		twilight: { bg: '#141018', text: '#e4dde6', accent: '#c79292', heading: '#d4b896', network: '#2d2535' },
		forest: { bg: '#0e1512', text: '#d8e8dc', accent: '#7a9e7e', heading: '#c8b88c', network: '#1e352a' }
	};

	type ThemeName = 'dawn' | 'night' | 'twilight' | 'forest';
	const themeOrder: ThemeName[] = ['dawn', 'twilight', 'night', 'forest'];

	function getSystemPreference(): ThemeName {
		if (browser && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'twilight';
		}
		return 'dawn';
	}

	function getSavedTheme(): ThemeName | null {
		if (browser) {
			const saved = localStorage.getItem('theme');
			if (saved === 'dawn' || saved === 'night' || saved === 'twilight' || saved === 'forest') return saved;
		}
		return null;
	}

	let theme = $state<ThemeName>(getSavedTheme() ?? getSystemPreference());

	function cycleTheme() {
		const currentIndex = themeOrder.indexOf(theme);
		const nextIndex = (currentIndex + 1) % themeOrder.length;
		theme = themeOrder[nextIndex];
		if (browser) {
			localStorage.setItem('theme', theme);
		}
	}

	$effect(() => {
		document.body.style.background = themes[theme].bg;
	});

	$effect(() => {
		if (browser) {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handler = () => {
				if (!localStorage.getItem('theme')) {
					theme = getSystemPreference();
				}
			};
			mediaQuery.addEventListener('change', handler);
			return () => mediaQuery.removeEventListener('change', handler);
		}
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
	<FloatingLlama />
	<button class="theme-toggle" onclick={cycleTheme} aria-label="Cycle theme">
		{#if theme === 'dawn'}
			<!-- Sun -->
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="5"/>
				<line x1="12" y1="1" x2="12" y2="3"/>
				<line x1="12" y1="21" x2="12" y2="23"/>
				<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
				<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
				<line x1="1" y1="12" x2="3" y2="12"/>
				<line x1="21" y1="12" x2="23" y2="12"/>
				<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
				<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
			</svg>
		{:else if theme === 'night'}
			<!-- Moon -->
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
			</svg>
		{:else if theme === 'twilight'}
			<!-- Twilight sparkle -->
			<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2 L14 10 L12 12 L10 10 Z"/>
				<path d="M12 22 L10 14 L12 12 L14 14 Z"/>
				<path d="M2 12 L10 10 L12 12 L10 14 Z"/>
				<path d="M22 12 L14 14 L12 12 L14 10 Z"/>
			</svg>
		{:else}
			<!-- Forest tree -->
			<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2 L6 10 L9 10 L5 16 L10.5 16 L10.5 20 L13.5 20 L13.5 16 L19 16 L15 10 L18 10 Z"/>
			</svg>
		{/if}
	</button>
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
		padding: 0.5rem;
		background: transparent;
		border: none;
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
