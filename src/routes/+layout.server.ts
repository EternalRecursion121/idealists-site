import { buildNavGraph } from '$lib/nav';

// Writings are discovered at build time, so this works on Vercel without
// filesystem access at runtime. Adding src/lib/writings/<slug>/content.md is
// enough for it to appear in the constellation.
const writingSlugs = Object.keys(import.meta.glob('/src/lib/writings/*/content.md'))
	.map((file) => file.match(/\/writings\/([^/]+)\/content\.md$/)?.[1])
	.filter((slug): slug is string => Boolean(slug))
	.sort();

const { pages, connections } = buildNavGraph(writingSlugs);

export async function load() {
	return {
		navPages: pages,
		navConnections: connections
	};
}
