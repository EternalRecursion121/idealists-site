<script lang="ts">
	import './layout.css';
	import FloatingLlama from '$lib/components/FloatingLlama.svelte';
	import NavOverlay from '$lib/components/NavOverlay.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount, tick } from 'svelte';
	import { slide } from 'svelte/transition';
	import {
		preferences,
		persistPreferences,
		discovery,
		unlockSettings,
		FONT_CHOICES,
		QUOTE_CHOICES,
		LLAMA_CHOICES,
		SIZE_CHOICES,
		MEASURE_CHOICES,
		GRAIN_CHOICES,
		CASING_CHOICES
	} from '$lib/preferences.svelte';

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

	function getSavedTheme(): ThemeName | null {
		if (browser) {
			const saved = localStorage.getItem('theme');
			if (saved === 'dawn' || saved === 'night' || saved === 'twilight' || saved === 'forest' || saved === 'auto') return saved;
		}
		return null;
	}

	let theme = $state<ThemeName>(getSavedTheme() ?? 'auto');
	let autoThemeName = $state<BaseThemeName>(getTimeBasedTheme());

	// Cycle the theme toggle through a full revolution and a settings icon appears
	let themeClicks = 0;
	let settingsOpen = $state(false);
	// Closing the panel nudges the world one theme forward — unless you already
	// picked a theme from inside it this visit (you got what you came for).
	let themePickedThisVisit = false;

	function cycleTheme() {
		const currentIndex = themeOrder.indexOf(theme);
		const nextIndex = (currentIndex + 1) % themeOrder.length;
		theme = themeOrder[nextIndex];
		if (browser) {
			localStorage.setItem('theme', theme);
		}
		themeClicks += 1;
		if (themeClicks >= themeOrder.length && !discovery.unlocked) {
			unlockSettings();
			// The discovery moment: complete the revolution and the last icon reveals itself
			openSettings();
		}
	}

	function handleToggleClick() {
		if (settingsOpen) {
			closeSettings();
			return;
		}
		// Once discovered, the gear is the cycle's hidden last stop, after 'auto'
		if (discovery.unlocked && theme === themeOrder[themeOrder.length - 1]) {
			openSettings();
			return;
		}
		cycleTheme();
	}

	function pickTheme(next: ThemeName) {
		theme = next;
		themePickedThisVisit = true;
		if (browser) {
			localStorage.setItem('theme', theme);
		}
	}

	function openSettings() {
		settingsOpen = true;
		themePickedThisVisit = false;
	}

	function closeSettings() {
		if (!settingsOpen) return;
		settingsOpen = false;
		if (!themePickedThisVisit) cycleTheme();
	}

	function choose<K extends keyof typeof preferences>(key: K, value: (typeof preferences)[K]) {
		preferences[key] = value;
		persistPreferences();
		// Font, size, and grain changes are visible wherever you stand; quotes and
		// measure may not be — hop somewhere they're instantly seen (panel stays open).
		if (key === 'quote') showQuoteEffect();
		if (key === 'measure') showMeasureEffect();
		// Choosing 'roams' summons the llama — 'many' summons the whole herd —
		// rather than leaving it to chance
		// (tick first: switching from 'rests' must remount the components' listeners)
		if (key === 'llama' && value !== 'rests') {
			tick().then(() => window.dispatchEvent(new CustomEvent('summon-llama')));
		}
	}

	async function showQuoteEffect() {
		if (!document.querySelector('.writing-content blockquote')) {
			// 'taste' has multiple quotes — and where else would you audition aesthetics?
			await goto(resolve('/(standard)/writings/[slug]', { slug: 'taste' }));
		}
		document
			.querySelector('.writing-content blockquote')
			?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	async function showMeasureEffect() {
		if (!document.querySelector('.max-w-3xl')) {
			await goto(resolve('/(standard)/writings/[slug]', { slug: 'taste' }));
		}
	}

	// Text size lives on <html> so rem-based sizing scales everywhere
	$effect(() => {
		if (browser) {
			document.documentElement.dataset.textSize = preferences.size;
		}
	});

	function handleWindowClick(e: MouseEvent) {
		if (!settingsOpen) return;
		const target = e.target as Element | null;
		if (!target?.closest('.settings-panel') && !target?.closest('.theme-toggle-wrap')) {
			closeSettings();
		}
	}

	function handleWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeSettings();
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
			document.documentElement.style.backgroundColor = currentColors.bg;
			document.body.style.backgroundColor = currentColors.bg;
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
	data-theme={activeTheme}
	data-grain={preferences.grain}
	style="--bg: {currentColors.bg}; --noise: {currentColors.noise};"
>
	<div class="bg-noise-turbulence"></div>
	<div class="bg-noise-tint"></div>
	<div class="bg-noise-grain"></div>
</div>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div
	class="app"
	data-theme={activeTheme}
	data-font={preferences.font}
	data-quote={preferences.quote}
	data-measure={preferences.measure}
	data-casing={preferences.casing}
	style="--bg: {currentColors.bg}; --text: {currentColors.text}; --accent: {currentColors.accent}; --heading: {currentColors.heading}; --noise: {currentColors.noise};"
>
	{#if preferences.llama === 'roams'}
		<FloatingLlama />
	{:else if preferences.llama === 'many'}
		<!-- A herd: each wanders on its own schedule; a summon becomes a stampede -->
		{#each { length: 5 } as _, i (i)}
			<FloatingLlama />
		{/each}
	{/if}

	{#if showNav && data.navPages}
		<NavOverlay pages={data.navPages} connections={data.navConnections} />
	{/if}

	<div class="theme-toggle-wrap">
		<span class="theme-tooltip">
			{settingsOpen
				? 'customise'
				: discovery.unlocked && theme === themeOrder[themeOrder.length - 1]
					? `${themeDescriptions[theme]} · customise next`
					: themeDescriptions[theme]}
		</span>
		<button
			class="theme-toggle"
			onclick={handleToggleClick}
			aria-label={settingsOpen ? 'Close customisation' : 'Cycle theme'}
			aria-expanded={discovery.unlocked ? settingsOpen : undefined}
		>
			{#if settingsOpen}
				<!-- Gear: the cycle's hidden last stop, a small sun of spokes kin to dawn's -->
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="3.5"/>
					<line x1="12" y1="2.5" x2="12" y2="5.5"/>
					<line x1="12" y1="18.5" x2="12" y2="21.5"/>
					<line x1="2.5" y1="12" x2="5.5" y2="12"/>
					<line x1="18.5" y1="12" x2="21.5" y2="12"/>
					<line x1="5.3" y1="5.3" x2="7.4" y2="7.4"/>
					<line x1="16.6" y1="16.6" x2="18.7" y2="18.7"/>
					<line x1="5.3" y1="18.7" x2="7.4" y2="16.6"/>
					<line x1="16.6" y1="7.4" x2="18.7" y2="5.3"/>
				</svg>
			{:else if theme === 'dawn'}
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

	{#if settingsOpen}
		<div class="settings-panel" transition:slide={{ duration: 200 }}>
			<div class="settings-row">
				<span class="settings-label">theme</span>
				<div class="settings-options">
					{#each themeOrder as t (t)}
						<button
							class="settings-option"
							class:active={theme === t}
							onclick={() => pickTheme(t)}
						>{t}</button>
					{/each}
				</div>
			</div>
			<div class="settings-row">
				<span class="settings-label">voice</span>
				<div class="settings-options">
					{#each FONT_CHOICES as font (font)}
						<button
							class="settings-option settings-font-{font}"
							class:active={preferences.font === font}
							onclick={() => choose('font', font)}
						>{font}</button>
					{/each}
				</div>
			</div>
			<div class="settings-row">
				<span class="settings-label">size</span>
				<div class="settings-options">
					{#each SIZE_CHOICES as size (size)}
						<button
							class="settings-option"
							class:active={preferences.size === size}
							onclick={() => choose('size', size)}
						>{size}</button>
					{/each}
				</div>
			</div>
			<div class="settings-row">
				<span class="settings-label">measure</span>
				<div class="settings-options">
					{#each MEASURE_CHOICES as measure (measure)}
						<button
							class="settings-option"
							class:active={preferences.measure === measure}
							onclick={() => choose('measure', measure)}
						>{measure}</button>
					{/each}
				</div>
			</div>
			<div class="settings-row">
				<span class="settings-label">quotes</span>
				<div class="settings-options">
					{#each QUOTE_CHOICES as quote (quote)}
						<button
							class="settings-option"
							class:active={preferences.quote === quote}
							onclick={() => choose('quote', quote)}
						>{quote}</button>
					{/each}
				</div>
			</div>
			<div class="settings-row">
				<span class="settings-label">grain</span>
				<div class="settings-options">
					{#each GRAIN_CHOICES as grain (grain)}
						<button
							class="settings-option"
							class:active={preferences.grain === grain}
							onclick={() => choose('grain', grain)}
						>{grain}</button>
					{/each}
				</div>
			</div>
			<div class="settings-row">
				<span class="settings-label">case</span>
				<div class="settings-options">
					{#each CASING_CHOICES as casing (casing)}
						<button
							class="settings-option settings-casing-{casing}"
							class:active={preferences.casing === casing}
							onclick={() => choose('casing', casing)}
						>{casing}</button>
					{/each}
				</div>
			</div>
			<div class="settings-row">
				<span class="settings-label">llama</span>
				<div class="settings-options">
					{#each LLAMA_CHOICES as llama (llama)}
						<button
							class="settings-option"
							class:active={preferences.llama === llama}
							onclick={() => choose('llama', llama)}
						>{llama}</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{@render children()}
</div>

<style>
	:global(html) {
		font-size: 14px;
	}

	/* Text size preference (regular falls through to the base sizes) */
	:global(html[data-text-size='small']) {
		font-size: 13px;
	}

	:global(html[data-text-size='large']) {
		font-size: 15.5px;
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

	/* Voice (body font) preferences — all faces already loaded for the site */
	.app[data-font='garamond'] {
		--font-body: 'EB Garamond', 'Iowan Old Style', Georgia, serif;
	}

	.app[data-font='manrope'] {
		--font-body: 'Manrope', system-ui, sans-serif;
	}

	.app[data-font='mono'] {
		--font-body: 'Source Code Pro', monospace;
	}

	.bg-noise {
		position: fixed;
		inset: 0;
		pointer-events: none;
		background-color: var(--bg);
		isolation: isolate;
	}

	.bg-noise-tint,
	.bg-noise-turbulence,
	.bg-noise-grain {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	/* Dawn (light theme) renders zero noise: the additive stack is invisible on
	   a near-white background anyway, so we remove the layers entirely rather
	   than risk any browser mis-compositing them. Guarantees one always-clean
	   theme. Its solid `background-color` (var(--bg)) is all that remains. */
	.bg-noise[data-theme='dawn'] .bg-noise-turbulence,
	.bg-noise[data-theme='dawn'] .bg-noise-tint,
	.bg-noise[data-theme='dawn'] .bg-noise-grain {
		display: none;
	}

	/* Grain preference: 'clean' removes the noise stack on every theme,
	   the same way dawn always does */
	.bg-noise[data-grain='clean'] .bg-noise-turbulence,
	.bg-noise[data-grain='clean'] .bg-noise-tint,
	.bg-noise[data-grain='clean'] .bg-noise-grain {
		display: none;
	}

	.bg-noise-tint {
		background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 55%);
		mix-blend-mode: screen;
	}

	.bg-noise-turbulence {
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.26' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
		background-size: 360px 360px;
		background-repeat: repeat;
		mix-blend-mode: overlay;
	}

	/* Film grain. The amplification that turns the muddy `feTurbulence` cloud
	   into sparse near-white speckle is baked into the SVG as a single linear
	   transfer (feComponentTransfer, out = 17·in − 3.5) instead of a CSS
	   `filter: contrast(170%) brightness(1000%)`. The two are mathematically
	   identical, but the SVG form rasterises reliably in WebKit, whereas the
	   extreme CSS `brightness()` posterised into blocky splotches on iOS
	   Safari's dark themes. */
	.bg-noise-grain {
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 320 320' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='linear' slope='17' intercept='-3.5'/%3E%3CfeFuncG type='linear' slope='17' intercept='-3.5'/%3E%3CfeFuncB type='linear' slope='17' intercept='-3.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
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

		:global(html[data-text-size='small']) {
			font-size: 16px;
		}

		:global(html[data-text-size='large']) {
			font-size: 19px;
		}

		.app {
			padding: 2rem;
		}
	}

	/* Reading measure — retunes the standard content column (48rem by default) */
	.app[data-measure='snug'] :global(.max-w-3xl) {
		max-width: 40rem;
	}

	.app[data-measure='roomy'] :global(.max-w-3xl) {
		max-width: 58rem;
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

	/* Casing preference — the whole site whispers or shouts together.
	   !important on purpose: several components set their own text-transform,
	   and this mode overrules them all by design. */
	.app[data-casing='lower'] :global(*) {
		text-transform: lowercase !important;
	}

	.app[data-casing='loud'] :global(*) {
		text-transform: uppercase !important;
	}

	/* The case options keep previewing themselves so you can find your way back */
	.app :global(.settings-casing-mixed) {
		text-transform: none !important;
	}

	.app :global(.settings-casing-lower) {
		text-transform: lowercase !important;
	}

	.app :global(.settings-casing-loud) {
		text-transform: uppercase !important;
	}

	.settings-panel {
		position: fixed;
		top: 3.25rem;
		right: 1rem;
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 0.9rem 1rem;
		background: var(--bg);
		border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
		border-radius: 6px;
		font-size: 0.75rem;
	}

	.settings-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1.25rem;
	}

	.settings-label {
		opacity: 0.5;
	}

	.settings-options {
		display: flex;
		gap: 0.25rem;
	}

	.settings-option {
		background: transparent;
		border: none;
		color: var(--text);
		font-family: inherit;
		font-size: inherit;
		cursor: pointer;
		opacity: 0.45;
		padding: 0.15rem 0.35rem;
		transition: opacity 0.2s, color 0.2s;
	}

	.settings-option:hover {
		opacity: 1;
	}

	.settings-option.active {
		opacity: 1;
		color: var(--accent);
	}

	/* Each voice option previews its own face */
	.settings-font-garamond {
		font-family: 'EB Garamond', Georgia, serif;
	}

	.settings-font-manrope {
		font-family: 'Manrope', system-ui, sans-serif;
	}

	.settings-font-mono {
		font-family: 'Source Code Pro', monospace;
	}

	/* Each case option previews itself */
	.settings-casing-lower {
		text-transform: lowercase;
	}

	.settings-casing-loud {
		text-transform: uppercase;
	}

	:global(a) {
		color: inherit;
	}

	:global(a:hover) {
		color: var(--accent);
	}
</style>
