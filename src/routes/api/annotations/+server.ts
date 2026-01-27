import { json } from '@sveltejs/kit';
import { saveAnnotations, getAnnotations, isCollaborator } from '$lib/server/git-history';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { slug, markdown, user } = await request.json();

		if (!slug || typeof markdown !== 'string') {
			return json({ error: 'Missing slug or markdown' }, { status: 400 });
		}

		if (!user || !user.login || !user.name) {
			return json({ error: 'Missing user info' }, { status: 400 });
		}

		// Verify user is a collaborator on the repo
		const hasAccess = await isCollaborator(user.login);
		if (!hasAccess) {
			return json({ error: 'Not a collaborator on this repo' }, { status: 403 });
		}

		// Save with user as author
		const success = await saveAnnotations(slug, markdown, {
			name: user.name || user.login,
			email: user.email || `${user.id}+${user.login}@users.noreply.github.com`
		});

		if (success) {
			return json({ success: true });
		} else {
			return json({ error: 'Failed to save' }, { status: 500 });
		}
	} catch (e) {
		console.error('Annotation save error:', e);
		return json({ error: 'Server error' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url }) => {
	const slug = url.searchParams.get('slug');

	if (!slug) {
		return json({ error: 'Missing slug' }, { status: 400 });
	}

	const markdown = await getAnnotations(slug);
	return json({ markdown });
};
