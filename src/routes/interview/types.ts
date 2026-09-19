// Shapes shared between the interview page and its section components.

export type Phase = 'welcome' | 'form' | 'conversation' | 'notes' | 'done' | 'error';

export type ToolPart = {
	kind: 'tool';
	id: string;
	name: string;
	label: string;
	ok: boolean | null; // null = in flight
};
export type TextPart = { kind: 'text'; text: string };
export type Part = TextPart | ToolPart;

export type Turn = {
	role: 'interviewer' | 'participant';
	parts: Part[];
	elapsed?: number;
	streaming?: boolean;
};
