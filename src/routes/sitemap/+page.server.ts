// Re-use nav data from layout and add descriptions
const pageDescriptions: Record<string, string> = {
	'/': 'the collective',
	'/writings': 'essays & thoughts',
	'/projects': 'things we\'re building',
	'/library': 'our influences',
	'/glossary': 'our vocabulary',
	'/vibes': 'visual inspiration',
	'/members': 'the people',
	'/join': 'become one of us',
	'/sitemap': 'you are here'
};

export async function load({ parent }) {
	const { navPages, navConnections } = await parent();

	// Add descriptions to pages
	const pages = navPages.map(p => ({
		...p,
		description: pageDescriptions[p.path] || ''
	}));

	return { pages, connections: navConnections };
}
