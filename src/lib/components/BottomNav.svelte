<script lang="ts">
	type Page = 'home' | 'writings' | 'vibes' | 'library' | 'projects' | 'members';

	const ring: Page[] = ['projects', 'writings', 'home', 'library', 'members', 'vibes'];
	const paths: Record<Page, string> = {
		home: '/',
		writings: '/writings',
		vibes: '/vibes',
		library: '/library',
		projects: '/projects',
		members: '/members'
	};

	interface Props {
		current: Page;
	}

	let { current }: Props = $props();

	const idx = ring.indexOf(current);
	const prev = ring[(idx - 1 + ring.length) % ring.length];
	const next = ring[(idx + 1) % ring.length];
</script>

<footer class="site-footer">
	<div class="footer-grid">
		<span class="line-h"></span>
		<a href={paths[prev]} class="nav-prev opacity-70 hover:opacity-100">← {prev}</a>
		<div class="nav-center">
			<a href="/join" class="text-[var(--accent)] opacity-85 hover:opacity-100">join us</a>
			<span class="divider"></span>
			<a href="/sitemap" class="opacity-70 hover:opacity-100">index</a>
		</div>
		<a href={paths[next]} class="nav-next opacity-70 hover:opacity-100">{next} →</a>
		<span class="line-h"></span>
	</div>
</footer>

<style>
	.site-footer {
		margin-top: auto;
		padding-top: 6rem;
		padding-bottom: 2rem;
		font-size: 0.875rem;
	}

	.footer-grid {
		display: grid;
		grid-template-columns: 3rem auto auto auto 3rem;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin: 0 auto;
	}

	.line-h {
		height: 1px;
		width: 100%;
		background: var(--text);
		opacity: 0.2;
	}

	.nav-prev {
		text-align: right;
	}

	.nav-next {
		text-align: left;
	}

	.nav-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.divider {
		width: 1px;
		height: 0.75rem;
		background: var(--text);
		opacity: 0.25;
	}


	@media (min-width: 640px) {
		.footer-grid {
			grid-template-columns: 4rem auto auto auto 4rem;
			gap: 1.5rem;
		}
	}
</style>
