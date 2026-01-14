<script lang="ts">
	import type { WritingMetadata } from '$lib/types/writing';
	import BottomNav from '$lib/components/BottomNav.svelte';

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

<div class="max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-16 min-h-screen flex flex-col">
	<header class="mb-8 sm:mb-12 text-center">
		<h1 class="text-2xl sm:text-3xl font-semibold mb-4">writings</h1>
		<p class="opacity-70 max-w-xs mx-auto text-sm">essays and thoughts from the collective</p>
	</header>

	<section class="text-center">
		{#if data.writings.length === 0}
			<p class="opacity-60 italic">coming soon</p>
		{:else}
			<ul class="space-y-6 inline-block">
				{#each data.writings as writing (writing.slug)}
					<li>
						<a href="/writings/{writing.slug}" class="block group">
							<h2 class="font-semibold mb-1 group-hover:opacity-70">{writing.title}</h2>
							{#if writing.description}
								<p class="text-sm opacity-60 mb-2">{writing.description}</p>
							{/if}
							<div class="text-xs opacity-40 flex gap-3 justify-center">
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

	<BottomNav current="writings" />
</div>
