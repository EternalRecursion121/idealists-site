<script lang="ts">
	import type { WritingMetadata } from '$lib/types/writing';

	interface Props {
		data: {
			writings: WritingMetadata[];
		};
	}

	let { data }: Props = $props();

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Writings — The Idealists Collective</title>
</svelte:head>

<section>
	{#if data.writings.length === 0}
		<p class="opacity-60 italic">coming soon</p>
	{:else}
		<ul class="space-y-8">
			{#each data.writings as writing (writing.slug)}
				<li>
					<a href="/writings/{writing.slug}" class="block group">
						<h2 class="font-semibold mb-1 group-hover:opacity-70">{writing.title}</h2>
						{#if writing.description}
							<p class="text-sm opacity-60 mb-2">{writing.description}</p>
						{/if}
						<div class="text-xs opacity-40 flex gap-3">
							<span>{formatDate(writing.updatedAt)}</span>
							<span>•</span>
							<span>{writing.revisionCount} revision{writing.revisionCount !== 1 ? 's' : ''}</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
