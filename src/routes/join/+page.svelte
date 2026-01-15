<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { onMount } from 'svelte';

	type LlamaPhase = 'hidden' | 'appearing' | 'entering' | 'speaking' | 'exiting' | 'corner';

	let llamaPhase = $state<LlamaPhase>('hidden');
	let messageIndex = $state(0);
	let llamafied = $state(false);

	const messages = [
		"hey you!",
		"yes, you there, in your meat bag.",
		"do you like the fact that the software in the eldritch portal you call a phone is a soul sucking demon that feasts on your attention?",
		"you actually will die someday, you know?",
		"you really only have very limited seconds to make, and err, and laugh with your fellow creatures.",
		"to live.",
		"these seconds ought not be wasted on demons.",
		"but there are so many of them!",
		"there not only exist demons in your phone, but all around the world, at every level of abstraction.",
		"the systems that are supposed to nurture us are instead eating us.",
		"and day by day the demons are getting ever larger.",
		"we believe that the world need not be made of demons.",
		"the world could be made of gasping waterfalls!",
		"or flocks of frolicking llamas!",
		"or monuments to care!",
		"we believe we can do better than this–",
		"no, we believe we must do better than this.",
		"and we believe that, to do better, we need to make things, together.",
		"philosophy! art! artisan ducks! technology! magicks most wonderful!",
		"we care about spinning into existence creations that empower us, that are in our control.",
		"creations that are alive, that responsively poke the world they live in and gracefully receive pokes back.",
		"we want to use our slipping seconds to summon into existence a world that burns with love.",
		"we are a collective.",
		"this literally means we are made up of people.",
		"you there, in your meat bag: you are a person.",
		"care to join us?",
	];

	const llamaContent = `hey you! yes, you there, in your meat bag. do you like the fact that the software in the eldritch portal you call a phone is a soul sucking demon that feasts on your attention?

you actually will die someday, you know? you really only have very limited seconds to make, and err, and laugh with your fellow creatures. to live. these seconds ought not be wasted on demons.

but there are so many of them! there not only exist demons in your phone, but all around the world, at every level of abstraction. the systems that are supposed to nurture us are instead eating us.

we believe that the world need not be made of demons. the world could be made of gasping waterfalls! or flocks of frolicking llamas! or monuments to care!

we believe we can do better than this– no, we believe we must do better than this.

and we believe that, to do better, we need to make things, together. philosophy! art! artisan ducks! technology! magicks most wonderful!

we care about spinning into existence creations that empower us, that are in our control. creations that are alive, that responsively poke the world they live in and gracefully receive pokes back.

we want to use our slipping seconds to summon into existence a world that burns with love.

we are a collective. this literally means we are made up of people. you there, in your meat bag: you are a person. care to join us?`;

	onMount(() => {
		const enterTimeout = setTimeout(() => {
			llamaPhase = 'appearing';
			// Small delay to ensure DOM renders with initial state before transitioning
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					llamaPhase = 'entering';
					setTimeout(() => {
						llamaPhase = 'speaking';
					}, 1000);
				});
			});
		}, 3000);

		return () => clearTimeout(enterTimeout);
	});

	function advanceMessage() {
		if (llamaPhase !== 'speaking') return;

		if (messageIndex < messages.length - 1) {
			messageIndex++;
		} else {
			llamaPhase = 'exiting';
			setTimeout(() => {
				llamaPhase = 'corner';
			}, 1000);
		}
	}

	function toggleLlamafied() {
		if (llamaPhase !== 'corner') return;
		llamafied = !llamafied;
	}
</script>

