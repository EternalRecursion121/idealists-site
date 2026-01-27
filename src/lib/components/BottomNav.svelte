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

<nav class="nav-footer">
	<a href={paths[prev]} class="opacity-80 hover:opacity-100">← {prev}</a>
	<span class="opacity-50">•</span>
	<a href="/join" class="tracking-wide text-[var(--accent)] opacity-[0.85] hover:opacity-100">
		join us
	</a>
	<span class="opacity-50">•</span>
	<a href={paths[next]} class="opacity-80 hover:opacity-100">{next} →</a>
</nav>

<style>
	.nav-footer {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
		font-size: 0.875rem;
		margin-top: auto;
		padding-top: 4rem;
		padding-bottom: 2rem;
	}

	@media (min-width: 640px) {
		.nav-footer {
			gap: 1.5rem;
		}
	}
</style>
