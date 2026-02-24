interface PageNode {
	name: string;
	path: string;
	linksTo: string[];
	isWriting?: boolean;
}

// Hardcoded route data (filesystem scanning doesn't work in production on Vercel)
const mainPages: PageNode[] = [
	{ name: 'home', path: '/', linksTo: ['/writings', '/library', '/glossary', '/projects', '/members', '/vibes', '/join', '/sitemap'] },
	{ name: 'writings', path: '/writings', linksTo: ['/', '/library', '/glossary', '/projects', '/members', '/vibes', '/join', '/sitemap'] },
	{ name: 'projects', path: '/projects', linksTo: ['/', '/writings', '/library', '/glossary', '/members', '/vibes', '/join', '/sitemap'] },
	{ name: 'library', path: '/library', linksTo: ['/', '/writings', '/glossary', '/projects', '/members', '/vibes', '/join', '/sitemap'] },
	{ name: 'glossary', path: '/glossary', linksTo: ['/', '/writings', '/library', '/projects', '/members', '/vibes', '/join', '/sitemap'] },
	{ name: 'vibes', path: '/vibes', linksTo: ['/', '/writings', '/glossary', '/projects', '/library', '/members', '/join', '/sitemap'] },
	{ name: 'members', path: '/members', linksTo: ['/', '/writings', '/glossary', '/projects', '/library', '/vibes', '/join', '/sitemap'] },
	{ name: 'join', path: '/join', linksTo: ['/', '/writings', '/glossary', '/projects', '/library', '/vibes', '/members', '/sitemap'] },
	{ name: 'index', path: '/sitemap', linksTo: ['/', '/writings', '/glossary', '/projects', '/library', '/vibes', '/members', '/join'] }
];

const writings: PageNode[] = [
	{ name: 'aliveness', path: '/writings/aliveness', linksTo: ['/writings'], isWriting: true },
	{ name: 'delight-in-the-details', path: '/writings/delight-in-the-details', linksTo: ['/writings'], isWriting: true },
	{ name: 'high-bandwidth-communication', path: '/writings/high-bandwidth-communication', linksTo: ['/writings'], isWriting: true },
	{ name: 'i-want-to-write-code-like-im-playing-jazz', path: '/writings/i-want-to-write-code-like-im-playing-jazz', linksTo: ['/writings'], isWriting: true },
	{ name: 'what-is-this', path: '/writings/what-is-this', linksTo: ['/writings'], isWriting: true }
];

function getRoutesData(): { pages: PageNode[]; connections: { from: string; to: string }[] } {
	// Combine main pages and writings
	const pages = [...mainPages];

	// Add writings and link them from /writings page
	const writingsPage = pages.find(p => p.path === '/writings');
	for (const writing of writings) {
		pages.push(writing);
		if (writingsPage && !writingsPage.linksTo.includes(writing.path)) {
			writingsPage.linksTo.push(writing.path);
		}
	}

	// Build connections (deduplicated)
	const connections: { from: string; to: string }[] = [];
	const seen = new Set<string>();
	for (const page of pages) {
		for (const target of page.linksTo) {
			const key = [page.path, target].sort().join('|');
			if (!seen.has(key)) {
				seen.add(key);
				connections.push({ from: page.path, to: target });
			}
		}
	}

	return { pages, connections };
}

export async function load() {
	const { pages, connections } = getRoutesData();
	return {
		navPages: pages,
		navConnections: connections
	};
}
