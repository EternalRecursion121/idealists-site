// Storage interface and factory
import type { Annotation, AnnotationStore } from '../types';

export type { AnnotationStore };

// Re-export implementations
export { FilesystemStore } from './filesystem';
export { MemoryStore } from './memory';
export { GitHubStore } from './github';

// Factory to get the appropriate store
export function getStore(type: 'filesystem' | 'memory' | 'github' = 'filesystem'): AnnotationStore {
	switch (type) {
		case 'memory':
			// Lazy import to avoid circular deps
			return new (require('./memory').MemoryStore)();
		case 'github':
			return new (require('./github').GitHubStore)();
		case 'filesystem':
		default:
			return new (require('./filesystem').FilesystemStore)();
	}
}
