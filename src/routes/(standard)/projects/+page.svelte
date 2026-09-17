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
				{@const isExternal = project.url.startsWith('http')}
				<a href={project.url} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener' : undefined} class="inline-block gutter-link">
					<!-- same marker as /members, so linked projects are tellable from unlinked ones without hover -->
					<h2 class="font-semibold mb-2">
						{project.name}
						<span class="text-xs font-normal opacity-50 ml-1">{isExternal ? '↗' : '→'}</span>
					</h2>
				</a>
			{:else}
				<h2 class="font-semibold mb-2">{project.name}</h2>
			{/if}
			<p class="text-sm opacity-70 max-w-md">{project.description}</p>
		</article>
	{/each}
</section>
