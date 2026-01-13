import { error } from '@sveltejs/kit';
import { getWritingSlugs, getWritingPath, getWritingWithRevisions, extractFrontmatter, getFileHistory } from '$lib/server/git-history';
import type { WritingMetadata, WritingWithHistory } from '$lib/types/writing';

export async function load({ params, setHeaders }) {
	// Cache for 60s, serve stale while revalidating for up to 1 hour
	setHeaders({
		'cache-control': 'public, max-age=60, stale-while-revalidate=3600'
	});

	const { slug } = params;
	const slugs = await getWritingSlugs();

	if (!slugs.includes(slug)) {
		throw error(404, 'Writing not found');
	}

	const revisions = await getWritingWithRevisions(slug);

	if (revisions.length === 0) {
		throw error(404, 'Writing has no history');
	}

	const currentContent = revisions[0].content;
	const { title, description, author, body } = extractFrontmatter(currentContent);

	const metadata: WritingMetadata = {
		slug,
		title: title || slug.replace(/-/g, ' '),
		description,
		author,
		createdAt: revisions[revisions.length - 1].date,
		updatedAt: revisions[0].date,
		revisionCount: revisions.length
	};

	const writing: WritingWithHistory = {
		metadata,
		currentContent: body,
		revisions
	};

	// Get all writings sorted by date for prev/next navigation
	const allWritings = await Promise.all(
		slugs.map(async (s) => {
			const history = await getFileHistory(getWritingPath(s));
			return {
				slug: s,
				updatedAt: history.length > 0 ? history[0].date : new Date().toISOString()
			};
		})
	);
	allWritings.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

	const currentIndex = allWritings.findIndex(w => w.slug === slug);
	// Circle around: if at newest, go to oldest; if at oldest, go to newest
	const nextSlug = currentIndex > 0
		? allWritings[currentIndex - 1].slug
		: allWritings[allWritings.length - 1].slug;

	return { writing, nextSlug };
}
