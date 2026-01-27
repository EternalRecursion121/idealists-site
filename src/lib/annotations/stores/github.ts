// GitHub-based annotation storage - commits as the authenticated user
import type { Annotation, AnnotationStore } from '../types';
import { parseAnnotationsMarkdown, serializeAnnotationsMarkdown } from '../parser';
import { GitHubAuth } from '../auth/github';

const REPO_OWNER = 'EternalRecursion121';
const REPO_NAME = 'idealists-site';
const BRANCH = 'main';

/**
 * Store annotations by committing to GitHub as the authenticated user.
 * Each annotation save creates a commit with the user as the author.
 */
export class GitHubStore implements AnnotationStore {
	private auth: GitHubAuth;

	constructor(auth?: GitHubAuth) {
		this.auth = auth || new GitHubAuth();
	}

	async load(slug: string): Promise<Annotation[]> {
		const token = this.auth.getAccessToken();
		if (!token) return [];

		try {
			const path = `src/lib/writings/${slug}/annotations.md`;
			const res = await fetch(
				`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`,
				{
					headers: {
						'Authorization': `Bearer ${token}`,
						'Accept': 'application/vnd.github.v3+json'
					}
				}
			);

			if (!res.ok) {
				if (res.status === 404) return []; // File doesn't exist yet
				throw new Error(`GitHub API error: ${res.status}`);
			}

			const data = await res.json();
			const content = atob(data.content); // GitHub returns base64 encoded
			return parseAnnotationsMarkdown(content);
		} catch (e) {
			console.error('Failed to load annotations from GitHub:', e);
			return [];
		}
	}

	async save(slug: string, annotations: Annotation[]): Promise<boolean> {
		const token = this.auth.getAccessToken();
		if (!token) return false;

		const session = this.auth.getSession();
		if (!session) return false;

		try {
			const path = `src/lib/writings/${slug}/annotations.md`;
			const markdown = serializeAnnotationsMarkdown(annotations);
			const content = btoa(unescape(encodeURIComponent(markdown))); // Base64 encode

			// First, try to get the current file's SHA (needed for updates)
			let sha: string | undefined;
			const existingRes = await fetch(
				`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`,
				{
					headers: {
						'Authorization': `Bearer ${token}`,
						'Accept': 'application/vnd.github.v3+json'
					}
				}
			);

			if (existingRes.ok) {
				const existing = await existingRes.json();
				sha = existing.sha;
			}

			// Commit the file
			const commitRes = await fetch(
				`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
				{
					method: 'PUT',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Accept': 'application/vnd.github.v3+json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						message: `Add annotation to ${slug}`,
						content,
						sha, // Include SHA if updating existing file
						branch: BRANCH,
						committer: {
							name: session.user.name || session.user.login,
							email: `${session.user.id}+${session.user.login}@users.noreply.github.com`
						}
					})
				}
			);

			if (!commitRes.ok) {
				const error = await commitRes.json();
				console.error('GitHub commit failed:', error);
				return false;
			}

			return true;
		} catch (e) {
			console.error('Failed to save annotations to GitHub:', e);
			return false;
		}
	}
}
