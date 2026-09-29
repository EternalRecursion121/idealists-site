import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	PROMPT,
	RECENT_LIMIT,
	createMatchup,
	getRatings,
	imageMetadata,
	isEnabled,
	skip,
	vibeSrc as src,
	vote
} from '$lib/server/vibes-elo';

const SEEN_COOKIE = 'vibes_seen';

/** The vibes this browser saw most recently, so it isn't shown them again straight away. */
function readSeen(raw: string | undefined): string[] {
	try {
		const parsed = JSON.parse(raw ?? '[]');
		return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
	} catch {
		return [];
	}
}

export const load: PageServerLoad = async ({ fetch, setHeaders, cookies }) => {
	// Every load writes a fresh matchup, so this must never be cached.
	setHeaders({ 'cache-control': 'private, no-store' });

	if (!isEnabled()) return { enabled: false as const };

	const meta = await imageMetadata(fetch);
	const seen = readSeen(cookies.get(SEEN_COOKIE));
	const matchup = await createMatchup(await getRatings(Object.keys(meta)), seen);
	cookies.set(SEEN_COOKIE, JSON.stringify([...seen, matchup.a, matchup.b].slice(-RECENT_LIMIT)), {
		path: '/vibes/duel',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24
	});

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

		switch (await vote(match, winner, getClientAddress())) {
			case 'ok':
				return { voted: true };
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
