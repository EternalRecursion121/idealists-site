<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { page } from '$app/state';
	import { interviewer as realInterviewer, InterviewerError } from '$lib/interviewer-client';
	import { mockInterviewer, mockControls } from '$lib/interviewer-client-mock';
	import './interview.css';
	import Welcome from './Welcome.svelte';
	import Stage1Form from './Stage1Form.svelte';
	import Conversation from './Conversation.svelte';
	import Notes from './Notes.svelte';
	import Done from './Done.svelte';
	import ErrorState from './ErrorState.svelte';
	import type { Phase, Turn, TextPart, ToolPart } from './types';
	import HumanModal from './HumanModal.svelte';

	const isPreview = $derived(page.url.searchParams.has('preview'));
	const interviewer = $derived(isPreview ? mockInterviewer : realInterviewer);

	let phase = $state<Phase>('welcome');
	let convo: Conversation | null = $state(null);
	let memberHint = $state('');
	let busy = $state(false);
	let errorMessage = $state('');

	let sessionId = $state<string | null>(null);
	let turns = $state<Turn[]>([]);
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

	// Human-handoff modal (see HumanModal.svelte)
	let humanModalOpen = $state(false);

	function begin() {
		// Welcome → stage-1 form. (No network yet; the session starts after the form.)
		errorMessage = '';
		phase = 'form';
	}

	async function startConversation(stage1: import('$lib/interviewer-client').Stage1 | null) {
		errorMessage = '';
		busy = true;
		try {
			const hint = memberHint.trim() || null;
			turns = [];
			phase = 'conversation';
			await tick();
			convo?.focusInput();
			const events = await interviewer.startStream({ member_hint: hint, stage1 });
			await consumeStream(events);
		} catch (e) {
			handleError(e);
			if (turns.length === 0) {
				// Bouncing back to the form resets scroll to the top, leaving the
				// message far below the fold — bring it into view.
				phase = 'form';
				await tick();
				document.querySelector('.frame .error')?.scrollIntoView({ block: 'center' });
			}
		} finally {
			busy = false;
			await tick();
			convo?.focusInput();
		}
	}

	async function sendText(text: string) {
		if (!sessionId || busy) return;
		turns = [...turns, { role: 'participant', parts: [{ kind: 'text', text }], elapsed: elapsedSeconds }];
		persistConversation();
		await tick();
		convo?.ensureVisible(true);
		busy = true;
		try {
			const events = await interviewer.turnStream(sessionId, { text });
			await consumeStream(events);
		} catch (e) {
			handleError(e);
		} finally {
			busy = false;
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
			convo?.ensureVisible();
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
		devReplyIndex = 0;
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

	// Canned participant replies for stepping through the conversation without
	// typing. Cycles if we run past the end.
	const DEV_CANNED_REPLIES = [
		'about 20 minutes, sounds good.',
		'mostly the writing, honestly — a friend sent me one of the essays and it stuck with me.',
		'i think if it had led with a concrete example instead of the abstract framing.',
		'yeah, point me at it.',
		'the format worked better than i expected — felt less stiff than a form.',
		"that's me, thanks."
	];
	let devReplyIndex = $state(0);

	// Advance one conversation turn using a canned reply (mock only — no typing,
	// no real server call). Starts the conversation first if needed.
	async function devStepTurn() {
		if (busy) return;
		if (phase !== 'conversation') {
			await devGotoPhase('conversation');
			devReplyIndex = 0;
			return;
		}
		const reply = DEV_CANNED_REPLIES[devReplyIndex % DEV_CANNED_REPLIES.length];
		devReplyIndex += 1;
		await sendText(reply);
	}
</script>

<svelte:head>
	<title>collective conversation — the idealists collective</title>
</svelte:head>

<div class="frame">
	{#if phase === 'welcome'}
		<Welcome
			bind:memberHint
			{busy}
			{errorMessage}
			{hasPersisted}
			onbegin={begin}
			onhuman={() => (humanModalOpen = true)}
			onreset={resetEverything}
		/>

		{#if humanModalOpen}
			<HumanModal
				prefillName={memberHint}
				requestHuman={(payload) => interviewer.requestHuman(payload)}
				onclose={() => (humanModalOpen = false)}
			/>
		{/if}
	{:else if phase === 'form'}
		<Stage1Form
			{busy}
			{errorMessage}
			onsubmit={startConversation}
			onskip={() => startConversation(null)}
		/>
	{:else if phase === 'conversation'}
		<Conversation
			bind:this={convo}
			{turns}
			{busy}
			{elapsedSeconds}
			{timeBudgetSeconds}
			{writingNotes}
			{isTouch}
			onsend={sendText}
			onend={leaveEarly}
			onreset={resetEverything}
		/>
	{:else if phase === 'notes'}
		<Notes bind:notesContent {notesOriginal} {busy} onfile={() => fileNotes(true)} />
	{:else if phase === 'done'}
		<Done {notesPath} />
	{:else if phase === 'error'}
		<ErrorState {errorMessage} onretry={resetEverything} />
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
						<div class="dev-label">step conversation</div>
						<div class="dev-row">
							<button onclick={devStepTurn} disabled={busy}>
								{phase === 'conversation' ? '＋ canned reply →' : 'start & step'}
							</button>
							<button onclick={leaveEarly} disabled={busy || phase !== 'conversation'}
								>→ end & notes</button
							>
						</div>
						<p class="dev-hint">sends a canned answer — no typing, no server</p>
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
		/* --rule was used by four borders below but never defined, so they fell
		   back to 20%-black hairlines — invisible on the dark themes. */
		--rule: color-mix(in srgb, var(--text) 22%, transparent);
		max-width: 56rem;
		margin: 0 auto;
		padding: 0 1rem;
		min-height: 80vh;
		display: flex;
		flex-direction: column;
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
