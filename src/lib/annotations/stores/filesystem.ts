// Filesystem-based annotation storage (via API)
import type { Annotation, AnnotationStore } from '../types';
import { parseAnnotationsMarkdown, serializeAnnotationsMarkdown } from '../parser';

/**
 * Store annotations in local filesystem via API endpoint.
 * Files are saved as markdown alongside content.md in each writing folder.
 */
export class FilesystemStore implements AnnotationStore {
	async load(slug: string): Promise<Annotation[]> {
		try {
			const res = await fetch(`/api/annotations?slug=${encodeURIComponent(slug)}`);
			if (!res.ok) return [];

			const data = await res.json();
			return parseAnnotationsMarkdown(data.markdown);
		} catch (e) {
			console.error('Failed to load annotations:', e);
			return [];
		}
	}

	async save(slug: string, annotations: Annotation[]): Promise<boolean> {
		try {
			const markdown = serializeAnnotationsMarkdown(annotations);
			const res = await fetch('/api/annotations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug, markdown })
			});

			return res.ok;
		} catch (e) {
			console.error('Failed to save annotations:', e);
			return false;
		}
	}
}
