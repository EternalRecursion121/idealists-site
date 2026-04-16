<script lang="ts">
	import './layout.css';
	import FloatingLlama from '$lib/components/FloatingLlama.svelte';
	import NavOverlay from '$lib/components/NavOverlay.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	interface Props {
		children: any;
		data: {
			navPages: { name: string; path: string; linksTo: string[]; isWriting?: boolean }[];
			navConnections: { from: string; to: string }[];
		};
	}

	let { children, data }: Props = $props();

	// Hide nav on index pages
	let showNav = $derived(!$page.url.pathname.startsWith('/index'));

	const themes = {
		dawn: { bg: '#FFFBF3', text: '#4A3728', accent: '#D89A6A', heading: '#B8804E', noise: 'rgba(216,154,106,1)' },
		night: { bg: '#04050a', text: '#d8dce8', accent: '#a08cd8', heading: '#d8c8a0', noise: 'rgba(175,158,235,1)' },
		twilight: { bg: '#0b0812', text: '#e4dde6', accent: '#c79292', heading: '#d4b896', noise: 'rgba(225,150,150,1)' },
		forest: { bg: '#050b08', text: '#d8e8dc', accent: '#7a9e7e', heading: '#c8b88c', noise: 'rgba(160,240,100,1)' }
	};

	type ThemeName = 'dawn' | 'night' | 'twilight' | 'forest' | 'auto';
	type BaseThemeName = 'dawn' | 'night' | 'twilight' | 'forest';
	const themeOrder: ThemeName[] = ['dawn', 'twilight', 'night', 'forest', 'auto'];

	const themeDescriptions: Record<ThemeName, string> = {
		dawn: 'dawn',
		twilight: 'twilight',
		night: 'night',
		forest: 'forest',
		auto: 'auto · by time'
	};

	// Get theme based on time of day (no interpolation, just switches)
	function getTimeBasedTheme(): BaseThemeName {
		const hours = new Date().getHours();

		// dawn: 6am-12pm, forest: 12pm-6pm, twilight: 6pm-10pm, night: 10pm-6am
		if (hours >= 6 && hours < 12) return 'dawn';
		if (hours >= 12 && hours < 18) return 'forest';
		if (hours >= 18 && hours < 22) return 'twilight';
		return 'night';
	}

	function getSystemPreference(): ThemeName {
		if (browser && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'twilight';
		}
		return 'dawn';
	}

	function getSavedTheme(): ThemeName | null {
		if (browser) {
			const saved = localStorage.getItem('theme');
			if (saved === 'dawn' || saved === 'night' || saved === 'twilight' || saved === 'forest' || saved === 'auto') return saved;
		}
		return null;
	}

	let theme = $state<ThemeName>(getSavedTheme() ?? getSystemPreference());
	let autoThemeName = $state<BaseThemeName>(getTimeBasedTheme());

	function cycleTheme() {
		const currentIndex = themeOrder.indexOf(theme);
		const nextIndex = (currentIndex + 1) % themeOrder.length;
		theme = themeOrder[nextIndex];
		if (browser) {
			localStorage.setItem('theme', theme);
		}
	}

	// Update auto theme every minute
	$effect(() => {
		if (theme !== 'auto') return;

		autoThemeName = getTimeBasedTheme();

		const interval = setInterval(() => {
			autoThemeName = getTimeBasedTheme();
		}, 60000);
		return () => clearInterval(interval);
	});

	let activeTheme = $derived<BaseThemeName>(theme === 'auto' ? autoThemeName : theme);
	let currentColors = $derived(themes[activeTheme]);


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
	<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=IM+Fell+DW+Pica:ital@0;1&family=Manrope:wght@200..800&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&family=Texturina:ital,opsz,wght@0,12..72,100..900;1,12..72,100..900&display=swap" rel="stylesheet" />
</svelte:head>

<div
	class="bg-noise"
	aria-hidden="true"
	style="--bg: {currentColors.bg}; --noise: {currentColors.noise};"
