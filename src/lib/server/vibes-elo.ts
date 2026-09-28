/**
 * Vibe vs vibe: pairwise ratings for the vibes gallery.
 *
 * Ratings use Glicko-1 (Elo plus a per-image uncertainty, `rd`) so we can
 * choose matchups by how much we expect to learn from them. Everything lives
 * in Upstash Redis:
 *
 *   vibes:rating   sorted set  filename → rating (default 1500)
 *   vibes:rd       hash        filename → rating deviation (default 350)
 *   vibes:games    hash        filename → matches played
 *   vibes:votes    stream      append-only log {winner, loser, ts, ip}
 *   vibes:skips    stream      pairs someone declined to choose between
 *   vibes:match:*  string      a served matchup, consumed by the vote
 *
 * The vote log is the source of truth: ratings can be recomputed from it with
 * different parameters whenever we like.
 */
import { createHash, randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const RATING = 'vibes:rating';
const RD = 'vibes:rd';
const GAMES = 'vibes:games';
const VOTES = 'vibes:votes';
const SKIPS = 'vibes:skips';
const MATCH_PREFIX = 'vibes:match:';

const DEFAULT_RATING = 1500;
const DEFAULT_RD = 350;
/** Floor on uncertainty, so ratings keep drifting with the collective's taste. */
const MIN_RD = 50;
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

export function isEnabled(): boolean {
	return client() !== null;
}

export interface VibeRating {
	name: string;
	rating: number;
	rd: number;
	games: number;
}

export interface Matchup {
	id: string;
	a: string;
	b: string;
}

// Glicko-1 constants and helpers (mirrored in the Lua script below).
const Q = Math.LN10 / 400;
const g = (rd: number) => 1 / Math.sqrt(1 + (3 * Q * Q * rd * rd) / (Math.PI * Math.PI));

/** Probability that `i` beats `j`, accounting for both images' uncertainty. */
function expected(i: VibeRating, j: VibeRating): number {
	const combined = Math.sqrt(i.rd * i.rd + j.rd * j.rd);
	return 1 / (1 + 10 ** ((-g(combined) * (i.rating - j.rating)) / 400));
}

/**
 * How much a comparison should teach us: high when the outcome is a coin flip
 * (p(1-p) peaks at 0.5) and when we're unsure about either rating (rd² large).
 * This is proportional to the expected shrinkage in rating variance.
 */
function informationScore(i: VibeRating, j: VibeRating): number {
	const p = expected(i, j);
	return p * (1 - p) * (i.rd * i.rd + j.rd * j.rd);
}

/** Current ratings for every image in the gallery (unrated images get defaults). */
export async function getRatings(names: string[]): Promise<{ ratings: VibeRating[]; totalVotes: number }> {
	const r = client();
	if (!r) throw new Error('vibes-elo: Redis not configured');

	const [flat, rds, games, totalVotes] = await r
		.pipeline()
		.zrange(RATING, 0, -1, { withScores: true })
		.hgetall(RD)
		.hgetall(GAMES)
		.xlen(VOTES)
		.exec<[string[], Record<string, string> | null, Record<string, string> | null, number]>();

	const ratingByName = new Map<string, number>();
	for (let k = 0; k < flat.length; k += 2) ratingByName.set(flat[k], Number(flat[k + 1]));

	const ratings = names.map((name) => ({
		name,
		rating: ratingByName.get(name) ?? DEFAULT_RATING,
		rd: rds?.[name] ? Number(rds[name]) : DEFAULT_RD,
		games: games?.[name] ? Number(games[name]) : 0
	}));

	return { ratings, totalVotes: Number(totalVotes) };
}

/** Pick one of the most informative pairs at random, weighted by information, and remember it. */
export async function createMatchup(ratings: VibeRating[]): Promise<Matchup> {
	const r = client();
	if (!r) throw new Error('vibes-elo: Redis not configured');
	if (ratings.length < 2) throw new Error('vibes-elo: need at least two images');

	const pairs: { i: number; j: number; score: number }[] = [];
	for (let i = 0; i < ratings.length; i++) {
		for (let j = i + 1; j < ratings.length; j++) {
			pairs.push({ i, j, score: informationScore(ratings[i], ratings[j]) });
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
 * Consume a matchup and apply a Glicko-1 update to both images, atomically.
 * Each matchup can only be voted on once, and only for one of its two images.
 */
const VOTE_SCRIPT = `
local m = redis.call('GETDEL', KEYS[1])
if not m then return {'gone'} end
local a, b = string.match(m, '^([^\\n]*)\\n(.*)$')
local w = ARGV[1]
local l
if w == a then l = b elseif w == b then l = a else return {'invalid'} end

local defaultRating, defaultRd, minRd = tonumber(ARGV[4]), tonumber(ARGV[5]), tonumber(ARGV[6])
local rw = tonumber(redis.call('ZSCORE', KEYS[2], w)) or defaultRating
local rl = tonumber(redis.call('ZSCORE', KEYS[2], l)) or defaultRating
local dw = tonumber(redis.call('HGET', KEYS[3], w)) or defaultRd
local dl = tonumber(redis.call('HGET', KEYS[3], l)) or defaultRd

local Q = math.log(10) / 400
local function g(rd) return 1 / math.sqrt(1 + 3 * Q * Q * rd * rd / (math.pi * math.pi)) end
local function update(r, rd, ro, rdo, s)
  local gg = g(rdo)
  local e = 1 / (1 + 10 ^ (-gg * (r - ro) / 400))
  local d2 = 1 / (Q * Q * gg * gg * e * (1 - e))
  local inv = 1 / (rd * rd) + 1 / d2
  return r + Q / inv * gg * (s - e), math.max(math.sqrt(1 / inv), minRd), e
end

local nrw, ndw, ew = update(rw, dw, rl, dl, 1)
local nrl, ndl = update(rl, dl, rw, dw, 0)

redis.call('ZADD', KEYS[2], tostring(nrw), w, tostring(nrl), l)
redis.call('HSET', KEYS[3], w, tostring(ndw), l, tostring(ndl))
redis.call('HINCRBY', KEYS[4], w, 1)
redis.call('HINCRBY', KEYS[4], l, 1)
redis.call('XADD', KEYS[5], '*', 'winner', w, 'loser', l, 'ts', ARGV[2], 'ip', ARGV[3])

-- Lua numbers would be truncated to integers on return, so send strings.
return {'ok', w, l, tostring(rw), tostring(nrw), tostring(rl), tostring(nrl), tostring(ew)}
`;

export type VoteResult =
	| { status: 'ok'; winner: string; loser: string; winnerDelta: number; loserDelta: number; expected: number }
	| { status: 'gone' | 'invalid' | 'ratelimited' };

export async function vote(matchId: string, winner: string, ip: string): Promise<VoteResult> {
	const r = client();
	if (!r || !ratelimit) throw new Error('vibes-elo: Redis not configured');

	const ipHash = hashIp(ip);
	const { success } = await ratelimit.limit(ipHash);
	if (!success) return { status: 'ratelimited' };

	const res = await r.eval<string[], string[]>(
		VOTE_SCRIPT,
		[MATCH_PREFIX + matchId, RATING, RD, GAMES, VOTES],
		[winner, String(Date.now()), ipHash, String(DEFAULT_RATING), String(DEFAULT_RD), String(MIN_RD)]
	);

	if (res[0] !== 'ok') return { status: res[0] as 'gone' | 'invalid' };
	const [, w, l, rw, nrw, rl, nrl, ew] = res;
	return {
		status: 'ok',
		winner: w,
		loser: l,
		winnerDelta: Number(nrw) - Number(rw),
		loserDelta: Number(nrl) - Number(rl),
		expected: Number(ew)
	};
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
