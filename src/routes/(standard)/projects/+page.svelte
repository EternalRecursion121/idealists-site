<script lang="ts">
	import type { Project } from './+page.server';

	interface Props {
		data: {
			projects: Project[];
		};
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Projects — The Idealists Collective</title>
</svelte:head>

<section class="space-y-8">
	{#each data.projects as project}
		<article>
			{#if project.url}
				<a href={project.url} target="_blank" rel="noopener" class="group">
					<h2 class="font-semibold mb-2 group-hover:opacity-70">{project.name}</h2>
				</a>
			{:else}
				<h2 class="font-semibold mb-2">{project.name}</h2>
			{/if}
			<p class="text-sm opacity-70 max-w-md">{project.description}</p>
		</article>
	{/each}
</section>
