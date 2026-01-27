// GitHub-based annotation storage - uses server API with PAT
// OAuth only gets user:email scope, server PAT handles actual commits
import type { Annotation, AnnotationStore } from '../types';
import { parseAnnotationsMarkdown, serializeAnnotationsMarkdown } from '../parser';
import { GitHubAuth } from '../auth/github';

/**
 * Store annotations via server API.
 * Server verifies user is a collaborator, then commits using PAT with user as author.
 */
export class GitHubStore implements AnnotationStore {
	private auth: GitHubAuth;

	constructor(auth?: GitHubAuth) {
		this.auth = auth || new GitHubAuth();
	}

	async load(slug: string): Promise<Annotation[]> {
		try {
			// Use server API to fetch (reads via PAT)
			const res = await fetch(`/api/annotations?slug=${encodeURIComponent(slug)}`);
			if (!res.ok) return [];

			const data = await res.json();
			if (!data.markdown) return [];

			return parseAnnotationsMarkdown(data.markdown);
		} catch (e) {
			console.error('Failed to load annotations:', e);
			return [];
		}
	}

	async save(slug: string, annotations: Annotation[]): Promise<boolean> {
		const session = this.auth.getSession();
		if (!session) {
			console.error('No session - user must be logged in to save');
			return false;
		}

		try {
			const markdown = serializeAnnotationsMarkdown(annotations);

			// Send to server API - server will verify collaborator status and commit
			const res = await fetch('/api/annotations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					slug,
					markdown,
					user: {
						id: session.user.id,
						login: session.user.login,
						name: session.user.name || session.user.login,
						email: session.user.email
					}
				})
			});

			if (!res.ok) {
				const error = await res.json();
				console.error('Save failed:', error);
				return false;
			}

			return true;
		} catch (e) {
			console.error('Failed to save annotations:', e);
			return false;
		}
	}
}
