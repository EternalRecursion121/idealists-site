<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import { interviewer as realInterviewer, InterviewerError, type TurnResponse } from '$lib/interviewer-client';
	import { mockInterviewer, mockControls } from '$lib/interviewer-client-mock';

	const isPreview = $derived($page.url.searchParams.has('preview'));
	const interviewer = $derived(isPreview ? mockInterviewer : realInterviewer);

	type Phase = 'welcome' | 'conversation' | 'notes' | 'done' | 'error';

	type Turn = {
		role: 'interviewer' | 'participant';
		text: string;
		elapsed?: number;
	};

	let phase = $state<Phase>('welcome');
	let memberHint = $state('');
	let busy = $state(false);
	let errorMessage = $state('');

	let sessionId = $state<string | null>(null);
	let turns = $state<Turn[]>([]);
	let inputText = $state('');
	let inputEl: HTMLTextAreaElement | null = $state(null);
	let scrollEl: HTMLDivElement | null = $state(null);

	let consent = $state<'private' | 'ask_first' | 'public'>('ask_first');
	let consentLocked = $state(false);
	let elapsedSeconds = $state(0);
	let timeBudgetSeconds = $state<number | null>(null);
	let interviewEnded = $state(false);
	let endReason = $state<string | null>(null);

	let notesContent = $state('');
	let notesOriginal = $state('');
	let notesPath = $state<string | null>(null);

	// Human-handoff modal state
	let humanModalOpen = $state(false);
	let humanName = $state('');
	let humanContact = $state('');
	let humanNote = $state('');
	let humanSubmitting = $state(false);
	let humanSubmitted = $state(false);
	let humanError = $state('');

	async function begin() {
		errorMessage = '';
		busy = true;
		try {
			const hint = memberHint.trim() || null;
			// Move to conversation phase immediately so the participant sees the
			// thinking indicator instead of a stuck "opening" button while the
			// first turn (which can take several seconds) generates.
			turns = [];
			phase = 'conversation';
			await tick();
			inputEl?.focus();
			const res = await interviewer.createSession({ member_hint: hint });
			sessionId = res.session_id;
			turns = [{ role: 'interviewer', text: res.opening_turn, elapsed: 0 }];
			await tick();
			scrollToBottom('instant');
			inputEl?.focus();
		} catch (e) {
			handleError(e);
			// fall back to welcome if the very first call failed
			if (turns.length === 0) phase = 'welcome';
		} finally {
			busy = false;
		}
	}

	// Try to detect a time mention in the participant's reply ("30 min", "an hour")
	// so the time-tag can update on the server side. Heuristic, not authoritative.
	function detectTimeBudgetSeconds(text: string): number | null {
		const t = text.toLowerCase();
		const mMin = t.match(/(\d+)\s*(?:min|minutes|m\b)/);
		if (mMin) return parseInt(mMin[1], 10) * 60;
		const mHr = t.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour|hours|h\b)/);
		if (mHr) return Math.round(parseFloat(mHr[1]) * 3600);
		if (/\bhalf\s*an?\s*hour\b/.test(t)) return 30 * 60;
		if (/\ban?\s*hour\b/.test(t)) return 60 * 60;
		return null;
	}

	async function send() {
		if (!inputText.trim() || !sessionId || busy) return;
		const text = inputText.trim();
		inputText = '';
		turns = [...turns, { role: 'participant', text, elapsed: elapsedSeconds }];
		await tick();
		scrollToBottom();
		busy = true;
		try {
			// Heuristically detect a time budget the participant just stated
			// ("about 30 min", "an hour"). If found, pass it so the server's
			// time-tag updates. Otherwise leave server budget alone.
			const detected = timeBudgetSeconds === null ? detectTimeBudgetSeconds(text) : null;
			const res: TurnResponse = await interviewer.turn(sessionId, {
				text,
				time_budget_seconds: detected
			});
			turns = [...turns, { role: 'interviewer', text: res.text, elapsed: res.elapsed_seconds }];
			elapsedSeconds = res.elapsed_seconds;
			timeBudgetSeconds = res.time_budget_seconds;
			consent = res.consent;
			consentLocked = res.consent_locked;
			interviewEnded = res.interview_ended;
			endReason = res.end_reason;
			await tick();
			scrollToBottom();

			if (res.interview_ended) {
				// Auto-fetch the notes for the participant to review
				if (res.notes_path) notesPath = res.notes_path;
				try {
					const notes = await interviewer.getNotes(sessionId);
					notesContent = notes.notes_content;
					notesOriginal = notes.notes_content;
					notesPath = notes.notes_path;
					phase = 'notes';
				} catch (err) {
					// If we can't fetch notes for some reason, still go to done
					console.error('failed to fetch notes', err);
					phase = 'done';
				}
			}
		} catch (e) {
			handleError(e);
		} finally {
			busy = false;
			inputEl?.focus();
		}
	}

	async function leaveEarly() {
		if (!sessionId) return;
		busy = true;
		try {
			const res = await interviewer.endSession(sessionId);
			notesContent = res.notes_content;
			notesOriginal = res.notes_content;
			notesPath = res.notes_path;
			phase = 'notes';
		} catch (e) {
			handleError(e);
		} finally {
			busy = false;
		}
	}

	async function fileNotes(asEdited: boolean) {
		if (!sessionId) return;
		busy = true;
		try {
			if (asEdited && notesContent !== notesOriginal) {
				const res = await interviewer.putNotes(sessionId, notesContent);
				notesContent = res.notes_content;
			}
			phase = 'done';
		} catch (e) {
			handleError(e);
		} finally {
			busy = false;
		}
	}

	function handleError(e: unknown) {
		console.error(e);
		if (e instanceof InterviewerError) {
			if (e.status === 409) {
				errorMessage =
					"looks like you've already done one of these. one per person for now — reach out to samuel if that's a mistake.";
			} else if (e.status === 410) {
				errorMessage = 'this conversation has already ended.';
			} else if (e.status === 503) {
				errorMessage = "the interviewer isn't running right now. try again in a moment.";
			} else {
				errorMessage = e.message || 'something went wrong.';
			}
		} else if (e instanceof TypeError) {
			errorMessage = "couldn't reach the interviewer. check your connection.";
		} else {
			errorMessage = String(e);
		}
		if (phase === 'welcome') return; // stay on welcome with error visible
		phase = 'error';
	}

	function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
		if (!scrollEl) return;
		scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior });
	}

	function onKeydown(e: KeyboardEvent) {
		// cmd/ctrl + enter sends; plain enter newlines
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			send();
		}
	}

	function fmtTime(s: number): string {
		if (s < 60) return `${s}s`;
		return `${Math.floor(s / 60)}m`;
	}

	function consentLabel(c: string): string {
		return c === 'private' ? 'private' : c === 'public' ? 'public' : 'ask first';
	}

	function autosize(el: HTMLTextAreaElement | null) {
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = Math.min(el.scrollHeight, 320) + 'px';
	}

	$effect(() => {
		if (inputText !== undefined) autosize(inputEl);
	});

	function openHumanModal() {
		humanModalOpen = true;
		humanError = '';
		humanSubmitted = false;
		// prefill name from the welcome input if they already typed one
		if (memberHint && !humanName) humanName = memberHint;
	}

	function closeHumanModal() {
		humanModalOpen = false;
	}

	async function submitHumanRequest() {
		if (!humanContact.trim()) {
			humanError = 'an email or discord handle, please.';
			return;
		}
		humanSubmitting = true;
		humanError = '';
		try {
			await interviewer.requestHuman({
				name: humanName.trim() || null,
				contact: humanContact.trim(),
				note: humanNote.trim() || null
			});
			humanSubmitted = true;
		} catch (e) {
			humanError = e instanceof Error ? e.message : 'something went wrong.';
		} finally {
			humanSubmitting = false;
		}
	}

	function onModalKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeHumanModal();
	}

	// Preview-mode dev controls
	let devOpen = $state(true);
	function devReset() {
		mockControls.reset();
		phase = 'welcome';
		turns = [];
		sessionId = null;
		notesContent = '';
		notesOriginal = '';
		notesPath = null;
		consent = 'ask_first';
		consentLocked = false;
		elapsedSeconds = 0;
		timeBudgetSeconds = null;
		interviewEnded = false;
		endReason = null;
		errorMessage = '';
	}
	async function devGotoPhase(p: Phase) {
		if (p === 'welcome') {
			devReset();
			return;
		}
		if (p === 'conversation') {
			devReset();
			await begin();
			return;
		}
		if (p === 'notes') {
			notesContent = mockControls.sampleNotes;
			notesOriginal = mockControls.sampleNotes;
			notesPath = '/mock/notes.md';
			phase = 'notes';
			return;
		}
		if (p === 'done') {
			notesPath = '/mock/notes.md';
			phase = 'done';
		}
	}
	function devSetConsent(c: 'private' | 'ask_first' | 'public') {
		mockControls.setConsent(c);
		consent = c;
	}

	// Inline typewriter for the "* (honorary member of the collective)" reveal.
	// Char-by-char into the live DOM so the text wraps with the surrounding line.
	const ASIDE_FULL = ' (honorary member of the collective)';
	let asideShown = $state('');
	let asideTimer: ReturnType<typeof setInterval> | null = null;

	function clearAsideTimer() {
		if (asideTimer) {
			clearInterval(asideTimer);
			asideTimer = null;
		}
	}

	function startAsideReveal() {
		clearAsideTimer();
		asideTimer = setInterval(() => {
			if (asideShown.length >= ASIDE_FULL.length) {
				clearAsideTimer();
				return;
			}
			asideShown = ASIDE_FULL.slice(0, asideShown.length + 1);
		}, 8);
	}

	function stopAsideReveal() {
		clearAsideTimer();
		asideTimer = setInterval(() => {
			if (asideShown.length <= 0) {
				clearAsideTimer();
				return;
			}
			asideShown = asideShown.slice(0, -1);
		}, 5);
	}
