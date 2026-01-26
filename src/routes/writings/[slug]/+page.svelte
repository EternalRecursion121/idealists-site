<script lang="ts">
	import { slide } from 'svelte/transition';
	import TimelineSlider from '$lib/components/TimelineSlider.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import type { WritingWithHistory } from '$lib/types/writing';

	interface Props {
		data: {
			writing: WritingWithHistory;
			nextSlug: string;
		};
	}

	let { data }: Props = $props();

	let currentRevisionIndex = $state(0);
	let historyExpanded = $state(false);

	let currentRevision = $derived(data.writing.revisions[currentRevisionIndex]);
	let isLatest = $derived(currentRevisionIndex === 0);

	// Extract body without frontmatter for display
	function getBody(content: string): string {
		const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
		return frontmatterMatch ? frontmatterMatch[1].trim() : content;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{data.writing.metadata.title} — The Idealists Collective</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-16">
	<header class="header-centered">
		<h1 class="text-2xl sm:text-3xl font-semibold mb-2">{data.writing.metadata.title}</h1>
		{#if data.writing.metadata.description}
			<p class="opacity-70 mb-4">{data.writing.metadata.description}</p>
		{/if}
		<div class="text-sm opacity-50">
			{#if data.writing.metadata.authors?.length}
				<span>{data.writing.metadata.authors.join(' & ')}</span>
				<span class="mx-2">•</span>
			{/if}
			<span>
				{#if isLatest}
					Last updated {formatDate(data.writing.metadata.updatedAt)}
				{:else}
					Viewing revision from {formatDate(currentRevision.date)}
				{/if}
			</span>
		</div>
		<div class="separator">
			<button onclick={() => history.back()} class="sep-link">&lt;&lt;&lt;</button><a href={`/writings/${data.nextSlug}`} class="sep-link">&gt;&gt;&gt;</a>
		</div>
	</header>

	<article class="writing-content">
		{@html renderMarkdown(getBody(currentRevision.content))}
	</article>

	{#if data.writing.revisions.length > 1}
		<div class="timeline-section">
			<button
				class="history-toggle"
				class:history-expanded={historyExpanded}
				onclick={() => historyExpanded = !historyExpanded}
			>
				<span>revision history ({data.writing.revisions.length})</span>
				<span class="toggle-icon">{historyExpanded ? '−' : '+'}</span>
			</button>
			{#if historyExpanded}
				<div transition:slide={{ duration: 300 }}>
					<TimelineSlider
						revisions={data.writing.revisions}
						currentIndex={currentRevisionIndex}
						onSelect={(i) => currentRevisionIndex = i}
					/>
				</div>
			{/if}
		</div>
	{/if}

	<BottomNav current="writings" />
</div>

<script module lang="ts">
	import { marked } from 'marked';

	const styles = [
     'font-size: 1.8rem; font-weight: 600; color: var(--heading); margin: 2rem 0 1rem 0; letter-spacing: -0.02em;',
     'font-size: 1.4rem; font-weight: 600; color: var(--heading); margin: 1.5rem 0 0.75rem 0; letter-spacing: -0.01em;',
     'font-size: 1.15rem; font-weight: 600; color: var(--heading); margin: 1.25rem 0 0.5rem 0;',
     'font-size: 1rem; font-weight: 600; color: var(--accent); margin: 1rem 0 0.5rem 0; text-transform: uppercase; letter-spacing: 0.05em;',
     'font-size: 0.9rem; font-weight: 500; color: var(--accent); margin: 0.75rem 0 0.25rem 0;',
    'font-size: 0.85rem; font-weight: 500; color: var(--text); opacity: 0.7; margin: 0.5rem 0 0.25rem 0;'
];

	// Configure marked to open links in new tabs
	marked.use({
		renderer: {
			link({ href, title, text }) {
				const titleAttr = title ? ` title="${title}"` : '';
				return `<a href="${href}"${titleAttr} target="_blank" rel="noopener">${text}</a>`;
			},
			strong({ text }) {
			return `<strong class="fancy-bold">${text}</strong>`;
			},
			
			heading({ text, depth }) {
			const slug = text.toLowerCase().replace(/\s+/g, '-');
			return `<h${depth} style="${styles[depth]}" id="${slug}">${text}</h${depth}>`;
			},
			
			em({ text }) {
			return `<em class="italic">${text}</em>`;
			},
		}
	});

	function renderMarkdown(text: string): string {
		return marked(text) as string;
	}
</script>

<style>
	.header-centered {
		text-align: center;
		margin-bottom: 2rem;
	}

	.separator {
		margin-top: 1.5rem;
		letter-spacing: 0.2em;
	}

	.sep-link {
		color: var(--accent);
		opacity: 0.5;
		text-decoration: none;
		transition: opacity 0.2s;
		background: none;
		border: none;
		font-family: inherit;
		font-size: inherit;
		cursor: pointer;
		padding: 0;
	}

	.sep-link:hover {
		opacity: 1;
	}

	.timeline-section {
		position: relative;
		margin-top: 3rem;
		padding-left: 1rem;
		max-width: 65ch;
		margin-left: auto;
		margin-right: auto;
	}

	.timeline-section::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--accent);
		opacity: 0.15;
		transition: opacity 0.2s ease;
	}

	.timeline-section:hover::before {
		opacity: 0.4;
	}

	.timeline-section:has(.history-expanded)::before {
		opacity: 1;
	}

	.history-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		background: none;
		border: none;
		color: inherit;
		font-family: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		padding: 0.6rem 0;
		text-align: left;
		transition: transform 0.15s ease;
	}

	.history-toggle:hover {
		color: var(--accent);
		transform: translateX(4px);
	}

	.history-toggle.history-expanded {
		color: var(--accent);
		font-style: italic;
	}

	.toggle-icon {
		color: var(--accent);
		font-size: 1rem;
		font-weight: 300;
		opacity: 0.5;
		transition: opacity 0.2s ease, transform 0.2s ease;
	}

	.history-toggle:hover .toggle-icon {
		opacity: 1;
	}

	.history-toggle.history-expanded .toggle-icon {
		opacity: 1;
		transform: rotate(45deg);
	}

	.writing-content {
		font-size: 0.85rem;
		line-height: 1.7;
		opacity: 0.85;
		max-width: 65ch;
		margin-left: auto;
		margin-right: auto;
	}

	.writing-content :global(p) {
		margin-bottom: 1.25rem;
	}

	.writing-content :global(p:first-child::first-letter) {
		float: left;
		font-size: 3.5rem;
		line-height: 0.8;
		padding-right: 0.15em;
		color: var(--heading);
		font-weight: 600;
	}

	.writing-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.writing-content :global(a) {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.writing-content :global(a:hover) {
		opacity: 0.7;
	}

	.writing-content :global(ul),
	.writing-content :global(ol) {
		margin-bottom: 1.25rem;
		padding-left: 1.5rem;
	}

	.writing-content :global(ol) {
		list-style-type: decimal;
	}

	.writing-content :global(li) {
		margin-bottom: 0.5rem;
	}

	.writing-content :global(strong) {
		font-weight: 600;
		color: var(--heading);
	}
</style>
