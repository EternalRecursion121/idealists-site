/**
 * Vibe vs vibe: pairwise ratings for the vibes gallery.
 *
 * Ratings come from a Bayesian Bradley–Terry fit over every vote (see
 * bradley-terry.ts), refitted every REFIT_EVERY votes and on demand via
 * POST /api/vibes/refit. Matchups are random, nudged toward vibes we know
 * least about. Everything lives in Upstash Redis:
 *
 *   vibes:pairs    hash        "winner\nloser" → times that ordered pair happened
 *   vibes:fit      string      JSON of the latest fit (see StoredFit)
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
import { fitBradleyTerry, type Comparison } from './bradley-terry';

const PAIRS = 'vibes:pairs';
const VOTES = 'vibes:votes';
const SKIPS = 'vibes:skips';
const FIT = 'vibes:fit';
const FIT_LOCK = 'vibes:fit:lock';
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
/** Refit after every this many votes (and whenever a read finds the stored fit this far behind). */
const REFIT_EVERY = 10;
/** How many of their most recent vibes a visitor won't be shown again. */
export const RECENT_LIMIT = 10;
/** A vibe we know little about is at most this many times likelier to be picked than a typical one. */
const MAX_UNCERTAINTY_BOOST = 2;

/** The one question every matchup asks. */
export const PROMPT = 'which is more ideal?';

let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;
let skipRatelimit: Ratelimit | null = null;

function client(): Redis | null {
	if (redis) return redis;
	if (!env.KV_REST_API_URL || !env.KV_REST_API_TOKEN) return null;
	redis = new Redis({
		url: env.KV_REST_API_URL,
		token: env.KV_REST_API_TOKEN,
		// filenames like "2024.webp" must stay strings
		automaticDeserialization: false
	});
	// Generous: faster than anyone votes by hand, so it only catches scripts.
	ratelimit = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(300, '1 m'),
		prefix: 'vibes:ratelimit'
	});
	// Skips get their own allowance so they never eat into voting.
	skipRatelimit = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(300, '1 m'),
		prefix: 'vibes:ratelimit:skip'
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
}

