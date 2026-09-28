import type { PageServerLoad } from './$types';
import {
	PROVISIONAL_RD,
	getRatings,
	imageMetadata,
	isEnabled,
	leaderboard,
	vibeSrc
} from '$lib/server/vibes-elo';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	// Read-only, so a short shared cache is fine.
	setHeaders({ 'cache-control': 'public, max-age=30, stale-while-revalidate=300' });

	if (!isEnabled()) return { enabled: false as const };

	const meta = await imageMetadata(fetch);
	const { ratings, totalVotes } = await getRatings(Object.keys(meta));

	return {
		enabled: true as const,
		board: leaderboard(ratings, Infinity).map((v) => ({
			src: vibeSrc(v.name),
			rating: Math.round(v.rating),
			rd: Math.round(v.rd),
			games: v.games,
			provisional: v.rd > PROVISIONAL_RD
		})),
		totalVotes
	};
};
