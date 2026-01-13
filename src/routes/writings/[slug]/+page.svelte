<script lang="ts">
	import TimelineSlider from '$lib/components/TimelineSlider.svelte';
	import type { WritingWithHistory } from '$lib/types/writing';

	interface Props {
		data: {
			writing: WritingWithHistory;
			nextSlug: string;
		};
	}

	let { data }: Props = $props();

	let currentRevisionIndex = $state(0);

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
			<span class="opacity-60 text-sm">revision history</span>
			<TimelineSlider
				revisions={data.writing.revisions}
				currentIndex={currentRevisionIndex}
				onSelect={(i) => currentRevisionIndex = i}
			/>
		</div>
	{/if}

	<nav class="mt-16 flex gap-6 justify-center">
		<a href="/writings" class="opacity-50 hover:opacity-100">← writings</a>
		<span class="opacity-50">•</span>
		<a href="https://docs.google.com/forms/d/e/1FAIpQLSeFt80kKtQ81aPR5SscPl99C0br4gPZOG6wo91yVD4Gnu42rg/viewform?usp=dialog" class="opacity-50 hover:opacity-100 italic">join us</a>
		<span class="opacity-50">•</span>
		<a href="/" class="opacity-50 hover:opacity-100">home →</a>
	</nav>
</div>

<script module lang="ts">
	import { marked } from 'marked';

	// Configure marked to open links in new tabs
	marked.use({
		renderer: {
			link({ href, title, text }) {
				const titleAttr = title ? ` title="${title}"` : '';
				return `<a href="${href}"${titleAttr} target="_blank" rel="noopener">${text}</a>`;
			}
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
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--accent);
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

	.writing-content :global(ul) {
		margin-bottom: 1.25rem;
		padding-left: 1.5rem;
	}

	.writing-content :global(li) {
		margin-bottom: 0.5rem;
	}

	.writing-content :global(strong) {
		font-weight: 600;
		color: var(--heading);
	}
</style>
