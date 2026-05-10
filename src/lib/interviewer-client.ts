/**
 * Client for the interviewer FastAPI service.
 *
 * The base URL is set via the PUBLIC_INTERVIEWER_API environment variable at
 * build/dev time. For ngrok-hosted backends this points at the ngrok URL.
 */
import { PUBLIC_INTERVIEWER_API } from '$env/static/public';

const BASE = (PUBLIC_INTERVIEWER_API || 'http://127.0.0.1:8000').replace(/\/$/, '');

export interface CreateSessionRequest {
	member_hint?: string | null;
	fast?: boolean;
	model?: string | null;
}

export interface CreateSessionResponse {
	session_id: string;
	opening_turn: string;
}

export interface TurnRequest {
	text: string;
	time_budget_seconds?: number | null;
}

export interface TurnResponse {
	text: string;
	elapsed_seconds: number;
	time_budget_seconds: number | null;
	interview_ended: boolean;
	end_reason: string | null;
	transcript_path: string | null;
	notes_path: string | null;
	consent: 'private' | 'ask_first' | 'public';
	consent_locked: boolean;
}

export interface EndSessionResponse {
	transcript_path: string;
	notes_path: string;
	notes_content: string;
	duration_seconds: number;
}

export interface NotesResponse {
	notes_path: string;
	notes_content: string;
	has_been_edited: boolean;
}

export interface HumanRequestPayload {
	name?: string | null;
	contact: string;
	note?: string | null;
}

export interface HumanRequestResponse {
	ok: boolean;
}

export class InterviewerError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			// ngrok free tier serves an interstitial HTML warning to browsers unless
			// this header is present; harmless against non-ngrok backends.
			'ngrok-skip-browser-warning': 'true',
			...(init?.headers || {})
		}
	});
	if (!res.ok) {
		let detail = res.statusText;
		try {
			const body = await res.json();
			detail = body.detail || JSON.stringify(body);
		} catch {
			/* not json */
		}
		throw new InterviewerError(res.status, detail);
	}
	return (await res.json()) as T;
}

export const interviewer = {
	createSession: (req: CreateSessionRequest) =>
		call<CreateSessionResponse>('/sessions', {
			method: 'POST',
			body: JSON.stringify(req)
		}),

	turn: (sessionId: string, req: TurnRequest) =>
		call<TurnResponse>(`/sessions/${sessionId}/turn`, {
			method: 'POST',
			body: JSON.stringify(req)
		}),

	endSession: (sessionId: string) =>
		call<EndSessionResponse>(`/sessions/${sessionId}/end`, {
			method: 'POST',
			body: '{}'
		}),

	getNotes: (sessionId: string) => call<NotesResponse>(`/sessions/${sessionId}/notes`),

	putNotes: (sessionId: string, content: string) =>
		call<NotesResponse>(`/sessions/${sessionId}/notes`, {
			method: 'PUT',
			body: JSON.stringify({ content })
		}),

	requestHuman: (req: HumanRequestPayload) =>
		call<HumanRequestResponse>('/human-requests', {
			method: 'POST',
			body: JSON.stringify(req)
		}),

	health: () =>
		call<{ ok: boolean; anthropic_api_key: boolean; active_sessions: number }>('/health')
};
