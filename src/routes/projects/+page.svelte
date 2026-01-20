<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
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

<div class="max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-16 min-h-screen flex flex-col">
	<header class="mb-8 sm:mb-12 text-center">
		<h1 class="text-2xl sm:text-3xl font-semibold mb-4">projects</h1>
		<p class="opacity-70 max-w-xs mx-auto">things we're building together</p>
	</header>

	<section class="space-y-8">
		{#each data.projects as project}
			<article class="text-center">
				{#if project.url}
					<a href={project.url} target="_blank" rel="noopener" class="group">
						<h2 class="font-semibold mb-2 group-hover:opacity-70">{project.name}</h2>
					</a>
				{:else}
					<h2 class="font-semibold mb-2">{project.name}</h2>
				{/if}
				<p class="text-sm opacity-70 max-w-md mx-auto">{project.description}</p>
			</article>
		{/each}
	</section>

	<BottomNav current="projects" />
</div>
