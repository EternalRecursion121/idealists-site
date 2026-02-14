import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getWritingSlugs, getWritingPath, getWritingWithRevisions, extractFrontmatter, getFileHistory, getAnnotations, getExternalFileHistory } from '$lib/server/git-history';
import type { WritingMetadata, WritingWithHistory, Revision } from '$lib/types/writing';
import { readFile } from 'fs/promises';

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

	let revisions = await getWritingWithRevisions(slug);
	let currentContent: string;

	// In dev mode, handle local-only writings that don't exist on GitHub yet
	if (dev) {
		try {
			currentContent = await readFile(getWritingPath(slug), 'utf-8');
			// If no revisions from GitHub, create a draft revision from local file
			if (revisions.length === 0) {
				revisions = [{
					hash: 'local-draft',
					shortHash: 'draft',
					date: new Date().toISOString(),
					author: 'local',
					message: 'Local draft (not yet committed)',
					content: currentContent
				}];
			}
		} catch {
			if (revisions.length === 0) {
				throw error(404, 'Writing has no history');
			}
			currentContent = revisions[0].content;
		}
	} else {
		if (revisions.length === 0) {
			throw error(404, 'Writing has no history');
		}
		currentContent = revisions[0].content;
	}

	const { title, description, authors, branches, style, body } = extractFrontmatter(currentContent);

	// Fetch revision history for external branches
	let branchesWithRevisions = branches;
	if (branches?.length) {
		branchesWithRevisions = await Promise.all(
			branches.map(async (branch) => {
				if (branch.repo && branch.path) {
					const externalRevisions = await getExternalFileHistory(branch.repo, branch.path);
					return { ...branch, revisions: externalRevisions };
				}
				return branch;
			})
		);
	}

	const metadata: WritingMetadata = {
		slug,
		title: title || slug.replace(/-/g, ' '),
		description,
		authors,
		createdAt: revisions[revisions.length - 1].date,
		updatedAt: revisions[0].date,
		revisionCount: revisions.length,
		style,
		branches: branchesWithRevisions
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

	// Fetch annotations markdown
	const annotationsMarkdown = await getAnnotations(slug);

	return { writing, nextSlug, annotationsMarkdown };
}
