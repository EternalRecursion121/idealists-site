import { createHash, timingSafeEqual } from 'node:crypto';
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isEnabled, refit } from '$lib/server/vibes-elo';
import type { RequestHandler } from './$types';

const digest = (value: string) => createHash('sha256').update(value).digest();

/**
 * Refit the vibe ratings from every vote, on demand.
 *   curl -X POST -H "Authorization: Bearer $VIBES_REFIT_TOKEN" https://<site>/api/vibes/refit
 * Disabled (404) unless VIBES_REFIT_TOKEN is set.
 */
export const POST: RequestHandler = async ({ request }) => {
	const token = env.VIBES_REFIT_TOKEN;
	if (!token) error(404, 'Not found');

	// Compare hashes so the check takes the same time whatever the input.
	const given = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
	if (!timingSafeEqual(digest(given), digest(token))) error(401, 'Unauthorized');

	if (!isEnabled()) error(503, 'Voting database not configured');
	return json(await refit());
};
