<script lang="ts">
	import { page } from '$app/state';
	import { ring, ringPathFor, pageName } from '$lib/nav';

	// which ring page we're on: its own, its parent (/unconference -> /projects), or home
	let current = $derived(ringPathFor(page.url.pathname));
	let idx = $derived(ring.indexOf(current));
	let prev = $derived(ring[(idx - 1 + ring.length) % ring.length]);
	let next = $derived(ring[(idx + 1) % ring.length]);

	// /join sits off the ring; there, "join us" would just link to itself
	let onJoin = $derived(page.url.pathname === '/join');
</script>

<footer class="site-footer">
	<div class="footer-grid">
		<span class="line-h"></span>
		<a href={prev} class="nav-prev opacity-70 hover:opacity-100">← {pageName(prev)}</a>
		<div class="nav-center">
			{#if onJoin}
				<a href="/" class="text-[var(--accent)] opacity-85 hover:opacity-100">home</a>
			{:else}
				<a href="/join" class="text-[var(--accent)] opacity-85 hover:opacity-100">join us</a>
			{/if}
			<span class="divider"></span>
			<a href="/sitemap" class="opacity-70 hover:opacity-100">index</a>
		</div>
		<a href={next} class="nav-next opacity-70 hover:opacity-100">{pageName(next)} →</a>
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

	/* text-height links were 18px tap targets; padding enlarges them without
	   moving anything (negative margins hand the space back) */
	.footer-grid a {
		padding: 0.6rem 0.4rem;
		margin: -0.6rem -0.4rem;
	}

	/* the stacked centre links are close together: smaller pads so they don't overlap */
	.nav-center a {
		padding: 0.35rem 0.3rem;
		margin: -0.35rem -0.3rem;
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

	/* On the narrowest phones the two decorative rules + gaps take 112px, and
	   the labels wrap into each other. Drop the rules and keep labels on a line. */
	@media (max-width: 400px) {
		.footer-grid {
			grid-template-columns: auto auto auto;
			gap: 0.75rem;
		}

		.line-h {
			display: none;
		}

		.nav-prev,
		.nav-center,
		.nav-next {
			white-space: nowrap;
		}
	}

	@media (min-width: 640px) {
		.footer-grid {
			grid-template-columns: 4rem auto auto auto 4rem;
			gap: 1.5rem;
		}
	}
</style>
