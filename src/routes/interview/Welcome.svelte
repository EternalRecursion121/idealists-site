<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		memberHint: string;
		busy: boolean;
		errorMessage: string;
		/** a saved conversation was restored: offer the escape hatch */
		hasPersisted: boolean;
		onbegin: () => void;
		onhuman: () => void;
		onreset: () => void;
	}

	let {
		memberHint = $bindable(),
		busy,
		errorMessage,
		hasPersisted,
		onbegin,
		onhuman,
		onreset
	}: Props = $props();

	// Inline typewriter for the "* (honorary member of the collective)" reveal.
	// Char-by-char into the live DOM so the text wraps with the surrounding line.
	const ASIDE_FULL = ' (honorary member of the collective)';
	let asideShown = $state('');
	let asideTimer: ReturnType<typeof setInterval> | null = null;

	function clearAsideTimer() {
		if (asideTimer) {
			clearInterval(asideTimer);
			asideTimer = null;
		}
	}

	function startAsideReveal() {
		clearAsideTimer();
		asideTimer = setInterval(() => {
			if (asideShown.length >= ASIDE_FULL.length) {
				clearAsideTimer();
				return;
			}
			asideShown = ASIDE_FULL.slice(0, asideShown.length + 1);
		}, 8);
	}

	function stopAsideReveal() {
		clearAsideTimer();
		asideTimer = setInterval(() => {
			if (asideShown.length <= 0) {
				clearAsideTimer();
				return;
			}
			asideShown = asideShown.slice(0, -1);
		}, 5);
	}

	onDestroy(clearAsideTimer);
</script>

<section class="welcome" in:fade={{ duration: 600 }}>
	<h1 class="display-title">
		<span class="title-line-1">collective</span>
		<span class="title-line-2">conversation</span>
	</h1>

	<div class="rule"></div>

	<p class="lede">
		a two way interview with claude<span
			class="asterisk-wrap"
			tabindex="0"
			role="button"
			aria-label="(honorary member of the collective)"
			onmouseenter={startAsideReveal}
			onmouseleave={stopAsideReveal}
			onfocus={startAsideReveal}
			onblur={stopAsideReveal}
			><span class="ast">*</span><span class="aside-inline">{asideShown}</span></span
		> for you to find out everything that's going on in the collective, and have your say on its future.
	</p>

	<div class="form">
		<label class="field">
			<span class="field-label">name or handle <em>· optional</em></span>
			<input
				class="underline-input"
				type="text"
				bind:value={memberHint}
				placeholder="e.g. samuel, eternalrecursion"
				spellcheck="false"
				autocomplete="off"
				disabled={busy}
			/>
		</label>

		{#if errorMessage}
			<p class="error" in:fade>{errorMessage}</p>
		{/if}

		<div class="actions">
			<button class="begin-btn" onclick={onbegin} disabled={busy} aria-busy={busy}>
				<span class="begin-text">{busy ? 'opening' : 'begin'}</span>
				<svg
					class="begin-arrow"
					aria-hidden="true"
					width="22"
					height="14"
					viewBox="0 0 22 14"
					fill="none"
				>
					<path
						d="M1 7 H20 M14 1 L20 7 L14 13"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>

			<div class="actions-divider">
				<span class="divider-line"></span>
				<span class="divider-text">or</span>
				<span class="divider-line"></span>
			</div>

			<button class="human-btn" onclick={onhuman} disabled={busy}>
				screw ai, i want to talk to a human
			</button>
		</div>

		{#if hasPersisted}
			<button class="start-fresh" onclick={onreset} title="clear saved conversation and start over">
				or — clear the saved conversation and start fresh
			</button>
		{/if}
	</div>
</section>

<style>
	.asterisk-wrap {
		display: inline;
		cursor: help;
		outline: none;
	}

	.ast {
		color: var(--accent);
		font-weight: 600;
		padding: 0 0.05em;
	}

	.aside-inline {
		color: var(--accent);
		opacity: 0.85;
		font-style: italic;
		white-space: pre-wrap;
	}

	.actions-divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		max-width: 18rem;
		margin: 0.25rem 0;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		text-transform: lowercase;
		letter-spacing: 0.18em;
		opacity: 0.4;
	}

	.divider-line {
		flex: 1;
		height: 1px;
		background: currentColor;
	}

	.divider-text {
		flex-shrink: 0;
	}

	.human-btn {
		padding: 0.4rem 0;
		font-family: inherit;
		font-size: 0.85rem;
		line-height: 1;
		background: transparent;
		border: none;
		color: var(--text);
		opacity: 0.55;
		cursor: pointer;
		text-decoration: none;
		border-bottom: 1px dashed color-mix(in srgb, var(--text) 30%, transparent);
		transition: all 0.2s ease;
	}

	.human-btn:hover:not(:disabled) {
		opacity: 1;
		color: var(--accent);
		border-bottom-color: var(--accent);
		border-bottom-style: solid;
	}

	.human-btn:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}

	/* "start fresh" escape hatch (only when persisted state is loaded) */
	.start-fresh {
		display: block;
		margin-top: 1.5rem;
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
	.start-fresh:hover {
		opacity: 0.85;
	}
</style>
