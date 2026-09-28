<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Stage1 } from '$lib/interviewer-client';

	interface Props {
		busy: boolean;
		errorMessage: string;
		onsubmit: (stage1: Stage1) => void;
		onskip: () => void;
	}

	let { busy, errorMessage, onsubmit, onskip }: Props = $props();

	let value = $state('');
	let fallingShort = $state('');
	let ideas = $state('');
	let involvement = $state('');
	let openQuestions = $state({ membership: '', growth: '', roles: '', action: '' });
	let timeMinutes = $state<number | null>(20);
	let noTimeLimit = $state(false);
	let wantsNewsletter = $state(false);
	let nlEmail = $state('');
	let nlInterested = $state(''); // free text: "how often + what in it"

	const TIME_CHOICES = [15, 20, 30, 45, 60];
	const OPEN_QUESTIONS = [
		{
			key: 'membership',
			label: 'how should new membership be handled?',
			context:
				"samuel reads every application and basically lets everyone in. it's worked for ~130 applications, but it isn't scalable or democratic."
		},
		{
			key: 'growth',
			label: 'should the collective grow — and if so, how?',
			context:
				'growth so far is referral-driven. is more reach worth wanting? if so, how — and at what cost to coherence?'
		},
		{
			key: 'roles',
			label: "what roles of responsibility should exist, and who'd want them?",
			context:
				'the collective has no formal roles — things happen because someone decides to do them.'
		},
		{
			key: 'action',
			label: 'how do we shift from talking to actually doing?',
			context:
				"long threads, a deferred unconference, drafts, projects 'in planning'. what's the practical lever?"
		}
	] as const;

	function build(): Stage1 {
		const t = (s: string) => {
			const v = s.trim();
			return v ? v : null;
		};
		const newsletter =
			wantsNewsletter && nlEmail.trim()
				? {
						email: nlEmail.trim(),
						frequency: null,
						interested_in: t(nlInterested)
					}
				: null;
		const oq = {
			membership: t(openQuestions.membership),
			growth: t(openQuestions.growth),
			roles: t(openQuestions.roles),
			action: t(openQuestions.action)
		};
		const open_questions = Object.values(oq).some((v) => v !== null) ? oq : null;
		return {
			value: t(value),
			falling_short: t(fallingShort),
			ideas: t(ideas),
			involvement: t(involvement),
			time_minutes: noTimeLimit ? null : timeMinutes,
			no_time_limit: noTimeLimit,
			newsletter,
			open_questions
		};
	}

	// Action: auto-grow a textarea to fit its content. Works in every modern
	// browser (no reliance on the still-uneven `field-sizing` CSS).
	function autogrow(el: HTMLTextAreaElement) {
		const fit = () => {
			el.style.height = 'auto';
			el.style.height = el.scrollHeight + 'px';
		};
		fit();
		el.addEventListener('input', fit);
		return {
			destroy() {
				el.removeEventListener('input', fit);
			}
		};
	}
</script>

