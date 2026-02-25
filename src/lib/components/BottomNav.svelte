<script lang="ts">
	type Page = 'home' | 'writings' | 'projects' | 'glossary' | 'library' | 'members' | 'vibes';

	const pages: { name: Page; path: string }[] = [
		{ name: 'home', path: '/' },
		{ name: 'writings', path: '/writings' },
		{ name: 'projects', path: '/projects' },
		{ name: 'glossary', path: '/glossary' },
		{ name: 'library', path: '/library' },
		{ name: 'members', path: '/members' },
		{ name: 'vibes', path: '/vibes' }
	];

	interface Props {
		current: Page;
	}

	let { current }: Props = $props();
</script>

<footer class="site-footer">
	<nav class="footer-nav" aria-label="Site navigation">
		{#each pages as pg (pg.name)}
			{#if pg.name === current}
				<span class="nav-link current">{pg.name}</span>
			{:else}
				<a href={pg.path} class="nav-link">{pg.name}</a>
			{/if}
		{/each}
	</nav>
	<div class="footer-secondary">
		<a href="/join" class="join-link">join us</a>
		<span class="dot">·</span>
		<a href="/sitemap" class="index-link">index</a>
	</div>
</footer>

<style>
	.site-footer {
		margin-top: auto;
		padding-top: 5rem;
		padding-bottom: 2rem;
	}

	.footer-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.25rem;
		justify-content: center;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
	}

	.nav-link {
		font-family: var(--font-sans);
		font-size: 0.8rem;
		letter-spacing: 0.02em;
		text-decoration: none;
		color: var(--text);
		opacity: 0.55;
		transition: opacity 0.15s ease, color 0.15s ease;
		padding: 0.25rem 0;
	}

	.nav-link:hover {
		opacity: 1;
		color: var(--accent);
	}

	.nav-link.current {
		opacity: 0.9;
		font-weight: 600;
	}

	.footer-secondary {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.6rem;
		padding-top: 0.75rem;
		font-size: 0.75rem;
	}

	.join-link {
		color: var(--accent);
		text-decoration: none;
		opacity: 0.8;
		transition: opacity 0.15s ease;
	}

	.join-link:hover {
		opacity: 1;
		color: var(--accent);
	}

	.dot {
		opacity: 0.3;
	}

	.index-link {
		text-decoration: none;
		color: var(--text);
		opacity: 0.5;
		transition: opacity 0.15s ease;
	}

	.index-link:hover {
		opacity: 1;
		color: var(--accent);
	}
</style>