></div>

<div
	class="app"
	data-theme={activeTheme}
	style="--bg: {currentColors.bg}; --text: {currentColors.text}; --accent: {currentColors.accent}; --heading: {currentColors.heading}; --noise: {currentColors.noise};"
>
	<FloatingLlama />

	{#if showNav && data.navPages}
		<NavOverlay pages={data.navPages} connections={data.navConnections} />
	{/if}

	<div class="theme-toggle-wrap">
		<span class="theme-tooltip">{themeDescriptions[theme]}</span>
		<button class="theme-toggle" onclick={cycleTheme} aria-label="Cycle theme">
			{#if theme === 'dawn'}
				<!-- Sunrise -->
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 14a6 6 0 0 0-12 0"/>
					<line x1="2" y1="14" x2="22" y2="14"/>
					<circle cx="12" cy="2" r="1" fill="currentColor" stroke="none"/>
					<circle cx="5" cy="5" r="1" fill="currentColor" stroke="none"/>
					<circle cx="19" cy="5" r="1" fill="currentColor" stroke="none"/>
					<circle cx="2" cy="10" r="1" fill="currentColor" stroke="none"/>
					<circle cx="22" cy="10" r="1" fill="currentColor" stroke="none"/>
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
			{:else if theme === 'forest'}
				<!-- Forest tree -->
				<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 2 L6 10 L9 10 L5 16 L10.5 16 L10.5 20 L13.5 20 L13.5 16 L19 16 L15 10 L18 10 Z"/>
				</svg>
			{:else}
				<!-- Auto: sun/moon cycle -->
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none"/>
					<circle cx="12" cy="12" r="9"/>
					<circle cx="12" cy="12" r="4"/>
				</svg>
			{/if}
		</button>
	</div>
	{@render children()}
</div>

<style>
	:global(html) {
		font-size: 14px;
	}

	:global(html, body) {
		margin: 0;
		padding: 0;
		/* Hide scrollbar for all browsers */
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE and Edge */
	}

	:global(html::-webkit-scrollbar),
	:global(body::-webkit-scrollbar) {
		display: none; /* Chrome, Safari, Opera */
	}

	.app {
		--font-body: 'Sligoil Micro Medium', 'Diamond Grotesk', sans-serif;
		--font-title: 'Texturina', 'IM Fell DW Pica', 'Resistance', serif;
		--font-serif: var(--font-body);
		--font-sans: var(--font-body);
		--font-grotesk: var(--font-body);
		--font-display: var(--font-title);
		--font-mono: 'Source Code Pro', monospace;
		font-family: var(--font-body);
		min-height: 100vh;
		padding: 1rem;
		background: transparent;
		color: var(--text);
		transition: color 0.3s;
	}

	.bg-noise {
		position: fixed;
		inset: 0;
		pointer-events: none;
		background-color: var(--bg);
		background-image:
			linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 55%),
			url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.26' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
		background-size: 100% 100%, 360px 360px;
		background-repeat: no-repeat, repeat;
		background-blend-mode: screen, overlay;
	}

	.bg-noise::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		filter: contrast(170%) brightness(1000%);
		background:
			url("data:image/svg+xml,%3Csvg viewBox='0 0 320 320' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
		background-size: 360px 360px;
		background-repeat: repeat;
		opacity: 0.18;
	}

	.app {
		position: relative;
		z-index: 1;
	}

	@media (min-width: 640px) {
		:global(html) {
			font-size: 17px;
		}

		.app {
			padding: 2rem;
		}
	}

	.theme-toggle-wrap {
		position: fixed;
		top: 1rem;
		right: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.theme-tooltip {
		font-size: 0.7rem;
		opacity: 0;
		transition: opacity 0.2s;
		white-space: nowrap;
		pointer-events: none;
	}

	.theme-toggle-wrap:hover .theme-tooltip {
		opacity: 0.5;
	}

	.theme-toggle {
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
