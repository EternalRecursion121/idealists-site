// Auth interface and factory
import type { AuthUser, AuthProvider } from '../types';

export type { AuthUser, AuthProvider };

// Re-export implementations
export { AnonymousAuth } from './anonymous';
export { GitHubAuth } from './github';

// Factory to get the appropriate auth provider
export function getAuthProvider(type: 'anonymous' | 'github' | 'discord' = 'anonymous'): AuthProvider {
	switch (type) {
		case 'github':
			return new (require('./github').GitHubAuth)();
		case 'discord':
			// Future: return new DiscordAuth();
			throw new Error('Discord auth not yet implemented');
		case 'anonymous':
		default:
			return new (require('./anonymous').AnonymousAuth)();
	}
}
