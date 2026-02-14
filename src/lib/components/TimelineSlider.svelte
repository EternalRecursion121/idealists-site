<script lang="ts">
	import type { Revision } from '$lib/types/writing';

	interface Props {
		revisions: Revision[];
		currentIndex: number;
		onSelect: (index: number) => void;
		branches?: {
			url: string;
			label: string;
			repo?: string;
			path?: string;
			revisions?: Revision[];
		}[];
		style?: 'default' | 'notebook';
	}

	let { revisions, currentIndex, onSelect, branches, style }: Props = $props();

	// Track element positions for SVG line drawing
	let containerEl = $state<HTMLDivElement>();
	let leftTrackEl = $state<HTMLDivElement>();
	let rightTrackEl = $state<HTMLDivElement>();
	let leftLineX = $state(0);
	let rightLineX = $state(0);
	let containerWidth = $state(400);
	const curveTopY = 6;
	const curveBottomY = 56;

	const rootX = $derived.by(() => {
		if (!leftLineX || !rightLineX) return containerWidth / 2;
		return (leftLineX + rightLineX) / 2;
	});

	const curveControlY = $derived((curveTopY + curveBottomY) / 2);

	$effect(() => {
		if (!containerEl || !leftTrackEl || !branches?.length) return;
		const container = containerEl;
		const leftTrack = leftTrackEl;

		const updatePositions = () => {
			const containerRect = container.getBoundingClientRect();
			const leftRect = leftTrack.getBoundingClientRect();

			containerWidth = containerRect.width;
			// The line is 5px from left edge of track
			leftLineX = leftRect.left - containerRect.left + 5;

			if (rightTrackEl) {
				const rightRect = rightTrackEl.getBoundingClientRect();
				rightLineX = rightRect.left - containerRect.left + 5;
			}
		};

		updatePositions();
		window.addEventListener('resize', updatePositions);
		return () => window.removeEventListener('resize', updatePositions);
	});

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

{#if branches?.length}
	<!-- Branching layout -->
	<div class="branch-container" class:notebook={style === 'notebook'} bind:this={containerEl}>
		<!-- SVG header with root node and curves - coordinates calculated from actual element positions -->
		<svg class="branch-header-svg" viewBox="0 0 {containerWidth} 56" preserveAspectRatio="xMidYMid meet">
			<!-- Left branch curve -->
			<path d="M{rootX},{curveTopY} C{rootX},{curveControlY} {leftLineX},{curveControlY} {leftLineX},{curveBottomY}" fill="none" stroke="var(--accent)" stroke-width="2" opacity="0.3"/>
			<!-- Right branch curve -->
			<path d="M{rootX},{curveTopY} C{rootX},{curveControlY} {rightLineX},{curveControlY} {rightLineX},{curveBottomY}" fill="none" stroke="var(--accent)" stroke-width="2" opacity="0.3"/>
		</svg>

		<!-- Two-column layout -->
		<div class="branches-row">
			<!-- Left: idealists commits -->
			<div class="branch branch-local">
				<div class="branch-label">idealists</div>
				<div class="branch-track" bind:this={leftTrackEl}>
					{#each revisions as revision, i (revision.hash)}
						<button
							class="timeline-point"
							class:active={i === currentIndex}
							onclick={() => onSelect(i)}
						>
							<span class="point-dot"></span>
							<span class="point-label">
								<span class="point-date">{formatDate(revision.date)} at {formatTime(revision.date)}</span>
								<span class="point-message">{revision.message}</span>
							</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Right: external branches -->
			{#each branches as branch (branch.url)}
				<div class="branch branch-external">
					<div class="branch-label">{branch.label}</div>
					<div class="branch-track" bind:this={rightTrackEl}>
						{#if branch.revisions?.length}
							{#each branch.revisions as revision, j (revision.hash)}
								<a
									href={branch.url}
									target="_blank"
									rel="noopener"
									class="timeline-point external-point"
									class:first-external={j === 0}
								>
									<span class="point-dot"></span>
									<span class="point-label">
										<span class="point-date">{formatDate(revision.date)} at {formatTime(revision.date)}</span>
										<span class="point-message">{revision.message}</span>
									</span>
								</a>
							{/each}
						{:else}
							<a
								href={branch.url}
								target="_blank"
								rel="noopener"
								class="timeline-point external-point first-external"
							>
								<span class="point-dot"></span>
								<span class="point-label">
									<span class="point-date">current</span>
									<span class="point-message external-link">
										<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
											<path d="M10 2h4v4M14 2L7 9M12 9v5H2V4h5" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
										view on {branch.label}
									</span>
								</span>
							</a>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
{:else}
	<!-- Simple linear layout (no branches) -->
	<div class="timeline-container" class:notebook={style === 'notebook'}>
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
						<span class="point-message">{revision.message}</span>
					</span>
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	/* ===== Branching Layout ===== */
	.branch-container {
		margin: 1rem 0;
	}

	.branch-header-svg {
		display: block;
		width: 100%;
		height: 56px;
	}

	.branches-row {
		display: flex;
		gap: 2rem;
		justify-content: center;
		margin-top: -1rem;
		padding-top: 1rem;
	}

	.branch {
		flex: 1;
		max-width: 300px;
	}

	.branch-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent);
		opacity: 0.6;
		margin-bottom: 0.5rem;
		padding-left: 1rem;
	}

	.branch-track {
		position: relative;
		padding-left: 1rem;
	}

	.branch-track::before {
		content: '';
		position: absolute;
		top: -1rem;
		bottom: 0;
		left: 5px;
		width: 2px;
		background: var(--accent);
		opacity: 0.3;
	}

	/* External branch track line extends full height like local */

	/* ===== Simple Linear Layout ===== */
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

	/* ===== Shared Point Styles ===== */
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
		font-family: inherit;
		color: inherit;
	}

	.external-point {
		text-decoration: none;
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

	.timeline-point:hover .point-label {
		opacity: 1;
	}

	.timeline-point.active .point-label {
		opacity: 1;
	}

	.point-date {
		color: var(--accent);
		font-weight: 500;
	}

	.timeline-point.active .point-date {
		font-style: italic;
	}

	.point-message {
		color: var(--text);
		opacity: 0.8;
		transition: color 0.15s ease, opacity 0.15s ease;
	}

	.timeline-point.active .point-message {
		color: var(--accent);
		opacity: 1;
	}

	/* External link styling */
	.external-link {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.external-link svg {
		opacity: 0.6;
	}

	.external-point:hover .external-link svg {
		opacity: 1;
	}

	.external-point:hover .point-dot {
		background: var(--accent);
	}

	/* ===== Notebook Style ===== */
	.branch-container.notebook,
	.timeline-container.notebook {
		font-family: 'Reenie Beanie', cursive;
	}

	.notebook .branch-label {
		font-size: 1rem;
		letter-spacing: 0;
		text-transform: none;
	}

	.notebook .point-label {
		font-size: 1.1rem;
	}

	.notebook .point-date {
		font-size: 1rem;
	}

	.notebook .point-message {
		font-size: 1.1rem;
	}

	.notebook .point-dot {
		border-color: rgba(225, 182, 14, 0.8);
	}

	.notebook .timeline-point.active .point-dot {
		background: rgba(225, 182, 14, 0.8);
		border-color: rgba(225, 182, 14, 0.8);
	}

	.notebook .branch-track::before,
	.notebook .timeline-track::before {
		background: rgba(225, 182, 14, 0.5);
	}

	:global(.notebook) .branch-header-svg path {
		stroke: rgba(225, 182, 14, 0.8);
	}
</style>
