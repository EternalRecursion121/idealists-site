<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { Annotation, Reply, AnnotationStore, AuthUser } from '../types';
	import { parseAnnotationsMarkdown, serializeAnnotationsMarkdown } from '../parser';
	import { FilesystemStore } from '../stores/filesystem';
	import { GitHubStore } from '../stores/github';
	import { AnonymousAuth } from '../auth/anonymous';
	import { GitHubAuth } from '../auth/github';
	import AnnotationThread from './AnnotationThread.svelte';
	import AnnotationEditor from './AnnotationEditor.svelte';

	interface Props {
		slug: string;
		contentSelector?: string;
		annotationsMarkdown?: string | null;
		useGitHub?: boolean; // Enable GitHub auth mode
	}

	let { slug, contentSelector = '.writing-content', annotationsMarkdown = null, useGitHub = false }: Props = $props();

	// Services - choose based on mode
	const githubAuth = new GitHubAuth();
	const anonAuth = new AnonymousAuth();

	// State
	let annotations = $state<Annotation[]>([]);
	let currentSelection = $state<{
		text: string;
		exact: string;
		prefix: string;
		suffix: string;
		start: number;
		end: number;
		rect: DOMRect;
	} | null>(null);
	let showForm = $state(false);
	let formPosition = $state({ x: 0, y: 0 });
	let viewingAnnotation = $state<Annotation | null>(null);
	let viewPosition = $state({ x: 0, y: 0 });
	let username = $state('');
	let githubUser = $state<AuthUser | null>(null);
	let isLoggedIn = $state(false);
	let store = $state<AnnotationStore>(new FilesystemStore());

	onMount(async () => {
		if (browser) {
			// Check GitHub auth first if enabled
			if (useGitHub) {
				githubUser = await githubAuth.getUser();
				if (githubUser) {
					isLoggedIn = true;
					username = githubUser.name;
					store = new GitHubStore(githubAuth);
				}
			}

			// Fall back to anonymous auth
			if (!isLoggedIn) {
				username = anonAuth.getName() || '';
			}

			// Parse annotations from markdown (server-provided from local filesystem)
			if (annotationsMarkdown) {
				annotations = parseAnnotationsMarkdown(annotationsMarkdown);
			}

			// Defer highlighting to next tick after DOM is ready
			setTimeout(() => renderHighlights(), 100);

			// Listen for text selection
			document.addEventListener('mouseup', handleMouseUp);
			document.addEventListener('mousedown', handleMouseDown);

			return () => {
				document.removeEventListener('mouseup', handleMouseUp);
				document.removeEventListener('mousedown', handleMouseDown);
			};
		}
	});

	function handleMouseDown(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.annotation-popover') &&
			!target.closest('.annotation-form') &&
			!target.closest('.annotation-view') &&
			!target.closest('.annotation-controls')) {
			currentSelection = null;
			showForm = false;
			if (!target.closest('.annotated-text')) {
				viewingAnnotation = null;
			}
		}
	}

	function handleMouseUp(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('.annotation-popover') ||
			target.closest('.annotation-form') ||
			target.closest('.annotation-view') ||
			target.closest('.annotation-controls')) {
			return;
		}

		const selection = window.getSelection();
		const text = selection?.toString().trim();
		const content = document.querySelector(contentSelector);

		if (text && text.length > 0 && content && selection?.anchorNode && content.contains(selection.anchorNode)) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();

			currentSelection = {
				text,
				exact: text,
				prefix: getTextContext(content, range, 'before', 30),
				suffix: getTextContext(content, range, 'after', 30),
				start: getTextOffset(content, range.startContainer, range.startOffset),
				end: getTextOffset(content, range.endContainer, range.endOffset),
				rect
			};
		}
	}

	function getTextContext(root: Element, range: Range, direction: 'before' | 'after', chars: number): string {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		let fullText = '';
		let rangeStart = 0;

		while (walker.nextNode()) {
			if (walker.currentNode === range.startContainer) {
				rangeStart = fullText.length + range.startOffset;
			}
			fullText += walker.currentNode.textContent || '';
		}

		if (direction === 'before') {
			return fullText.slice(Math.max(0, rangeStart - chars), rangeStart);
		} else {
			const rangeEnd = rangeStart + range.toString().length;
			return fullText.slice(rangeEnd, rangeEnd + chars);
		}
	}

	function getTextOffset(root: Element, node: Node, offset: number): number {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		let total = 0;

		while (walker.nextNode()) {
			if (walker.currentNode === node) {
				return total + offset;
			}
			total += (walker.currentNode.textContent || '').length;
		}
		return total;
	}

	function requestUsername(): string | null {
		if (isLoggedIn && githubUser) {
			return githubUser.name;
		}
		const name = prompt("What's your name?");
		if (name) {
			anonAuth.setName(name);
			username = name;
		}
		return name;
	}

	function loginWithGitHub() {
		// Store current URL to return to after auth
		if (browser) {
			sessionStorage.setItem('auth-return-to', window.location.pathname);
		}
		githubAuth.login();
	}

	async function logout() {
		await githubAuth.logout();
		githubUser = null;
		isLoggedIn = false;
		username = anonAuth.getName() || '';
		store = new FilesystemStore();
	}

	function openForm() {
		if (!currentSelection) return;

		// If GitHub mode and not logged in, prompt to login
		if (useGitHub && !isLoggedIn) {
			loginWithGitHub();
			return;
		}

		// Check for username first (anonymous mode)
		if (!username) {
			const name = requestUsername();
			if (!name) return;
		}

		formPosition = {
			x: Math.max(10, currentSelection.rect.left),
			y: currentSelection.rect.bottom + window.scrollY + 10
		};
		showForm = true;
	}

	function submitAnnotation(text: string) {
		if (!text || !currentSelection) return;

		const annotation: Annotation = {
			id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
			target: {
				selectors: [
					{
						type: 'TextQuoteSelector',
						exact: currentSelection.exact,
						prefix: currentSelection.prefix,
						suffix: currentSelection.suffix
					},
					{
						type: 'TextPositionSelector',
						start: currentSelection.start,
						end: currentSelection.end
					}
				]
			},
			body: {
				text,
				author: username,
				createdAt: Date.now()
			},
			replies: []
		};

		annotations = [...annotations, annotation];
		saveAnnotations();
		renderHighlights();

		showForm = false;
		currentSelection = null;
		window.getSelection()?.removeAllRanges();
	}

	function submitReply(text: string) {
		if (!text || !viewingAnnotation) return;

		const reply: Reply = {
			id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
			author: username,
			text,
			createdAt: Date.now()
		};

		// Update annotation with new reply
		annotations = annotations.map(a => {
			if (a.id === viewingAnnotation!.id) {
				return { ...a, replies: [...(a.replies || []), reply] };
			}
			return a;
		});

		// Update viewing annotation
		viewingAnnotation = { ...viewingAnnotation, replies: [...(viewingAnnotation.replies || []), reply] };

		saveAnnotations();
	}

	async function saveAnnotations() {
		if (browser) {
			const success = await store.save(slug, annotations);
			if (!success && useGitHub && isLoggedIn) {
				alert('Failed to save annotation. You may not have write access to the repository.');
			}
		}
	}

	function renderHighlights() {
		const content = document.querySelector(contentSelector);
		if (!content) return;

		// Remove existing highlights
		content.querySelectorAll('.annotated-text').forEach(el => {
			const text = el.textContent || '';
			el.replaceWith(document.createTextNode(text));
		});
		content.normalize();

		// Re-apply highlights
		for (const ann of annotations) {
			const selector = ann.target.selectors.find(s => s.type === 'TextQuoteSelector');
			if (!selector || selector.type !== 'TextQuoteSelector' || !selector.exact) continue;

			const range = findTextInNode(content, selector.exact, selector.prefix, selector.suffix);
			if (range) {
				highlightRange(range, ann.id);
			}
		}
	}

	function findTextInNode(root: Element, exact: string, prefix?: string, suffix?: string): Range | null {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		let fullText = '';
		const nodes: Array<{ node: Text; start: number }> = [];

		while (walker.nextNode()) {
			nodes.push({ node: walker.currentNode as Text, start: fullText.length });
			fullText += walker.currentNode.textContent || '';
		}

		// Find the text
		let index = fullText.indexOf(exact);

		// Use context to disambiguate if needed
		if (index !== -1 && (prefix || suffix)) {
			const searchWithContext = (prefix || '') + exact + (suffix || '');
			const contextIndex = fullText.indexOf(searchWithContext);
			if (contextIndex !== -1) {
				index = contextIndex + (prefix || '').length;
			}
		}

		if (index === -1) return null;

		// Convert to range
		const range = document.createRange();
		let startSet = false, endSet = false;

		for (const { node, start } of nodes) {
			const end = start + (node.textContent || '').length;

			if (!startSet && index >= start && index < end) {
				range.setStart(node, index - start);
				startSet = true;
			}

			if (!endSet && index + exact.length > start && index + exact.length <= end) {
				range.setEnd(node, index + exact.length - start);
				endSet = true;
			}

			if (startSet && endSet) break;
		}

		return (startSet && endSet) ? range : null;
	}

	function highlightRange(range: Range, annotationId: string) {
		try {
			const span = document.createElement('span');
			span.className = 'annotated-text';
			span.dataset.annotationId = annotationId;
			span.addEventListener('click', (e) => {
				e.stopPropagation();
				showAnnotation(annotationId, e.target as HTMLElement);
			});
			range.surroundContents(span);
		} catch (e) {
			// Range spans multiple elements
			console.log('Complex range, skipping highlight');
		}
	}

	function showAnnotation(id: string, element: HTMLElement) {
		const ann = annotations.find(a => a.id === id);
		if (!ann) return;

		viewingAnnotation = ann;
		const rect = element.getBoundingClientRect();
		viewPosition = {
			x: rect.left,
			y: rect.bottom + window.scrollY + 10
		};
	}

	function copyMarkdown() {
		const markdown = serializeAnnotationsMarkdown(annotations);
		navigator.clipboard.writeText(markdown);
		alert('Annotations markdown copied to clipboard!\n\nPaste this into annotations.md in your writing folder.');
	}
