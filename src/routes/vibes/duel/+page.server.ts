import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	PROMPT,
	createMatchup,
	getRatings,
	imageMetadata,
	isEnabled,
	skip,
	vibeSrc as src,
	vote
} from '$lib/server/vibes-elo';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	// Every load writes a fresh matchup, so this must never be cached.
	setHeaders({ 'cache-control': 'private, no-store' });

	if (!isEnabled()) return { enabled: false as const };

	const meta = await imageMetadata(fetch);
	const { ratings } = await getRatings(Object.keys(meta));
	const matchup = await createMatchup(ratings);

	const side = (name: string) => ({ name, src: src(name), width: meta[name][0], height: meta[name][1] });

	return {
		enabled: true as const,
		matchup: {
			id: matchup.id,
			prompt: PROMPT,
			a: side(matchup.a),
			b: side(matchup.b)
		}
	};
};

export const actions: Actions = {
	vote: async ({ request, getClientAddress }) => {
		if (!isEnabled()) return fail(503, { message: 'voting is resting right now' });

		const form = await request.formData();
		const match = form.get('match');
		const winner = form.get('winner');
		if (typeof match !== 'string' || typeof winner !== 'string') {
			return fail(400, { message: 'that vote got lost on the way' });
		}

		const result = await vote(match, winner, getClientAddress());
		switch (result.status) {
			case 'ok':
				return {
					winner: src(result.winner),
					loser: src(result.loser),
					winnerDelta: Math.round(result.winnerDelta),
					loserDelta: Math.round(result.loserDelta),
					upset: result.expected < 0.35
				};
			case 'ratelimited':
				return fail(429, { message: 'slow down — let the vibes breathe' });
			case 'gone':
				return fail(410, { message: 'that matchup already happened — here’s a new one' });
			case 'invalid':
				return fail(400, { message: 'that vibe wasn’t in this matchup' });
		}
	},

	skip: async ({ request, getClientAddress }) => {
		if (!isEnabled()) return fail(503, { message: 'voting is resting right now' });

		const match = (await request.formData()).get('match');
		if (typeof match !== 'string') return { skipped: true };

		// A missing matchup is fine here: either way the next load brings a new pair.
		const status = await skip(match, getClientAddress());
		if (status === 'ratelimited') return fail(429, { message: 'slow down — let the vibes breathe' });
		return { skipped: true };
	}
};
