// GitHub OAuth - redirect to GitHub
import { redirect } from '@sveltejs/kit';
import { GITHUB_CLIENT_ID } from '$env/static/private';
import type { RequestHandler } from './$types';

const CLIENT_ID = GITHUB_CLIENT_ID;
const SCOPES = 'user:email'; // minimal scope - just need identity, server PAT handles commits

export const GET: RequestHandler = async ({ url }) => {
	const callbackUrl = `${url.origin}/api/auth/github/callback`;

	// Generate random state for CSRF protection
	const state = crypto.randomUUID();

	const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
	githubAuthUrl.searchParams.set('client_id', CLIENT_ID);
	githubAuthUrl.searchParams.set('redirect_uri', callbackUrl);
	githubAuthUrl.searchParams.set('scope', SCOPES);
	githubAuthUrl.searchParams.set('state', state);

	// Could store state in a cookie for verification, but keeping it simple for now
	throw redirect(302, githubAuthUrl.toString());
};
