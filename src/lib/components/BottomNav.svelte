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

<nav class="nav-header">
	<a href={paths[prev]} class="opacity-80 hover:opacity-100">← {prev}</a>
	<span class="opacity-50">•</span>
	<a href="/join" class="tracking-wide text-[var(--accent)] opacity-[0.85] hover:opacity-100">
		join us
	</a>
	<span class="opacity-50">•</span>
	<a href={paths[next]} class="opacity-80 hover:opacity-100">{next} →</a>
</nav>

<style>
	.nav-header {
		position: fixed;
		top: 1rem;
		left: 1rem;
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		font-size: 0.875rem;
		z-index: 10;
	}

	@media (min-width: 640px) {
		.nav-header {
			gap: 1.5rem;
		}
	}
</style>
