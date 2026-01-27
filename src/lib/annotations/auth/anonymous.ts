// Anonymous auth - just asks for a name via prompt
import { browser } from '$app/environment';
import type { AuthUser, AuthProvider } from '../types';

const USERNAME_KEY = 'idealists-username';

/**
 * Anonymous auth provider.
 * Simply stores username in localStorage and prompts if not set.
 */
export class AnonymousAuth implements AuthProvider {
	private cachedUser: AuthUser | null = null;

	async getUser(): Promise<AuthUser | null> {
		if (!browser) return null;

		if (this.cachedUser) return this.cachedUser;

		const name = localStorage.getItem(USERNAME_KEY);
		if (name) {
			this.cachedUser = {
				id: `anon_${name.toLowerCase().replace(/\s+/g, '_')}`,
				name,
				provider: 'anonymous'
			};
			return this.cachedUser;
		}

		return null;
	}

	async login(): Promise<AuthUser | null> {
		if (!browser) return null;

		const name = prompt("What's your name?");
		if (!name) return null;

		localStorage.setItem(USERNAME_KEY, name);
		this.cachedUser = {
			id: `anon_${name.toLowerCase().replace(/\s+/g, '_')}`,
			name,
			provider: 'anonymous'
		};

		return this.cachedUser;
	}

	async logout(): Promise<void> {
		if (!browser) return;

		localStorage.removeItem(USERNAME_KEY);
		this.cachedUser = null;
	}

	// Get name directly (for backwards compat)
	getName(): string | null {
		if (!browser) return null;
		return localStorage.getItem(USERNAME_KEY);
	}

	// Set name directly
	setName(name: string): void {
		if (!browser) return;
		localStorage.setItem(USERNAME_KEY, name);
		this.cachedUser = {
			id: `anon_${name.toLowerCase().replace(/\s+/g, '_')}`,
			name,
			provider: 'anonymous'
		};
	}
}
