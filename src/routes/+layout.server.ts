import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

interface PageNode {
	name: string;
	path: string;
	linksTo: string[];
	isWriting?: boolean;
}

function getRouteName(routePath: string): string {
	if (routePath === '/') return 'home';
	return routePath.slice(1);
}

function findInternalLinks(content: string, currentPath: string): string[] {
	const links = new Set<string>();
	const hrefRegex = /href=["'](\/?(?:writings|projects|library|vibes|members|join|sitemap)?)\/?["']/g;
	let match;

	while ((match = hrefRegex.exec(content)) !== null) {
		let path = match[1];
		if (!path.startsWith('/')) path = '/' + path;
		if (path === '/') path = '/';
		else path = path.replace(/\/$/, '');
		if (path !== currentPath && path !== '') {
			links.add(path);
		}
	}

	return Array.from(links);
}

function getWritingSlugs(): string[] {
	const writingsDir = 'src/lib/writings';
	if (!existsSync(writingsDir)) return [];
	try {
		return readdirSync(writingsDir).filter(name => {
			const path = join(writingsDir, name);
			return statSync(path).isDirectory();
		});
	} catch {
		return [];
	}
}

function scanRoutes(): { pages: PageNode[]; connections: { from: string; to: string }[] } {
	const pages: PageNode[] = [];
	const routesDir = 'src/routes';
	const mainRoutes = ['', 'writings', 'projects', 'library', 'vibes', 'members', 'join', 'sitemap'];

	for (const route of mainRoutes) {
		const routePath = route === '' ? '/' : `/${route}`;
		// Check both direct path and (standard) group path
		const possiblePaths = [
			join(routesDir, route, '+page.svelte'),
			join(routesDir, '(standard)', route, '+page.svelte')
		];

		for (const pageFile of possiblePaths) {
			try {
				const content = readFileSync(pageFile, 'utf-8');
				const linksTo = findInternalLinks(content, routePath);
				pages.push({
					name: getRouteName(routePath),
					path: routePath,
					linksTo
				});
				break; // Found the file, stop checking other paths
			} catch {
				// Try next path
			}
		}
	}

	// Add writings
	const writingSlugs = getWritingSlugs();
	for (const slug of writingSlugs) {
		const contentPath = join('src/lib/writings', slug, 'content.md');
		let linksTo: string[] = ['/writings'];
		try {
			const content = readFileSync(contentPath, 'utf-8');
			const internalLinks = findInternalLinks(content, `/writings/${slug}`);
			linksTo = [...linksTo, ...internalLinks];
		} catch {}

		pages.push({
			name: slug,
			path: `/writings/${slug}`,
			linksTo,
			isWriting: true
		});
	}

	// Link /writings to individual writings
	const writingsPage = pages.find(p => p.path === '/writings');
	if (writingsPage) {
		for (const slug of writingSlugs) {
			writingsPage.linksTo.push(`/writings/${slug}`);
		}
	}

	// Add BottomNav links
	const ring = ['projects', 'writings', 'home', 'library', 'members', 'vibes'];
	for (let i = 0; i < ring.length; i++) {
		const page = ring[i];
		const prev = ring[(i - 1 + ring.length) % ring.length];
		const next = ring[(i + 1) % ring.length];
		const pagePath = page === 'home' ? '/' : `/${page}`;
		const prevPath = prev === 'home' ? '/' : `/${prev}`;
		const nextPath = next === 'home' ? '/' : `/${next}`;

		const pageNode = pages.find(p => p.path === pagePath);
		if (pageNode) {
			if (!pageNode.linksTo.includes(prevPath)) pageNode.linksTo.push(prevPath);
			if (!pageNode.linksTo.includes(nextPath)) pageNode.linksTo.push(nextPath);
			if (!pageNode.linksTo.includes('/join')) pageNode.linksTo.push('/join');
			if (!pageNode.linksTo.includes('/sitemap')) pageNode.linksTo.push('/sitemap');
		}
	}

	// Connect /sitemap to all main pages (since it displays all of them)
	const sitemapPage = pages.find(p => p.path === '/sitemap');
	if (sitemapPage) {
		for (const route of mainRoutes) {
			const routePath = route === '' ? '/' : `/${route}`;
			if (routePath !== '/sitemap' && !sitemapPage.linksTo.includes(routePath)) {
				sitemapPage.linksTo.push(routePath);
			}
		}
	}

	// Build connections
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
	const { pages, connections } = scanRoutes();
	return {
		navPages: pages,
		navConnections: connections
	};
}
