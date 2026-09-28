<script lang="ts">
	import type { Phase } from './types';

	// Preview-mode controls (?preview): jump between phases and step the
	// conversation with canned replies, against the mock client.
	interface Props {
		phase: Phase;
		busy: boolean;
		elapsedSeconds: number;
		turnCount: number;
		ongoto: (phase: Phase) => void;
		onstep: () => void;
		onend: () => void;
		onreset: () => void;
	}

	let { phase, busy, elapsedSeconds, turnCount, ongoto, onstep, onend, onreset }: Props = $props();

	let open = $state(true);
</script>

<aside class="dev-panel" class:dev-panel-collapsed={!open}>
	<button class="dev-toggle" onclick={() => (open = !open)} title="toggle dev panel">
		{open ? '×' : '⚙'}
	</button>
	{#if open}
		<div class="dev-body">
			<div class="dev-section">
				<div class="dev-label">preview mode</div>
				<p class="dev-hint">no api calls · canned responses · zero credits</p>
			</div>
			<div class="dev-section">
				<div class="dev-label">jump to phase</div>
				<div class="dev-row">
					<button onclick={() => ongoto('welcome')} class:active={phase === 'welcome'}>welcome</button>
					<button onclick={() => ongoto('conversation')} class:active={phase === 'conversation'}
						>conversation</button
					>
					<button onclick={() => ongoto('notes')} class:active={phase === 'notes'}>notes</button>
					<button onclick={() => ongoto('done')} class:active={phase === 'done'}>done</button>
				</div>
			</div>
			<div class="dev-section">
				<div class="dev-label">step conversation</div>
				<div class="dev-row">
					<button onclick={onstep} disabled={busy}>
						{phase === 'conversation' ? '＋ canned reply →' : 'start & step'}
					</button>
					<button onclick={onend} disabled={busy || phase !== 'conversation'}>→ end & notes</button>
				</div>
				<p class="dev-hint">sends a canned answer — no typing, no server</p>
			</div>
			<div class="dev-section dev-stats">
				elapsed {elapsedSeconds}s · turns {turnCount} · busy {busy ? 'y' : 'n'}
			</div>
			<button class="dev-reset" onclick={onreset}>reset everything</button>
		</div>
	{/if}
</aside>

<style>
	.dev-panel {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 60;
		min-width: 18rem;
		max-width: 22rem;
		padding: 0.75rem 0.9rem 0.9rem;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		background: color-mix(in srgb, var(--bg, #fff) 96%, var(--text) 4%);
		border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
		border-radius: 4px;
		box-shadow: 0 8px 30px color-mix(in srgb, #000 18%, transparent);
		opacity: 0.95;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}

	.dev-panel-collapsed {
		min-width: 0;
		padding: 0.3rem 0.4rem;
	}

	.dev-toggle {
		position: absolute;
		top: 0.25rem;
		right: 0.4rem;
		width: 1.4rem;
		height: 1.4rem;
		padding: 0;
		font-size: 1rem;
		line-height: 1;
		background: transparent;
		border: none;
		color: var(--text);
		opacity: 0.55;
		cursor: pointer;
	}
	.dev-toggle:hover {
		opacity: 1;
	}
	.dev-panel-collapsed .dev-toggle {
		position: relative;
		top: auto;
		right: auto;
	}

	.dev-body {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding-right: 1.2rem;
	}

	.dev-section {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.dev-label {
		opacity: 0.5;
		text-transform: lowercase;
		letter-spacing: 0.08em;
		font-size: 0.65rem;
	}

	.dev-hint {
		margin: 0;
		opacity: 0.55;
		font-size: 0.7rem;
		line-height: 1.4;
	}

	.dev-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.dev-row button {
		padding: 0.3rem 0.55rem;
		font-family: inherit;
		font-size: 0.7rem;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--text) 25%, transparent);
		border-radius: 3px;
		color: var(--text);
		opacity: 0.75;
		cursor: pointer;
		transition: all 0.15s;
	}
	.dev-row button:hover {
		opacity: 1;
		border-color: var(--accent);
		color: var(--accent);
	}
	.dev-row button.active {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		opacity: 1;
	}

	.dev-stats {
		opacity: 0.55;
		font-size: 0.7rem;
	}

	.dev-reset {
		padding: 0.4rem 0.7rem;
		font-family: inherit;
		font-size: 0.7rem;
		background: transparent;
		border: 1px dashed color-mix(in srgb, var(--text) 35%, transparent);
		border-radius: 3px;
		color: var(--text);
		opacity: 0.7;
		cursor: pointer;
		transition: all 0.15s;
		align-self: flex-start;
	}
	.dev-reset:hover {
		opacity: 1;
		border-style: solid;
		color: color-mix(in srgb, var(--accent) 80%, #c44 20%);
		border-color: currentColor;
	}
</style>
