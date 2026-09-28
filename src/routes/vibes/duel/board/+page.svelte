<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const PREVIEW = 25;
	let showAll = $state(false);
	let order: 'most' | 'least' = $state('most');

	/**
	 * Place = 1 + how many vibes are clearly ahead, i.e. whose whole 95% interval
	 * (rating ± 2·rd) lies above this one's. Overlapping intervals share a place.
	 * "least" keeps the same places and just reads the list from the bottom.
	 */
	const ranked = $derived.by(() => {
		if (!data.enabled) return [];
		const withInterval = data.board.map((v) => ({ ...v, lo: v.rating - 2 * v.rd, hi: v.rating + 2 * v.rd }));
		const placed = withInterval.map((v) => ({
			...v,
			place: 1 + withInterval.filter((other) => other.lo > v.hi).length
		}));
		placed.sort((a, b) => a.place - b.place || b.rating - a.rating);
		if (order === 'least') placed.reverse();

		const perPlace = new Map<number, number>();
		for (const v of placed) perPlace.set(v.place, (perPlace.get(v.place) ?? 0) + 1);
		return placed.map((v) => ({ ...v, joint: (perPlace.get(v.place) ?? 0) > 1 }));
	});
	const shown = $derived(showAll ? ranked : ranked.slice(0, PREVIEW));
</script>

<svelte:head>
	<title>The Board — Vibe vs Vibe — The Idealists Collective</title>
</svelte:head>

<div class="board-page">
	<nav class="top">
		<a href="/vibes/duel">← back to the duel</a>
	</nav>

	<h1>the board</h1>

	{#if !data.enabled}
		<p class="meta">the board is resting — no database is connected here.</p>
	{:else}
		<p class="meta">
			which is most ideal, according to {data.totalVotes}
			{data.totalVotes === 1 ? 'vote' : 'votes'}. Each rating comes with a 95% range; vibes whose ranges
			overlap share a place (=), because we can’t yet tell them apart. Faded vibes haven’t played enough
			to be sure.
		</p>

		<button
			type="button"
			class="order"
			aria-label="sorted by {order} ideal; switch to {order === 'most' ? 'least' : 'most'} ideal"
			onclick={() => (order = order === 'most' ? 'least' : 'most')}
		>
			sort by <em>{'{'}{order}{'}'}</em> ideal
		</button>

		{#if data.board.length === 0}
			<p class="meta">no votes yet — <a href="/vibes/duel">cast the first one</a>.</p>
		{:else}
			<ol>
				{#each shown as vibe (vibe.src)}
					<li class:provisional={vibe.provisional}>
						<span class="rank">{vibe.joint ? '=' : ''}{vibe.place}</span>
						<img src={vibe.src} alt="" loading="lazy" />
						<span class="score">{vibe.rating} <small>± {2 * vibe.rd}</small></span>
						<span class="games">{vibe.games} {vibe.games === 1 ? 'match' : 'matches'}</span>
					</li>
				{/each}
			</ol>
			{#if data.board.length > PREVIEW}
				<button type="button" class="more" onclick={() => (showAll = !showAll)}>
					{showAll ? `show first ${PREVIEW}` : `show all ${data.board.length}`}
				</button>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.board-page {
		width: 100%;
		max-width: 640px;
		min-height: 100vh;
		margin: 0 auto;
		padding: 3rem 1rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.top {
		font-size: 0.875rem;
	}

	.top a {
		opacity: 0.6;
	}

	.top a:hover {
		opacity: 1;
	}

	h1 {
		font-family: var(--font-title);
		font-size: clamp(1.75rem, 5vw, 2.75rem);
		color: var(--heading);
	}

	.meta {
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.order {
		align-self: flex-start;
		padding: 0.25rem 0.75rem;
		font-size: 0.8rem;
		border: 1px solid color-mix(in srgb, var(--text) 20%, transparent);
		border-radius: 999px;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.order:hover {
		border-color: var(--accent);
	}

	.order em {
		font-style: normal;
		color: var(--accent);
	}

	.meta a {
		text-decoration: underline;
	}

	ol {
		list-style: none;
		padding: 0;
		margin-top: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	li {
		display: grid;
		grid-template-columns: 2.5rem 4rem 1fr auto;
		align-items: center;
		gap: 0.75rem;
	}

	li.provisional {
		opacity: 0.55;
	}

	li img {
		width: 4rem;
		height: 4rem;
		object-fit: cover;
		border-radius: 0.25rem;
	}

	.rank {
		font-family: var(--font-title);
		text-align: right;
		opacity: 0.7;
	}

	.score small,
	.games {
		font-size: 0.75rem;
		opacity: 0.6;
	}

	.more {
		align-self: flex-start;
		font-size: 0.8rem;
		opacity: 0.7;
		text-decoration: underline;
		cursor: pointer;
	}

	.more:hover {
		opacity: 1;
	}
</style>
