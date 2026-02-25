<script lang="ts">
	import { page } from '$app/stores';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	interface Props {
		children: any;
	}

	let { children }: Props = $props();

	// Access page data via $page.data
	let title = $derived($page.data.title as string);
	let description = $derived($page.data.description as string | undefined);
	let centered = $derived($page.data.centered as boolean | undefined);

	// Derive current page from URL for BottomNav
	type PageType = 'home' | 'writings' | 'vibes' | 'library' | 'projects' | 'members' | 'glossary';
	let current: PageType = $derived.by(() => {
		const path = $page.url.pathname;
		if (path === '/library') return 'library';
		if (path === '/glossary') return 'glossary';
		if (path === '/projects') return 'projects';
		if (path === '/members') return 'members';
		if (path.startsWith('/writings')) return 'writings';
		return 'home';
	});
</script>

<div class="page-layout" class:centered>
	<PageHeader {title} {description} />
	{@render children()}
	<BottomNav {current} />
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
</style>
