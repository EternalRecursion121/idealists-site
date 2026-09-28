<script lang="ts">
	import { tick } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import type { Turn } from './types';

	interface Props {
		turns: Turn[];
		busy: boolean;
		elapsedSeconds: number;
		timeBudgetSeconds: number | null;
		writingNotes: boolean;
		/** coarse pointer: Enter newlines, the arrow button sends */
		isTouch: boolean;
		onsend: (text: string) => Promise<void> | void;
		onend: () => void;
		onreset: () => void;
	}

	let { turns, busy, elapsedSeconds, timeBudgetSeconds, writingNotes, isTouch, onsend, onend, onreset }: Props =
		$props();

	let inputText = $state('');
	let inputEl: HTMLTextAreaElement | null = $state(null);
	let composerFocused = $state(false);

	/** Used by the page after a turn finishes so typing can continue. */
	export function focusInput() {
		inputEl?.focus();
	}

	// Keep the composer pinned to the bottom of the viewport by following the
	// page as it grows. The page calls this on every typewriter tick during
	// streaming so the scroll appears continuous (tiny deltas = visually
	// smooth) instead of a single jarring jump at the end.
	//
	// Uses scrollIntoView({block:'end'}) on the composer-wrap so the *bottom
	// edge of the composer* (padding included) lands at the viewport bottom —
	// more reliable than scrolling to document.scrollHeight, which can lag
	// behind layout changes from autosize.
	//
	// `force` ignores the user-intent guard. By default, if the user has
	// scrolled up manually (>200px from bottom), we don't yank them back.
	export function ensureVisible(force = false) {
		if (typeof window === 'undefined') return;
		// Defer to the next frame so any pending layout (autosize, new turn,
		// streamed text) has actually been computed before we measure/scroll.
		requestAnimationFrame(() => {
			const docH = document.documentElement.scrollHeight;
			const winH = window.innerHeight;
			const y = window.scrollY;
			const fromBottom = docH - winH - y;
			if (!force && fromBottom > 200) return;
			const composerEl = document.querySelector('.composer-wrap') as HTMLElement | null;
			if (composerEl) {
				composerEl.scrollIntoView({ block: 'end', behavior: 'auto' });
			} else {
				window.scrollTo({ top: docH, behavior: 'auto' });
			}
		});
	}

	async function send() {
		if (!inputText.trim() || busy) return;
		const text = inputText.trim();
		// Synchronously shrink the textarea BEFORE the new turn is added — this
		// avoids a visible reflow where (a) we scroll, then (b) the autosize
		// $effect fires later and the page jumps.
		inputText = '';
		if (inputEl) {
			inputEl.value = '';
			autosize(inputEl);
		}
		await onsend(text);
		await tick();
		inputEl?.focus();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.isComposing) return; // let IME composition commit normally
		// Cmd/Ctrl+Enter always sends — power-user shortcut, and an escape hatch
		// if a touchscreen laptop gets misclassified as touch-only.
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			send();
			return;
		}
		// Plain Enter sends only with a physical keyboard. On touch the on-screen
		// Return key falls through to its default (newline); the send button is
		// the only way to send there.
		if (e.key === 'Enter' && !e.shiftKey && !isTouch) {
			e.preventDefault();
			send();
		}
	}

	// Linkify URLs in finished message text. Applied only to non-streaming
	// turns so we don't accidentally break a half-streamed link mid-token.
	const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?'")\]])/gi;
	function linkify(s: string): { kind: 'text' | 'link'; value: string }[] {
		const out: { kind: 'text' | 'link'; value: string }[] = [];
		let last = 0;
		let m: RegExpExecArray | null;
		URL_RE.lastIndex = 0;
		while ((m = URL_RE.exec(s)) !== null) {
			if (m.index > last) out.push({ kind: 'text', value: s.slice(last, m.index) });
			out.push({ kind: 'link', value: m[0] });
			last = m.index + m[0].length;
		}
		if (last < s.length) out.push({ kind: 'text', value: s.slice(last) });
		return out;
	}
	function hrefFor(url: string): string {
		return /^https?:\/\//i.test(url) ? url : `https://${url}`;
	}

	function fmtTime(s: number): string {
		if (s < 60) return `${s}s`;
		return `${Math.floor(s / 60)}m`;
	}

	function autosize(el: HTMLTextAreaElement | null) {
		if (!el) return;
		const before = el.style.height;
		el.style.height = 'auto';
		// Cap matches the .composer textarea max-height (14rem ≈ 224px at 16px root)
		const next = Math.min(el.scrollHeight, 224) + 'px';
		el.style.height = next;
		// If the composer just grew, pin the page to the bottom so the bottom
		// of the textarea (where the cursor is) stays in view. Force-scroll
		// because typing inherently means the user wants to see what they're
		// typing, regardless of the user-intent guard.
		if (before !== next) ensureVisible(true);
	}

	$effect(() => {
		if (inputText !== undefined) autosize(inputEl);
	});
</script>

