<script lang="ts">
	import './layout.css';
	import Constellation from '$lib/components/Constellation.svelte';
	import FloatingLlama from '$lib/components/FloatingLlama.svelte';
	import { browser } from '$app/environment';
	let { children } = $props();

	const themes = {
		dawn: { bg: '#FFF8F3', text: '#3D2C29', accent: '#C94A35', heading: '#C08050', network: '#F0B8A8' },
		night: { bg: '#0a0e1a', text: '#e8eaf0', accent: '#7eb8da', heading: '#f0d890', network: '#3a5a8a' }
	};

	type ThemeName = 'dawn' | 'night';

	function getSystemPreference(): ThemeName {
		if (browser && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'night';
		}
		return 'dawn';
	}

	function getSavedTheme(): ThemeName | null {
		if (browser) {
			const saved = localStorage.getItem('theme');
			if (saved === 'dawn' || saved === 'night') return saved;
		}
		return null;
	}

	let theme = $state<ThemeName>(getSavedTheme() ?? getSystemPreference());

	function toggleTheme() {
		theme = theme === 'dawn' ? 'night' : 'dawn';
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
	<button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
		{#if theme === 'dawn'}
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
		{:else}
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
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
