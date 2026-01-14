<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
</script>

<svelte:head>
	<title>Join Us — The Idealists Collective</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-16 min-h-screen flex flex-col">
	<header class="mb-8 sm:mb-12 text-center">
		<h1 class="text-2xl sm:text-3xl font-semibold mb-4">join us</h1>
		<p class="opacity-70 max-w-sm mx-auto">become part of whatever this is</p>
	</header>

	<section class="content space-y-6 mb-12">
		<p>
			we're a group of people who think the future is worth fighting for.
			we have a discord server. we talk about ideas, share works-in-progress, and
			create things together.
		</p>

		<p>
			we are here to imagine and build out the world we want to live in, through philosophy, art and technology. we care about
			technology that empowers rather than extracts. tools you control. software that
			respects your attention. systems that are alive — that grow, adapt, and serve the
			people using them.
		</p>

		<p>
			if you join, we want you to <i>do things</i>. build software. write essays. make
			art. start projects. finish projects. collaborate with others. share what you're
			working on. ask for feedback. give feedback. the bar for entry is low but the
			expectation is participation.
		</p>

		<p>
			we're not a newsletter. we're not an audience. we're a collective — which means
			we're only as interesting as the people in it and what they make.
		</p>

		<p class="opacity-70 text-s text-center mb-3">
			(there's no membership fee. just show up.)
		</p>
	</section>

	<div class="text-center">
		<a
			href="https://docs.google.com/forms/d/e/1FAIpQLSeFt80kKtQ81aPR5SscPl99C0br4gPZOG6wo91yVD4Gnu42rg/viewform?usp=dialog"
			target="_blank"
			rel="noopener"
			class="cta-button"
		>
			fill out the form
		</a>
	</div>

	<BottomNav current="home" />
</div>

<style>
	.content {
		line-height: 1.6;
		text-align: center;
	}

	.content p {
		font-size: 0.875rem;
		opacity: 0.8;
		max-width: 36rem;
		margin-left: auto;
		margin-right: auto;
	}

	.cta-button {
		display: inline-block;
		color: var(--accent);
		font-size: 0.875rem;
		letter-spacing: 0.03em;
		text-decoration: underline;
		text-underline-offset: 0.25em;
		opacity: 0.9;
		transition: opacity 0.2s ease;
	}

	.cta-button:hover {
		opacity: 1;
	}

	@media (min-width: 640px) {
		.content p {
			font-size: 0.9375rem;
		}
	}
</style>
