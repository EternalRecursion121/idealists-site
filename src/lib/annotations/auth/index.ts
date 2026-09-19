// Auth interface
import type { AuthUser, AuthProvider } from '../types';

export type { AuthUser, AuthProvider };

// Re-export implementations
export { AnonymousAuth } from './anonymous';
export { GitHubAuth } from './github';
