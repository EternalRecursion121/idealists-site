<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let pending = $state(false);
	let arena: HTMLFormElement | null = $state(null);

	const submit: SubmitFunction = () => {
		pending = true;
		return async ({ result, update }) => {
			await update();
			// A stale or rejected matchup still deserves a fresh one.
			if (result.type === 'failure') await invalidateAll();
			pending = false;
		};
	};

	function onkeydown(event: KeyboardEvent) {
		if (pending || event.metaKey || event.ctrlKey || event.altKey) return;
		const choice = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'skip', s: 'skip' }[event.key];
		if (!choice) return;
		event.preventDefault();
		arena?.querySelector<HTMLButtonElement>(`[data-choice="${choice}"]`)?.click();
	}
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<title>Vibe vs Vibe — The Idealists Collective</title>
</svelte:head>

<div class="duel-page">
	<a href="/vibes" class="back">← all vibes</a>

	{#if !data.enabled}
		<p class="resting">the duel is resting — no database is connected here.</p>
	{:else}
		<h1>{data.matchup.prompt}</h1>

		<form bind:this={arena} method="POST" action="?/vote" use:enhance={submit} class="arena" class:pending>
			<input type="hidden" name="match" value={data.matchup.id} />
			{#each [data.matchup.a, data.matchup.b] as side, i (side.name)}
				<button
					data-choice={i === 0 ? 'left' : 'right'}
					type="submit"
					name="winner"
					value={side.name}
					disabled={pending}
					aria-label="choose the {i === 0 ? 'left' : 'right'} vibe"
				>
					<img src={side.src} alt="" width={side.width} height={side.height} />
				</button>
				{#if i === 0}<span class="vs" aria-hidden="true">vs</span>{/if}
			{/each}
			<button
				data-choice="skip"
				type="submit"
				formaction="?/skip"
				class="skip"
				disabled={pending}
			>
				can’t choose — skip
			</button>
		</form>

		<p class="hint">tap one, or use ← → (↓ to skip)</p>

		<p class="result" aria-live="polite">
			{#if form && 'message' in form}
				{form.message}
			{:else if form && 'winner' in form}
				{form.upset ? 'an upset!' : 'noted.'}
				<img src={form.winner} alt="" class="chip" /> +{form.winnerDelta}
				<img src={form.loser} alt="" class="chip" /> {form.loserDelta}
			{/if}
		</p>

		{#if data.leaderboard.length > 0}
			<section class="board">
				<h2>the board</h2>
				<p class="meta">
					{data.totalVotes} votes so far · ranked by a cautious estimate (rating − 2 × uncertainty), so a
					lucky first win doesn’t top the board
				</p>
				<ol>
					{#each data.leaderboard as vibe, rank (vibe.src)}
						<li class:provisional={vibe.provisional}>
							<span class="rank">{rank + 1}</span>
							<img src={vibe.src} alt="" loading="lazy" />
							<span class="score">{vibe.rating} <small>± {vibe.rd}</small></span>
							<span class="games">{vibe.games} {vibe.games === 1 ? 'match' : 'matches'}</span>
						</li>
					{/each}
				</ol>
			</section>
		{/if}
	{/if}
</div>

<style>
	.duel-page {
		width: 100%;
		max-width: 1100px;
		min-height: 100vh;
		margin: 0 auto;
		padding: 3rem 1rem 4rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.back {
		align-self: flex-start;
		font-size: 0.875rem;
		opacity: 0.6;
	}

	.back:hover {
		opacity: 1;
	}

	h1 {
		font-family: var(--font-title);
		font-size: clamp(1.5rem, 4vw, 2.5rem);
		color: var(--heading);
		text-align: center;
	}

	.arena {
		display: grid;
		grid-template-columns: 1fr;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		transition: opacity 0.2s;
	}

	.arena.pending {
		opacity: 0.5;
	}

	.arena button {
		display: flex;
		align-items: center;
		justify-content: center;
		height: min(42vh, 480px);
		padding: 0.5rem;
		border: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
		border-radius: 0.5rem;
		background: color-mix(in srgb, var(--text) 3%, transparent);
		cursor: pointer;
		transition:
			transform 0.2s,
			border-color 0.2s;
	}

	.arena button:hover:not(:disabled),
	.arena button:focus-visible {
		transform: scale(1.02) rotate(-0.5deg);
		border-color: var(--accent);
	}

	.arena button:disabled {
		cursor: wait;
	}

	.arena img {
		max-width: 100%;
		max-height: 100%;
		width: auto;
		height: auto;
		object-fit: contain;
	}

	.arena .skip {
		grid-column: 1 / -1;
		justify-self: center;
		height: auto;
		padding: 0.35rem 0.9rem;
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.arena .skip:hover:not(:disabled),
	.arena .skip:focus-visible {
		transform: none;
		opacity: 1;
	}

	.vs {
		text-align: center;
		font-family: var(--font-title);
		font-style: italic;
		opacity: 0.5;
	}

	@media (min-width: 640px) {
		.arena {
			grid-template-columns: 1fr auto 1fr;
			gap: 1.5rem;
		}

		.arena button {
			height: min(60vh, 560px);
		}
	}

	.hint {
		font-size: 0.75rem;
		opacity: 0.5;
	}

	.result {
		min-height: 2.5rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.9rem;
	}

	.chip {
		width: 2rem;
		height: 2rem;
		object-fit: cover;
		border-radius: 0.25rem;
	}

	.board {
		width: 100%;
		max-width: 560px;
		margin-top: 2rem;
	}

	.board h2 {
		font-family: var(--font-title);
		font-size: 1.5rem;
		color: var(--heading);
	}

	.meta {
		font-size: 0.75rem;
		opacity: 0.6;
		margin-bottom: 1rem;
	}

	.board ol {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.board li {
		display: grid;
		grid-template-columns: 2rem 3.5rem 1fr auto;
		align-items: center;
		gap: 0.75rem;
	}

	.board li.provisional {
		opacity: 0.55;
	}

	.board li img {
		width: 3.5rem;
		height: 3.5rem;
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

	.resting {
		margin-top: 4rem;
		opacity: 0.7;
	}
</style>
