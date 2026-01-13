<script lang="ts">
	import type { DiffResult } from '$lib/types/writing';

	interface Props {
		diff: DiffResult;
	}

	let { diff }: Props = $props();

	// Separate lines into old (left) and new (right) columns
	let leftLines = $derived(
		diff.lines.filter((line) => line.type === 'remove' || line.type === 'context')
	);

	let rightLines = $derived(
		diff.lines.filter((line) => line.type === 'add' || line.type === 'context')
	);
</script>

<div class="diff-container">
	<div class="diff-header">
		<div class="diff-stats">
			<span class="stat additions">+{diff.additions}</span>
			<span class="stat deletions">−{diff.deletions}</span>
		</div>
	</div>

	<div class="diff-columns">
		<div class="diff-column old">
			<div class="column-header">previous</div>
			<div class="column-content">
				{#each leftLines as line}
					<div class="diff-line" class:removed={line.type === 'remove'}>
						<span class="line-number">{line.oldLineNumber ?? ''}</span>
						<span class="line-content">{line.content || ' '}</span>
					</div>
				{/each}
			</div>
		</div>

		<div class="diff-column new">
			<div class="column-header">current</div>
			<div class="column-content">
				{#each rightLines as line}
					<div class="diff-line" class:added={line.type === 'add'}>
						<span class="line-number">{line.newLineNumber ?? ''}</span>
						<span class="line-content">{line.content || ' '}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.diff-container {
		border: 1px solid var(--accent);
		border-radius: 4px;
		overflow: hidden;
		margin: 1rem 0;
		font-family: 'Source Code Pro', monospace;
		font-size: 0.75rem;
	}

	.diff-header {
		padding: 0.5rem 1rem;
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		border-bottom: 1px solid var(--accent);
	}

	.diff-stats {
		display: flex;
		gap: 1rem;
	}

	.stat {
		font-weight: 600;
	}

	.stat.additions {
		color: #22c55e;
	}

	.stat.deletions {
		color: #ef4444;
	}

	.diff-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	.diff-column {
		overflow-x: auto;
	}

	.diff-column.old {
		border-right: 1px solid var(--accent);
	}

	.column-header {
		padding: 0.25rem 0.5rem;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.5;
		border-bottom: 1px solid var(--accent);
	}

	.column-content {
		min-height: 100px;
	}

	.diff-line {
		display: flex;
		line-height: 1.5;
	}

	.diff-line.added {
		background: rgba(34, 197, 94, 0.15);
	}

	.diff-line.removed {
		background: rgba(239, 68, 68, 0.15);
	}

	.line-number {
		min-width: 2.5rem;
		padding: 0 0.5rem;
		text-align: right;
		color: var(--text);
		opacity: 0.3;
		user-select: none;
		border-right: 1px solid var(--accent);
	}

	.line-content {
		padding: 0 0.5rem;
		white-space: pre-wrap;
		word-break: break-word;
		flex: 1;
	}

	@media (max-width: 640px) {
		.diff-columns {
			grid-template-columns: 1fr;
		}

		.diff-column.old {
			border-right: none;
			border-bottom: 1px solid var(--accent);
		}
	}
</style>
