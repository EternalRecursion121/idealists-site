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
	<nav class="top">
		<a href="/vibes">← all vibes</a>
	</nav>

	{#if !data.enabled}
		<p class="resting">the duel is resting — no database is connected here.</p>
	{:else}
		<h1>{data.matchup.prompt}</h1>

		<form bind:this={arena} method="POST" action="?/vote" use:enhance={submit} class="arena" class:pending>
			<input type="hidden" name="match" value={data.matchup.id} />
			{#each [data.matchup.a, data.matchup.b] as side, i (side.name)}
				<div class="side">
					<button
						data-choice={i === 0 ? 'left' : 'right'}
						type="submit"
						name="winner"
						value={side.name}
						disabled={pending}
						aria-label="choose the {i === 0 ? 'left' : 'right'} vibe"
					>
						<img
							src={side.src}
							alt=""
							width={side.width}
							height={side.height}
							style:--ar={side.width / side.height}
							style:--natural-w="{side.width}px"
						/>
					</button>
				</div>
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

		<a href="/vibes/duel/leaderboard" class="leaderboard-link">see the leaderboard →</a>
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

	.top {
		align-self: flex-start;
		font-size: 0.875rem;
	}

	.top a {
		opacity: 0.6;
	}

	.top a:hover,
	.leaderboard-link:hover {
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
		grid-template-columns: minmax(0, 1fr);
		--max-h: min(36vh, 420px);
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		transition: opacity 0.2s;
	}

	.arena.pending {
		opacity: 0.5;
	}

	/* Fills its grid column so the image can size against it (cqi). */
	.side {
		container-type: inline-size;
		display: flex;
		justify-content: center;
		min-width: 0;
	}

	.arena button {
		display: flex;
		align-items: center;
		justify-content: center;
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

	/* Fit within the column and --max-h, preserving aspect ratio; upscale small images at most 2×. */
	.arena img {
		display: block;
		width: min(100cqi - 1rem - 2px, calc(var(--max-h) * var(--ar)), calc(var(--natural-w) * 2));
		height: auto;
		aspect-ratio: var(--ar);
	}

	.arena .skip {
		grid-column: 1 / -1;
		justify-self: center;
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
			grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
			--max-h: min(62vh, 600px);
			gap: 1.5rem;
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

	.leaderboard-link {
		font-size: 0.875rem;
		opacity: 0.6;
	}

	.resting {
		margin-top: 4rem;
		opacity: 0.7;
	}
</style>
