// In-memory annotation storage (for guests/preview)
import type { Annotation, AnnotationStore } from '../types';

/**
 * In-memory store for annotations.
 * Useful for guests who can annotate but not save,
 * or for preview/testing without hitting the API.
 */
export class MemoryStore implements AnnotationStore {
	private cache: Map<string, Annotation[]> = new Map();

	async load(slug: string): Promise<Annotation[]> {
		return this.cache.get(slug) || [];
	}

	async save(slug: string, annotations: Annotation[]): Promise<boolean> {
		this.cache.set(slug, annotations);
		return true;
	}

	// Clear all cached annotations
	clear(): void {
		this.cache.clear();
	}
}