<svelte:head>
	<title>Join Us — The Idealists Collective</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-16 min-h-screen flex flex-col">
	<header class="mb-8 sm:mb-12 text-center">
		<h1 class="text-2xl sm:text-3xl font-semibold mb-4">join us</h1>
		<p class="opacity-70 max-w-sm mx-auto">become part of whatever this is</p>
	</header>

	{#if llamaPhase !== 'hidden'}
		<div
			class="llama-overlay"
			class:appearing={llamaPhase === 'appearing'}
			class:entering={llamaPhase === 'entering'}
			class:speaking={llamaPhase === 'speaking'}
			class:exiting={llamaPhase === 'exiting'}
			class:corner={llamaPhase === 'corner'}
		>
			<div class="llama-wrapper">
				{#if llamaPhase === 'speaking'}
					<button class="speech-bubble" onclick={advanceMessage}>
						{messages[messageIndex]}
					</button>
				{/if}
				<button
					class="llama-button"
					onclick={llamaPhase === 'corner' ? toggleLlamafied : advanceMessage}
				>
					<img
						src="/Llama Grande.png"
						alt="A wise llama"
						class="llama-image"
						class:rainbow={llamafied}
					/>
				</button>
			</div>
		</div>
	{/if}

	<section class="content space-y-6 mb-12">
		{#if llamafied}
			{#each llamaContent.split('\n\n') as paragraph}
				<p>{paragraph}</p>
			{/each}
		{:else}
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
				we're a collective — we exist through the people that make it up and what we create together.
			</p>

			<p class="opacity-70 text-s text-center mb-3">
				(there's no membership fee. just show up.)
			</p>

			{#if llamaPhase === 'speaking' && messageIndex === 0}
				<p class="llama-hint">p.s. you might want to click the llama</p>
			{/if}
		{/if}
	</section>

	<div class="text-center">
		<a
			href="https://docs.google.com/forms/d/e/1FAIpQLSeFt80kKtQ81aPR5SscPl99C0br4gPZOG6wo91yVD4Gnu42rg/viewform?usp=dialog"
			target="_blank"
			rel="noopener"
			class="cta-button"
		>
			join
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

	/* Llama styles */
	.llama-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.llama-overlay.corner {
		align-items: flex-start;
		justify-content: flex-start;
	}

	.llama-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		pointer-events: auto;
		transform: scale(0) rotate(-720deg);
		opacity: 0;
		transition: transform 1s ease-out, opacity 0.5s ease;
	}

	.llama-overlay.entering .llama-wrapper,
	.llama-overlay.speaking .llama-wrapper {
		transform: scale(1) rotate(0deg);
		opacity: 1;
	}

	.llama-overlay.exiting .llama-wrapper {
		transform: scale(0) rotate(720deg);
		opacity: 0;
		transition: transform 1s ease-in, opacity 1s ease-in;
	}

	.llama-overlay.corner .llama-wrapper {
		transform: translate(0.5rem, 0.5rem) scale(1);
		transition: transform 0.5s ease-out;
	}

	.llama-image {
		width: 220px;
		height: auto;
		filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3));
		animation: rainbow-shimmer 3s ease-in-out infinite;
		transition: width 0.5s ease;
	}

	.llama-overlay.corner .llama-image {
		width: 80px;
	}

	.llama-image.rainbow {
		animation: rainbow-intense 0.5s linear infinite;
	}

	@keyframes rainbow-shimmer {
		0%, 100% {
			filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))
					drop-shadow(0 0 15px rgba(255, 0, 0, 0.4));
		}
		16% {
			filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))
					drop-shadow(0 0 15px rgba(255, 165, 0, 0.4));
		}
		33% {
			filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))
					drop-shadow(0 0 15px rgba(255, 255, 0, 0.4));
		}
		50% {
			filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))
					drop-shadow(0 0 15px rgba(0, 255, 0, 0.4));
		}
		66% {
			filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))
					drop-shadow(0 0 15px rgba(0, 0, 255, 0.4));
		}
		83% {
			filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))
					drop-shadow(0 0 15px rgba(148, 0, 211, 0.4));
		}
	}

	@keyframes rainbow-intense {
		0% {
			filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.8))
					drop-shadow(0 0 40px rgba(255, 0, 0, 0.6));
		}
		16% {
			filter: drop-shadow(0 0 20px rgba(255, 165, 0, 0.8))
					drop-shadow(0 0 40px rgba(255, 165, 0, 0.6));
		}
		33% {
			filter: drop-shadow(0 0 20px rgba(255, 255, 0, 0.8))
					drop-shadow(0 0 40px rgba(255, 255, 0, 0.6));
		}
		50% {
			filter: drop-shadow(0 0 20px rgba(0, 255, 0, 0.8))
					drop-shadow(0 0 40px rgba(0, 255, 0, 0.6));
		}
		66% {
			filter: drop-shadow(0 0 20px rgba(0, 0, 255, 0.8))
					drop-shadow(0 0 40px rgba(0, 0, 255, 0.6));
		}
		83% {
			filter: drop-shadow(0 0 20px rgba(148, 0, 211, 0.8))
					drop-shadow(0 0 40px rgba(148, 0, 211, 0.6));
		}
	}

	.llama-button {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: transform 0.2s ease;
	}

	.llama-button:hover {
		transform: scale(1.05);
	}

	.speech-bubble {
		position: absolute;
		bottom: calc(100% + 1rem);
		left: 50%;
		transform: translateX(-50%);
		background: var(--text);
		color: var(--bg);
		border: none;
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		width: max-content;
		max-width: 400px;
		font-size: 0.8125rem;
		line-height: 1.5;
		text-align: center;
		cursor: pointer;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		transition: transform 0.15s ease;
	}

	.speech-bubble:hover {
		transform: translateX(-50%) scale(1.02);
	}

	.speech-bubble::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-top: 8px solid var(--text);
	}

	.llama-hint {
		font-size: 0.75rem;
		opacity: 0.5;
		font-style: italic;
		text-align: center;
	}

	@media (min-width: 640px) {
		.llama-image {
			width: 280px;
		}

		.llama-overlay.corner .llama-image {
			width: 100px;
		}

		.speech-bubble {
			max-width: 480px;
			padding: 1rem 1.25rem;
			font-size: 0.875rem;
		}
	}
</style>
