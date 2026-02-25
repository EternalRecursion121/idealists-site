<script lang="ts">
	const vocabulary: { term: string; kind: string; pronunciation?: string; definitions: string[] }[] = [
		{
			term: 'idealist',
			kind: 'noun',
			pronunciation: '/ʌɪˈdɪəlɪst/',
			definitions: [
				'someone who believes that a much better world is possible, often when this does not seem likely to others',
				'a person who sticks to their principles, choosing integrity over convenience',
				'you?'
			]
		},
		{
			term: 'idealism',
			kind: 'noun',
			pronunciation: '/ʌɪˈdɪəlɪz(ə)m/',
			definitions: [
				'the belief that ideas are more fundamental than matter, and that subjectivity is the foundation of everything',
				'the practice of pursuing a vision of the world as it should be, rather than accepting the world as it is'
			]
		},
		{
			term: 'aliveness',
			kind: 'noun',
			pronunciation: '/əˈlʌɪvnəs/',
			definitions: [
				'the quality of dynamic systems over static entities — things that grow, adapt, merge, and die when they need to',
				'the felt sense that something is vibrant, responsive, and full of potential'
			]
		},
		{
			term: 'unfolding',
			kind: 'noun · verb',
			pronunciation: '/ʌnˈfəʊldɪŋ/',
			definitions: [
				'the process of ideas and systems revealing themselves naturally, without force',
				'allowing something to become what it wants to be, rather than what you planned for it to be'
			]
		},
		{
			term: 'utopia',
			kind: 'noun',
			pronunciation: '/juːˈtəʊpɪə/',
			definitions: [
				'not a destination but a direction — the north star by which we navigate',
				'a world worth fighting for, even if it is never fully reached'
			]
		},
		{
			term: 'autonomy',
			kind: 'noun',
			pronunciation: '/ɔːˈtɒnəmi/',
			definitions: [
				'you control your tools, your data, your attention — decisions happen at the level where they matter',
				'the freedom to shape your own path without coercion or dependency'
			]
		},
		{
			term: 'cooperation',
			kind: 'noun',
			pronunciation: '/kəʊˌɒpəˈreɪʃ(ə)n/',
			definitions: [
				'we cannot succeed alone, nor would we want to',
				'the recognition that the most meaningful work emerges from genuine collaboration'
			]
		},
		{
			term: 'playfulness',
			kind: 'noun',
			pronunciation: '/ˈpleɪf(ʊ)lnəs/',
			definitions: [
				'creating with whimsy and joy — what is life without fun?',
				'the refusal to let seriousness drain the life out of serious work'
			]
		},
		{
			term: 'integrity',
			kind: 'noun',
			pronunciation: '/ɪnˈtɛɡrɪti/',
			definitions: [
				'doing everything with love — never selling your soul for convenience',
				'the wholeness that comes from aligning what you believe with what you build'
			]
		}
	];
</script>

<svelte:head>
	<title>Glossary — The Idealists Collective</title>
</svelte:head>

<section class="glossary">
	{#each vocabulary as entry (entry.term)}
		<article class="entry">
			<div class="entry-header">
				<h2 class="term">{entry.term}</h2>
				<span class="kind">{entry.kind}</span>
			</div>
			{#if entry.pronunciation}
				<span class="pronunciation">{entry.pronunciation}</span>
			{/if}
			<ol class="definitions">
				{#each entry.definitions as def, i (i)}
					<li>
						{#if def === 'you?'}
							<a href="/join" class="you-link">{def}</a>
						{:else}
							{def}
						{/if}
					</li>
				{/each}
			</ol>
		</article>
	{/each}
</section>

<style>
	.glossary {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.entry {
		padding-bottom: 2.5rem;
		border-bottom: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
	}

	.entry:last-child {
		border-bottom: none;
	}

	.entry-header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.term {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		margin: 0;
	}

	@media (min-width: 640px) {
		.term {
			font-size: 2rem;
		}
	}

	.kind {
		font-size: 0.65rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.4;
	}

	.pronunciation {
		display: block;
		font-size: 0.8rem;
		font-weight: 400;
		opacity: 0.6;
		color: var(--accent);
		margin-top: 0.15rem;
		margin-bottom: 0.75rem;
	}

	.definitions {
		list-style: none;
		counter-reset: def;
		padding: 0;
		margin: 0;
	}

	.definitions li {
		counter-increment: def;
		font-family: var(--font-serif);
		font-size: 1.05rem;
		line-height: 1.6;
		max-width: 55ch;
		padding: 0.35rem 0;
		opacity: 0.85;
	}

	.definitions li::before {
		content: counter(def) '. ';
		opacity: 0.5;
	}

	@media (min-width: 640px) {
		.definitions li {
			font-size: 1.15rem;
		}
	}

	.you-link {
		text-decoration: none;
		color: var(--accent);
		font-style: italic;
	}

	.you-link:hover {
		opacity: 0.8;
	}
</style>
