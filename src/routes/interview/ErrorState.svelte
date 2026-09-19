<script lang="ts">
	import { fade } from 'svelte/transition';

	interface Props {
		errorMessage: string;
		onretry: () => void;
	}

	let { errorMessage, onretry }: Props = $props();
</script>

<section class="error-state" in:fade>
	<h1>something broke.</h1>
	<p class="error">{errorMessage}</p>
	<button type="button" class="link link-as-button" onclick={onretry}>try again</button>
	<p class="sub error-help">
		this clears the saved conversation and returns you to the start. if it keeps happening,
		the interviewer backend may be down — try again in a few minutes.
	</p>
</section>

<style>
	.error-state {
		padding-top: 6rem;
	}

	.error-help {
		margin-top: 1rem;
		font-size: 0.82rem;
		opacity: 0.55;
		max-width: 36rem;
	}
</style>
