import { mainPages } from '$lib/nav';

export async function load({ parent }) {
	const { navPages, navConnections } = await parent();

	// the short descriptions sit beside each node on the index page
	const pages = navPages.map((p) => ({
		...p,
		description: mainPages.find((m) => m.path === p.path)?.short ?? ''
	}));

	return { pages, connections: navConnections };
}
