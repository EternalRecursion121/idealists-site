<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Access page data via page.data
	let title = $derived(page.data.title as string | undefined);
	let description = $derived(page.data.description as string | undefined);
	let centered = $derived(page.data.centered as boolean | undefined);

</script>

<div class="page-layout" class:centered class:untitled={!title}>
	{#if title}
		<PageHeader {title} {description} />
	{/if}
	{@render children()}
	<BottomNav />
</div>

<style>
	.page-layout {
		max-width: 48rem;
		margin: 0 auto;
		padding: 0 1rem;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.page-layout.centered {
		text-align: center;
	}

	/* Pages that bring their own heading (writings, unconference) skip
	   PageHeader but keep its top breathing room under the fixed chrome. */
	.page-layout.untitled {
		padding-top: 2.5rem;
	}

	@media (min-width: 640px) {
		.page-layout.untitled {
			padding-top: 1rem;
		}
	}
</style>
