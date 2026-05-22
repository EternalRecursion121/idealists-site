/**
 * Client for the interviewer FastAPI service.
 *
 * The base URL is set via the PUBLIC_INTERVIEWER_API environment variable.
 * For ngrok-hosted backends this points at the ngrok URL.
 */
import { env } from '$env/dynamic/public';

const BASE = (env.PUBLIC_INTERVIEWER_API || 'http://127.0.0.1:8000').replace(/\/$/, '');

export interface CreateSessionRequest {
	member_hint?: string | null;
	fast?: boolean;
	model?: string | null;
	stage1?: Stage1 | null;
}

export interface Stage1Newsletter {
	email?: string | null;
	frequency?: string | null;
	interested_in?: string | null;
}

export interface Stage1 {
	value?: string | null;
	falling_short?: string | null;
	ideas?: string | null;
	involvement?: string | null;
	time_minutes?: number | null;
	no_time_limit?: boolean;
	newsletter?: Stage1Newsletter | null;
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

// ---- streaming -----------------------------------------------------------

export type StreamEvent =
	| { type: 'session_created'; session_id: string }
	| { type: 'text_delta'; text: string }
	| { type: 'tool_use'; id: string; name: string; label: string }
	| { type: 'tool_done'; id: string; ok: boolean }
	| {
			type: 'turn_done';
			elapsed_seconds: number;
			time_budget_seconds: number | null;
			interview_ended: boolean;
			end_reason: string | null;
	  }
	| { type: 'transcript_saved'; path: string }
	| { type: 'notes_writing' }
	| { type: 'notes_written'; path: string }
	| { type: 'error'; message: string };

async function* readSSE(res: Response): AsyncGenerator<StreamEvent> {
	if (!res.ok || !res.body) {
		throw new InterviewerError(res.status, res.statusText || 'stream failed');
	}
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buf = '';
	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			buf += decoder.decode(value, { stream: true });
			// SSE messages are separated by blank lines (\n\n)
			let idx;
			while ((idx = buf.indexOf('\n\n')) !== -1) {
				const raw = buf.slice(0, idx);
				buf = buf.slice(idx + 2);
				const lines = raw.split('\n');
				let data = '';
				for (const line of lines) {
					if (line.startsWith('data:')) data += line.slice(5).trimStart();
				}
				if (!data) continue;
				try {
					yield JSON.parse(data) as StreamEvent;
				} catch {
					/* skip malformed */
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}

async function streamPost(path: string, body: unknown): Promise<Response> {
	return fetch(`${BASE}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'text/event-stream',
			'ngrok-skip-browser-warning': 'true'
		},
		body: JSON.stringify(body)
	});
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

	startStream: async (req: CreateSessionRequest) =>
		readSSE(await streamPost('/sessions/start-stream', req)),

	turnStream: async (sessionId: string, req: TurnRequest) =>
		readSSE(await streamPost(`/sessions/${sessionId}/turn-stream`, req)),

	health: () =>
		call<{ ok: boolean; anthropic_api_key: boolean; active_sessions: number }>('/health')
};
