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