</script>

<!-- Selection popover -->
{#if currentSelection && !showForm}
	<div
		class="annotation-popover"
		style="left: {currentSelection.rect.left + currentSelection.rect.width / 2}px; top: {currentSelection.rect.top + window.scrollY - 45}px;"
	>
		{#if useGitHub && !isLoggedIn}
			<button onclick={loginWithGitHub}>login to annotate</button>
		{:else}
			<button onclick={openForm}>annotate</button>
		{/if}
	</div>
{/if}

<!-- Annotation form -->
{#if showForm && currentSelection}
	<div
		class="annotation-form"
		style="left: {formPosition.x}px; top: {formPosition.y}px;"
	>
		<AnnotationEditor
			selectedText={currentSelection.text}
			onSubmit={submitAnnotation}
			onCancel={() => { showForm = false; currentSelection = null; }}
		/>
	</div>
{/if}

<!-- View annotation with replies -->
{#if viewingAnnotation}
	<div
		class="annotation-view"
		style="left: {viewPosition.x}px; top: {viewPosition.y}px;"
	>
		<AnnotationThread
			annotation={viewingAnnotation}
			{username}
			onReply={submitReply}
			onClose={() => viewingAnnotation = null}
			onRequestUsername={requestUsername}
		/>
	</div>
{/if}

<!-- Annotation controls + auth status -->
<div class="annotation-controls">
	{#if useGitHub}
		{#if isLoggedIn && githubUser}
			<img src={githubUser.avatar} alt="" class="avatar" />
			<span class="username">{githubUser.name}</span>
			<button class="auth-btn" onclick={logout}>logout</button>
		{:else}
			<button class="auth-btn github" onclick={loginWithGitHub}>
				<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
					<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
				</svg>
				login with github
			</button>
		{/if}
		<span class="divider">|</span>
	{/if}

	{#if annotations.length > 0}
		<span class="count">{annotations.length} note{annotations.length === 1 ? '' : 's'}</span>
		<button class="export-btn" onclick={copyMarkdown} title="Copy as markdown">📋</button>
	{:else}
		<span class="count">no notes yet</span>
	{/if}
</div>

<style>
	:global(.annotated-text) {
		background: rgba(255, 220, 100, 0.35);
		cursor: pointer;
		border-radius: 2px;
		transition: background 0.15s;
	}

	:global(.annotated-text:hover) {
		background: rgba(255, 220, 100, 0.6);
	}

	.annotation-popover {
		position: absolute;
		background: var(--text, #222);
		color: var(--bg, #fff);
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 0.8rem;
		z-index: 1000;
		transform: translateX(-50%);
		box-shadow: 0 2px 8px rgba(0,0,0,0.2);
	}

	.annotation-popover::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-top-color: var(--text, #222);
	}

	.annotation-popover button {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
	}

	.annotation-form {
		position: absolute;
		background: var(--bg, #fff);
		border: 1px solid var(--accent, #ccc);
		border-radius: 8px;
		padding: 12px;
		width: 280px;
		z-index: 1001;
		box-shadow: 0 4px 16px rgba(0,0,0,0.15);
	}

	.annotation-view {
		position: absolute;
		background: var(--bg, #fff);
		border: 1px solid var(--accent, #ddd);
		border-radius: 8px;
		padding: 12px;
		width: 280px;
		max-height: 400px;
		overflow-y: auto;
		z-index: 1001;
		box-shadow: 0 4px 16px rgba(0,0,0,0.15);
	}

	.annotation-controls {
		position: fixed;
		bottom: 20px;
		right: 20px;
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--bg, #fff);
		border: 1px solid var(--accent, #ddd);
		color: var(--text, #222);
		padding: 8px 14px;
		border-radius: 20px;
		font-size: 0.75rem;
		z-index: 999;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	.annotation-controls .count {
		opacity: 0.7;
	}

	.annotation-controls .divider {
		opacity: 0.3;
	}

	.annotation-controls .avatar {
		width: 20px;
		height: 20px;
		border-radius: 50%;
	}

	.annotation-controls .username {
		font-weight: 500;
	}

	.auth-btn {
		background: none;
		border: 1px solid var(--accent, #ddd);
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.7rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 4px;
		color: var(--text, #222);
	}

	.auth-btn:hover {
		background: rgba(0,0,0,0.05);
	}

	.auth-btn.github {
		background: #24292e;
		color: white;
		border: none;
	}

	.auth-btn.github:hover {
		background: #1a1e22;
	}

	.export-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0;
		opacity: 0.6;
	}

	.export-btn:hover {
		opacity: 1;
	}
</style>
