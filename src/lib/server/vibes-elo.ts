/**
 * Vibe vs vibe: pairwise ratings for the vibes gallery.
 *
 * Ratings come from a Bayesian Bradley–Terry fit over every vote (see
 * bradley-terry.ts), refitted on read. Matchups are chosen by how much we
 * expect to learn from them. Everything lives in Upstash Redis:
 *
 *   vibes:pairs    hash        "winner\nloser" → times that ordered pair happened
 *   vibes:votes    stream      append-only log {winner, loser, ts, ip}
 *   vibes:skips    stream      pairs someone declined to choose between
 *   vibes:match:*  string      a served matchup, consumed by the vote
 *
 * The vote log is the source of truth; vibes:pairs is a summary of it (all a
 * Bradley–Terry fit needs) and is rebuilt from the log if they ever disagree.
 */
import { createHash, randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { fitBradleyTerry, type BradleyTerryFit, type Comparison } from './bradley-terry';

const PAIRS = 'vibes:pairs';
const VOTES = 'vibes:votes';
const SKIPS = 'vibes:skips';
const MATCH_PREFIX = 'vibes:match:';

/**
 * Prior spread of vibe strengths, in logits. 1 means a typical vibe beats
 * another typical one somewhere between 27% and 73% of the time before any
 * votes. It sets how wide the ranges start (±348 on the Elo-style scale).
 */
const PRIOR_SD = 1;
/** Displayed ratings use the familiar Elo scale: 1500 average, 400 points ≈ 10:1 odds. */
const ELO_SCALE = 400 / Math.LN10;
const BASE_RATING = 1500;
const MATCH_TTL_SECONDS = 60 * 60;
/** Sample from this many of the most informative pairs, so concurrent visitors don't all see the same one. */
const CANDIDATE_PAIRS = 30;

/** The one question every matchup asks. */
export const PROMPT = 'which is more ideal?';

let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

function client(): Redis | null {
	if (redis) return redis;
	if (!env.KV_REST_API_URL || !env.KV_REST_API_TOKEN) return null;
	redis = new Redis({
		url: env.KV_REST_API_URL,
		token: env.KV_REST_API_TOKEN,
		// filenames like "2024.webp" must stay strings
		automaticDeserialization: false
	});
	ratelimit = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(60, '1 m'),
		prefix: 'vibes:ratelimit'
	});
	return redis;
}

/** Votes are logged against a truncated hash, never the raw address. */
const hashIp = (ip: string) => createHash('sha256').update(ip).digest('hex').slice(0, 16);

/** Filename → [width, height] for every image in the gallery. */
export async function imageMetadata(fetch: typeof globalThis.fetch) {
	const response = await fetch('/vibes/images.json');
	return (await response.json()) as Record<string, [number, number]>;
}

export const vibeSrc = (name: string) => `/vibes/${encodeURIComponent(name)}`;

export function isEnabled(): boolean {
	return client() !== null;
}

export interface VibeRating {
	name: string;
	/** Elo-scale rating (1500 = average). */
	rating: number;
	/** Elo-scale standard deviation; the 95% range is rating ± 2·rd. */
	rd: number;
	games: number;
}

export interface VibeState {
	ratings: VibeRating[];
	totalVotes: number;
	/** Logit-scale strength of ratings[i]. */
	theta: Float64Array;
	/** Posterior variance of θᵢ − θⱼ (logit scale), for ratings indices i and j. */
	differenceVariance: (i: number, j: number) => number;
}

export interface Matchup {
	id: string;
	a: string;
	b: string;
}

/**
 * How much a comparison should teach us: p(1−p)·Var(θᵢ − θⱼ). High when the
 * outcome is a coin flip and when we're unsure how the two compare. It's the
 * expected shrinkage in that variance from one more vote.
 */
function informationScore(state: VibeState, i: number, j: number): number {
	const variance = state.differenceVariance(i, j);
	// Averaging the win probability over our uncertainty pulls it toward ½.
	const d = (state.theta[i] - state.theta[j]) / Math.sqrt(1 + (Math.PI * variance) / 8);
	const p = 1 / (1 + Math.exp(-d));
	return p * (1 - p) * variance;
}

