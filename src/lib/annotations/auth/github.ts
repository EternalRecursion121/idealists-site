// GitHub OAuth auth provider
import { browser } from '$app/environment';
import type { AuthUser, AuthProvider } from '../types';

const SESSION_KEY = 'idealists-github-session';

export interface GitHubSession {
	accessToken: string;
	user: {
		id: number;
		login: string;
		name: string | null;
		avatar_url: string;
	};
	expiresAt?: number;
}

/**
 * GitHub OAuth provider.
 * Stores session in localStorage after OAuth callback sets it.
 */
export class GitHubAuth implements AuthProvider {
	private cachedSession: GitHubSession | null = null;

	async getUser(): Promise<AuthUser | null> {
		if (!browser) return null;

		const session = this.getSession();
		if (!session) return null;

		return {
			id: `github_${session.user.id}`,
			name: session.user.name || session.user.login,
			avatar: session.user.avatar_url,
			provider: 'github'
		};
	}

	async login(): Promise<AuthUser | null> {
		if (!browser) return null;

		// Redirect to GitHub OAuth - the callback will set the session
		window.location.href = '/api/auth/github';
		return null; // Won't reach here due to redirect
	}

	async logout(): Promise<void> {
		if (!browser) return;

		localStorage.removeItem(SESSION_KEY);
		this.cachedSession = null;
	}

	// Get the raw session (includes access token for API calls)
	getSession(): GitHubSession | null {
		if (!browser) return null;

		if (this.cachedSession) return this.cachedSession;

		const stored = localStorage.getItem(SESSION_KEY);
		if (!stored) return null;

		try {
			const session = JSON.parse(stored) as GitHubSession;

			// Check expiry if set
			if (session.expiresAt && Date.now() > session.expiresAt) {
				localStorage.removeItem(SESSION_KEY);
				return null;
			}

			this.cachedSession = session;
			return session;
		} catch {
			return null;
		}
	}

	// Set session (called by OAuth callback)
	setSession(session: GitHubSession): void {
		if (!browser) return;

		localStorage.setItem(SESSION_KEY, JSON.stringify(session));
		this.cachedSession = session;
	}

	// Get access token for API calls
	getAccessToken(): string | null {
		const session = this.getSession();
		return session?.accessToken || null;
	}

	// Check if user has write access to the repo
	async hasRepoAccess(owner: string, repo: string): Promise<boolean> {
		const token = this.getAccessToken();
		if (!token) return false;

		try {
			const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Accept': 'application/vnd.github.v3+json'
				}
			});

			if (!res.ok) return false;

			const data = await res.json();
			// Check for push permission
			return data.permissions?.push === true;
		} catch {
			return false;
		}
	}
}
