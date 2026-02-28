<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	let mounted = $state(false);
	let scrollY = $state(0);

	// Expandable state
	let retreatExpanded = $state(false);
	let conferenceExpanded = $state(false);
	let expandedCategories = $state<Set<string>>(new Set());
	let showCapsule = $state(false);
	let showWorkshops = $state(false);
	let showBudget = $state(false);
	let showBudgetBreakdown = $state(false);

	function toggleCategory(title: string) {
		if (expandedCategories.has(title)) {
			expandedCategories.delete(title);
			expandedCategories = new Set(expandedCategories);
		} else {
			expandedCategories = new Set(expandedCategories).add(title);
		}
	}

	onMount(() => {
		mounted = true;
		const root = document.documentElement;
		const handleScroll = () => {
			scrollY = window.scrollY;
			const shouldSnap = window.scrollY < window.innerHeight * 0.9;
			root.classList.toggle('unconference-snap', shouldSnap);
		};
		handleScroll();
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => {
			window.removeEventListener('scroll', handleScroll);
			root.classList.remove('unconference-snap');
		};
	});

	const voiceCategories = [
		{
			title: "spirit & format",
			quotes: [
				"weirdo futurists coming together and doing work (including schleppy, grindy work!) to articulate concrete stories of the future, or get their ideas to the discourse, rather than just hanging out",
				"SPAR, ESPR, post-agi conf, but with a place for the humanities, the arts, and PLURALISM. there are so many visions of the future that we have not pursued and that various communities are",
				"playful and solemn and genuine. I want it to have the feeling that we are trying to change the world.",
				"a place with many nooks and crannies"
			]
		},
		{
			title: "on inhabiting the future",
			quotes: [
				"there's this feeling i get when i read scifi/fantasy — ken liu, ted chiang, nk jemisin, and so on — of very intense worldbuilding, of sitting deeply with the futures they create and taking their worlds seriously. i get the sense that these people have inhabited the worlds they write about in a profound way, turned them over and over in their heads, thought carefully about the positive and the negative. and have applied all the human emotions and apparatuses to it — they are playful and solemn and genuine. but for all that EA and ai safety care about good futures, i struggle to really deeply feel and conceptualise what they are. there's a tidal wave coming from afar and i'd love to put on glasses and properly examine it — what the crash looks like, what the other side of the wave looks like. but i've become too hurried and feel like i have no time except to focus on how fast it's coming. i don't want that. i'd like to inhabit the future. a week of that would be awesome."
			]
		},
		{
			title: "on cultivating hope",
			quotes: [
				"the primary aim of the conference should be to leave people with a feeling of hope. i think this involves 4 components: recognising that the current situation is not ideal; realising that better things are possible; understanding that they can do something about it; and feeling surrounded by a group of people who also have hope.",
				"people are too disconnected and don't feel like they can make a difference, and the obstacles feel too insurmountable, so they relegate themselves to their small corners, following their local incentive gradients.",
				"in short — things can go well, and it's up to us to make that happen."
			]
		},
		{
			title: "on bridge-building",
			quotes: [
				"i want to bring people together who would not usually get a chance to meet — try to make it a space for bridge building. i don't want it to feel too EA/AI safety or too tech heavy. but i do want there to be philosophy, technology, and art components.",
				"especially in the AIS space i think there should be more diverse thoughts into alternative futures and what they would look like — a paused-AI world, an alternative tech world, other futures without any consideration of AI. many breakthroughs come from interdisciplinary exploration, and it feels a shame to limit to the niche that a lot of people are already familiar with."
			]
		},
		{
			title: "on atmosphere",
			quotes: [
				"i think we try to do many analog things in the event — get a court artist in to do some drawings, disposable film cameras. notepads, but diff sizes and colours and lines vs dots. the minutiae creates the atmosphere.",
				"it feels as though we should be in that painting of ancient greece — the philosophers sitting around and talking and walking."
			]
		},
		{
			title: "on momentum",
			quotes: [
				"if the conference goes well, then we've embedded 'idealist' as a term to identify with within our communities, like how people are EA or rationalist.",
				"we are better when we work together. and maybe related to this is the idea of faith in people — which is a prerequisite to any kind of meaningful collaboration."
			]
		}
	];

	const workshopIdeas = [
		"flash fiction about mundane lives in 2075",
		"blankets on blankets (sit on fluffy blankets and discuss markov blankets, why they change, your blankets, jung's blankets, carson's blankets, dennett's blankets, etc)",
		"shoot a mini documentary in a day",
		"write a play about post-AGI governance",
		"letters from your grandchildren",
		"annotated blueprints for institutions that don't exist yet"
	];


	const budgetItems = [
		{ category: "Retreat Accommodation", low: "£3,500", high: "£7,000", desc: "Country house rental, Cotswolds, 6 nights for 20–25 people" },
		{ category: "Retreat Meals & Incidentals", low: "£3,000", high: "£6,000", desc: "Catering, groceries, supplies for 6 days" },
		{ category: "Conference Venue", low: "£0", high: "£1,600", desc: "London venue hire (e.g. Newspeak House), 2 days, AV included" },
		{ category: "Conference Catering", low: "£3,200", high: "£4,800", desc: "Meals and refreshments for up to 80 attendees, 2 days" },
		{ category: "Conference Accommodation", low: "£0", high: "£16,000", desc: "Subsidised lodging for out-of-town conference attendees" },
		{ category: "Travel Grants", low: "£0", high: "£5,000", desc: "Flights and trains for international and UK-based participants" },
		{ category: "Media Costs", low: "£500", high: "£3,000", desc: "Editing, design, publication, photography, printing" }
	];
