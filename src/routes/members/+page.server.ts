import membersRaw from '$lib/data/members.csv?raw';

export interface Member {
	name: string;
	url: string;
}

function shuffle<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export async function load() {
	const lines = membersRaw.trim().split('\n').slice(1); // Skip header
	const members: Member[] = lines
		.filter(line => line.trim())
		.map(line => {
			const [name, url] = line.split(',').map(s => s.trim());
			return { name, url };
		})
		.filter(m => m.name); // Filter out empty entries

	return { members: shuffle(members) };
}
