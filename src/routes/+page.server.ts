import type { PageServerLoad } from './$types';
import { mainPages } from '$lib/nav';

const pageModules = import.meta.glob('./**/+page.svelte');

const EXCLUDED = new Set<string>(['/', '/unconference']);

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
			description: mainPages.find((m) => m.path === p.path)?.long ?? ''
		}));

	const mainNavConnections = navConnections.filter(
		(c) => mainPaths.has(c.from) && mainPaths.has(c.to)
	);

	const writingRoutes = navPages.filter((p) => p.isWriting).map((p) => p.path);
	const all = [...discoverStaticRoutes(), ...writingRoutes].filter((r) => !EXCLUDED.has(r));
	const randomRoute = all[Math.floor(Math.random() * all.length)] ?? '/writings';

	return { randomRoute, mainNavPages, mainNavConnections };
};
