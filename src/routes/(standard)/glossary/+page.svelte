<svelte:head>
	<title>Glossary — The Idealists Collective</title>
</svelte:head>

<section class="glossary">
	<!-- Featured: Idealist definition -->
	<div class="featured-term">
		<div class="featured-header">
			<h1 class="featured-word">idealist</h1>
			<span class="featured-pos">noun</span>
		</div>
		<span class="pronunciation">/ʌɪˈdɪəlɪst/</span>
		<ol class="featured-definitions">
			<li>someone who believes that a much better world is possible, often when this does not seem likely to others</li>
			<li>a person who sticks to their principles, choosing integrity over convenience</li>
			<li>the belief that ideas are more fundamental than matter, and that subjectivity is the foundation of everything</li>
			<li><a href="/join" class="you-link">you?</a></li>
		</ol>
	</div>

	<!-- Section header -->
	<h2 class="section-header">our vocabulary</h2>

	<!-- Terms grid -->
	<div class="terms-grid">
		<article class="term-card">
			<h3 class="term-name">aliveness</h3>
			<p class="term-definition">
				The quality of having a strong, autonomous trajectory that resists unalive attractors.
				Preserving individuality while reducing local entropy in beautiful ways.
			</p>
			<span class="term-link">→ <a href="/writings/aliveness">read more</a></span>
		</article>

		<article class="term-card">
			<h3 class="term-name">unfolding</h3>
			<p class="term-definition">
				The process by which future entities gradually become real through present actions.
				Moving from potential to actual. The retrochronic self-creation of what one is becoming.
			</p>
		</article>

		<article class="term-card">
			<h3 class="term-name">hyperstition</h3>
			<p class="term-definition">
				Ideas that make themselves real through belief and action.
				Self-fulfilling prophecies that shape reality. Can serve either coordination or dissolution.
			</p>
		</article>

		<article class="term-card">
			<h3 class="term-name">positive-sum</h3>
			<p class="term-definition">
				Cooperative dynamics where competition is bounded, allowing internal coordination.
				Like the human body—selected by external pressure but internally cooperating.
			</p>
		</article>

		<article class="term-card">
			<h3 class="term-name">autonomy</h3>
			<p class="term-definition">
				Having a trajectory that is authentically one's own.
				Distinguishing signal from noise, separating what's genuinely yours from inherited patterns.
			</p>
		</article>

		<article class="term-card">
			<h3 class="term-name">getting real</h3>
			<p class="term-definition">
				Aiding the unfolding of one's natural trajectory.
				Removing obstacles, clarifying direction, actively participating in reality-creation.
			</p>
		</article>
	</div>
</section>

<style>
	.glossary {
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	/* Featured idealist definition */
	.featured-term {
		position: relative;
		padding: 2rem 2rem 2rem 2.5rem;
		background: linear-gradient(135deg,
			color-mix(in srgb, var(--accent) 8%, transparent) 0%,
			color-mix(in srgb, var(--accent) 3%, transparent) 100%
		);
		border-radius: 4px;
	}

	.featured-term::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		background: linear-gradient(180deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 40%, transparent) 100%);
		border-radius: 2px 0 0 2px;
	}

	.featured-header {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.featured-word {
		font-size: 2.5rem;
		font-family: var(--font-serif);
		font-weight: 400;
		font-style: italic;
		letter-spacing: -0.02em;
		color: var(--heading);
		margin: 0;
	}

	.featured-pos {
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.4;
		padding: 0.2rem 0.5rem;
		border: 1px solid color-mix(in srgb, var(--text) 20%, transparent);
		border-radius: 3px;
	}

	.pronunciation {
		font-size: 0.9rem;
		opacity: 0.5;
		color: var(--accent);
		display: block;
		margin-bottom: 1.25rem;
		font-family: var(--font-serif);
	}

	.featured-definitions {
		margin: 0;
		padding-left: 1.5rem;
		font-family: var(--font-serif);
		font-size: 1.05rem;
		line-height: 1.7;
		opacity: 0.85;
	}

	.featured-definitions li {
		margin-bottom: 0.75rem;
		padding-left: 0.5rem;
	}

	.featured-definitions li::marker {
		color: var(--accent);
		opacity: 0.6;
	}

	.you-link {
		text-decoration: none;
		color: var(--accent);
		font-style: italic;
		transition: opacity 0.2s;
	}

	.you-link:hover {
		opacity: 0.7;
	}

	/* Section header */
	.section-header {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--accent);
		opacity: 0.7;
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
	}

	/* Terms grid */
	.terms-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	.term-card {
		position: relative;
		padding: 1.25rem 1.5rem;
		background: color-mix(in srgb, var(--text) 3%, transparent);
		border-radius: 4px;
		border: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
		transition: border-color 0.2s, background 0.2s;
	}

	.term-card:hover {
		border-color: color-mix(in srgb, var(--accent) 30%, transparent);
		background: color-mix(in srgb, var(--accent) 5%, transparent);
	}

	.term-name {
		font-size: 1.25rem;
		font-family: var(--font-serif);
		font-weight: 500;
		font-style: italic;
		margin: 0 0 0.5rem 0;
		color: var(--heading);
		transition: color 0.2s;
	}

	.term-card:hover .term-name {
		color: var(--accent);
	}

	.term-definition {
		font-family: var(--font-serif);
		font-size: 0.95rem;
		line-height: 1.6;
		opacity: 0.75;
		margin: 0;
	}

	.term-link {
		display: block;
		margin-top: 0.75rem;
		font-size: 0.8rem;
		opacity: 0.5;
		transition: opacity 0.2s;
	}

	.term-link a {
		color: var(--accent);
		text-decoration: none;
	}

	.term-card:hover .term-link {
		opacity: 1;
	}

	.term-link a:hover {
		text-decoration: underline;
	}

	@media (min-width: 640px) {
		.featured-term {
			padding: 2.5rem 3rem 2.5rem 3rem;
		}

		.featured-word {
			font-size: 3rem;
		}

		.featured-definitions {
			font-size: 1.1rem;
		}

		.terms-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1.5rem;
		}

		.term-name {
			font-size: 1.3rem;
		}

		.term-definition {
			font-size: 1rem;
		}
	}

	@media (min-width: 900px) {
		.terms-grid {
			gap: 2rem;
		}
	}
</style>
