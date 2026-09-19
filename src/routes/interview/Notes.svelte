<script lang="ts">
	import { fade } from 'svelte/transition';
	import { marked } from 'marked';

	interface Props {
		/** the editable markdown source, frontmatter included */
		notesContent: string;
		/** what the interviewer originally wrote, to tell an edited draft apart */
		notesOriginal: string;
		busy: boolean;
		onfile: () => void;
	}

	let { notesContent = $bindable(), notesOriginal, busy, onfile }: Props = $props();

	let view = $state<'read' | 'edit'>('read');

	// The notes are markdown with a YAML frontmatter block. Strip the frontmatter
	// for the rendered preview (it's filing metadata, not something to read), but
	// keep it in the editable source so it's preserved when filed.
	function stripFrontmatter(md: string): string {
		const m = md.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
		return m ? md.slice(m[0].length) : md;
	}
	const notesHtml = $derived(marked.parse(stripFrontmatter(notesContent.trim())) as string);
</script>

<section class="notes" in:fade={{ duration: 400 }}>
	<header class="notes-header">
		<h1>your notes</h1>
		<p class="lede">
			this is what i wrote about our conversation. read it. change anything that's wrong.
			redact anything you don't want filed.
		</p>
	</header>

	<div class="notes-viewtabs" role="tablist" aria-label="notes view">
		<button
			class="viewtab"
			class:active={view === 'read'}
			role="tab"
			aria-selected={view === 'read'}
			onclick={() => (view = 'read')}
		>
			read
		</button>
		<button
			class="viewtab"
			class:active={view === 'edit'}
			role="tab"
			aria-selected={view === 'edit'}
			onclick={() => (view = 'edit')}
		>
			edit
		</button>
	</div>

	{#if view === 'read'}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<article class="notes-rendered prose">{@html notesHtml}</article>
	{:else}
		<textarea class="notes-editor" bind:value={notesContent} spellcheck="false"></textarea>
	{/if}

	<div class="notes-actions">
		<div class="actions-info">
			{#if notesContent !== notesOriginal}
				<span class="dirty">edited · the original draft is preserved</span>
			{:else}
				<span class="clean">unedited</span>
			{/if}
		</div>
		<div class="actions-buttons">
			<button class="primary-btn" onclick={onfile} disabled={busy}>file</button>
		</div>
	</div>
</section>

<style>
	.notes {
		padding-bottom: 4rem;
	}

	.notes-header {
		max-width: 40rem;
	}

	.notes-editor {
		display: block;
		width: 100%;
		min-height: 60vh;
		margin-top: 2rem;
		padding: 1.25rem 1.5rem;
		font-family: var(--font-mono);
		font-size: 0.88rem;
		line-height: 1.6;
		background: color-mix(in srgb, var(--text) 4%, transparent);
		border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
		border-radius: 3px;
		color: var(--text);
		outline: none;
		resize: vertical;
		white-space: pre-wrap;
	}

	.notes-editor:focus {
		border-color: var(--accent);
	}

	/* read / edit toggle */
	.notes-viewtabs {
		display: inline-flex;
		gap: 0.25rem;
		margin-top: 2rem;
		padding: 0.2rem;
		background: color-mix(in srgb, var(--text) 5%, transparent);
		border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
		border-radius: 999px;
	}

	.viewtab {
		padding: 0.3rem 1rem;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		text-transform: lowercase;
		letter-spacing: 0.08em;
		background: transparent;
		border: none;
		border-radius: 999px;
		color: var(--text);
		opacity: 0.55;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.viewtab:hover {
		opacity: 0.85;
	}

	.viewtab.active {
		opacity: 1;
		color: var(--accent);
		background: color-mix(in srgb, var(--bg, #fff) 90%, var(--text) 10%);
		box-shadow: 0 1px 3px color-mix(in srgb, #000 10%, transparent);
	}

	/* rendered markdown preview */
	.notes-rendered {
		margin-top: 1.25rem;
		padding: 2rem 2.25rem;
		background: color-mix(in srgb, var(--text) 3%, transparent);
		border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
		border-radius: 6px;
		font-size: 1rem;
		line-height: 1.65;
		max-width: 44rem;
	}

	.notes-rendered :global(h1),
	.notes-rendered :global(h2),
	.notes-rendered :global(h3) {
		font-family: var(--font-display);
		font-weight: 600;
		color: var(--heading);
		line-height: 1.2;
	}

	.notes-rendered :global(h1) {
		font-size: 1.6rem;
		margin: 0 0 1rem;
	}

	.notes-rendered :global(h2) {
		font-size: 1.2rem;
		margin: 2rem 0 0.6rem;
		padding-bottom: 0.35rem;
		border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
	}

	.notes-rendered :global(h3) {
		font-size: 1.02rem;
		margin: 1.5rem 0 0.4rem;
		color: var(--accent);
	}

	.notes-rendered :global(p) {
		margin: 0 0 1rem;
	}

	.notes-rendered :global(ul),
	.notes-rendered :global(ol) {
		margin: 0 0 1rem;
		padding-left: 1.4rem;
	}

	.notes-rendered :global(li) {
		margin: 0.3rem 0;
	}

	.notes-rendered :global(li::marker) {
		color: color-mix(in srgb, var(--accent) 70%, transparent);
	}

	.notes-rendered :global(strong) {
		color: var(--heading);
		font-weight: 600;
	}

	.notes-rendered :global(em) {
		color: color-mix(in srgb, var(--text) 85%, var(--accent) 15%);
	}

	.notes-rendered :global(blockquote) {
		margin: 0 0 1rem;
		padding: 0.25rem 0 0.25rem 1rem;
		border-left: 2px solid color-mix(in srgb, var(--accent) 50%, transparent);
		opacity: 0.85;
		font-style: italic;
	}

	.notes-rendered :global(code) {
		font-family: var(--font-mono);
		font-size: 0.85em;
		padding: 0.1rem 0.35rem;
		background: color-mix(in srgb, var(--text) 8%, transparent);
		border-radius: 3px;
	}

	.notes-rendered :global(a) {
		color: var(--accent);
		text-decoration: none;
		border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
	}

	.notes-rendered :global(hr) {
		border: none;
		border-top: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
		margin: 1.5rem 0;
	}

	.notes-rendered :global(> *:first-child) {
		margin-top: 0;
	}

	.notes-rendered :global(> *:last-child) {
		margin-bottom: 0;
	}

	.notes-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.actions-info {
		font-size: 0.85rem;
		opacity: 0.65;
		font-family: var(--font-mono);
	}

	.dirty {
		color: var(--accent);
	}

	.actions-buttons {
		display: flex;
		gap: 0.75rem;
	}

	.primary-btn {
		padding: 0.6rem 1.4rem;
		font-family: var(--font-display);
		font-size: 0.95rem;
		background: transparent;
		border: 1px solid var(--accent);
		border-radius: 2px;
		color: var(--accent);
		cursor: pointer;
		transition: all 0.15s;
	}

	.primary-btn:hover:not(:disabled) {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
	}
</style>
