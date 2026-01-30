import { getWritingSlugs, getWritingPath, getFileHistory, getFileAtCommit, extractFrontmatter } from '$lib/server/git-history';
import type { WritingMetadata } from '$lib/types/writing';

export async function load({ setHeaders }) {
	// Cache for 60s, serve stale while revalidating for up to 1 hour
	setHeaders({
		'cache-control': 'public, max-age=60, stale-while-revalidate=3600'
	});

	const slugs = await getWritingSlugs();

	const writings: WritingMetadata[] = await Promise.all(
		slugs.map(async (slug) => {
			const filePath = getWritingPath(slug);
			const history = await getFileHistory(filePath);

			// Get current content for title extraction
			const currentContent = history.length > 0
				? await getFileAtCommit(history[0].hash, filePath)
				: null;

			const { title, description } = currentContent
				? extractFrontmatter(currentContent)
				: { title: undefined, description: undefined };

			return {
				slug,
				title: title || slug.replace(/-/g, ' '),
				description,
				createdAt: history.length > 0 ? history[history.length - 1].date : new Date().toISOString(),
				updatedAt: history.length > 0 ? history[0].date : new Date().toISOString(),
				revisionCount: history.length
			};
		})
	);

	// Sort by most recently updated
	writings.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

	return {
		writings,
		title: 'writings',
		description: 'essays and thoughts from the collective'
	};
}
