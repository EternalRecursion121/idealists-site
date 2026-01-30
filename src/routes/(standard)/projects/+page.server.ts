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
		name: 'Web Decompiler',
		url: null,
		description: "A tool for grabbing every atomic action available from a website—API calls, HTTP requests, source code—to give people more autonomy over what they do on the web. Browse Instagram without their algorithm, read news sites without enabling cookies, run frequent actions through the terminal, redesign a site's UI just because you can."
	},
	{
		name: "I'm Bored",
		url: 'https://github.com/EternalRecursion121/im-bored',
		description: "An app to replace Instagram, TikTok, and YouTube as your default place to go when you're bored. An algorithm you control, pulling from whatever sources you like, that you can customize endlessly. Content flows through a visual DAG of Sources and Transforms—mixed and filtered however you want."
	},
	{
		name: 'Non-Linear Writing Interface',
		url: 'https://github.com/EternalRecursion121/non-linear-writing-interface',
		description: 'A keyboard-native, node-based writing application for crafting branching narratives. Explore multiple story directions simultaneously through branching and parallelization, visualizing narrative structure as a directed acyclic graph.'
	},
	{
		name: 'Focus Machine',
		url: 'https://github.com/meg-an31/focus-machine',
		description: "An AI-powered productivity companion that observes your work patterns and provides personalized nudges. More frequent when you drift, quieter when you're in flow."
	},
	{
		name: 'Magazine',
		url: null,
		description: 'A hybrid digital-physical publication exploring the intersection of technology and human experience. Embedded NFC tags bridge the tangible and digital, featuring essays, art, poetry, and conversations with collective members about their work.'
	},
	{
		name: 'This Website',
		url: 'https://github.com/EternalRecursion121/idealists-site',
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