export interface Matchup {
	id: string;
	a: string;
	b: string;
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

/** What vibes:fit holds: the posterior for every vibe that has played, in logits. */
interface StoredFit {
	votes: number;
	fittedAt: string;
	names: string[];
	theta: number[];
	sd: number[];
	games: number[];
}

export interface RefitResult {
	status: 'fitted' | 'busy';
	votes: number;
	vibes: number;
	iterations?: number;
	ms?: number;
}

/**
 * Fit Bradley–Terry to every vote and store the result. Only vibes that have
 * played are fitted: an unplayed vibe's posterior is just the prior. The
 * previous fit is the warm start. A short lock keeps concurrent refits from
 * racing; the loser reports 'busy'.
 */
export async function refit(): Promise<RefitResult> {
	const r = client();
	if (!r) throw new Error('vibes-elo: Redis not configured');

	if ((await r.set(FIT_LOCK, '1', { nx: true, ex: 30 })) === null) {
		return { status: 'busy', votes: Number(await r.xlen(VOTES)), vibes: 0 };
	}
	try {
		const started = performance.now();
		const [flatPairs, rawTotal, rawPrevious] = await r
			.pipeline()
			.hgetall(PAIRS)
			.xlen(VOTES)
			.get(FIT)
			.exec<[string[] | null, number, string | null]>();
		const votes = Number(rawTotal);
		let pairCounts = entries(flatPairs);
		if (pairCounts.reduce((sum, [, c]) => sum + c, 0) !== votes) pairCounts = await rebuildPairs(r);

		const index = new Map<string, number>();
		const names: string[] = [];
		const games: number[] = [];
		const indexOf = (name: string) => {
			let k = index.get(name);
			if (k === undefined) {
				k = names.length;
				index.set(name, k);
				names.push(name);
				games.push(0);
			}
			return k;
		};
		const comparisons: Comparison[] = pairCounts.map(([key, count]) => {
			const [winner, loser] = key.split('\n');
			const w = indexOf(winner);
			const l = indexOf(loser);
			games[w] += count;
			games[l] += count;
			return { winner: w, loser: l, count };
		});

		const previous: StoredFit | null = rawPrevious ? JSON.parse(rawPrevious) : null;
		const prior = new Map(previous?.names.map((name, k) => [name, previous.theta[k]]));
		const init = Float64Array.from(names, (name) => prior.get(name) ?? 0);
		const fit = fitBradleyTerry(names.length, comparisons, { priorSd: PRIOR_SD, init });

		const n = names.length;
		const round = (x: number) => Math.round(x * 1e6) / 1e6;
		const stored: StoredFit = {
			votes,
			fittedAt: new Date().toISOString(),
			names,
			theta: Array.from(fit.theta, round),
			sd: names.map((_, k) => round(Math.sqrt(fit.cov[k * n + k]))),
			games
		};
		await r.set(FIT, JSON.stringify(stored));
		return { status: 'fitted', votes, vibes: n, iterations: fit.iterations, ms: Math.round(performance.now() - started) };
	} finally {
		await r.del(FIT_LOCK);
	}
}

/** Current ratings for every image in the gallery, from the stored Bradley–Terry fit. */
export async function getRatings(names: string[]): Promise<VibeState> {
	const r = client();
	if (!r) throw new Error('vibes-elo: Redis not configured');

	const [rawFit, rawTotal] = await r.pipeline().get(FIT).xlen(VOTES).exec<[string | null, number]>();
	const totalVotes = Number(rawTotal);
	let stored: StoredFit | null = rawFit ? JSON.parse(rawFit) : null;

	// Self-heal if a refit was missed (or there has never been one).
	if (totalVotes > 0 && (!stored || totalVotes - stored.votes >= REFIT_EVERY)) {
		if ((await refit()).status === 'fitted') {
			const fresh = await r.get<string>(FIT);
			stored = fresh ? JSON.parse(fresh) : stored;
		}
	}

	const byName = new Map(stored?.names.map((name, k) => [name, k]));
	const ratings = names.map((name) => {
		const k = byName.get(name);
		const t = k === undefined ? 0 : stored!.theta[k];
		const sd = k === undefined ? PRIOR_SD : stored!.sd[k];
		return {
			name,
			rating: BASE_RATING + ELO_SCALE * t,
			rd: ELO_SCALE * sd,
			games: k === undefined ? 0 : stored!.games[k]
		};
	});

	return { ratings, totalVotes };
}

/**
 * Pick a matchup and remember it. Simulations showed choosing the "most
 * informative" pair ranks no better than random pairing here, and it let a
 * brand-new vibe appear in every matchup until one visitor had decided its
 * rating. So: pick one vibe, nudged toward those we know least about (capped
 * at MAX_UNCERTAINTY_BOOST× a typical vibe), pair it with a uniformly random
 * other, and skip anything this visitor saw in their last RECENT_LIMIT vibes.
 */
export async function createMatchup(state: VibeState, recent: string[] = []): Promise<Matchup> {
	const r = client();
	if (!r) throw new Error('vibes-elo: Redis not configured');
	if (state.ratings.length < 2) throw new Error('vibes-elo: need at least two images');

	const seen = new Set(recent);
	const fresh = state.ratings.filter((v) => !seen.has(v.name));
	const pool = fresh.length >= 2 ? fresh : state.ratings;

	const variances = pool.map((v) => (v.rd / ELO_SCALE) ** 2);
	const typical = [...variances].sort((x, y) => x - y)[Math.floor(variances.length / 2)];
	const weights = variances.map((v) => Math.min(v, MAX_UNCERTAINTY_BOOST * typical));
	let pick = Math.random() * weights.reduce((sum, w) => sum + w, 0);
	let first = pool.length - 1;
	for (let k = 0; k < pool.length; k++) {
		pick -= weights[k];
		if (pick <= 0) {
			first = k;
			break;
		}
	}
	let second = Math.floor(Math.random() * (pool.length - 1));
	if (second >= first) second++;

	// Randomise left/right so position doesn't bias the vote.
	const [left, right] = Math.random() < 0.5 ? [first, second] : [second, first];
	const matchup: Matchup = {
		id: randomUUID(),
		a: pool[left].name,
		b: pool[right].name
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
return {'ok', tostring(redis.call('XLEN', KEYS[3]))}
`;

export type VoteResult = 'ok' | 'gone' | 'invalid' | 'ratelimited';

export async function vote(matchId: string, winner: string, ip: string): Promise<VoteResult> {
	const r = client();
	if (!r || !ratelimit) throw new Error('vibes-elo: Redis not configured');

	const ipHash = hashIp(ip);
	const { success } = await ratelimit.limit(ipHash);
	if (!success) return 'ratelimited';

	const result = await r.eval<string[], string | string[]>(
		VOTE_SCRIPT,
		[MATCH_PREFIX + matchId, PAIRS, VOTES],
		[winner, String(Date.now()), ipHash]
	);
	if (!Array.isArray(result)) return result as 'gone' | 'invalid';

	// Every REFIT_EVERY-th vote refreshes the fit (a missed one is caught on the next read).
	if (Number(result[1]) % REFIT_EVERY === 0) {
		try {
			await refit();
		} catch (err) {
			console.error('vibes-elo: refit after vote failed', err);
		}
	}
	return 'ok';
}

/**
 * Drop a matchup without rating it. Skips are logged (a pair people won't
 * choose between is its own kind of signal) but don't touch ratings.
 */
export async function skip(matchId: string, ip: string): Promise<'ok' | 'gone' | 'ratelimited'> {
	const r = client();
	if (!r || !skipRatelimit) throw new Error('vibes-elo: Redis not configured');

	const ipHash = hashIp(ip);
	const { success } = await skipRatelimit.limit(ipHash);
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
