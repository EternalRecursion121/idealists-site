import { json } from '@sveltejs/kit';
import { saveAnnotations, getAnnotations } from '$lib/server/git-history';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { slug, markdown } = await request.json();

		if (!slug || typeof markdown !== 'string') {
			return json({ error: 'Missing slug or markdown' }, { status: 400 });
		}

		const success = saveAnnotations(slug, markdown);

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
