export interface WritingMetadata {
	slug: string;
	title: string;
	description?: string;
	authors?: string[];
	createdAt: string; // ISO 8601
	updatedAt: string; // ISO 8601
	revisionCount: number;
	style?: 'default' | 'notebook';  // visual style for the writing
	branches?: {
		url: string;
		label: string;
		repo?: string;  // e.g., "user/repo"
		path?: string;  // e.g., "content/blog/post.md"
		revisions?: Revision[];  // populated at runtime
	}[];
}

export interface Revision {
	hash: string;
	shortHash: string;
	date: string; // ISO 8601
	author: string;
	message: string;
	content?: string;
}

export interface RevisionWithDiff extends Revision {
	content: string;
	diff?: DiffResult;
}

export interface DiffResult {
	lines: DiffLine[];
	additions: number;
	deletions: number;
}

export interface DiffLine {
	type: 'add' | 'remove' | 'context';
	content: string;
	oldLineNumber?: number;
	newLineNumber?: number;
}

export interface WritingWithHistory {
	metadata: WritingMetadata;
	currentContent: string;
	revisions: RevisionWithDiff[];
}
