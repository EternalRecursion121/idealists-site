import membersRaw from '$lib/data/members.csv?raw';

export interface Member {
	name: string;
	url?: string;
}

function shuffle<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

function parseCSVLine(line: string): [string, string | undefined] | null {
	// Handle quoted fields (e.g., "Name, Jr.",url)
	const match = line.match(/^"([^"]+)"|^([^,]+)/);
	if (!match) return null;

	const name = (match[1] || match[2]).trim();
	const rest = line.slice(match[0].length).replace(/^,\s*/, '');
	const url = rest.replace(/^"([^"]+)"/, '$1').trim() || undefined;

	return name ? [name, url] : null;
}

export async function load() {
	const lines = membersRaw.trim().split('\n').slice(1); // Skip header
	const members = lines
		.filter(line => line.trim())
		.map(line => {
			const parsed = parseCSVLine(line);
			if (!parsed) return null;
			const [name, url] = parsed;
			return { name, url } as Member;
		})
		.filter((m): m is Member => m !== null);

	return {
		members: shuffle(members),
		title: 'members',
		description: 'the people behind the collective',
		centered: true
	};
}
