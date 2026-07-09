import { browser } from '$app/environment';

// Site customisation preferences, unlocked by cycling the theme toggle
// through a full revolution. Persisted to localStorage.

export type FontChoice = 'sligoil' | 'garamond' | 'manrope' | 'mono';
export type QuoteChoice = 'centered' | 'ruled' | 'wash';
export type LlamaChoice = 'roams' | 'rests';

export interface SitePreferences {
	font: FontChoice;
	quote: QuoteChoice;
	llama: LlamaChoice;
}

export const FONT_CHOICES: FontChoice[] = ['sligoil', 'garamond', 'manrope', 'mono'];
export const QUOTE_CHOICES: QuoteChoice[] = ['centered', 'ruled', 'wash'];
export const LLAMA_CHOICES: LlamaChoice[] = ['roams', 'rests'];

const DEFAULTS: SitePreferences = { font: 'sligoil', quote: 'centered', llama: 'roams' };

const STORAGE_KEY = 'site-preferences';
const UNLOCK_KEY = 'settings-discovered';

function pick<T extends string>(value: unknown, allowed: T[], fallback: T): T {
	return allowed.includes(value as T) ? (value as T) : fallback;
}

function loadPreferences(): SitePreferences {
	if (!browser) return { ...DEFAULTS };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...DEFAULTS };
		const parsed = JSON.parse(raw);
		return {
			font: pick(parsed.font, FONT_CHOICES, DEFAULTS.font),
			quote: pick(parsed.quote, QUOTE_CHOICES, DEFAULTS.quote),
			llama: pick(parsed.llama, LLAMA_CHOICES, DEFAULTS.llama)
		};
	} catch {
		return { ...DEFAULTS };
	}
}

export const preferences = $state<SitePreferences>(loadPreferences());

export function persistPreferences() {
	if (browser) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
	}
}

// Once found, the settings icon stays found.
export const discovery = $state({
	unlocked: browser ? localStorage.getItem(UNLOCK_KEY) === '1' : false
});

export function unlockSettings() {
	discovery.unlocked = true;
	if (browser) {
		localStorage.setItem(UNLOCK_KEY, '1');
	}
}
