<script lang="ts">
	import type { Revision } from '$lib/types/writing';

	interface Props {
		revisions: Revision[];
		currentIndex: number;
		onSelect: (index: number) => void;
	}

	let { revisions, currentIndex, onSelect }: Props = $props();

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: '2-digit'
		});
	}

	function formatTime(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<div class="timeline-container">
	<div class="timeline-track">
		{#each revisions as revision, i (revision.hash)}
			<button
				class="timeline-point"
				class:active={i === currentIndex}
				onclick={() => onSelect(i)}
			>
				<span class="point-dot"></span>
				<span class="point-label">
					<span class="point-date">{formatDate(revision.date)} at {formatTime(revision.date)}</span>
				</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.timeline-container {
		margin: 1rem 0;
	}

	.timeline-track {
		display: flex;
		flex-direction: column;
		gap: 0;
		position: relative;
		padding-left: 1rem;
	}

	.timeline-track::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 5px;
		width: 2px;
		background: var(--accent);
		opacity: 0.3;
	}

	.timeline-point {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0;
		background: none;
		border: none;
		cursor: pointer;
		position: relative;
		text-align: left;
	}

	.point-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--bg);
		border: 2px solid var(--accent);
		transition: all 0.2s ease;
		position: relative;
		z-index: 1;
		flex-shrink: 0;
		margin-left: -1rem;
	}

	.timeline-point:hover .point-dot {
		transform: scale(1.2);
	}

	.timeline-point.active .point-dot {
		background: var(--accent);
		transform: scale(1.2);
	}

	.point-label {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		font-size: 0.75rem;
		opacity: 0.6;
		transition: opacity 0.2s ease;
	}

	.timeline-point:hover .point-label,
	.timeline-point.active .point-label {
		opacity: 1;
	}

	.point-date {
		color: var(--accent);
		font-weight: 500;
	}

	.point-message {
		color: var(--text);
		opacity: 0.8;
	}
</style>
