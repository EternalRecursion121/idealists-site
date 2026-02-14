<script lang="ts">
	import { slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import TimelineSlider from '$lib/components/TimelineSlider.svelte';
	import AnnotationLayer from '$lib/annotations/components/AnnotationLayer.svelte';
	import type { WritingWithHistory } from '$lib/types/writing';

	interface Props {
		data: {
			writing: WritingWithHistory;
			nextSlug: string;
			annotationsMarkdown: string | null;
		};
	}

	let { data }: Props = $props();

	let currentRevisionIndex = $state(0);
	let historyExpanded = $state(false);
	let mathJaxReady = $state(false);

	let currentRevision = $derived(data.writing.revisions[currentRevisionIndex]);
	let isLatest = $derived(currentRevisionIndex === 0);

	// Load MathJax dynamically
	onMount(() => {
		if (window.MathJax) {
			mathJaxReady = true;
			return;
		}

		(window as Window).MathJax = {
			tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']] },
			startup: {
				ready: () => {
					window.MathJax!.startup!.defaultReady();
					mathJaxReady = true;
				}
			}
		} as Window['MathJax'];

		const script = document.createElement('script');
		script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
		script.async = true;
		document.head.appendChild(script);
	});

	// Re-typeset MathJax when revision changes or MathJax becomes ready
	$effect(() => {
		if (!mathJaxReady) return;
		currentRevision; // track dependency

		// Small delay to ensure DOM is updated
		const timeout = setTimeout(() => {
			window.MathJax?.typesetPromise?.();
		}, 50);

		return () => clearTimeout(timeout);
	});

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
	{#if data.writing.metadata.style === 'notebook'}
		<link href="https://fonts.googleapis.com/css2?family=Reenie+Beanie&display=swap" rel="stylesheet">
	{/if}
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-16" class:notebook-style={data.writing.metadata.style === 'notebook'}>
	<header class="header-centered">
		<h1 class="text-2xl sm:text-3xl font-semibold mb-2">{data.writing.metadata.title}</h1>
		{#if data.writing.metadata.description}
			<p class="opacity-70 mb-4">{data.writing.metadata.description}</p>
		{/if}
		<div class="text-sm opacity-50 byline-row">
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
			{#if data.writing.metadata.branches?.length}
				{#each data.writing.metadata.branches as branch}
					<a
						href={branch.url}
						target="_blank"
						rel="noopener"
						class="fork-icon"
						title="also on {branch.label}"
					>
						<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
							<circle cx="5" cy="3" r="1.5" stroke="currentColor" fill="none" stroke-width="1.5"/>
							<circle cx="5" cy="13" r="1.5" stroke="currentColor" fill="none" stroke-width="1.5"/>
							<circle cx="11" cy="6" r="1.5" stroke="currentColor" fill="none" stroke-width="1.5"/>
							<path d="M5 4.5v7M5 6.5c0-1.5 2-2.5 4.5-2.5" stroke="currentColor" fill="none" stroke-width="1.5"/>
						</svg>
					</a>
				{/each}
			{/if}
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
						branches={data.writing.metadata.branches}
					/>
				</div>
			{/if}
		</div>
	{/if}

</div>

<AnnotationLayer slug={data.writing.metadata.slug} annotationsMarkdown={data.annotationsMarkdown} useGitHub={true} />

<script module lang="ts">
	import { marked, type TokenizerExtension, type RendererExtension } from 'marked';
	import markedFootnote from 'marked-footnote';

	const styles = [
     'font-size: 1.8rem; font-weight: 600; color: var(--heading); margin: 2rem 0 1rem 0; letter-spacing: -0.02em;',
     'font-size: 1.4rem; font-weight: 600; color: var(--heading); margin: 1.5rem 0 0.75rem 0; letter-spacing: -0.01em;',
     'font-size: 1.15rem; font-weight: 600; color: var(--heading); margin: 1.25rem 0 0.5rem 0;',
     'font-size: 1rem; font-weight: 600; color: var(--accent); margin: 1rem 0 0.5rem 0; text-transform: uppercase; letter-spacing: 0.05em;',
     'font-size: 0.9rem; font-weight: 500; color: var(--accent); margin: 0.75rem 0 0.25rem 0;',
    'font-size: 0.85rem; font-weight: 500; color: var(--text); opacity: 0.7; margin: 0.5rem 0 0.25rem 0;'
	];

	// Math extension for marked - preserves LaTeX for MathJax processing
	const mathBlock: TokenizerExtension & RendererExtension = {
		name: 'mathBlock',
		level: 'block',
		start(src) { return src.match(/\$\$/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\$\$([\s\S]+?)\$\$/);
			if (match) {
				return { type: 'mathBlock', raw: match[0], text: match[1].trim() };
			}
		},
		renderer(token) {
			return `<div class="math-block">\\[${token.text}\\]</div>`;
		}
	};

	const mathInline: TokenizerExtension & RendererExtension = {
		name: 'mathInline',
		level: 'inline',
		start(src) { return src.match(/\$/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\$([^\$\n]+?)\$/);
			if (match) {
				return { type: 'mathInline', raw: match[0], text: match[1] };
			}
		},
		renderer(token) {
			return `<span class="math-inline">\\(${token.text}\\)</span>`;
		}
	};

	// Configure marked
	marked.use(markedFootnote());
	marked.use({ extensions: [mathBlock, mathInline] });

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

	.byline-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.fork-icon {
		display: inline-flex;
		align-items: center;
		margin-left: 0.5rem;
		color: var(--accent);
		opacity: 0.5;
		transition: opacity 0.2s ease, transform 0.2s ease;
	}

	.fork-icon:hover {
		opacity: 1;
		transform: scale(1.15);
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
		font-size: 1rem;
		line-height: 1.7;
		opacity: 0.85;
		max-width: 65ch;
		margin-left: auto;
		margin-right: auto;
	}

	.writing-content :global(p) {
		margin-bottom: 1.25rem;
	}

	.writing-content > :global(p:first-child::first-letter) {
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

	.writing-content :global(ul) {
		list-style-type: none;
		padding-left: 0;
	}

	.writing-content :global(ul li) {
		position: relative;
		padding-left: 1.25rem;
	}

	.writing-content :global(ul li::before) {
		content: '—';
		position: absolute;
		left: 0;
		color: var(--accent);
		opacity: 0.6;
	}

	.writing-content :global(ol) {
		list-style-type: decimal;
	}

	.writing-content :global(li) {
		margin-bottom: 0.5rem;
	}

	.writing-content :global(blockquote) {
		margin: 1.5rem 0;
		padding: 1rem 1.5rem;
		border-left: 2px solid var(--accent);
		font-style: italic;
		opacity: 0.85;
	}

	.writing-content :global(blockquote p) {
		margin-bottom: 0.5rem;
	}

	.writing-content :global(blockquote p:last-child) {
		margin-bottom: 0;
	}

	.writing-content :global(strong) {
		font-weight: 600;
		color: var(--heading);
	}

	/* Footnote inline references */
	.writing-content :global([data-footnote-ref]) {
		font-size: 0.75em;
		vertical-align: super;
		text-decoration: none;
		color: var(--accent);
	}

	.writing-content :global([data-footnote-ref]:hover) {
		text-decoration: underline;
	}

	/* Footnotes section */
	.writing-content :global(section[data-footnotes]) {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--accent);
		opacity: 0.7;
		font-size: 0.85em;
	}

	.writing-content :global(section[data-footnotes] ol) {
		padding-left: 1.25rem;
	}

	.writing-content :global(section[data-footnotes] li) {
		margin-bottom: 0.75rem;
	}

	/* Back-to-reference link */
	.writing-content :global([data-footnote-backref]) {
		text-decoration: none;
		margin-left: 0.25rem;
		color: var(--accent);
	}

	/* Math blocks */
	.writing-content :global(.math-block) {
		margin: 1.5rem 0;
		overflow-x: auto;
	}

	.writing-content :global(.math-inline) {
		display: inline;
	}

	/* ===== Notebook Style ===== */
	.notebook-style {
		--notebook-highlight: rgba(225, 182, 14, 0.4);
	}

	.notebook-style .writing-content {
		font-family: 'Reenie Beanie', cursive;
		font-size: 1.5rem;
		line-height: 1.4;
	}

	.notebook-style .writing-content :global(a) {
		color: var(--text);
		text-decoration: none;
		background-image: linear-gradient(to right,
			rgba(225, 182, 14, 0.4),
			rgba(225, 182, 14, 0.6) 20%,
			rgba(225, 182, 14, 0.5) 80%,
			rgba(225, 182, 14, 0.4));
		background-size: 100% 0.5em;
		background-position: 0 88%;
		background-repeat: no-repeat;
		transition: background-size 0.2s;
	}

	.notebook-style .writing-content :global(a:hover) {
		background-size: 100% 100%;
		opacity: 1;
	}

	.notebook-style .writing-content :global(blockquote) {
		background-image: linear-gradient(to right,
			rgba(225, 182, 14, 0.3),
			rgba(225, 182, 14, 0.5) 20%,
			rgba(225, 182, 14, 0.4) 80%,
			rgba(225, 182, 14, 0.3));
		border-left: none;
	}

	.notebook-style .writing-content :global(img) {
		display: block;
		margin: 2rem auto;
		max-width: 100%;
		padding: 12px;
		background: #fff;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
		transform: rotate(-0.5deg);
	}

	.notebook-style .header-centered h1 {
		font-family: 'Reenie Beanie', cursive;
		font-size: 3rem;
	}

	.notebook-style .header-centered p {
		font-family: 'Reenie Beanie', cursive;
		font-size: 1.5rem;
	}
</style>
