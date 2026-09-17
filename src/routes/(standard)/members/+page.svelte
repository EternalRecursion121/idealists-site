<script lang="ts">
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

<section>
	<!-- same row pitch as before, but padding (not dead space between rows)
	     carries it, so each name is a ~32px tap target instead of 21px -->
	<ul class="space-y-1.5 inline-block">
		{#each data.members as member}
			<li>
				{#if member.url}
					<a
						href={member.url}
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-2 py-1.5 hover:opacity-70"
					>
						<span>{member.name}</span>
						<span class="text-xs opacity-50">↗</span>
					</a>
				{:else}
					<span class="inline-block py-1.5">{member.name}</span>
				{/if}
			</li>
		{/each}
		<li>
			<a
				href="/join"
				class="inline-flex items-center gap-2 py-1.5 hover:opacity-70"
			>
				<span>you?</span>
				<span class="text-xs opacity-50">↗</span>
			</a>
		</li>
	</ul>
</section>
