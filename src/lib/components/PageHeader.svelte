<script lang="ts">
	interface Props {
		title: string;
		description?: string;
	}

	let { title, description }: Props = $props();
</script>

<header class="page-header">
	<h1>{title}</h1>
	{#if description}
		<p class="description">{description}</p>
	{/if}
</header>

<style>
	.page-header {
		margin-top: 2.5rem;
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.description {
		opacity: 0.7;
		font-size: 0.875rem;
	}

	@media (min-width: 640px) {
		.page-header {
			margin-top: 1rem;
			margin-bottom: 3rem;
		}

		h1 {
			font-size: 1.875rem;
		}
	}
</style>