/** With automaticDeserialization off, Upstash returns HGETALL as a flat [key, value, …] array. */
function entries(flat: string[] | null): [string, number][] {
	const out: [string, number][] = [];
	for (let k = 0; flat && k < flat.length; k += 2) out.push([flat[k], Number(flat[k + 1])]);
	return out;
}

/** Recount vibes:pairs from the vote log. Used on first run and if the two ever drift apart. */
async function rebuildPairs(r: Redis): Promise<[string, number][]> {
	const counts = new Map<string, number>();
	let start = '-';
	for (;;) {
		const page = await r.xrange(VOTES, start, '+', 1000);
		const rows = Array.isArray(page)
			? (page as unknown as [string, string[]][])
			: Object.entries(page as Record<string, Record<string, string>>).map(
					([id, fields]) => [id, Object.entries(fields).flat()] as [string, string[]]
				);
		if (rows.length === 0) break;
		for (const [, fields] of rows) {
			const field = (name: string) => {
				for (let k = 0; k < fields.length; k += 2) if (fields[k] === name) return fields[k + 1];
			};
			const key = `${field('winner')}\n${field('loser')}`;
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		if (rows.length < 1000) break;
		start = `(${rows[rows.length - 1][0]}`;
	}
	const tx = r.multi().del(PAIRS);
	if (counts.size > 0) tx.hset(PAIRS, Object.fromEntries(counts));
	await tx.exec();
	return [...counts];
}

/** The last fit, reused while nothing has changed and as a warm start when something has. */
let cache: { key: string; names: string[]; fit: BradleyTerryFit } | null = null;

/** Current ratings for every image in the gallery, from a Bradley–Terry fit over all votes. */
export async function getRatings(names: string[]): Promise<VibeState> {
	const r = client();
	if (!r) throw new Error('vibes-elo: Redis not configured');

	const [flatPairs, rawTotal] = await r.pipeline().hgetall(PAIRS).xlen(VOTES).exec<[string[] | null, number]>();
	const totalVotes = Number(rawTotal);
	let pairCounts = entries(flatPairs);
	if (pairCounts.reduce((sum, [, c]) => sum + c, 0) !== totalVotes) pairCounts = await rebuildPairs(r);

	// Fit over every vibe that has ever played (retired ones still inform the rest), then report the gallery.
	const index = new Map<string, number>();
	const all: string[] = [];
	const indexOf = (name: string) => {
		let k = index.get(name);
		if (k === undefined) {
			k = all.length;
			index.set(name, k);
			all.push(name);
		}
		return k;
	};
	for (const name of names) indexOf(name);
	const games = new Map<string, number>();
	const comparisons: Comparison[] = pairCounts.map(([key, count]) => {
		const [winner, loser] = key.split('\n');
		games.set(winner, (games.get(winner) ?? 0) + count);
		games.set(loser, (games.get(loser) ?? 0) + count);
		return { winner: indexOf(winner), loser: indexOf(loser), count };
	});

	const key = `${totalVotes}|${all.join('\n')}`;
	let fit: BradleyTerryFit;
	if (cache?.key === key) {
		fit = cache.fit;
	} else {
		const previous = cache ? new Map(cache.names.map((name, k) => [name, cache!.fit.theta[k]])) : null;
		const init = previous ? Float64Array.from(all, (name) => previous.get(name) ?? 0) : undefined;
		fit = fitBradleyTerry(all.length, comparisons, { priorSd: PRIOR_SD, init });
		cache = { key, names: all, fit };
	}

	const n = all.length;
	const ratings = names.map((name, k) => ({
		name,
		rating: BASE_RATING + ELO_SCALE * fit.theta[k],
		rd: ELO_SCALE * Math.sqrt(fit.cov[k * n + k]),
		games: games.get(name) ?? 0
	}));

	return {
		ratings,
		totalVotes,
		theta: fit.theta.subarray(0, names.length),
		differenceVariance: (i, j) => fit.cov[i * n + i] + fit.cov[j * n + j] - 2 * fit.cov[i * n + j]
	};
}

/** Pick one of the most informative pairs at random, weighted by information, and remember it. */
export async function createMatchup(state: VibeState): Promise<Matchup> {
	const { ratings } = state;
	const r = client();
	if (!r) throw new Error('vibes-elo: Redis not configured');
	if (ratings.length < 2) throw new Error('vibes-elo: need at least two images');

	const pairs: { i: number; j: number; score: number }[] = [];
	for (let i = 0; i < ratings.length; i++) {
		for (let j = i + 1; j < ratings.length; j++) {
			pairs.push({ i, j, score: informationScore(state, i, j) });
		}
	}
	// Shuffle before sorting so ties (e.g. everything unrated) break randomly.
	for (let k = pairs.length - 1; k > 0; k--) {
		const m = Math.floor(Math.random() * (k + 1));
		[pairs[k], pairs[m]] = [pairs[m], pairs[k]];
	}
	pairs.sort((x, y) => y.score - x.score);
	const candidates = pairs.slice(0, CANDIDATE_PAIRS);

	const total = candidates.reduce((sum, p) => sum + p.score, 0);
	let pick = Math.random() * total;
	let chosen = candidates[0];
	for (const p of candidates) {
		pick -= p.score;
		if (pick <= 0) {
			chosen = p;
			break;
		}
	}

	// Randomise left/right so position doesn't bias the vote.
	const [left, right] = Math.random() < 0.5 ? [chosen.i, chosen.j] : [chosen.j, chosen.i];
	const matchup: Matchup = {
		id: randomUUID(),
		a: ratings[left].name,
		b: ratings[right].name
	};

	await r.set(MATCH_PREFIX + matchup.id, [matchup.a, matchup.b].join('\n'), {
		ex: MATCH_TTL_SECONDS
	});
	return matchup;
}

/**
 * Consume a matchup and record the result, atomically. Each matchup can only
 * be voted on once, and only for one of its two images.
 */
const VOTE_SCRIPT = `
local m = redis.call('GETDEL', KEYS[1])
if not m then return 'gone' end
local a, b = string.match(m, '^([^\\n]*)\\n(.*)$')
local w = ARGV[1]
local l
if w == a then l = b elseif w == b then l = a else return 'invalid' end

redis.call('HINCRBY', KEYS[2], w .. '\\n' .. l, 1)
redis.call('XADD', KEYS[3], '*', 'winner', w, 'loser', l, 'ts', ARGV[2], 'ip', ARGV[3])
return 'ok'
`;

export type VoteResult = 'ok' | 'gone' | 'invalid' | 'ratelimited';

export async function vote(matchId: string, winner: string, ip: string): Promise<VoteResult> {
	const r = client();
	if (!r || !ratelimit) throw new Error('vibes-elo: Redis not configured');

	const ipHash = hashIp(ip);
	const { success } = await ratelimit.limit(ipHash);
	if (!success) return 'ratelimited';

	return await r.eval<string[], VoteResult>(
		VOTE_SCRIPT,
		[MATCH_PREFIX + matchId, PAIRS, VOTES],
		[winner, String(Date.now()), ipHash]
	);
}

/**
 * Drop a matchup without rating it. Skips are logged (a pair people won't
 * choose between is its own kind of signal) but don't touch ratings.
 */
export async function skip(matchId: string, ip: string): Promise<'ok' | 'gone' | 'ratelimited'> {
	const r = client();
	if (!r || !ratelimit) throw new Error('vibes-elo: Redis not configured');

	const ipHash = hashIp(ip);
	const { success } = await ratelimit.limit(ipHash);
	if (!success) return 'ratelimited';

	const match = await r.getdel<string>(MATCH_PREFIX + matchId);
	if (!match) return 'gone';
	const [a, b] = match.split('\n');
	await r.xadd(SKIPS, '*', { a, b, ts: String(Date.now()), ip: ipHash });
	return 'ok';
}

/** Rank by a conservative estimate (rating − 2·rd) so one lucky early win doesn't top the board. */
export function leaderboard(ratings: VibeRating[], limit = 15): VibeRating[] {
	return ratings
		.filter((v) => v.games > 0)
		.sort((x, y) => y.rating - 2 * y.rd - (x.rating - 2 * x.rd))
		.slice(0, limit);
}

export const PROVISIONAL_RD = 150;
