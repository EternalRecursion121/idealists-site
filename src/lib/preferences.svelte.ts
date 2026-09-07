import { browser } from '$app/environment';

// Site customisation preferences, unlocked by cycling the theme toggle
// through a full revolution. Persisted to localStorage.

export type FontChoice = 'sligoil' | 'garamond' | 'manrope' | 'mono';
export type QuoteChoice = 'centered' | 'ruled' | 'wash';
export type LlamaChoice = 'roams' | 'many' | 'rests';
export type SizeChoice = 'small' | 'regular' | 'large';
export type MeasureChoice = 'snug' | 'regular' | 'roomy';
export type GrainChoice = 'film' | 'clean';
export type CasingChoice = 'mixed' | 'lower' | 'loud';

export interface SitePreferences {
	font: FontChoice;
	quote: QuoteChoice;
	llama: LlamaChoice;
	size: SizeChoice;
	measure: MeasureChoice;
	grain: GrainChoice;
	casing: CasingChoice;
}

export const FONT_CHOICES: FontChoice[] = ['sligoil', 'garamond', 'manrope', 'mono'];
export const QUOTE_CHOICES: QuoteChoice[] = ['centered', 'ruled', 'wash'];
export const LLAMA_CHOICES: LlamaChoice[] = ['roams', 'many', 'rests'];
export const SIZE_CHOICES: SizeChoice[] = ['small', 'regular', 'large'];
export const MEASURE_CHOICES: MeasureChoice[] = ['snug', 'regular', 'roomy'];
export const GRAIN_CHOICES: GrainChoice[] = ['film', 'clean'];
export const CASING_CHOICES: CasingChoice[] = ['mixed', 'lower', 'loud'];

const DEFAULTS: SitePreferences = {
	font: 'sligoil',
	quote: 'centered',
	llama: 'roams',
	size: 'regular',
	measure: 'regular',
	grain: 'film',
	casing: 'mixed'
};

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
			llama: pick(parsed.llama, LLAMA_CHOICES, DEFAULTS.llama),
			size: pick(parsed.size, SIZE_CHOICES, DEFAULTS.size),
			measure: pick(parsed.measure, MEASURE_CHOICES, DEFAULTS.measure),
			grain: pick(parsed.grain, GRAIN_CHOICES, DEFAULTS.grain),
			casing: pick(parsed.casing, CASING_CHOICES, DEFAULTS.casing)
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
