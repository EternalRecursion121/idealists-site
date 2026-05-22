<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import { interviewer as realInterviewer, InterviewerError } from '$lib/interviewer-client';
	import { mockInterviewer, mockControls } from '$lib/interviewer-client-mock';

	const isPreview = $derived($page.url.searchParams.has('preview'));
	const interviewer = $derived(isPreview ? mockInterviewer : realInterviewer);

	type Phase = 'welcome' | 'form' | 'conversation' | 'notes' | 'done' | 'error';

	type ToolPart = {
		kind: 'tool';
		id: string;
		name: string;
		label: string;
		ok: boolean | null; // null = in flight
	};
	type TextPart = { kind: 'text'; text: string };
	type Part = TextPart | ToolPart;

	type Turn = {
		role: 'interviewer' | 'participant';
		parts: Part[];
		elapsed?: number;
		streaming?: boolean;
	};

	let phase = $state<Phase>('welcome');
	let memberHint = $state('');
	// Stage-1 form state
	let s1Value = $state('');
	let s1FallingShort = $state('');
	let s1Ideas = $state('');
	let s1Involvement = $state('');
	let s1TimeMinutes = $state<number | null>(20);
	let s1NoTimeLimit = $state(false);
	let s1WantsNewsletter = $state(false);
	let s1NlEmail = $state('');
	let s1NlInterested = $state(''); // free text: "how often + what in it"
	const TIME_CHOICES = [15, 20, 30, 45, 60];
	let busy = $state(false);
	let errorMessage = $state('');

	let sessionId = $state<string | null>(null);
	let turns = $state<Turn[]>([]);
	let inputText = $state('');
	let inputEl: HTMLTextAreaElement | null = $state(null);
	let composerFocused = $state(false);
	// Coarse pointer ≈ touch device with a soft keyboard. Drives Enter behaviour:
	// on touch, Enter must newline (the send button sends) so people can write
	// multi-line replies and don't fire half-finished messages by accident.
	let isTouch = $state(false);

	let elapsedSeconds = $state(0);
	let timeBudgetSeconds = $state<number | null>(null);
	let interviewEnded = $state(false);
	let endReason = $state<string | null>(null);

	let notesContent = $state('');
	let notesOriginal = $state('');
	let notesPath = $state<string | null>(null);
	let writingNotes = $state(false);

	// Human-handoff modal state
	let humanModalOpen = $state(false);
	let humanName = $state('');
	let humanContact = $state('');
	let humanNote = $state('');
	let humanSubmitting = $state(false);
	let humanSubmitted = $state(false);
	let humanError = $state('');

	function begin() {
		// Welcome → stage-1 form. (No network yet; the session starts after the form.)
		errorMessage = '';
		phase = 'form';
	}

	function buildStage1() {
		const t = (s: string) => {
			const v = s.trim();
			return v ? v : null;
		};
		const newsletter =
			s1WantsNewsletter && s1NlEmail.trim()
				? {
						email: s1NlEmail.trim(),
						frequency: null,
						interested_in: t(s1NlInterested)
					}
				: null;
		return {
			value: t(s1Value),
			falling_short: t(s1FallingShort),
			ideas: t(s1Ideas),
			involvement: t(s1Involvement),
			time_minutes: s1NoTimeLimit ? null : s1TimeMinutes,
			no_time_limit: s1NoTimeLimit,
			newsletter
		};
	}

	async function startConversation(stage1: import('$lib/interviewer-client').Stage1 | null) {
		errorMessage = '';
		busy = true;
		try {
			const hint = memberHint.trim() || null;
			turns = [];
			phase = 'conversation';
			await tick();
			inputEl?.focus();
			const events = await interviewer.startStream({ member_hint: hint, stage1 });
			await consumeStream(events);
		} catch (e) {
			handleError(e);
			if (turns.length === 0) phase = 'form';
		} finally {
			busy = false;
			await tick();
			inputEl?.focus();
		}
	}

	function submitForm() {
		startConversation(buildStage1());
	}

	function skipForm() {
		startConversation(null);
	}

	async function send() {
		if (!inputText.trim() || !sessionId || busy) return;
		const text = inputText.trim();
		// Synchronously shrink the textarea BEFORE adding the new turn — this
		// avoids a visible reflow where (a) we scroll, then (b) the autosize
		// $effect fires later and the page jumps.
		inputText = '';
		if (inputEl) {
			inputEl.value = '';
			autosize(inputEl);
		}
		turns = [...turns, { role: 'participant', parts: [{ kind: 'text', text }], elapsed: elapsedSeconds }];
		persistConversation();
		await tick();
		ensureComposerVisible(true);
		busy = true;
		try {
			const events = await interviewer.turnStream(sessionId, { text });
			await consumeStream(events);
		} catch (e) {
			handleError(e);
		} finally {
			busy = false;
			await tick();
			inputEl?.focus();
		}
	}

	// Drains an SSE stream into the current conversation. Text chunks from
	// Anthropic come in irregular sizes — to make the stream feel smooth we
	// push them into a per-turn buffer and reveal characters on a timer.
	async function consumeStream(events: AsyncIterable<import('$lib/interviewer-client').StreamEvent>) {
		const turnIndex = turns.length;
		turns = [
			...turns,
			{ role: 'interviewer', parts: [], elapsed: elapsedSeconds, streaming: true }
		];
		await tick();

		// Buffered text that hasn't been flushed to the visible text part yet.
		let pendingText = '';
		let streamFinished = false;

		const ensureTextPart = (): TextPart => {
			const t = turns[turnIndex];
			const last = t.parts[t.parts.length - 1];
			if (last && last.kind === 'text') return last as TextPart;
			const np: TextPart = { kind: 'text', text: '' };
			t.parts.push(np);
			return np;
		};

		// Reveal up to N chars per tick; tick rate adapts to buffer size so we
		// never fall behind a fast model. Goal: feel typewriter-smooth without
		// adding noticeable latency.
		const TICK_MS = 12;
		const ticker = setInterval(() => {
			if (!pendingText) {
				if (streamFinished) {
					clearInterval(ticker);
					turns = turns;
				}
				return;
			}
			// Drain faster when the buffer is large so we never lag visibly.
			const stride = pendingText.length > 80 ? 4 : pendingText.length > 30 ? 2 : 1;
			const chunk = pendingText.slice(0, stride);
			pendingText = pendingText.slice(stride);
			const part = ensureTextPart();
			part.text += chunk;
			turns = turns;
			// Follow the growing text — tiny deltas per tick read as a smooth
			// continuous scroll, not a jarring final jump.
			ensureComposerVisible();
		}, TICK_MS);

		try {
			for await (const evt of events) {
				if (evt.type === 'session_created') {
					sessionId = evt.session_id;
					persistConversation();
				} else if (evt.type === 'text_delta') {
					pendingText += evt.text;
				} else if (evt.type === 'tool_use') {
					// Flush any pending text first so the tool indicator appears
					// after the text it follows in the stream order.
					if (pendingText) {
						const part = ensureTextPart();
						part.text += pendingText;
						pendingText = '';
					}
					turns[turnIndex].parts.push({
						kind: 'tool',
						id: evt.id,
						name: evt.name,
						label: evt.label,
						ok: null
					});
					turns = turns;
				} else if (evt.type === 'tool_done') {
					const tp = turns[turnIndex].parts.find(
						(p) => p.kind === 'tool' && (p as ToolPart).id === evt.id
					) as ToolPart | undefined;
					if (tp) tp.ok = evt.ok;
					turns = turns;
				} else if (evt.type === 'turn_done') {
					elapsedSeconds = evt.elapsed_seconds;
					timeBudgetSeconds = evt.time_budget_seconds;
					interviewEnded = evt.interview_ended;
					endReason = evt.end_reason;
					turns[turnIndex].elapsed = evt.elapsed_seconds;
				} else if (evt.type === 'notes_writing') {
					writingNotes = true;
				} else if (evt.type === 'notes_written') {
					writingNotes = false;
					notesPath = evt.path;
				} else if (evt.type === 'error') {
					throw new InterviewerError(500, evt.message);
				}
			}
		} finally {
			streamFinished = true;
		}

		// Wait for the typewriter to drain before flipping streaming=false
		while (pendingText) {
			await new Promise((r) => setTimeout(r, 16));
		}
		clearInterval(ticker);
		turns[turnIndex].streaming = false;
		turns = turns;
		persistConversation();

		if (interviewEnded && sessionId) {
			try {
				const notes = await interviewer.getNotes(sessionId);
				notesContent = notes.notes_content;
				notesOriginal = notes.notes_content;
				notesPath = notes.notes_path;
				phase = 'notes';
				clearPersistedConversation();
			} catch (err) {
				console.error('failed to fetch notes', err);
				phase = 'done';
				clearPersistedConversation();
			}
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

	// Keep the composer pinned to the bottom of the viewport by following the
	// page as it grows. Called on every typewriter tick during streaming so
	// the scroll appears continuous (tiny deltas = visually smooth) instead
	// of a single jarring jump at the end.
	//
	// Uses scrollIntoView({block:'end'}) on the composer-wrap so the *bottom
	// edge of the composer* (padding included) lands at the viewport bottom —
	// more reliable than scrolling to document.scrollHeight, which can lag
	// behind layout changes from autosize.
	//
	// `force` ignores the user-intent guard. By default, if the user has
	// scrolled up manually (>200px from bottom), we don't yank them back.
	function ensureComposerVisible(force = false) {
		if (typeof window === 'undefined') return;
		// Defer to the next frame so any pending layout (autosize, new turn,
		// streamed text) has actually been computed before we measure/scroll.
		requestAnimationFrame(() => {
			const docH = document.documentElement.scrollHeight;
			const winH = window.innerHeight;
			const y = window.scrollY;
			const fromBottom = docH - winH - y;
			if (!force && fromBottom > 200) return;
			const composerEl = document.querySelector('.composer-wrap') as HTMLElement | null;
			if (composerEl) {
				composerEl.scrollIntoView({ block: 'end', behavior: 'auto' });
			} else {
				window.scrollTo({ top: docH, behavior: 'auto' });
			}
		});
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.isComposing) return; // let IME composition commit normally
		// Cmd/Ctrl+Enter always sends — power-user shortcut, and an escape hatch
		// if a touchscreen laptop gets misclassified as touch-only.
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			send();
			return;
		}
		// Plain Enter sends only with a physical keyboard. On touch the on-screen
		// Return key falls through to its default (newline); the send button is
		// the only way to send there.
		if (e.key === 'Enter' && !e.shiftKey && !isTouch) {
			e.preventDefault();
			send();
		}
	}

	// Linkify URLs in finished message text. Applied only to non-streaming
	// turns so we don't accidentally break a half-streamed link mid-token.
	const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?'")\]])/gi;
	function linkify(s: string): { kind: 'text' | 'link'; value: string }[] {
		const out: { kind: 'text' | 'link'; value: string }[] = [];
		let last = 0;
		let m: RegExpExecArray | null;
		URL_RE.lastIndex = 0;
		while ((m = URL_RE.exec(s)) !== null) {
			if (m.index > last) out.push({ kind: 'text', value: s.slice(last, m.index) });
			out.push({ kind: 'link', value: m[0] });
			last = m.index + m[0].length;
		}
		if (last < s.length) out.push({ kind: 'text', value: s.slice(last) });
		return out;
	}
	function hrefFor(url: string): string {
		return /^https?:\/\//i.test(url) ? url : `https://${url}`;
	}

	function fmtTime(s: number): string {
		if (s < 60) return `${s}s`;
		return `${Math.floor(s / 60)}m`;
	}

	function autosize(el: HTMLTextAreaElement | null) {
		if (!el) return;
		const before = el.style.height;
		el.style.height = 'auto';
		// Cap matches the .composer textarea max-height (14rem ≈ 224px at 16px root)
		const next = Math.min(el.scrollHeight, 224) + 'px';
		el.style.height = next;
		// If the composer just grew, pin the page to the bottom so the bottom
		// of the textarea (where the cursor is) stays in view. Force-scroll
		// because typing inherently means the user wants to see what they're
		// typing, regardless of the user-intent guard.
		if (before !== next) ensureComposerVisible(true);
	}

	$effect(() => {
		if (inputText !== undefined) autosize(inputEl);
	});

	// ---- localStorage persistence ----
	// Save the in-progress conversation so a refresh / browser crash doesn't
	// wipe it. Restore on mount if the saved session still has turns. We don't
	// try to verify the server still has the session in memory — if /turn
	// returns 404 the user can still see their history and just start over.
	const STORAGE_KEY = 'interviewer.conversation.v1';

	function persistConversation() {
		if (isPreview || phase !== 'conversation' || !sessionId) return;
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					sessionId,
					turns,
					elapsedSeconds,
					timeBudgetSeconds,
					savedAt: Date.now()
				})
			);
		} catch {
			/* quota / private mode */
		}
	}

	function clearPersistedConversation() {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			/* ignore */
		}
	}

	function tryRestoreConversation() {
		if (isPreview) return false;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return false;
			const data = JSON.parse(raw);
			// Reject anything older than 1 day to avoid resurrecting ancient state
			if (!data?.sessionId || !Array.isArray(data?.turns)) return false;
			if (Date.now() - (data.savedAt ?? 0) > 24 * 60 * 60 * 1000) {
				clearPersistedConversation();
				return false;
			}
			sessionId = data.sessionId;
			turns = data.turns.map((t: any) => ({
				role: t.role,
				parts: t.parts ?? (t.text ? [{ kind: 'text', text: t.text }] : []),
				elapsed: t.elapsed,
				streaming: false
			}));
			elapsedSeconds = data.elapsedSeconds ?? 0;
			timeBudgetSeconds = data.timeBudgetSeconds ?? null;
			phase = 'conversation';
			hasPersisted = true;
			return true;
		} catch {
			return false;
		}
	}

	onMount(() => {
		tryRestoreConversation();
		const mq = window.matchMedia('(pointer: coarse)');
		isTouch = mq.matches;
		const onPointerChange = (e: MediaQueryListEvent) => (isTouch = e.matches);
		mq.addEventListener('change', onPointerChange);
		return () => mq.removeEventListener('change', onPointerChange);
	});

	onDestroy(() => {
		clearAsideTimer();
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

	// Hard-reset everything: component state + localStorage. Used by the
	// error-phase "try again" button and the welcome-page "start fresh"
	// escape hatch when a stale persisted session has restored into a
	// broken state.
	let hasPersisted = $state(false);
	function resetEverything() {
		clearPersistedConversation();
		hasPersisted = false;
		phase = 'welcome';
		turns = [];
		sessionId = null;
		inputText = '';
		notesContent = '';
		notesOriginal = '';
		notesPath = null;
		writingNotes = false;
		elapsedSeconds = 0;
		timeBudgetSeconds = null;
		interviewEnded = false;
		endReason = null;
		errorMessage = '';
		busy = false;
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
			await startConversation(null);
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
				> for you to find out everything that's going on in the collective, and have your say on its future.
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

				{#if hasPersisted}
					<button class="start-fresh" onclick={resetEverything} title="clear saved conversation and start over">
						or — clear the saved conversation and start fresh
					</button>
				{/if}
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
					tabindex="-1"
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
	{:else if phase === 'form'}
		<section class="welcome stage1" in:fade={{ duration: 400 }}>
			<h1 class="display-title">
				<span class="title-line-1">before</span>
				<span class="title-line-2">we talk</span>
			</h1>
			<div class="rule"></div>
			<p class="lede">
				a couple of minutes of rough notes — all optional, a sentence is plenty. it lets the
				conversation go deeper instead of starting cold. skip anything, or skip the whole thing.
			</p>

			<div class="form">
				<div class="field">
					<span class="field-label">how long do you want the conversation to be?</span>
					<div class="chips">
						{#each TIME_CHOICES as m}
							<button
								type="button"
								class="chip"
								class:active={!s1NoTimeLimit && s1TimeMinutes === m}
								aria-pressed={!s1NoTimeLimit && s1TimeMinutes === m}
								onclick={() => {
									s1TimeMinutes = m;
									s1NoTimeLimit = false;
								}}>{m} min</button
							>
						{/each}
						<button
							type="button"
							class="chip"
							class:active={s1NoTimeLimit}
							aria-pressed={s1NoTimeLimit}
							onclick={() => (s1NoTimeLimit = true)}>no fixed limit</button
						>
					</div>
				</div>

				<label class="field">
					<span class="field-label">what do you value about the collective?</span>
					<textarea class="s1-input" rows="2" bind:value={s1Value} disabled={busy}></textarea>
				</label>
				<label class="field">
					<span class="field-label">where do you think we're falling short?</span>
					<textarea class="s1-input" rows="2" bind:value={s1FallingShort} disabled={busy}
					></textarea>
				</label>
				<label class="field">
					<span class="field-label"
						>any ideas for things we could do differently, or things you wish existed?</span
					>
					<textarea class="s1-input" rows="2" bind:value={s1Ideas} disabled={busy}></textarea>
				</label>
				<label class="field">
					<span class="field-label"
						>would you like to get more involved? if so, what would you want to do?</span
					>
					<textarea class="s1-input" rows="2" bind:value={s1Involvement} disabled={busy}
					></textarea>
				</label>

				<label class="field newsletter-toggle">
					<input type="checkbox" bind:checked={s1WantsNewsletter} disabled={busy} />
					<span class="field-label">i'd like a personalised newsletter</span>
				</label>
				{#if s1WantsNewsletter}
					<label class="field">
						<span class="field-label">email</span>
						<input
							class="underline-input"
							type="email"
							bind:value={s1NlEmail}
							spellcheck="false"
							autocomplete="off"
							disabled={busy}
						/>
					</label>
					<label class="field">
						<span class="field-label">how often, and what would you want in it?</span>
						<textarea class="s1-input" rows="2" bind:value={s1NlInterested} disabled={busy}
						></textarea>
					</label>
				{/if}

				{#if errorMessage}
					<p class="error" in:fade>{errorMessage}</p>
				{/if}

				<div class="actions">
					<button class="begin-btn" onclick={submitForm} disabled={busy} aria-busy={busy}>
						<span class="begin-text">{busy ? 'opening' : 'start the conversation'}</span>
					</button>
					<button class="skip-btn" onclick={skipForm} disabled={busy}>skip straight to it</button>
				</div>
			</div>
		</section>
	{:else if phase === 'conversation'}
		<section class="convo" in:fade={{ duration: 400 }}>
			<div class="convo-meta">
				<span class="meta-elapsed">{fmtTime(elapsedSeconds)}</span>
				{#if timeBudgetSeconds}
					<span class="meta-divider">·</span>
					<span class="meta-budget">{fmtTime(timeBudgetSeconds)}</span>
				{/if}
				<span class="meta-divider">·</span>
				<button class="meta-end" onclick={leaveEarly} disabled={busy} title="end and review notes">
					end
				</button>
				{#if writingNotes}
					<span class="meta-divider">·</span>
					<span class="meta-writing">writing notes…</span>
				{/if}
			</div>

			<div class="transcript">
				<div class="transcript-inner">
					{#each turns as turn, ti (ti)}
						<article class="turn turn-{turn.role}" in:fly={{ y: 8, duration: 280 }}>
							<header class="turn-attr">
								{turn.role === 'interviewer' ? 'interviewer' : 'you'}
							</header>
							{#each turn.parts as part, pi (pi)}
								{#if part.kind === 'tool'}
									<div class="tool-line" class:tool-running={part.ok === null}>
										<span class="tool-dash">—</span>
										<span class="tool-label">{part.label}</span>
										{#if part.ok === null}
											<span class="tool-ellipsis">…</span>
										{/if}
									</div>
								{:else if turn.streaming}
									<div class="turn-text">{part.text}{#if turn.streaming && pi === turn.parts.length - 1}<span class="caret"></span>{/if}</div>
								{:else}
									<div class="turn-text">{#each linkify(part.text) as seg, si (si)}{#if seg.kind === 'link'}<a href={hrefFor(seg.value)} target="_blank" rel="noopener noreferrer">{seg.value}</a>{:else}{seg.value}{/if}{/each}</div>
								{/if}
							{/each}
						</article>
					{/each}
					{#if busy && (turns.length === 0 || (turns[turns.length - 1].role === 'interviewer' && turns[turns.length - 1].parts.length === 0))}
						<div class="thinking turn-interviewer" in:fade={{ duration: 200 }}>
							<span class="dot"></span><span class="dot"></span><span class="dot"></span>
							{#if turns.length === 0}
								<span class="thinking-label">warming up — reading the wiki, finding you in it</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<div class="composer-wrap">
				{#if turns.length > 0}
					<div class="end-row">
						<button
							class="reset-link"
							onclick={resetEverything}
							title="clear this conversation and start over (no notes filed)"
						>
							reset
						</button>
						<button
							class="end-review"
							onclick={leaveEarly}
							disabled={busy}
							title="end now and review your notes"
						>
							end & review notes →
						</button>
					</div>
				{/if}
				<div class="composer" class:composer-focused={composerFocused}>
					<textarea
						bind:this={inputEl}
						bind:value={inputText}
						onkeydown={onKeydown}
						onfocus={() => (composerFocused = true)}
						onblur={() => (composerFocused = false)}
						placeholder="say what's on your mind…"
						rows="1"
					></textarea>
					<button
						class="send-btn"
						onclick={send}
						disabled={!inputText.trim() || busy}
						title="send (↵)"
						aria-label="send message"
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M5 12h14M13 6l6 6-6 6"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</div>
				<div class="composer-hint">
					{isTouch ? 'tap → to send' : '↵ to send · shift + ↵ for new line'}
				</div>
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
			</header>

			<textarea class="notes-editor" bind:value={notesContent} spellcheck="false"></textarea>

			<div class="notes-actions">
				<div class="actions-info">
					{#if notesContent !== notesOriginal}
						<span class="dirty">edited · the original draft is preserved</span>
					{:else}
						<span class="clean">unedited</span>
					{/if}
				</div>
				<div class="actions-buttons">
					<button class="primary-btn" onclick={() => fileNotes(true)} disabled={busy}>
						file
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
			<button type="button" class="link link-as-button" onclick={resetEverything}>
				try again
			</button>
			<p class="sub error-help">
				this clears the saved conversation and returns you to the start. if it keeps happening,
				the interviewer backend may be down — try again in a few minutes.
			</p>
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
	.convo {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - 2rem);
		padding-top: 0.75rem;
	}

	.convo-meta {
		position: fixed;
		top: 1rem;
		right: 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.04em;
		opacity: 0.45;
		color: var(--text);
		z-index: 10;
		transition: opacity 0.25s ease;
	}

	.convo-meta:hover {
		opacity: 0.9;
	}

	.meta-divider {
		opacity: 0.5;
	}

	.meta-end {
		padding: 0;
		font: inherit;
		color: inherit;
		background: transparent;
		border: none;
		cursor: pointer;
		text-transform: lowercase;
		opacity: 0.7;
		transition: color 0.15s, opacity 0.15s;
	}

	.meta-end:hover:not(:disabled) {
		opacity: 1;
		color: var(--accent);
	}

	.meta-end:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.meta-writing {
		color: var(--accent);
		opacity: 0.85;
	}

	.transcript {
		flex: 1;
		overflow-y: auto;
		padding: 0 0.5rem;
		scrollbar-width: thin;
		scrollbar-color: color-mix(in srgb, var(--text) 18%, transparent) transparent;
	}

	.transcript-inner {
		display: flex;
		flex-direction: column;
		gap: 2.25rem;
		padding: 2.5rem 0 3rem;
		max-width: 44rem;
		margin: 0 auto;
	}

	.turn {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		max-width: 86%;
	}

	.turn-interviewer {
		align-self: flex-start;
		align-items: flex-start;
		text-align: left;
	}

	.turn-participant {
		align-self: flex-end;
		align-items: flex-end;
		text-align: right;
	}

	.turn-attr {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		text-transform: lowercase;
		letter-spacing: 0.08em;
		opacity: 0.45;
	}

	.turn-interviewer .turn-attr {
		color: var(--accent);
		opacity: 0.75;
	}

	.turn-text {
		white-space: pre-wrap;
		font-size: 1.02rem;
		line-height: 1.6;
	}

	.turn-text a {
		color: var(--accent);
		text-decoration: none;
		border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
		transition: border-color 0.15s, opacity 0.15s;
	}
	.turn-text a:hover {
		border-bottom-color: var(--accent);
		opacity: 0.85;
	}

	.tool-line {
		display: inline-flex;
		align-items: baseline;
		gap: 0.45rem;
		font-family: var(--font-mono);
		font-size: 0.74rem;
		font-style: italic;
		letter-spacing: 0.02em;
		opacity: 0.55;
		padding: 0.1rem 0;
	}
	.turn-interviewer .tool-line {
		color: var(--accent);
		opacity: 0.7;
	}
	.tool-dash {
		opacity: 0.7;
	}
	.tool-running .tool-label::after {
		content: '';
	}
	.tool-ellipsis {
		display: inline-block;
		width: 1ch;
		animation: dot-pulse 1.4s ease-in-out infinite;
	}
	@keyframes dot-pulse {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 1; }
	}

	/* tiny blinking caret at the tail of the streaming text */
	.caret {
		display: inline-block;
		width: 0.5ch;
		margin-left: 1px;
		border-right: 2px solid currentColor;
		opacity: 0.6;
		animation: blink 1s steps(1, end) infinite;
		vertical-align: text-bottom;
		height: 1.05em;
	}
	@keyframes blink {
		50% { opacity: 0; }
	}

	.thinking {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.5rem 0;
		opacity: 0.55;
	}

	.thinking.turn-interviewer {
		align-self: flex-start;
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

	/* composer — soft rounded card sticking to the bottom, send arrow inside */
	.composer-wrap {
		max-width: 44rem;
		width: 100%;
		margin: 0 auto;
		padding: 0.5rem 0.5rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.composer {
		position: relative;
		display: flex;
		align-items: flex-end;
		padding: 0.85rem 3.5rem 0.85rem 1.1rem;
		background: color-mix(in srgb, var(--text) 4%, transparent);
		border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
		border-radius: 14px;
		transition:
			border-color 0.18s ease,
			background 0.18s ease,
			box-shadow 0.18s ease;
	}

	.composer-focused {
		border-color: color-mix(in srgb, var(--accent) 60%, transparent);
		background: color-mix(in srgb, var(--text) 2%, transparent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
	}

	.composer textarea {
		flex: 1;
		font-family: inherit;
		font-size: 1.02rem;
		line-height: 1.55;
		background: transparent;
		border: none;
		color: var(--text);
		outline: none;
		resize: none;
		min-height: 1.55rem;
		max-height: 14rem;
		padding: 0;
	}

	.composer textarea::placeholder {
		opacity: 0.4;
		font-style: italic;
	}

	.send-btn {
		position: absolute;
		right: 0.55rem;
		bottom: 0.55rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		background: var(--accent);
		border: none;
		border-radius: 50%;
		color: var(--bg, #fff);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.send-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 35%, transparent);
	}

	.send-btn:disabled {
		background: color-mix(in srgb, var(--text) 18%, transparent);
		color: color-mix(in srgb, var(--text) 50%, transparent);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.composer-hint {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		text-transform: lowercase;
		letter-spacing: 0.06em;
		opacity: 0.4;
		text-align: center;
		padding: 0 0.5rem;
	}

	/* ---------- notes ---------- */
	.notes {
		padding-bottom: 4rem;
	}

	.notes-header {
		max-width: 40rem;
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

	.link-as-button {
		background: transparent;
		border: none;
		cursor: pointer;
	}
	/* .link styles already cover the visual; .link-as-button just neutralizes
	   default <button> chrome so it inherits .link's underline-on-hover look. */

	.error-help {
		margin-top: 1rem;
		font-size: 0.82rem;
		opacity: 0.55;
		max-width: 36rem;
	}

	/* reset on the left, end-and-review pill on the right, above the composer */
	.end-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		padding: 0 0.5rem 0.4rem;
		max-width: 44rem;
		margin: 0 auto;
		width: 100%;
	}

	.reset-link {
		padding: 0;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		opacity: 0.45;
		background: transparent;
		border: none;
		color: var(--text);
		cursor: pointer;
		text-decoration: underline dotted;
		text-underline-offset: 4px;
		transition: opacity 0.15s ease;
	}
	.reset-link:hover {
		opacity: 0.85;
	}

	.end-review {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.85rem;
		font-family: var(--font-mono);
		font-size: 0.74rem;
		letter-spacing: 0.04em;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
		border-radius: 999px;
		color: var(--accent);
		cursor: pointer;
		opacity: 0.85;
		transition:
			opacity 0.15s ease,
			background 0.15s ease,
			border-color 0.15s ease;
	}
	.end-review:hover:not(:disabled) {
		opacity: 1;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		border-color: var(--accent);
	}
	.end-review:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	/* "start fresh" escape hatch on welcome (only when persisted state is loaded) */
	.start-fresh {
		display: block;
		margin-top: 1.5rem;
		padding: 0;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		opacity: 0.45;
		background: transparent;
		border: none;
		color: var(--text);
		cursor: pointer;
		text-decoration: underline dotted;
		text-underline-offset: 4px;
		transition: opacity 0.15s ease;
	}
	.start-fresh:hover {
		opacity: 0.85;
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
		resize: vertical;
		padding: 0.35rem 0;
	}
	.s1-input:focus {
		outline: none;
		border-bottom-color: currentColor;
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
		font-weight: 600;
	}
	.newsletter-toggle {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
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
</style>
