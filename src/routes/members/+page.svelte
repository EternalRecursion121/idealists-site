<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
	import type { Member } from './+page.server';

	interface Props {
		data: {
			members: Member[];
		};
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Members — The Idealists Collective</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-16 min-h-screen flex flex-col">
	<header class="mb-8 sm:mb-12 text-center">
		<h1 class="text-2xl sm:text-3xl font-semibold mb-4">members</h1>
		<p class="opacity-70 max-w-xs mx-auto">the people behind the collective</p>
	</header>

	<section class="text-center">
		<ul class="space-y-4 inline-block">
			{#each data.members as member (member.name)}
				<li>
					{#if member.url}
						<a
							href={member.url}
							target="_blank"
							rel="noopener"
							class="inline-flex items-center gap-2 hover:opacity-70"
						>
							<span>{member.name}</span>
							<span class="text-xs opacity-50">↗</span>
						</a>
					{:else}
						<span>{member.name}</span>
					{/if}
				</li>
			{/each}
			<li>
				<a
					href="/join"
					class="inline-flex items-center gap-2 hover:opacity-70"
				>
					<span>you?</span>
					<span class="text-xs opacity-50">↗</span>
				</a>
			</li>
		</ul>
	</section>

	<BottomNav current="members" />
</div>
