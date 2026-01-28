// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		MathJax?: {
			typesetPromise?: (elements?: Element[]) => Promise<void>;
			startup?: {
				promise?: Promise<void>;
				defaultReady: () => void;
				ready?: () => void;
			};
			tex?: {
				inlineMath?: string[][];
				displayMath?: string[][];
			};
		};
	}
}

export {};
