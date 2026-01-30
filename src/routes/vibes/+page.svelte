<script lang="ts">
	import ScatteredGallery from '$lib/components/ScatteredGallery.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	interface Props {
		data: {
			images: { src: string; width: number; height: number }[];
		};
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Vibes — The Idealists Collective</title>
</svelte:head>

<div class="vibes-page">
	<div class="mobile-spacer"></div>
	<p class="text-sm opacity-60 mb-4 text-center">
		inspired by <a href="https://www.xavicf.com/vibes" target="_blank" rel="noopener" class="underline hover:opacity-100">Xavi</a>
	</p>

	<ScatteredGallery images={data.images} />

	<BottomNav current="vibes" />
</div>

<style>
	.vibes-page {
		width: 100%;
		min-height: 100vh;
		padding: 1rem;
		display: flex;
		flex-direction: column;
	}

	.mobile-spacer {
		height: 2rem;
	}

	@media (min-width: 640px) {
		.vibes-page {
			padding: 2rem;
		}

		.mobile-spacer {
			height: 0;
		}
	}
</style>
