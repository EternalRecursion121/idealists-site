// Annotation types following W3C Web Annotation Data Model

export interface Reply {
	id: string;
	author: string;
	text: string;
	createdAt: number;
}

export interface TextQuoteSelector {
	type: 'TextQuoteSelector';
	exact: string;
	prefix?: string;
	suffix?: string;
}

export interface TextPositionSelector {
	type: 'TextPositionSelector';
	start: number;
	end: number;
}

export type Selector = TextQuoteSelector | TextPositionSelector;

export interface Annotation {
	id: string;
	target: {
		selectors: Selector[];
	};
	body: {
		text: string;
		author: string;
		createdAt: number;
	};
	replies: Reply[];
}

// Auth user info
export interface AuthUser {
	id: string;
	name: string;
	avatar?: string;
	provider: 'anonymous' | 'github' | 'discord';
}

// Storage interface
export interface AnnotationStore {
	load(slug: string): Promise<Annotation[]>;
	save(slug: string, annotations: Annotation[]): Promise<boolean>;
}

// Auth interface
export interface AuthProvider {
	getUser(): Promise<AuthUser | null>;
	login(): Promise<AuthUser | null>;
	logout(): Promise<void>;
}
