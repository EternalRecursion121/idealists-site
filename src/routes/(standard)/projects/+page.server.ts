export interface Project {
	name: string;
	url: string | null;
	description: string;
}

function shuffle<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

const projects: Project[] = [
	{
		name: 'The Idealists Unconference',
		url: '/unconference',
		description: 'A week-long gathering to imagine the future. April 4–12, 2026: five days in the Cotswolds, two days in London. Creating a time capsule from possible futures.'
	},
	{
		name: 'Web Decompiler',
		url: null,
		description: "A tool for grabbing every atomic action available from a website—API calls, HTTP requests, source code—to give people more autonomy over what they do on the web. Browse Instagram without their algorithm, read news sites without enabling cookies, run frequent actions through the terminal, redesign a site's UI just because you can."
	},
	{
		name: "I'm Bored",
		url: 'https://github.com/[REDACTED]/im-bored',
		description: "An app to replace Instagram, TikTok, and YouTube as your default place to go when you're bored. An algorithm you control, pulling from whatever sources you like, that you can customize endlessly. Content flows through a visual DAG of Sources and Transforms—mixed and filtered however you want."
	},
	{
		name: 'Non-Linear Writing Interface',
		url: 'https://github.com/[REDACTED]/non-linear-writing-interface',
		description: 'A keyboard-native, node-based writing application for crafting branching narratives. Explore multiple story directions simultaneously through branching and parallelization, visualizing narrative structure as a directed acyclic graph.'
	},
	{
		name: 'Focus Machine',
		url: 'https://github.com/meg-an31/focus-machine',
		description: "An AI-powered productivity companion that observes your work patterns and provides personalized nudges. More frequent when you drift, quieter when you're in flow."
	},
	{
		name: 'Wafflelist',
		url: 'https://wafflelist.mxbi.net/',
		description: 'A list-first to-do app with due dates, snooze controls, and Today/Tomorrow/Week workflows, plus encrypted sync between sessions.'
	},
	{
		name: 'Nothingburger Injector',
		url: 'https://xide.quest/nothingburger/',
		description: 'Turns sentences into pages of nothingburger text, with seed-based extraction so the original meaning can be recovered.'
	},
	{
		name: 'HyprLenia',
		url: 'https://github.com/JamesL425/HyprLenia---Taichi',
		description: 'A hyperoptimized realtime 3D emergent-behavior playground ported to Taichi Lang.'
	},
	{
		name: 'Anthist',
		url: 'https://www.anthist.com/',
		description: 'A distraction-free content reader for curating your own anthology of blogs, videos, and articles, with an ethical feed algorithm.'
	},
	{
		name: 'small web browsing',
		url: 'https://mains.in.net/smallweb/idealists-v2.html',
		description: 'A smallweb crawl snapshot ("idealists-v2") that surfaces discoveries ranked by local PageRank across a seeded set of domains.'
	},
	{
		name: 'programming-in-language',
		url: null,
		description: 'A work-in-progress specification language and CLI called "speck" for steering LLM-assisted development without losing control. It models each module at overview, declarative, and functional layers with typed interfaces, so intent and design decisions persist beyond a single agent session. The goal is to make iteration fast like vibe-coding, while making edits and dependency propagation much more reliable for real software.'
	},
	{
		name: 'Magazine',
		url: null,
		description: 'A hybrid digital-physical publication exploring technology and human experience. Embedded NFC tags bridge the tangible and digital, featuring essays, art, poetry, and conversations with collective members about their work.'
	},
	{
		name: 'This Website',
		url: 'https://github.com/[REDACTED]/[REDACTED]',
		description: 'The home of the collective. A living document featuring constellation navigation, version-controlled writings, and the occasional wandering llama.'
	}
];

export async function load() {
	return {
		projects: shuffle(projects),
		title: 'projects',
		description: "things we're building together"
	};
}
