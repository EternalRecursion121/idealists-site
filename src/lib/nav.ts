// The one place the site's page graph is written down by hand.
//
// Everything else derives from this file: the constellation (index overlay,
// /sitemap, the homepage map), the footer ring, and which ring page a route
// belongs to. Writings are not listed here; the root layout discovers them at
// build time from src/lib/writings/*/content.md (see +layout.server.ts), so
// adding a writing needs no edit here.
//
// It is deliberately a hand-edited list rather than runtime route discovery:
// filesystem scanning isn't available in production on Vercel.

export interface MainPage {
	/** label shown in the constellation and footer */
	name: string;
	path: string;
	/** one-line description for the index page: short, sits beside the node */
	short: string;
	/** fuller description for the homepage map */
	long: string;
}

export const mainPages: readonly MainPage[] = [
	{ name: 'home', path: '/', short: 'the collective', long: 'the collective' },
	{
		name: 'writings',
		path: '/writings',
		short: 'essays & thoughts',
		long: 'essays on technology, philosophy, and the future we want to build'
	},
	{
		name: 'projects',
		path: '/projects',
		short: "things we're building",
		long: 'tools and experiments born from our principles'
	},
	{
		name: 'library',
		path: '/library',
		short: 'our influences',
		long: 'books, talks, and resources that shape our thinking'
	},
	{
		name: 'vibes',
		path: '/vibes',
		short: 'visual inspiration',
		long: "visual fragments of the world we're reaching for"
	},
	{ name: 'members', path: '/members', short: 'the people', long: 'the people behind the collective' },
	{
		name: 'join',
		path: '/join',
		short: 'become one of us',
		long: "bring your idealism — we're better together"
	},
	{ name: 'index', path: '/sitemap', short: 'you are here', long: 'the full map' }
];

/** The footer's previous / next ring, in order. Pages not listed sit off the ring. */
export const ring = ['/projects', '/writings', '/', '/library', '/members', '/vibes'] as const;
export type RingPath = (typeof ring)[number];

/** Routes that aren't main pages but belong to one for the footer's purposes. */
const ringAliases: Record<string, RingPath> = {
	'/unconference': '/projects'
};

/** Which ring page a pathname belongs to (its own, its parent, or home). */
export function ringPathFor(pathname: string): RingPath {
	if (pathname.startsWith('/writings')) return '/writings';
	if (pathname in ringAliases) return ringAliases[pathname];
	return (ring as readonly string[]).includes(pathname) ? (pathname as RingPath) : '/';
}

export function pageName(path: string): string {
	return mainPages.find((p) => p.path === path)?.name ?? path;
}

export interface PageNode {
	name: string;
	path: string;
	linksTo: string[];
	isWriting?: boolean;
}

/**
 * The full graph: every main page links to every other main page, /writings
 * links to each writing, each writing links back to /writings.
 */
export function buildNavGraph(writingSlugs: readonly string[]): {
	pages: PageNode[];
	connections: { from: string; to: string }[];
} {
	const mainPaths = mainPages.map((p) => p.path);
	const pages: PageNode[] = mainPages.map((p) => ({
		name: p.name,
		path: p.path,
		linksTo: mainPaths.filter((other) => other !== p.path)
	}));

	const writingsPage = pages.find((p) => p.path === '/writings');
	for (const slug of writingSlugs) {
		const path = `/writings/${slug}`;
		pages.push({ name: slug, path, linksTo: ['/writings'], isWriting: true });
		writingsPage?.linksTo.push(path);
	}

	// connections are undirected and deduplicated
	const connections: { from: string; to: string }[] = [];
	const seen = new Set<string>();
	for (const page of pages) {
		for (const target of page.linksTo) {
			const key = [page.path, target].sort().join('|');
			if (seen.has(key)) continue;
			seen.add(key);
			connections.push({ from: page.path, to: target });
		}
	}

	return { pages, connections };
}