<section class="convo" in:fade={{ duration: 400 }}>
	<div class="convo-meta">
		<span class="meta-elapsed">{fmtTime(elapsedSeconds)}</span>
		{#if timeBudgetSeconds}
			<span class="meta-divider">·</span>
			<span class="meta-budget">{fmtTime(timeBudgetSeconds)}</span>
		{/if}
		<span class="meta-divider">·</span>
		<button class="meta-end" onclick={onend} disabled={busy} title="end and review notes">
			end
		</button>
		{#if writingNotes}
			<span class="meta-divider">·</span>
			<span class="meta-writing">writing notes…</span>
		{/if}
	</div>

	<div class="transcript">
		<div class="transcript-inner">
			{#each turns as turn, ti (ti)}
				<article class="turn turn-{turn.role}" in:fly={{ y: 8, duration: 280 }}>
					<header class="turn-attr">
						{turn.role === 'interviewer' ? 'interviewer' : 'you'}
					</header>
					{#each turn.parts as part, pi (pi)}
						{#if part.kind === 'tool'}
							<div class="tool-line" class:tool-running={part.ok === null}>
								<span class="tool-dash">—</span>
								<span class="tool-label">{part.label}</span>
								{#if part.ok === null}
									<span class="tool-ellipsis">…</span>
								{/if}
							</div>
						{:else if turn.streaming}
							<div class="turn-text">{part.text}{#if turn.streaming && pi === turn.parts.length - 1}<span class="caret"></span>{/if}</div>
						{:else}
							<div class="turn-text">{#each linkify(part.text) as seg, si (si)}{#if seg.kind === 'link'}<a href={hrefFor(seg.value)} target="_blank" rel="noopener noreferrer">{seg.value}</a>{:else}{seg.value}{/if}{/each}</div>
						{/if}
					{/each}
				</article>
			{/each}
			{#if busy && (turns.length === 0 || (turns[turns.length - 1].role === 'interviewer' && turns[turns.length - 1].parts.length === 0))}
				<div class="thinking turn-interviewer" in:fade={{ duration: 200 }}>
					<span class="dot"></span><span class="dot"></span><span class="dot"></span>
					{#if turns.length === 0}
						<span class="thinking-label">warming up — reading the wiki, finding you in it</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<div class="composer-wrap">
		{#if turns.length > 0}
			<div class="end-row">
				<button
					class="reset-link"
					onclick={onreset}
					title="clear this conversation and start over (no notes filed)"
				>
					reset
				</button>
				<button
					class="end-review"
					onclick={onend}
					disabled={busy}
					title="end now and review your notes"
				>
					end & review notes →
				</button>
			</div>
		{/if}
		<div class="composer" class:composer-focused={composerFocused}>
			<textarea
				bind:this={inputEl}
				bind:value={inputText}
				onkeydown={onKeydown}
				onfocus={() => (composerFocused = true)}
				onblur={() => (composerFocused = false)}
				placeholder="say what's on your mind…"
				rows="1"
			></textarea>
			<button
				class="send-btn"
				onclick={send}
				disabled={!inputText.trim() || busy}
				title="send (↵)"
				aria-label="send message"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M5 12h14M13 6l6 6-6 6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
		<div class="composer-hint">
			{isTouch ? 'tap → to send' : '↵ to send · shift + ↵ for new line'}
		</div>
	</div>
</section>

<style>
	.convo {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - 2rem);
		padding-top: 0.75rem;
	}

	.convo-meta {
		position: fixed;
		top: 1rem;
		right: 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.04em;
		opacity: 0.45;
		color: var(--text);
		z-index: 10;
		transition: opacity 0.25s ease;
	}

	.convo-meta:hover {
		opacity: 0.9;
	}

	.meta-divider {
		opacity: 0.5;
	}

	.meta-end {
		padding: 0;
		font: inherit;
		color: inherit;
		background: transparent;
		border: none;
		cursor: pointer;
		text-transform: lowercase;
		opacity: 0.7;
		transition: color 0.15s, opacity 0.15s;
	}

	.meta-end:hover:not(:disabled) {
		opacity: 1;
		color: var(--accent);
	}

	.meta-end:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.meta-writing {
		color: var(--accent);
		opacity: 0.85;
	}

	.transcript {
		flex: 1;
		overflow-y: auto;
		padding: 0 0.5rem;
		scrollbar-width: thin;
		scrollbar-color: color-mix(in srgb, var(--text) 18%, transparent) transparent;
	}

	.transcript-inner {
		display: flex;
		flex-direction: column;
		gap: 2.25rem;
		padding: 2.5rem 0 3rem;
		max-width: 44rem;
		margin: 0 auto;
	}

	.turn {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		max-width: 86%;
	}

	.turn-interviewer {
		align-self: flex-start;
		align-items: flex-start;
		text-align: left;
	}

	.turn-participant {
		align-self: flex-end;
		align-items: flex-end;
		text-align: right;
	}

	.turn-attr {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		text-transform: lowercase;
		letter-spacing: 0.08em;
		opacity: 0.45;
	}

	.turn-interviewer .turn-attr {
		color: var(--accent);
		opacity: 0.75;
	}

	.turn-text {
		white-space: pre-wrap;
		font-size: 1.02rem;
		line-height: 1.6;
	}

	.turn-text a {
		color: var(--accent);
		text-decoration: none;
		border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
		transition: border-color 0.15s, opacity 0.15s;
	}
	.turn-text a:hover {
		border-bottom-color: var(--accent);
		opacity: 0.85;
	}

	.tool-line {
		display: inline-flex;
		align-items: baseline;
		gap: 0.45rem;
		font-family: var(--font-mono);
		font-size: 0.74rem;
		font-style: italic;
		letter-spacing: 0.02em;
		opacity: 0.55;
		padding: 0.1rem 0;
	}
	.turn-interviewer .tool-line {
		color: var(--accent);
		opacity: 0.7;
	}
	.tool-dash {
		opacity: 0.7;
	}
	.tool-running .tool-label::after {
		content: '';
	}
	.tool-ellipsis {
		display: inline-block;
		width: 1ch;
		animation: dot-pulse 1.4s ease-in-out infinite;
	}
	@keyframes dot-pulse {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 1; }
	}

	/* tiny blinking caret at the tail of the streaming text */
	.caret {
		display: inline-block;
		width: 0.5ch;
		margin-left: 1px;
		border-right: 2px solid currentColor;
		opacity: 0.6;
		animation: blink 1s steps(1, end) infinite;
		vertical-align: text-bottom;
		height: 1.05em;
	}
	@keyframes blink {
		50% { opacity: 0; }
	}

	.thinking {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.5rem 0;
		opacity: 0.55;
	}

	.thinking.turn-interviewer {
		align-self: flex-start;
	}

	.thinking-label {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		text-transform: lowercase;
		letter-spacing: 0.06em;
		opacity: 0.85;
		margin-left: 0.3rem;
	}

	.dot {
		width: 5px;
		height: 5px;
		background: var(--text);
		border-radius: 50%;
		animation: breathe 1.4s ease-in-out infinite;
	}

	.dot:nth-child(2) {
		animation-delay: 0.18s;
	}
	.dot:nth-child(3) {
		animation-delay: 0.36s;
	}

	@keyframes breathe {
		0%,
		100% {
			opacity: 0.25;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* composer — soft rounded card sticking to the bottom, send arrow inside */
	.composer-wrap {
		max-width: 44rem;
		width: 100%;
		margin: 0 auto;
		padding: 0.5rem 0.5rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.composer {
		position: relative;
		display: flex;
		align-items: flex-end;
		padding: 0.85rem 3.5rem 0.85rem 1.1rem;
		background: color-mix(in srgb, var(--text) 4%, transparent);
		border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
		border-radius: 14px;
		transition:
			border-color 0.18s ease,
			background 0.18s ease,
			box-shadow 0.18s ease;
	}

	.composer-focused {
		border-color: color-mix(in srgb, var(--accent) 60%, transparent);
		background: color-mix(in srgb, var(--text) 2%, transparent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
	}

	.composer textarea {
		flex: 1;
		font-family: inherit;
		font-size: 1.02rem;
		line-height: 1.55;
		background: transparent;
		border: none;
		color: var(--text);
		outline: none;
		resize: none;
		min-height: 1.55rem;
		max-height: 14rem;
		padding: 0;
	}

	.composer textarea::placeholder {
		opacity: 0.4;
		font-style: italic;
	}

	.send-btn {
		position: absolute;
		right: 0.55rem;
		bottom: 0.55rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		background: var(--accent);
		border: none;
		border-radius: 50%;
		color: var(--bg, #fff);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.send-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 35%, transparent);
	}

	.send-btn:disabled {
		background: color-mix(in srgb, var(--text) 18%, transparent);
		color: color-mix(in srgb, var(--text) 50%, transparent);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.composer-hint {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		text-transform: lowercase;
		letter-spacing: 0.06em;
		opacity: 0.4;
		text-align: center;
		padding: 0 0.5rem;
	}

	/* reset on the left, end-and-review pill on the right, above the composer */
	.end-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		padding: 0 0.5rem 0.4rem;
		max-width: 44rem;
		margin: 0 auto;
		width: 100%;
	}

	.reset-link {
		padding: 0;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		opacity: 0.45;
		background: transparent;
		border: none;
		color: var(--text);
		cursor: pointer;
		text-decoration: underline dotted;
		text-underline-offset: 4px;
		transition: opacity 0.15s ease;
	}
	.reset-link:hover {
		opacity: 0.85;
	}

	.end-review {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.85rem;
		font-family: var(--font-mono);
		font-size: 0.74rem;
		letter-spacing: 0.04em;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
		border-radius: 999px;
		color: var(--accent);
		cursor: pointer;
		opacity: 0.85;
		transition:
			opacity 0.15s ease,
			background 0.15s ease,
			border-color 0.15s ease;
	}
	.end-review:hover:not(:disabled) {
		opacity: 1;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		border-color: var(--accent);
	}
	.end-review:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
</style>