<section class="welcome stage1" in:fade={{ duration: 400 }}>
	<h1 class="display-title">
		<span class="title-line-1">before</span>
		<span class="title-line-2">we talk</span>
	</h1>
	<div class="rule"></div>
	<p class="lede">
		a couple of minutes of rough notes — all optional, a sentence is plenty. skip
		anything, or skip the whole thing.
	</p>

	<div class="form">
		<div class="field">
			<span class="field-label">how long do you want the conversation to be?</span>
			<div class="chips">
				{#each TIME_CHOICES as m (m)}
					<button
						type="button"
						class="chip"
						class:active={!noTimeLimit && timeMinutes === m}
						aria-pressed={!noTimeLimit && timeMinutes === m}
						onclick={() => {
							timeMinutes = m;
							noTimeLimit = false;
						}}>{m} min</button
					>
				{/each}
				<button
					type="button"
					class="chip"
					class:active={noTimeLimit}
					aria-pressed={noTimeLimit}
					onclick={() => (noTimeLimit = true)}>no fixed limit</button
				>
			</div>
		</div>

		<label class="field">
			<span class="field-label">what do you like about the collective? why did you join?</span>
			<textarea class="s1-input" rows="3" bind:value use:autogrow disabled={busy}></textarea>
		</label>
		<label class="field">
			<span class="field-label">where do you think we're falling short?</span>
			<textarea class="s1-input" rows="3" bind:value={fallingShort} use:autogrow disabled={busy}
			></textarea>
		</label>
		<label class="field">
			<span class="field-label"
				>any ideas for things we could do differently, or things you wish existed?</span
			>
			<textarea class="s1-input" rows="3" bind:value={ideas} use:autogrow disabled={busy}
			></textarea>
		</label>
		<label class="field">
			<span class="field-label"
				>would you like to get more involved? if so, what would you want to do?</span
			>
			<textarea class="s1-input" rows="3" bind:value={involvement} use:autogrow disabled={busy}
			></textarea>
		</label>

		<details class="s1-section">
			<summary>
				<span class="field-label">open questions</span>
				<span class="s1-hint">optional</span>
			</summary>
			<p class="s1-section-lede">braindump on as many as you like.</p>
			{#each OPEN_QUESTIONS as q (q.key)}
				<label class="field s1-q">
					<span class="field-label">{q.label}</span>
					<p class="s1-q-context">{q.context}</p>
					<textarea
						class="s1-input"
						rows="3"
						bind:value={openQuestions[q.key]}
						use:autogrow
						disabled={busy}
					></textarea>
				</label>
			{/each}
		</details>

		<label class="field newsletter-toggle">
			<input type="checkbox" bind:checked={wantsNewsletter} disabled={busy} />
			<span class="field-label">i'd like a personalised newsletter</span>
		</label>
		{#if wantsNewsletter}
			<label class="field">
				<span class="field-label">email</span>
				<input
					class="underline-input"
					type="email"
					bind:value={nlEmail}
					spellcheck="false"
					autocomplete="off"
					disabled={busy}
				/>
			</label>
			<label class="field">
				<span class="field-label">how often, and is there anything in particular you'd want in it?</span>
				<textarea
					class="s1-input"
					rows="3"
					placeholder="e.g. monthly — new essays and member projects"
					bind:value={nlInterested}
					use:autogrow
					disabled={busy}
				></textarea>
			</label>
		{/if}

		{#if errorMessage}
			<p class="error" in:fade>{errorMessage}</p>
		{/if}

		<div class="actions">
			<button class="begin-btn" onclick={() => onsubmit(build())} disabled={busy} aria-busy={busy}>
				<span class="begin-text">{busy ? 'opening' : 'start the conversation'}</span>
			</button>
			<button class="skip-btn" onclick={onskip} disabled={busy}>skip straight to it</button>
		</div>
	</div>
</section>

<style>
	.stage1 .form {
		max-width: 36rem;
	}
	.s1-input {
		width: 100%;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--rule, rgba(0, 0, 0, 0.2));
		font: inherit;
		color: inherit;
		padding: 0.35rem 0;
		/* Auto-grow happens via the `use:autogrow` action, which sets inline
		   height to scrollHeight on every input. overflow: hidden keeps the
		   brief height=auto step from flashing a scrollbar. */
		overflow: hidden;
		resize: none;
	}
	.s1-input:focus {
		outline: none;
		/* accent, like .underline-input and .modal-input — a 1px rule going from
		   22% to 100% text was the faintest focus cue on the page */
		border-bottom-color: var(--accent);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.4rem;
	}
	.chip {
		padding: 0.3rem 0.7rem;
		border: 1px solid var(--rule, rgba(0, 0, 0, 0.25));
		border-radius: 999px;
		background: transparent;
		font: inherit;
		color: inherit;
		cursor: pointer;
	}
	.chip.active {
		border-color: currentColor;
	}
	.newsletter-toggle {
		flex-direction: row;
		align-items: center;
		gap: 0.6rem;
		cursor: pointer;
		align-self: flex-start;
	}
	.newsletter-toggle input[type='checkbox'] {
		appearance: none;
		-webkit-appearance: none;
		width: 1rem;
		height: 1rem;
		margin: 0;
		border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
		border-radius: 2px;
		background: transparent;
		cursor: pointer;
		transition: border-color 0.15s, background-color 0.15s;
	}
	.newsletter-toggle input[type='checkbox']:checked {
		border-color: currentColor;
		background-color: currentColor;
	}
	.newsletter-toggle input[type='checkbox']:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	.skip-btn {
		background: none;
		border: none;
		font: inherit;
		color: inherit;
		opacity: 0.6;
		cursor: pointer;
		text-decoration: underline;
	}
	.skip-btn:hover {
		opacity: 1;
	}
	.s1-section {
		border-top: 1px solid var(--rule, rgba(0, 0, 0, 0.15));
		padding-top: 0.9rem;
	}
	.s1-section > summary {
		cursor: pointer;
		user-select: none;
	}
	.stage1 .underline-input {
		font: inherit;
	}
	.stage1 .field-label {
		font-size: 0.8rem;
	}
	.s1-hint {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		text-transform: lowercase;
		letter-spacing: 0.1em;
		opacity: 0.4;
		margin-left: 0.5rem;
	}
	.s1-section-lede {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		opacity: 0.55;
		margin: 1rem 0 0.4rem;
	}
	.s1-q {
		margin-top: 1.6rem;
		padding-left: 1.2rem;
		border-left: 1px solid var(--rule, rgba(0, 0, 0, 0.12));
	}
	.s1-q-context {
		font-size: 0.85rem;
		opacity: 0.5;
		line-height: 1.55;
		margin: 0.55rem 0 0.75rem;
	}
	.s1-q .s1-input {
		margin-top: 0.2rem;
	}
</style>
