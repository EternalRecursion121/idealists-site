<script lang="ts">
	import { page } from '$app/state';

	let notFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{page.status} — The Idealists Collective</title>
</svelte:head>

<div class="error-page">
	<p class="status">{page.status}</p>
	<h1>
		{#if notFound}
			this page hasn't been imagined yet
		{:else}
			something came loose
		{/if}
	</h1>
	{#if page.error?.message && page.error.message !== 'Not Found'}
		<p class="message">{page.error.message.toLowerCase()}</p>
	{/if}
	<nav class="ways-out" aria-label="ways out">
		<a href="/">&lt;&lt;&lt; home</a>
		<a href="/writings">writings</a>
		<a href="/sitemap">index</a>
	</nav>
</div>

<style>
	.error-page {
		/* the root layout's .app adds 1rem of padding top and bottom */
		min-height: calc(100vh - 2rem);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 4rem 1.5rem;
		text-align: center;
	}

	.status {
		font-size: 0.75rem;
		letter-spacing: 0.3em;
		color: var(--accent);
	}

	h1 {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 600;
		max-width: 22rem;
		text-wrap: balance;
	}

	.message {
		font-size: 0.875rem;
		opacity: 0.7;
	}

	.ways-out {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem 1.75rem;
		margin-top: 1.5rem;
		font-size: 0.875rem;
	}

	.ways-out a {
		padding: 0.5rem 0.25rem;
		text-decoration: none;
		opacity: 0.8;
	}

	.ways-out a:hover {
		opacity: 1;
	}

	@media (min-width: 640px) {
		.error-page {
			min-height: calc(100vh - 4rem); /* .app padding is 2rem here */
		}

		h1 {
			font-size: 1.875rem;
			max-width: 28rem;
		}
	}
</style>