</script>

<svelte:head>
	<title>The Idealists Unconference — April 2026</title>
	<meta name="description" content="A week-long gathering to imagine the future. April 4–12, 2026 in the Cotswolds and London." />
</svelte:head>

<div class="unconference" class:mounted>
	<!-- Hero -->
	<header class="hero">
		<div class="hero-content">
			<p class="hero-label">April 4–12, 2026</p>
			<h1 class="hero-title">
				<span class="title-line">The Idealists</span>
				<span class="title-line accent">Unconference</span>
			</h1>
			<p class="hero-subtitle">A gathering to imagine the future</p>
			<p class="hero-location">Cotswolds & London, UK</p>
		</div>
		<div class="hero-scroll-hint" style="opacity: {Math.max(0, 1 - scrollY / 200)}">
			<span>scroll</span>
			<svg width="16" height="24" viewBox="0 0 16 24" fill="none">
				<path d="M8 4v16M8 20l-4-4M8 20l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
		</div>
	</header>

	<div class="content-shell">
	<!-- Structure -->
	<section class="section structure compact">
		<div class="section-inner">
			<p class="week-intro">
				The idealists conference exists to explore and create a stance of hope we ought to take, in the face of our current reality, to get to good futures; to practice this stance of hope, collectively, through discussion and dialogue and making; to impart this stance onto its participants, and into what they will create long after the conference is over.
			</p>
		<details class="full-draft">
			<summary>Ok, but what does this actually mean?</summary>
			<div class="full-draft-content">
				<p>Consider: The world is on fire.</p>
				<p>We live in the world.</p>
				<p>Given that we live in the world, which is on fire, how ought we relate to it?</p>
				<p>This question is painful to grapple with. So painful, in fact, that there are at least two varieties of wishing it away: (1) the world is doomed, the fire will eat everything, there is nothing we can do; (2) the fire is good actually, we should want the fire to eat everything, let's make the fire go faster. While we believe that, taken wholesale, both approaches are misguided, we also believe that they each contain a grain of truth: The fire is, in fact, daunting. The fire is, in fact, very large in scope, and requires humanity to display coordination and competence. We must buck up and face the tangled horror-problems reality presents us with. We must not solve easier problems than those to make ourselves feel good. We must stare the monster in the face. Fire is good, eventually. For humanity to grow up is for humanity to become powerful: to let that flame burn away the proems that plague us, so that utopia can flower in the ash. Many of the technologies, attitudes and ideas contained in the gasoline making the fire worse are cousins to beautiful fingers that point toward this end.</p>
				<p>We believe the synthesis of these attitudes presents a secret third option-a way of relating to reality such that answering the question becomes not only bearable, but fun:</p>
				<p>Hope. Good-old-fashioned hope. Dangerous, beguiling, loveable hope. Hope so unbearable it makes the world seem bearable, after all.</p>
				<p>What is hope? First, hope is distinct from optimism. Things are actually pretty bad right now, and on track to becoming much worse; if we want things to get better, we should not delude ourselves into thinking things are already fine. To be optimistic about the current state of affairs would be to live in delusion.</p>
				<p>While optimism is a summary statistic of reality, hope is a stance one can take with respect to reality, regardless of how grim reality really is. Hope is a stance characterized by ntradiction: to take on hope as a stance is to dream up fantastical wondrous futures, and explore strange thought experiments probing at fundamental ideas; but also to be relentlessly practical about immediate actions that can be taken, and carefully consider how those actions will eventually lead to good outcomes. Hope is not a stance to be taken on alone, because the future will be lived-in by more than one person.</p>
				<p>The stance of hope is very much not the stance of heroism. Note that slogging through a field, bloody and bruised, arms shaking around your sword, swiping at fire-breathing dragons is not actually fun! Being a hero is not fun. The stance of hope thus does not require you to be a hero.</p>
				<p>We believe that formulating this stance of hope, and putting it into practice, will require cognitive variety and exploration. We believe that art is preparadigmatic philosophy is preparadigmatic mathematics is preparadigmatic science is preparadigmatic engineering is preparadigmatic policy. We believe that we should mine insights from all parts of this funnel, put these varied techniques and aesthetics into considered dialogue, and carefully tend to what emerges. The guiding question of the conference will be:</p>
				<p><strong>What kind of future do we actually want, and how do we get there?</strong></p>
				<details class="full-draft">
					<summary>Ok, but what does this actually mean?</summary>
					<div class="full-draft-content">
						<p>Technology is changing the world faster than we are equipped to handle. We need new ideas. We need new institutions. We need to think carefully about where we are going. But more than this we need hope – hope that the future can be better and hope to fuel us in fighting for it. The conference aims to provide a space for imagining and creating the futures we want.</p>
					</div>
				</details>
			</div>
		</details>
			<h2 class="section-header">the week</h2>

			<div class="event-cards">
				<article class="event-card" class:expanded={retreatExpanded}>
					<button class="event-toggle" onclick={() => retreatExpanded = !retreatExpanded}>
						<div class="event-header">
							<div>
								<span class="event-day">Apr 4–10</span>
								<h3 class="event-name">The Retreat</h3>
								<p class="event-location">Cotswolds countryside</p>
							</div>
							<span class="expand-icon">{retreatExpanded ? '−' : '+'}</span>
						</div>
					</button>
					{#if retreatExpanded}
						<div class="event-content" transition:slide={{ duration: 300 }}>
							<p class="event-description">
								A five-day retreat for 20–30 participants at a rented country house in the Cotswolds. The format is deliberately open-ended and unconference-style, with ample unstructured time for deep conversation, collaborative work, and serendipitous connection.
							</p>
							<p class="event-description">
								Participants are encouraged to propose and self-organise sessions around whatever they're most excited about. The retreat format is designed to let the most urgent and generative questions emerge from participants, with a soft expectation that retreat participants will host workshops during the London conference.
							</p>
							<ul class="event-details">
								<li>Self-organised sessions</li>
								<li>Deep work time</li>
								<li>Nooks and crannies</li>
								<li>Drop in/out flexibility</li>
							</ul>
						</div>
					{/if}
				</article>

				<article class="event-card" class:expanded={conferenceExpanded}>
					<button class="event-toggle" onclick={() => conferenceExpanded = !conferenceExpanded}>
						<div class="event-header">
							<div>
								<span class="event-day">Apr 11–12</span>
								<h3 class="event-name">The Unconference</h3>
								<p class="event-location">London</p>
							</div>
							<span class="expand-icon">{conferenceExpanded ? '−' : '+'}</span>
						</div>
					</button>
					{#if conferenceExpanded}
						<div class="event-content" transition:slide={{ duration: 300 }}>
							<p class="event-description">
								A two-day unconference for up to 80 participants in London. The tentative location is Newspeak House, running from 9am to 6pm. In addition to the retreat attendees, we will open applications to support a larger group.
							</p>
							<p class="event-description">
								We aim to provide the infrastructure for attendee-led talks, workshops, discussions, and collaborative working time, with the aim of giving people the support to produce thinking and creative output for the time capsule.
							</p>
							<ul class="event-details">
								<li>Workshops & talks</li>
								<li>Time capsule creation</li>
								<li>Public exhibition</li>
								<li>Up to 80 participants</li>
							</ul>
						</div>
					{/if}
				</article>
			</div>
		</div>
	</section>

	<!-- Capsule -->
	<section class="section compact">
		<div class="section-inner">
			<div class="expandables-group">
				<div class="workshops-card" class:expanded={showCapsule}>
					<button class="workshops-toggle" onclick={() => showCapsule = !showCapsule}>
						<h2 class="section-header">a backward-looking time capsule</h2>
						<span class="expand-icon">{showCapsule ? '−' : '+'}</span>
					</button>
					{#if showCapsule}
						<div class="workshops-content" transition:slide={{ duration: 300 }}>
							<p class="workshops-intro">
								Over the course of the week, we will create a curated collection of speculative fiction, policy sketches, artwork, letters,
								institutional blueprints, and other artefacts—situated from possible futures back to the present day.
							</p>
							<ul class="capsule-examples">
								<li>fictional policy memos from 2060</li>
								<li>letters from grandchildren</li>
								<li>institutional blueprints</li>
								<li>speculative fiction</li>
								<li>artwork</li>
								<li>physical ephemera</li>
							</ul>
							<p class="capsule-note">
								Distributed as a printed anthology and companion website.
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Voices -->
	<section class="section compact">
		<div class="section-inner">
			<h2 class="section-header">what we want this to be</h2>

			<div class="voice-categories">
				{#each voiceCategories as category}
					<div class="voice-category" class:expanded={expandedCategories.has(category.title)}>
						<button class="category-toggle" onclick={() => toggleCategory(category.title)}>
							<h3 class="category-title">{category.title}</h3>
							<span class="expand-icon">{expandedCategories.has(category.title) ? '−' : '+'}</span>
						</button>
						{#if expandedCategories.has(category.title)}
							<div class="category-quotes" transition:slide={{ duration: 300 }}>
								{#each category.quotes as quote}
									<blockquote class="testimonial">
										<p class="testimonial-quote">{quote}</p>
									</blockquote>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
				<div class="voice-category" class:expanded={showWorkshops}>
				<button class="category-toggle" onclick={() => showWorkshops = !showWorkshops}>
					<h3 class="category-title">workshop sketches</h3>
					<span class="expand-icon">{showWorkshops ? '−' : '+'}</span>
				</button>
				{#if showWorkshops}
					<div class="category-quotes" transition:slide={{ duration: 300 }}>
						{#each workshopIdeas as idea}
							<blockquote class="testimonial">
								<p class="testimonial-quote">{idea}</p>
							</blockquote>
						{/each}
					</div>
				{/if}
			</div>
			</div>
		</div>
	</section>

	<!-- Support -->
	<section class="section compact">
		<div class="section-inner">
			<div class="expandables-group">
				<div class="workshops-card support-highlight" class:expanded={showBudget}>
					<button class="workshops-toggle" onclick={() => showBudget = !showBudget}>
						<h2 class="section-header">support this gathering</h2>
						<span class="expand-icon">{showBudget ? '−' : '+'}</span>
					</button>
					{#if showBudget}
						<div class="support-content" transition:slide={{ duration: 300 }}>
							<p class="support-intro">
								We are seeking funders interested in financing part or all of the conference costs.
								Contributions at any level are welcome:
							</p>
							<div class="funding-tiers">
								<div class="tier">
									<span class="tier-amount">£10k</span>
									<span class="tier-desc">core retreat costs</span>
								</div>
								<div class="tier">
									<span class="tier-amount">£20k–30k</span>
									<span class="tier-desc">fully subsidised retreat + London conference</span>
								</div>
								<div class="tier">
									<span class="tier-amount">£40k+</span>
									<span class="tier-desc">full travel grants & maximum accessibility</span>
								</div>
							</div>

							<button class="budget-toggle" onclick={() => showBudgetBreakdown = !showBudgetBreakdown}>
								{showBudgetBreakdown ? '− hide budget breakdown' : '+ view budget breakdown'}
							</button>

							{#if showBudgetBreakdown}
								<div class="budget-table" transition:slide={{ duration: 300 }}>
									<div class="budget-header">
										<span>Category</span>
										<span>Low</span>
										<span>High</span>
									</div>
									{#each budgetItems as item}
										<div class="budget-row">
											<div class="budget-category">
												<span class="budget-name">{item.category}</span>
												<span class="budget-desc">{item.desc}</span>
											</div>
											<span class="budget-amount">{item.low}</span>
											<span class="budget-amount">{item.high}</span>
										</div>
									{/each}
									<div class="budget-row budget-total">
										<span>Total</span>
										<span>£10,200</span>
										<span>£43,400</span>
									</div>
								</div>
							{/if}

							<p class="support-note">
								Your support will directly enable researchers and thinkers to come together at a critical moment—to build shared frameworks,
								forge cross-community relationships, and articulate a constructive vision for the future.
							</p>
							<div class="contact-block">
								<p class="contact-label">To discuss partnership opportunities:</p>
								<div class="contacts">
									<a href="mailto:jasminexinzeli@gmail.com" class="contact">Jasmine Li</a>
									<a href="mailto:samueljratnam@gmail.com" class="contact">Samuel Ratnam</a>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>
	</div>

	<!-- Footer -->
	<footer class="page-footer">
		<p class="footer-quote">"in short — things can go well, and it's up to us to make that happen."</p>
		<a href="/" class="footer-link">← back to the collective</a>
	</footer>
</div>

<style>
	.unconference {
		--section-padding: 1.5rem 1.5rem;
		opacity: 0;
		transition: opacity 0.6s ease;
	}

	.unconference.mounted {
		opacity: 1;
	}

	.unconference :is(a, button, summary, input, textarea, select):focus,
	.unconference :is(a, button, summary, input, textarea, select):focus-visible {
		outline: none;
		box-shadow: none;
	}

	.unconference :is(a, button, summary, input, textarea, select) {
		-webkit-tap-highlight-color: transparent;
	}

	/* Hero */
	.hero {
		min-height: 100svh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		padding: 2rem;
		padding-bottom: 14rem;
		position: relative;
		/* Break out of parent max-width constraint */
		width: 100vw;
		margin-left: calc(-50vw + 50%);
		box-sizing: border-box;
		scroll-snap-align: start;
		scroll-snap-stop: always;
	}

	.hero-content {
		max-width: 800px;
	}

	.hero-label {
		font-size: 0.85rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		opacity: 0.6;
		margin-bottom: 1.5rem;
	}

	.hero-title {
		font-family: var(--font-serif);
		font-size: clamp(2.5rem, 8vw, 5rem);
		font-weight: 400;
		line-height: 1.1;
		margin: 0 0 1.5rem 0;
	}

	.title-line {
		display: block;
	}

	.title-line.accent {
		font-style: italic;
		color: var(--accent);
	}

	.hero-subtitle {
		font-family: var(--font-serif);
		font-size: 1.25rem;
		opacity: 0.8;
		margin-bottom: 0.5rem;
	}

	.hero-location {
		font-size: 0.9rem;
		opacity: 0.5;
	}

	.hero-scroll-hint {
		position: absolute;
		bottom: 8rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		opacity: 0.25;
		transition: opacity 0.3s;
	}

	.hero-scroll-hint svg {
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(4px); }
	}

	/* Sections */
	.section {
		padding: var(--section-padding);
	}

	.section.compact {
		padding-top: 1rem;
		padding-bottom: 1.5rem;
	}

	.content-shell {
		max-width: 980px;
		margin: 0 auto;
		border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--text) 5%, transparent);
		backdrop-filter: blur(5px);
		-webkit-backdrop-filter: blur(5px);
		overflow: hidden;
		scroll-snap-align: start;
		scroll-snap-stop: always;
	}

	:global(html.unconference-snap) {
		scroll-snap-type: y mandatory;
	}

	.section-inner {
		max-width: 800px;
		margin: 0 auto;
		padding: clamp(1rem, 2vw, 1.5rem);
	}

	.section-header {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--accent);
		margin: 0 0 2rem 0;
		opacity: 0.8;
	}

	.week-intro {
		font-family: var(--font-serif);
		font-size: 1.15rem;
		line-height: 1.7;
		margin: 0 0 1.25rem 0;
		opacity: 0.85;
	}

	.full-draft {
		margin: 0 0 1.5rem 0;
		padding: 0.9rem 1rem;
		border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
		background: color-mix(in srgb, var(--accent) 3%, transparent);
		border-radius: 4px;
	}

	.full-draft summary {
		cursor: pointer;
		font-size: 0.9rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
		font-weight: 600;
	}

	.full-draft-content {
		margin-top: 1rem;
	}

	.full-draft .full-draft {
		margin-top: 1rem;
	}

	.full-draft-content p {
		font-family: var(--font-serif);
		font-size: 1rem;
		line-height: 1.7;
		margin: 0 0 1rem 0;
		opacity: 0.85;
	}

	.full-draft-content blockquote {
		margin: 0.5rem 0 1rem;
		padding-left: 1rem;
		border-left: 2px solid color-mix(in srgb, var(--accent) 45%, transparent);
	}

	/* Event Cards */
	.event-cards {
		display: grid;
		gap: 1.5rem;
		align-items: start;
	}

	.event-card {
		border: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
		border-radius: 4px;
		background: color-mix(in srgb, var(--text) 2%, transparent);
		overflow: hidden;
		transition: border-color 0.3s, background 0.3s;
	}

	.event-card.expanded {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 5%, transparent);
	}

	.event-toggle:hover {
		color: var(--accent);
	}

	.event-toggle {
		width: 100%;
		padding: 1.5rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		color: inherit;
		font-family: inherit;
	}

	.event-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.event-day {
		font-size: 0.75rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--accent);
		opacity: 0.8;
	}

	.event-name {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		font-weight: 400;
		margin: 0.25rem 0;
	}

	.event-location {
		font-size: 0.85rem;
		opacity: 0.5;
		margin: 0;
	}

	.expand-icon {
		font-size: 1.25rem;
		color: var(--accent);
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	.event-toggle:hover .expand-icon {
		opacity: 1;
	}

	.event-content {
		padding: 0 1.5rem 1.5rem;
	}

	.event-description {
		font-family: var(--font-serif);
		font-size: 1rem;
		line-height: 1.7;
		opacity: 0.8;
		margin: 0 0 1rem 0;
	}

	.event-details {
		list-style: none;
		padding: 0;
		margin: 1rem 0 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.event-details li {
		font-size: 0.8rem;
		padding: 0.35rem 0.75rem;
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		border-radius: 2rem;
		color: var(--accent);
	}

	/* Time Capsule */
	.capsule {
		background: transparent;
	}

	.capsule-card {
		border: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
		border-radius: 4px;
		background: color-mix(in srgb, var(--text) 2%, transparent);
		max-width: 720px;
		margin: 0 auto;
		transition: border-color 0.3s, background 0.3s;
	}

	.capsule-card.expanded {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 5%, transparent);
	}

	.capsule-toggle {
		width: 100%;
		padding: 1.25rem 1.5rem;
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: inherit;
		text-align: left;
	}

	.capsule-toggle:hover {
		color: var(--accent);
	}

	.capsule-toggle .expand-icon {
		font-size: 1.25rem;
		opacity: 0.5;
	}

	.capsule-content {
		text-align: left;
		padding: 0 1.5rem 1.5rem 1.5rem;
	}

	.capsule-title {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		font-weight: 400;
		margin: 0;
		color: var(--heading);
	}

	.capsule-description {
		font-family: var(--font-serif);
		font-size: 1.1rem;
		line-height: 1.7;
		opacity: 0.8;
		max-width: 700px;
		margin: 0 0 1.25rem 0;
	}

	.capsule-examples {
		list-style: disc;
		margin: 0 0 1.25rem 1.25rem;
		padding: 0;
	}

	.capsule-examples li {
		font-family: var(--font-serif);
		font-size: 1rem;
		line-height: 1.55;
		opacity: 0.85;
		margin: 0 0 0.35rem 0;
	}

	.capsule-note {
		font-size: 0.95rem;
		opacity: 0.72;
		font-style: normal;
		margin: 0;
	}

	/* Expandables group */
	.expandables-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Workshops */
	.workshops-card {
		border: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
		border-radius: 4px;
		background: color-mix(in srgb, var(--text) 2%, transparent);
		transition: border-color 0.3s, background 0.3s;
	}

	.workshops-card.expanded {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 5%, transparent);
	}

	.workshops-card.support-highlight {
		border: 2px solid var(--accent);
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}

	.workshops-card.support-highlight .section-header {
		font-size: 0.8rem;
		letter-spacing: 0.15em;
	}

	.workshops-toggle {
		width: 100%;
		padding: 1.25rem 1.5rem;
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: inherit;
		text-align: left;
	}

	.workshops-toggle:hover {
		color: var(--accent);
	}

	.workshops-toggle .section-header {
		margin: 0;
	}

	.workshops-toggle .expand-icon {
		font-size: 1.25rem;
		opacity: 0.5;
	}

	.workshops-content {
		padding: 0 1.5rem 1.5rem 1.5rem;
	}

	.workshops-intro {
		font-family: var(--font-serif);
		font-size: 1rem;
		opacity: 0.7;
		margin-bottom: 1.5rem;
	}

	.workshop-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 0.9rem;
	}

	.workshop-card {
		font-family: var(--font-serif);
		font-size: 0.98rem;
		line-height: 1.62;
		letter-spacing: 0.005em;
		opacity: 0.88;
		padding: 1rem 1.1rem 0.95rem 1.2rem;
		border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
		border-left: 2px solid color-mix(in srgb, var(--accent) 45%, transparent);
		border-radius: 0.45rem;
		background: color-mix(in srgb, var(--accent) 7%, transparent);
	}

	/* Voices */
	.voices {
		background: transparent;
	}

	.voices-intro {
		font-family: var(--font-serif);
		font-size: 1.1rem;
		line-height: 1.7;
		opacity: 0.8;
		margin-bottom: 2.5rem;
	}

	.voice-categories {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.voice-category {
		position: relative;
		border: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
		border-radius: 4px;
		background: color-mix(in srgb, var(--text) 2%, transparent);
		transition: border-color 0.3s, background 0.3s;
	}

	.voice-category.expanded {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 5%, transparent);
	}

	.category-toggle {
		width: 100%;
		padding: 1rem 1.25rem;
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: inherit;
		text-align: left;
	}

	.category-toggle:hover {
		color: var(--accent);
	}

	.category-toggle .expand-icon {
		font-size: 1.25rem;
		opacity: 0.5;
	}

	.category-title {
		font-size: 0.8rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: lowercase;
		color: var(--accent);
		margin: 0;
		opacity: 0.9;
	}

	.category-quotes {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 0 1.25rem 1.25rem 1.25rem;
	}

	.testimonial {
		margin: 0;
		position: relative;
		padding: 1rem 1.1rem 0.95rem 1.2rem;
		border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
		border-left: 2px solid color-mix(in srgb, var(--accent) 45%, transparent);
		border-radius: 0.45rem;
		background: color-mix(in srgb, var(--accent) 7%, transparent);
	}

	.testimonial-quote {
		font-family: var(--font-serif);
		font-size: 0.98rem;
		line-height: 1.62;
		letter-spacing: 0.005em;
		opacity: 0.88;
		margin: 0;
	}

	/* Support */
	.support {
		background: transparent;
	}

	.support-card {
		border: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
		border-radius: 4px;
		background: color-mix(in srgb, var(--text) 2%, transparent);
		transition: border-color 0.3s, background 0.3s;
	}

	.support-card.expanded {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 5%, transparent);
	}

	.support-toggle {
		width: 100%;
		padding: 1.5rem;
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: inherit;
		text-align: left;
	}

	.support-toggle:hover {
		color: var(--accent);
	}

	.support-toggle .section-header {
		margin: 0;
	}

	.support-toggle .expand-icon {
		font-size: 1.25rem;
		opacity: 0.5;
	}

	.support-content {
		text-align: center;
		padding: 0 1.5rem 1.5rem 1.5rem;
	}

	.support-intro {
		font-family: var(--font-serif);
		font-size: 1.1rem;
		line-height: 1.7;
		opacity: 0.8;
		margin-bottom: 2.5rem;
	}

	.funding-tiers {
		display: grid;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.tier {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.25rem;
		border: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
		border-radius: 4px;
		transition: border-color 0.2s;
	}

	.tier:hover {
		border-color: var(--accent);
	}

	.tier-amount {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--accent);
	}

	.tier-desc {
		font-family: var(--font-serif);
		font-size: 0.9rem;
		opacity: 0.7;
	}

	.budget-toggle {
		display: block;
		margin: 0 auto 2rem;
		padding: 0.75rem 1.5rem;
		background: none;
		border: 1px solid color-mix(in srgb, var(--text) 20%, transparent);
		border-radius: 2rem;
		color: inherit;
		font-family: inherit;
		font-size: 0.85rem;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.2s, border-color 0.2s;
	}

	.budget-toggle:hover {
		opacity: 1;
		border-color: var(--accent);
	}

	.budget-table {
		text-align: left;
		margin-bottom: 2.5rem;
		border: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
		border-radius: 4px;
		overflow: hidden;
	}

	.budget-header, .budget-row {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 1rem;
		padding: 1rem;
	}

	.budget-header {
		background: color-mix(in srgb, var(--text) 5%, transparent);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.6;
	}

	.budget-row {
		border-top: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
	}

	.budget-category {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.budget-name {
		font-size: 0.9rem;
	}

	.budget-desc {
		font-size: 0.75rem;
		opacity: 0.5;
	}

	.budget-amount {
		font-size: 0.9rem;
		opacity: 0.8;
		text-align: right;
	}

	.budget-total {
		background: color-mix(in srgb, var(--accent) 5%, transparent);
		font-weight: 600;
	}

	.budget-total span {
		color: var(--accent);
	}

	.support-note {
		font-family: var(--font-serif);
		font-size: 1rem;
		line-height: 1.7;
		opacity: 0.7;
		max-width: 600px;
		margin: 0 auto 3rem auto;
	}

	.contact-block {
		padding-top: 2rem;
		border-top: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
	}

	.contact-label {
		font-size: 0.9rem;
		opacity: 0.6;
		margin-bottom: 1rem;
	}

	.contacts {
		display: flex;
		justify-content: center;
		gap: 2rem;
	}

	.contact {
		font-family: var(--font-serif);
		font-size: 1.1rem;
		color: var(--accent);
		text-decoration: none;
		transition: opacity 0.2s;
	}

	.contact:hover {
		opacity: 0.7;
	}

	/* Footer */
	.page-footer {
		padding: 4rem 1.5rem;
		text-align: center;
	}

	.footer-quote {
		font-family: var(--font-serif);
		font-size: 1.25rem;
		font-style: italic;
		opacity: 0.6;
		margin-bottom: 2rem;
	}

	.footer-link {
		font-size: 0.9rem;
		color: var(--accent);
		text-decoration: none;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.footer-link:hover {
		opacity: 1;
	}

	/* Responsive */
	@media (min-width: 640px) {
		.unconference {
			--section-padding: 2rem 2rem;
		}

		.hero-title {
			font-size: clamp(3rem, 10vw, 6rem);
		}

		.question {
			font-size: 1.6rem;
		}

		.event-cards {
			grid-template-columns: repeat(2, 1fr);
		}

		.funding-tiers {
			grid-template-columns: repeat(3, 1fr);
		}

		.testimonial-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 900px) {
		.unconference {
			--section-padding: 5rem 2rem;
		}

		.section-inner {
			max-width: 900px;
		}
	}
</style>
