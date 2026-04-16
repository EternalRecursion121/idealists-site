import type { PageServerLoad } from './$types';

const pageModules = import.meta.glob('./**/+page.svelte');
const writingModules = import.meta.glob('/src/lib/writings/*/content.md');

const EXCLUDED = new Set<string>(['/', '/unconference']);

const mainPageDescriptions: Record<string, string> = {
	'/': 'the collective',
	'/writings': 'essays on technology, philosophy, and the future we want to build',
	'/projects': 'tools and experiments born from our principles',
	'/library': 'books, talks, and resources that shape our thinking',
	'/members': 'the people behind the collective',
	'/vibes': "visual fragments of the world we're reaching for",
	'/join': "bring your idealism — we're better together",
	'/sitemap': 'the full map'
};

function discoverStaticRoutes(): string[] {
	const routes: string[] = [];
	for (const filePath of Object.keys(pageModules)) {
		let path = filePath.replace(/\/\+page\.svelte$/, '').replace(/^\./, '');
		path = path.replace(/\/\([^)]+\)/g, '');
		if (path === '') path = '/';
		if (path.includes('[')) continue;
		if (path.startsWith('/api')) continue;
		routes.push(path);
	}
	return routes;
}

function discoverWritingRoutes(): string[] {
	const routes: string[] = [];
	for (const filePath of Object.keys(writingModules)) {
		const match = filePath.match(/\/writings\/([^/]+)\/content\.md$/);
		if (match) routes.push(`/writings/${match[1]}`);
	}
	return routes;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { navPages, navConnections } = await parent();

	const mainPaths = new Set(
		navPages.filter((p) => !p.isWriting).map((p) => p.path)
	);

	const mainNavPages = navPages
		.filter((p) => !p.isWriting)
		.map((p) => ({
			...p,
			linksTo: p.linksTo.filter((t) => mainPaths.has(t)),
			description: mainPageDescriptions[p.path] || ''
		}));

	const mainNavConnections = navConnections.filter(
		(c) => mainPaths.has(c.from) && mainPaths.has(c.to)
	);

	const all = [...discoverStaticRoutes(), ...discoverWritingRoutes()].filter(
		(r) => !EXCLUDED.has(r)
	);
	const randomRoute = all[Math.floor(Math.random() * all.length)] ?? '/writings';

	return { randomRoute, mainNavPages, mainNavConnections };
};
