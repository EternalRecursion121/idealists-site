<script lang="ts">
	import type { WritingMetadata } from '$lib/types/writing';

	interface Props {
		data: {
			writings: WritingMetadata[];
		};
	}

	let { data }: Props = $props();

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	// The list reads as the collective's commit log: a year label wherever the
	// year turns over (and above the newest entry).
	function startsYear(index: number): boolean {
		const year = (w: WritingMetadata) => new Date(w.updatedAt).getFullYear();
		return index === 0 || year(data.writings[index]) !== year(data.writings[index - 1]);
	}
</script>

<svelte:head>
	<title>Writings — The Idealists Collective</title>
</svelte:head>

<section>
	{#if data.writings.length === 0}
		<p class="opacity-60 italic">coming soon</p>
	{:else}
		<ul class="log">
			{#each data.writings as writing, i (writing.slug)}
				<li class:new-year={startsYear(i)}>
					{#if startsYear(i)}
						<span class="year-mark">{new Date(writing.updatedAt).getFullYear()}</span>
					{/if}
					<a href="/writings/{writing.slug}" class="block group">
						<h2 class="font-semibold mb-1 group-hover:opacity-70">{writing.title}</h2>
						{#if writing.description}
							<p class="text-sm opacity-60 mb-2">{writing.description}</p>
						{/if}
						<div class="text-xs opacity-40 flex gap-3">
							<span>{formatDate(writing.updatedAt)}</span>
							<span>•</span>
							<span>{writing.revisionCount} revision{writing.revisionCount !== 1 ? 's' : ''}</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	/* The log spine: a hairline down the left with a node per writing, the
	   newest one filled. The line is drawn in segments between the nodes rather
	   than as one rule masked by --bg discs, because a flat --bg patch shows up
	   as a box against the site's noise-and-gradient backdrop. */
	.log {
		--gutter: 2rem;
		--gap: 2rem;
		--node: 9px;
		--node-top: 0.45rem;
		display: flex;
		flex-direction: column;
		gap: var(--gap);
		padding-left: var(--gutter);
		/* room for the first year label, which sits above the list */
		margin-top: 1.5rem;
	}

	.log > li {
		position: relative;
	}

	.log > li::before {
		content: '';
		position: absolute;
		left: calc(-1 * var(--gutter));
		top: var(--node-top);
		width: var(--node);
		height: var(--node);
		box-sizing: border-box;
		border: 1px solid var(--accent);
		border-radius: 50%;
		opacity: 0.45;
		transition: opacity 0.2s ease, background 0.2s ease;
	}

	.log > li:first-child::before {
		background: var(--accent);
		opacity: 0.9;
	}

	.log > li:hover::before,
	.log > li:focus-within::before {
		background: var(--accent);
		opacity: 1;
	}

	/* segment from under this node to the top of the next one */
	.log > li:not(:last-child)::after {
		content: '';
		position: absolute;
		left: calc(-1 * var(--gutter) + (var(--node) - 1px) / 2);
		top: calc(var(--node-top) + var(--node) + 3px);
		bottom: calc(-1 * var(--gap) - var(--node-top) + 3px);
		width: 1px;
		background: var(--accent);
		opacity: 0.22;
	}

	.year-mark {
		position: absolute;
		left: calc(-1 * var(--gutter));
		top: -1.9rem;
		font-size: 0.62rem;
		letter-spacing: 0.14em;
		color: var(--accent);
		opacity: 0.6;
	}

	/* where the year turns over mid-list: open the gap for the label and stop
	   the line short of it */
	.log > li.new-year:not(:first-child) {
		margin-top: 1.75rem;
	}

	.log > li:has(+ li.new-year)::after {
		bottom: -0.35rem;
	}

	@media (max-width: 639px) {
		.log {
			--gutter: 1.4rem;
		}
	}
</style>
