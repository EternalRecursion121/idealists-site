// Main barrel export for annotations module

// Types
export type {
	Annotation,
	Reply,
	Selector,
	TextQuoteSelector,
	TextPositionSelector,
	AuthUser,
	AuthProvider,
	AnnotationStore
} from './types';

// Parser
export { parseAnnotationsMarkdown, serializeAnnotationsMarkdown, formatDate } from './parser';

// Stores
export { FilesystemStore, MemoryStore, getStore } from './stores';

// Auth
export { AnonymousAuth, getAuthProvider } from './auth';

// Components are exported individually since they're Svelte files
// import AnnotationLayer from '$lib/annotations/components/AnnotationLayer.svelte';
// import AnnotationThread from '$lib/annotations/components/AnnotationThread.svelte';
// import AnnotationEditor from '$lib/annotations/components/AnnotationEditor.svelte';
