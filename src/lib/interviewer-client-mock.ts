/**
 * Mock interviewer client for the /interview?preview=1 page.
 *
 * Same shape as the real client (so the page can use either interchangeably),
 * but every method returns canned data after a short fake latency. No API
 * credits are spent. Useful for iterating on the UI without burning Anthropic
 * tokens.
 *
 * The mock supports a small "dev controls" surface (see `mockControls`) so the
 * preview page can scrub through phases / inject custom turns / change consent.
 */
import type {
	CreateSessionRequest,
	CreateSessionResponse,
	EndSessionResponse,
	HumanRequestPayload,
	HumanRequestResponse,
	NotesResponse,
	TurnRequest,
	TurnResponse
} from './interviewer-client';

const FAKE_LATENCY_MS = 700;

const SCRIPT: string[] = [
	"hey — glad you're here. before i dive into anything, how long do you have? doesn't have to be a precise number — \"maybe 20 minutes\" is fine.",
	"got it. and one quick thing before we get into substance — by default this conversation gets distilled into notes for the collective to learn from, but nothing goes anywhere public without checking with you first. you can lock it down further (private — no notes written) or open it up (notes can go on the public site freely). totally your call. you can change your mind at the end too.",
	"okay. so — when you found your way to the collective, what was actually drawing you in? the writing, a person, a project, the vibe, all of it?",
	"that's a real answer. the bit about *the writing on idealism not landing for you the first read* is interesting — what would have made it land?",
	"yeah, that maps. lydia's essay on against-commentary actually wrestles with the same thing from a different angle. want me to point you at it after?",
	"before we wrap — anything about *this format* (an llm interviewing you on behalf of the collective) that landed wrong, or worked? not asking you to be polite about it.",
	"thanks for this — i'll write up some notes from our conversation now, and you'll get to read and edit them before they're filed."
];

const SAMPLE_NOTES = `---
title: "Interview: anonymous, 2026-05-10"
type: interview
sources:
  - server/transcripts/example.json
last_updated: 2026-05-10
consent: ask_first
---

# Notes

A 25-minute first conversation with someone new to the collective. Came in via a referral from a friend who'd read the writings. Articulate, slightly skeptical of the framing.

## What they care about

- Resisting the optimization-everything trend in tech
- Wants more *makers* and fewer *commenters*
- Curious whether the collective is actually doing anything or just talking

## Surprises

- The writing on idealism didn't land for them on first read — they thought it was the philosophical sense (mind-over-matter) and bounced. The frame as "anti-optimization" only landed once it was named.

## Positions on open questions

**Q4 (what's stopping participation):** "Honestly I read the discord and I don't know what to even reply to. Everything is mid-thread."

**Q6 (thinking → doing):** Strong views. Wants a "small thing per week, shipped publicly" cadence. Pointed at Lydia's against-commentary essay as adjacent.

## What I'd do differently

- Should have asked about their own writing project earlier; they mentioned it in passing and we didn't follow.

## Open threads

- Connect them with Lydia and with Ariel (autonomy stuff).
- Their reaction to the consent question was warm — worth flagging that the signposting *did* land for at least this person.
`;

class MockController {
	private turnIndex = 0;
	private consent: 'private' | 'ask_first' | 'public' = 'ask_first';
	private consentLocked = false;
	private elapsed = 0;
	private timeBudget: number | null = null;
	private ended = false;
	private endReason: string | null = null;

	reset() {
		this.turnIndex = 0;
		this.consent = 'ask_first';
		this.consentLocked = false;
		this.elapsed = 0;
		this.timeBudget = null;
		this.ended = false;
		this.endReason = null;
	}

	async createSession(req: CreateSessionRequest): Promise<CreateSessionResponse> {
		this.reset();
		await delay(FAKE_LATENCY_MS * 1.5);
		return {
			session_id: 'mock-' + Math.random().toString(36).slice(2, 10),
			opening_turn: SCRIPT[0]
		};
	}

	async turn(_sessionId: string, req: TurnRequest): Promise<TurnResponse> {
		this.turnIndex = Math.min(this.turnIndex + 1, SCRIPT.length - 1);
		this.elapsed += 60 + Math.floor(Math.random() * 90);
		if (req.time_budget_seconds) this.timeBudget = req.time_budget_seconds;
		// Capture consent on the second mock turn (after the consent signpost)
		if (this.turnIndex === 2 && !this.consentLocked) {
			this.consentLocked = true;
		}
		// Simulate end on the last scripted turn
		if (this.turnIndex >= SCRIPT.length - 1) {
			this.ended = true;
			this.endReason = 'natural close';
		}
		await delay(FAKE_LATENCY_MS);
		return {
			text: SCRIPT[this.turnIndex],
			elapsed_seconds: this.elapsed,
			time_budget_seconds: this.timeBudget,
			interview_ended: this.ended,
			end_reason: this.endReason,
			transcript_path: '/mock/transcript.json',
			notes_path: this.ended ? '/mock/notes.md' : null,
			consent: this.consent,
			consent_locked: this.consentLocked
		};
	}

	async endSession(_sessionId: string): Promise<EndSessionResponse> {
		await delay(FAKE_LATENCY_MS);
		return {
			transcript_path: '/mock/transcript.json',
			notes_path: '/mock/notes.md',
			notes_content: SAMPLE_NOTES,
			duration_seconds: this.elapsed
		};
	}

	async getNotes(_sessionId: string): Promise<NotesResponse> {
		await delay(FAKE_LATENCY_MS / 2);
		return {
			notes_path: '/mock/notes.md',
			notes_content: SAMPLE_NOTES,
			has_been_edited: false
		};
	}

	async putNotes(_sessionId: string, content: string): Promise<NotesResponse> {
		await delay(FAKE_LATENCY_MS / 2);
		return {
			notes_path: '/mock/notes.md',
			notes_content: content,
			has_been_edited: true
		};
	}

	async requestHuman(_req: HumanRequestPayload): Promise<HumanRequestResponse> {
		await delay(FAKE_LATENCY_MS / 2);
		return { ok: true };
	}

	async health() {
		return { ok: true, anthropic_api_key: false, active_sessions: 0 };
	}

	// Dev surface for the preview controls panel
	setConsent(level: 'private' | 'ask_first' | 'public') {
		this.consent = level;
	}
	getConsent() {
		return this.consent;
	}
	getTurnIndex() {
		return this.turnIndex;
	}
	getElapsed() {
		return this.elapsed;
	}
}

const controller = new MockController();

export const mockInterviewer = {
	createSession: (req: CreateSessionRequest) => controller.createSession(req),
	turn: (sid: string, req: TurnRequest) => controller.turn(sid, req),
	endSession: (sid: string) => controller.endSession(sid),
	getNotes: (sid: string) => controller.getNotes(sid),
	putNotes: (sid: string, content: string) => controller.putNotes(sid, content),
	requestHuman: (req: HumanRequestPayload) => controller.requestHuman(req),
	health: () => controller.health()
};

export const mockControls = {
	reset: () => controller.reset(),
	setConsent: (level: 'private' | 'ask_first' | 'public') => controller.setConsent(level),
	getConsent: () => controller.getConsent(),
	getTurnIndex: () => controller.getTurnIndex(),
	getElapsed: () => controller.getElapsed(),
	scriptLength: SCRIPT.length,
	sampleNotes: SAMPLE_NOTES
};

function delay(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}