</script>

<svelte:head>
	<title>collective conversation — the idealists collective</title>
</svelte:head>

<div class="frame">
	{#if phase === 'welcome'}
		<section class="welcome" in:fade={{ duration: 600 }}>
			<h1 class="display-title">
				<span class="title-line-1">collective</span>
				<span class="title-line-2">conversation</span>
			</h1>

			<div class="rule"></div>

			<p class="lede">
				a two way interview with claude<span
					class="asterisk-wrap"
					tabindex="0"
					role="button"
					aria-label="(honorary member of the collective)"
					onmouseenter={startAsideReveal}
					onmouseleave={stopAsideReveal}
					onfocus={startAsideReveal}
					onblur={stopAsideReveal}
					><span class="ast">*</span><span class="aside-inline">{asideShown}</span></span
				> for you to find out everything that's going on, and have your say on its future.
			</p>

			<div class="form">
				<label class="field">
					<span class="field-label">name or handle <em>· optional</em></span>
					<input
						class="underline-input"
						type="text"
						bind:value={memberHint}
						placeholder="e.g. samuel, eternalrecursion"
						spellcheck="false"
						autocomplete="off"
						disabled={busy}
					/>
				</label>

				{#if errorMessage}
					<p class="error" in:fade>{errorMessage}</p>
				{/if}

				<div class="actions">
					<button class="begin-btn" onclick={begin} disabled={busy} aria-busy={busy}>
						<span class="begin-text">{busy ? 'opening' : 'begin'}</span>
						<svg
							class="begin-arrow"
							aria-hidden="true"
							width="22"
							height="14"
							viewBox="0 0 22 14"
							fill="none"
						>
							<path
								d="M1 7 H20 M14 1 L20 7 L14 13"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>

					<div class="actions-divider">
						<span class="divider-line"></span>
						<span class="divider-text">or</span>
						<span class="divider-line"></span>
					</div>

					<button class="human-btn" onclick={openHumanModal} disabled={busy}>
						screw ai, i want to talk to a human
					</button>
				</div>
			</div>
		</section>

		{#if humanModalOpen}
			<div
				class="modal-backdrop"
				role="presentation"
				onclick={closeHumanModal}
				onkeydown={onModalKeydown}
				transition:fade={{ duration: 180 }}
			>
				<div
					class="modal"
					role="dialog"
					aria-modal="true"
					aria-labelledby="human-modal-title"
					onclick={(e) => e.stopPropagation()}
					onkeydown={onModalKeydown}
					in:fly={{ y: 12, duration: 240 }}
				>
					{#if humanSubmitted}
						<h2 id="human-modal-title" class="modal-title">noted.</h2>
						<p class="modal-lede">
							a human from the collective will reach out. it might take a day or two — we're
							small.
						</p>
						<div class="modal-actions">
							<button class="modal-primary" onclick={closeHumanModal}>close</button>
						</div>
					{:else}
						<h2 id="human-modal-title" class="modal-title">talk to a human</h2>
						<p class="modal-lede">
							leave a name and a way to reach you. someone in the collective will follow up.
						</p>

						<label class="modal-field">
							<span class="modal-field-label">name <em>· optional</em></span>
							<input
								class="modal-input"
								type="text"
								bind:value={humanName}
								placeholder="what should we call you?"
								spellcheck="false"
								autocomplete="name"
								disabled={humanSubmitting}
							/>
						</label>

						<label class="modal-field">
							<span class="modal-field-label">email or discord</span>
							<input
								class="modal-input"
								type="text"
								bind:value={humanContact}
								placeholder="you@example.com  ·  or @yourhandle"
								spellcheck="false"
								autocomplete="email"
								disabled={humanSubmitting}
							/>
						</label>

						<label class="modal-field">
							<span class="modal-field-label">anything to add <em>· optional</em></span>
							<textarea
								class="modal-input modal-textarea"
								bind:value={humanNote}
								placeholder="what you'd like to talk about, or how you came across this"
								rows="3"
								disabled={humanSubmitting}
							></textarea>
						</label>

						{#if humanError}
							<p class="error" in:fade>{humanError}</p>
						{/if}

						<div class="modal-actions">
							<button
								class="modal-secondary"
								onclick={closeHumanModal}
								disabled={humanSubmitting}
							>
								cancel
							</button>
							<button
								class="modal-primary"
								onclick={submitHumanRequest}
								disabled={humanSubmitting}
							>
								{humanSubmitting ? 'sending' : 'send'}
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{:else if phase === 'conversation'}
		<section class="conversation-frame" in:fade={{ duration: 400 }}>
			<aside class="margin">
				<div class="margin-row">
					<span class="margin-label">elapsed</span>
					<span class="margin-value">{fmtTime(elapsedSeconds)}</span>
				</div>
				{#if timeBudgetSeconds}
					<div class="margin-row">
						<span class="margin-label">budget</span>
						<span class="margin-value">{fmtTime(timeBudgetSeconds)}</span>
					</div>
				{/if}
				<button class="margin-action" onclick={leaveEarly} disabled={busy} title="end the interview">
					end now
				</button>
			</aside>

			<div class="transcript" bind:this={scrollEl}>
				<div class="transcript-inner">
					{#each turns as turn, i (i)}
						<article class="turn turn-{turn.role}" in:fly={{ y: 8, duration: 280 }}>
							<header class="turn-attr">
								{turn.role === 'interviewer' ? 'interviewer' : 'you'}
							</header>
							<div class="turn-text">{turn.text}</div>
						</article>
					{/each}
					{#if busy}
						<div class="thinking" in:fade={{ duration: 200 }}>
							<span class="dot"></span><span class="dot"></span><span class="dot"></span>
							{#if turns.length === 0}
								<span class="thinking-label">warming up — reading the wiki, finding you in it</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<div class="composer">
				<textarea
					bind:this={inputEl}
					bind:value={inputText}
					onkeydown={onKeydown}
					placeholder="say what's actually on your mind. cmd/ctrl+enter to send."
					rows="2"
					disabled={busy}
				></textarea>
				<button class="send-btn" onclick={send} disabled={!inputText.trim() || busy}>
					{busy ? '…' : 'send'}
				</button>
			</div>
		</section>
	{:else if phase === 'notes'}
		<section class="notes" in:fade={{ duration: 400 }}>
			<header class="notes-header">
				<h1>your notes</h1>
				<p class="lede">
					this is what i wrote about our conversation. read it. change anything that's wrong.
					redact anything you don't want filed. it's yours.
				</p>
				<p class="meta">
					{#if consent === 'private'}
						<span class="consent-pill consent-private">private</span> nothing here will be shared. these notes stay as your internal record only.
					{:else if consent === 'public'}
						<span class="consent-pill consent-public">public</span> notes can be incorporated into the wiki freely; you can be quoted publicly.
					{:else}
						<span class="consent-pill consent-ask">ask first</span> these notes will be read internally; nothing public happens without checking with you per-quote.
					{/if}
				</p>
			</header>

			<textarea class="notes-editor" bind:value={notesContent} spellcheck="false"></textarea>

			<div class="notes-actions">
				<div class="actions-info">
					{#if notesContent !== notesOriginal}
						<span class="dirty">edited · the original draft is preserved</span>
					{:else}
						<span class="clean">unedited · save to file as-is</span>
					{/if}
				</div>
				<div class="actions-buttons">
					<button class="link-btn" onclick={() => fileNotes(false)} disabled={busy}>
						file as-is
					</button>
					<button class="primary-btn" onclick={() => fileNotes(true)} disabled={busy}>
						{notesContent !== notesOriginal ? 'save edits and file' : 'file'}
					</button>
				</div>
			</div>
		</section>
	{:else if phase === 'done'}
		<section class="done" in:fade={{ duration: 600 }}>
			<h1>thanks.</h1>
			<p class="lede">
				notes filed{notesPath ? ` at ${notesPath.split('/').pop()}` : ''}. someone in the
				collective will read them.
			</p>
			<p class="sub">go do the thing you've been thinking about.</p>
			<a href="/" class="link">return to the site</a>
		</section>
	{:else if phase === 'error'}
		<section class="error-state" in:fade>
			<h1>something broke.</h1>
			<p class="error">{errorMessage}</p>
			<a href="/interview" class="link">try again</a>
		</section>
	{/if}

	{#if isPreview}
		<aside class="dev-panel" class:dev-panel-collapsed={!devOpen}>
			<button class="dev-toggle" onclick={() => (devOpen = !devOpen)} title="toggle dev panel">
				{devOpen ? '×' : '⚙'}
			</button>
			{#if devOpen}
				<div class="dev-body">
					<div class="dev-section">
						<div class="dev-label">preview mode</div>
						<p class="dev-hint">no api calls · canned responses · zero credits</p>
					</div>
					<div class="dev-section">
						<div class="dev-label">jump to phase</div>
						<div class="dev-row">
							<button onclick={() => devGotoPhase('welcome')} class:active={phase === 'welcome'}
								>welcome</button
							>
							<button
								onclick={() => devGotoPhase('conversation')}
								class:active={phase === 'conversation'}
								>conversation</button
							>
							<button onclick={() => devGotoPhase('notes')} class:active={phase === 'notes'}
								>notes</button
							>
							<button onclick={() => devGotoPhase('done')} class:active={phase === 'done'}
								>done</button
							>
						</div>
					</div>
					<div class="dev-section">
						<div class="dev-label">consent</div>
						<div class="dev-row">
							<button
								onclick={() => devSetConsent('private')}
								class:active={consent === 'private'}>private</button
							>
							<button
								onclick={() => devSetConsent('ask_first')}
								class:active={consent === 'ask_first'}>ask first</button
							>
							<button
								onclick={() => devSetConsent('public')}
								class:active={consent === 'public'}>public</button
							>
						</div>
					</div>
					<div class="dev-section dev-stats">
						elapsed {elapsedSeconds}s · turns {turns.length} · busy {busy ? 'y' : 'n'}
					</div>
					<button class="dev-reset" onclick={devReset}>reset everything</button>
				</div>
			{/if}
		</aside>
	{/if}
</div>

<style>
	.frame {
		max-width: 56rem;
		margin: 0 auto;
		padding: 0 1rem;
		min-height: 80vh;
		display: flex;
		flex-direction: column;
	}

	h1 {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 2rem;
		margin: 4rem 0 1.5rem;
		line-height: 1.1;
		color: var(--heading);
	}

	@media (min-width: 640px) {
		h1 {
			font-size: 2.75rem;
			margin-top: 5rem;
		}
	}

	.lede {
		font-size: 1.05rem;
		line-height: 1.55;
		max-width: 38rem;
		margin: 0 0 1rem;
	}

	.asterisk-wrap {
		display: inline;
		cursor: help;
		outline: none;
	}

	.ast {
		color: var(--accent);
		font-weight: 600;
		padding: 0 0.05em;
	}

	.aside-inline {
		color: var(--accent);
		opacity: 0.85;
		font-style: italic;
		white-space: pre-wrap;
	}

	.sub {
		font-size: 0.95rem;
		line-height: 1.6;
		opacity: 0.78;
		max-width: 38rem;
		margin: 0 0 0.75rem;
	}

	.meta {
		font-size: 0.8rem;
		opacity: 0.55;
		font-family: var(--font-mono);
		margin-top: 0.75rem;
	}

	/* ---------- welcome ---------- */
	.welcome {
		padding: 5rem 0 6rem;
		max-width: 42rem;
	}

	.display-title {
		font-family: var(--font-display);
		font-weight: 500;
		font-size: clamp(2.8rem, 8vw, 5.5rem);
		line-height: 0.98;
		margin: 0 0 1.75rem;
		letter-spacing: -0.015em;
		display: flex;
		flex-direction: column;
		gap: 0.05em;
	}

	.title-line-1 {
		color: var(--heading);
	}
	.title-line-2 {
		color: var(--accent);
		font-style: italic;
		padding-left: 0.6em;
	}

	.rule {
		width: 4rem;
		height: 1px;
		background: var(--accent);
		opacity: 0.6;
		margin: 0 0 1.75rem;
	}

	.form {
		margin-top: 3rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 34rem;
	}

	.actions {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.5rem;
	}

	.actions-divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		max-width: 18rem;
		margin: 0.25rem 0;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		text-transform: lowercase;
		letter-spacing: 0.18em;
		opacity: 0.4;
	}

	.divider-line {
		flex: 1;
		height: 1px;
		background: currentColor;
	}

	.divider-text {
		flex-shrink: 0;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.field-label {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		text-transform: lowercase;
		letter-spacing: 0.1em;
		opacity: 0.6;
		color: var(--heading);
	}

	.field-label em {
		opacity: 0.65;
		font-style: italic;
		letter-spacing: 0.04em;
	}

	/* underline-style input — no full border, just a baseline */
	.underline-input {
		width: 100%;
		padding: 0.6rem 0.1rem;
		font-family: var(--font-display);
		font-size: 1.25rem;
		background: transparent;
		border: none;
		border-bottom: 1px solid color-mix(in srgb, var(--text) 30%, transparent);
		color: var(--heading);
		outline: none;
		transition: border-color 0.2s, color 0.2s;
	}

	.underline-input:focus {
		border-bottom-color: var(--accent);
		color: var(--accent);
	}

	.underline-input::placeholder {
		opacity: 0.3;
		font-style: italic;
		font-size: 1rem;
	}

	.begin-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.4rem 0;
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1.6rem;
		font-weight: 500;
		line-height: 1;
		background: transparent;
		border: none;
		color: var(--accent);
		cursor: pointer;
		position: relative;
		transition: color 0.2s ease;
	}

	.begin-btn::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0.15rem;
		width: 100%;
		height: 1px;
		background: currentColor;
		opacity: 0.35;
		transform-origin: left;
		transition: opacity 0.2s ease, transform 0.3s ease;
	}

	.begin-btn:hover:not(:disabled)::after {
		opacity: 1;
	}

	.begin-btn:hover:not(:disabled) .begin-arrow {
		transform: translateX(6px);
	}

	.begin-btn:active:not(:disabled) {
		opacity: 0.8;
	}

	.begin-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.begin-text {
		display: inline-block;
		line-height: 1;
	}

	.begin-arrow {
		display: inline-block;
		transition: transform 0.25s ease;
		flex-shrink: 0;
	}

	.human-btn {
		padding: 0.4rem 0;
		font-family: inherit;
		font-size: 0.85rem;
		line-height: 1;
		background: transparent;
		border: none;
		color: var(--text);
		opacity: 0.55;
		cursor: pointer;
		text-decoration: none;
		border-bottom: 1px dashed color-mix(in srgb, var(--text) 30%, transparent);
		transition: all 0.2s ease;
	}

	.human-btn:hover:not(:disabled) {
		opacity: 1;
		color: var(--accent);
		border-bottom-color: var(--accent);
		border-bottom-style: solid;
	}

	.human-btn:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}

	/* ---------- modal ---------- */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: color-mix(in srgb, #000 55%, transparent);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		z-index: 50;
	}

	.modal {
		width: 100%;
		max-width: 32rem;
		background: var(--bg, #fff);
		border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
		border-radius: 4px;
		padding: 2rem 2rem 1.75rem;
		box-shadow: 0 24px 60px color-mix(in srgb, #000 30%, transparent);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.modal-title {
		font-family: var(--font-display);
		font-weight: 500;
		font-size: 1.7rem;
		line-height: 1.1;
		margin: 0;
		color: var(--heading);
	}

	.modal-lede {
		font-size: 0.95rem;
		line-height: 1.55;
		opacity: 0.78;
		margin: -0.25rem 0 0.25rem;
	}

	.modal-field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.modal-field-label {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		text-transform: lowercase;
		letter-spacing: 0.1em;
		opacity: 0.6;
		color: var(--heading);
	}

	.modal-field-label em {
		opacity: 0.65;
		font-style: italic;
		letter-spacing: 0.04em;
	}

	.modal-input {
		width: 100%;
		padding: 0.55rem 0.7rem;
		font-family: inherit;
		font-size: 1rem;
		line-height: 1.4;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--text) 22%, transparent);
		border-radius: 2px;
		color: var(--text);
		outline: none;
		transition: border-color 0.15s;
	}

	.modal-input:focus {
		border-color: var(--accent);
	}

	.modal-input::placeholder {
		opacity: 0.35;
	}

	.modal-textarea {
		resize: vertical;
		min-height: 4.5rem;
		font-family: inherit;
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.modal-secondary,
	.modal-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 1.5rem 0.8rem;
		font-family: var(--font-display);
		font-size: 0.95rem;
		line-height: 1;
		background: transparent;
		border-radius: 3px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.modal-secondary {
		border: 1px solid color-mix(in srgb, var(--text) 25%, transparent);
		color: var(--text);
		opacity: 0.7;
	}

	.modal-secondary:hover:not(:disabled) {
		opacity: 1;
		border-color: var(--text);
	}

	.modal-primary {
		border: 1px solid var(--accent);
		color: var(--accent);
	}

	.modal-primary:hover:not(:disabled) {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
	}

	.modal-secondary:disabled,
	.modal-primary:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.error {
		color: color-mix(in srgb, var(--accent) 70%, #c44 30%);
		font-size: 0.9rem;
	}

	/* ---------- conversation ---------- */
	.conversation-frame {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr auto;
		grid-template-areas:
			'transcript'
			'composer';
		gap: 1rem;
		min-height: calc(100vh - 4rem);
		padding-top: 1rem;
	}

	@media (min-width: 900px) {
		.conversation-frame {
			grid-template-columns: 9rem 1fr;
			grid-template-areas:
				'margin    transcript'
				'margin    composer';
		}
	}

	.margin {
		grid-area: margin;
		display: flex;
		flex-direction: row;
		gap: 1.5rem;
		padding: 0.5rem 0;
		font-size: 0.75rem;
		opacity: 0.65;
		font-family: var(--font-mono);
	}

	@media (min-width: 900px) {
		.margin {
			flex-direction: column;
			gap: 0.6rem;
			padding: 1rem 1rem 1rem 0;
			border-right: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
		}
	}

	.margin-row {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.margin-label {
		opacity: 0.55;
		font-size: 0.65rem;
		text-transform: lowercase;
		letter-spacing: 0.05em;
	}

	.margin-value {
		opacity: 0.95;
		font-size: 0.85rem;
	}

	.margin-value.locked::after {
		content: ' ✓';
		color: var(--accent);
	}

	.margin-action {
		margin-top: auto;
		padding: 0.4rem 0.6rem;
		font-family: inherit;
		font-size: 0.75rem;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
		border-radius: 2px;
		color: var(--text);
		cursor: pointer;
		opacity: 0.7;
		transition: all 0.15s;
	}

	.margin-action:hover:not(:disabled) {
		opacity: 1;
		border-color: var(--accent);
		color: var(--accent);
	}

	.transcript {
		grid-area: transcript;
		overflow-y: auto;
		max-height: calc(100vh - 14rem);
		padding-right: 1rem;
		scrollbar-width: thin;
		scrollbar-color: color-mix(in srgb, var(--text) 20%, transparent) transparent;
	}

	.transcript-inner {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 1rem 0 4rem;
		max-width: 38rem;
	}

	.turn {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.turn-attr {
		font-size: 0.7rem;
		text-transform: lowercase;
		letter-spacing: 0.06em;
		opacity: 0.5;
		font-family: var(--font-mono);
	}

	.turn-interviewer .turn-attr {
		color: var(--accent);
		opacity: 0.7;
	}

	.turn-text {
		white-space: pre-wrap;
		font-size: 1rem;
		line-height: 1.65;
	}

	.turn-participant {
		padding-left: 1rem;
		border-left: 2px solid color-mix(in srgb, var(--text) 18%, transparent);
	}

	.thinking {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0;
		opacity: 0.55;
	}

	.thinking-label {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		text-transform: lowercase;
		letter-spacing: 0.06em;
		opacity: 0.85;
		margin-left: 0.3rem;
	}

	.dot {
		width: 5px;
		height: 5px;
		background: var(--text);
		border-radius: 50%;
		animation: breathe 1.4s ease-in-out infinite;
	}

	.dot:nth-child(2) {
		animation-delay: 0.18s;
	}
	.dot:nth-child(3) {
		animation-delay: 0.36s;
	}

	@keyframes breathe {
		0%,
		100% {
			opacity: 0.25;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.composer {
		grid-area: composer;
		display: flex;
		gap: 0.6rem;
		align-items: flex-end;
		padding: 0.5rem 0 0;
		max-width: 38rem;
	}

	.composer textarea {
		flex: 1;
		padding: 0.7rem 0.9rem;
		font-family: inherit;
		font-size: 1rem;
		line-height: 1.5;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--text) 22%, transparent);
		border-radius: 2px;
		color: var(--text);
		outline: none;
		resize: none;
		min-height: 3rem;
		transition: border-color 0.15s;
	}

	.composer textarea:focus {
		border-color: var(--accent);
	}

	.composer textarea::placeholder {
		opacity: 0.35;
	}

	.send-btn {
		padding: 0.7rem 1.4rem;
		font-family: var(--font-display);
		font-size: 0.95rem;
		background: transparent;
		border: 1px solid var(--accent);
		border-radius: 2px;
		color: var(--accent);
		cursor: pointer;
		transition: all 0.15s;
	}

	.send-btn:hover:not(:disabled) {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
	}

	.send-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	/* ---------- notes ---------- */
	.notes {
		padding-bottom: 4rem;
	}

	.notes-header {
		max-width: 40rem;
	}

	.consent-pill {
		display: inline-block;
		padding: 0.15rem 0.55rem;
		margin-right: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		text-transform: lowercase;
		letter-spacing: 0.06em;
		border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
		border-radius: 999px;
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.consent-pill.consent-private {
		border-color: color-mix(in srgb, var(--text) 35%, transparent);
		color: var(--text);
		background: color-mix(in srgb, var(--text) 8%, transparent);
		opacity: 0.75;
	}

	.notes-editor {
		display: block;
		width: 100%;
		min-height: 60vh;
		margin-top: 2rem;
		padding: 1.25rem 1.5rem;
		font-family: var(--font-mono);
		font-size: 0.88rem;
		line-height: 1.6;
		background: color-mix(in srgb, var(--text) 4%, transparent);
		border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
		border-radius: 3px;
		color: var(--text);
		outline: none;
		resize: vertical;
		white-space: pre-wrap;
	}

	.notes-editor:focus {
		border-color: var(--accent);
	}

	.notes-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.actions-info {
		font-size: 0.85rem;
		opacity: 0.65;
		font-family: var(--font-mono);
	}

	.dirty {
		color: var(--accent);
	}

	.actions-buttons {
		display: flex;
		gap: 0.75rem;
	}

	.link-btn,
	.primary-btn {
		padding: 0.6rem 1.4rem;
		font-family: var(--font-display);
		font-size: 0.95rem;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--text) 25%, transparent);
		border-radius: 2px;
		color: var(--text);
		cursor: pointer;
		transition: all 0.15s;
	}

	.link-btn:hover:not(:disabled) {
		border-color: var(--text);
		opacity: 0.9;
	}

	.primary-btn {
		border-color: var(--accent);
		color: var(--accent);
	}

	.primary-btn:hover:not(:disabled) {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
	}

	/* ---------- done ---------- */
	.done {
		padding-top: 6rem;
	}

	.link {
		display: inline-block;
		margin-top: 2rem;
		padding: 0.5rem 0;
		font-family: var(--font-display);
		font-size: 0.95rem;
		opacity: 0.7;
		text-decoration: none;
		border-bottom: 1px solid color-mix(in srgb, var(--text) 30%, transparent);
		transition: all 0.15s;
		color: var(--text);
	}

	.link:hover {
		opacity: 1;
		border-bottom-color: var(--accent);
		color: var(--accent);
	}

	.error-state {
		padding-top: 6rem;
	}

	/* ---------- preview-mode dev panel ---------- */
	.dev-panel {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 60;
		min-width: 18rem;
		max-width: 22rem;
		padding: 0.75rem 0.9rem 0.9rem;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		background: color-mix(in srgb, var(--bg, #fff) 96%, var(--text) 4%);
		border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
		border-radius: 4px;
		box-shadow: 0 8px 30px color-mix(in srgb, #000 18%, transparent);
		opacity: 0.95;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}

	.dev-panel-collapsed {
		min-width: 0;
		padding: 0.3rem 0.4rem;
	}

	.dev-toggle {
		position: absolute;
		top: 0.25rem;
		right: 0.4rem;
		width: 1.4rem;
		height: 1.4rem;
		padding: 0;
		font-size: 1rem;
		line-height: 1;
		background: transparent;
		border: none;
		color: var(--text);
		opacity: 0.55;
		cursor: pointer;
	}
	.dev-toggle:hover {
		opacity: 1;
	}
	.dev-panel-collapsed .dev-toggle {
		position: relative;
		top: auto;
		right: auto;
	}

	.dev-body {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding-right: 1.2rem;
	}

	.dev-section {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.dev-label {
		opacity: 0.5;
		text-transform: lowercase;
		letter-spacing: 0.08em;
		font-size: 0.65rem;
	}

	.dev-hint {
		margin: 0;
		opacity: 0.55;
		font-size: 0.7rem;
		line-height: 1.4;
	}

	.dev-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.dev-row button {
		padding: 0.3rem 0.55rem;
		font-family: inherit;
		font-size: 0.7rem;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--text) 25%, transparent);
		border-radius: 3px;
		color: var(--text);
		opacity: 0.75;
		cursor: pointer;
		transition: all 0.15s;
	}
	.dev-row button:hover {
		opacity: 1;
		border-color: var(--accent);
		color: var(--accent);
	}
	.dev-row button.active {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		opacity: 1;
	}

	.dev-stats {
		opacity: 0.55;
		font-size: 0.7rem;
	}

	.dev-reset {
		padding: 0.4rem 0.7rem;
		font-family: inherit;
		font-size: 0.7rem;
		background: transparent;
		border: 1px dashed color-mix(in srgb, var(--text) 35%, transparent);
		border-radius: 3px;
		color: var(--text);
		opacity: 0.7;
		cursor: pointer;
		transition: all 0.15s;
		align-self: flex-start;
	}
	.dev-reset:hover {
		opacity: 1;
		border-style: solid;
		color: color-mix(in srgb, var(--accent) 80%, #c44 20%);
		border-color: currentColor;
	}
</style>
