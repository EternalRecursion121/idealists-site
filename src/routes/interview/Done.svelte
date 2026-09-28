<script lang="ts">
	import { fade } from 'svelte/transition';

	interface Props {
		notesPath: string | null;
	}

	let { notesPath }: Props = $props();
</script>

<section class="done" in:fade={{ duration: 600 }}>
	<h1>thanks.</h1>
	<p class="lede">
		notes filed{notesPath ? ` at ${notesPath.split('/').pop()}` : ''}. someone in the
		collective will read them.
	</p>
	<p class="sub">go do the thing you've been thinking about.</p>
	<a href="/" class="link">return to the site</a>
</section>

<style>
	.done {
		padding-top: 6rem;
	}
</style>
