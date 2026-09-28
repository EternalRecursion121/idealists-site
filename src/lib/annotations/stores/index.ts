// Storage interface
import type { AnnotationStore } from '../types';

export type { AnnotationStore };

// Re-export implementations
export { FilesystemStore } from './filesystem';
export { MemoryStore } from './memory';
export { GitHubStore } from './github';
