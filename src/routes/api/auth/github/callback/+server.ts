// GitHub OAuth callback - exchange code for token
import { redirect } from '@sveltejs/kit';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';
import type { RequestHandler } from './$types';

const CLIENT_ID = GITHUB_CLIENT_ID;
const CLIENT_SECRET = GITHUB_CLIENT_SECRET;

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');

	if (error) {
		// User denied access or error occurred
		throw redirect(302, '/?auth_error=' + encodeURIComponent(error));
	}

	if (!code) {
		throw redirect(302, '/?auth_error=no_code');
	}

	try {
		// Exchange code for access token
		const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
				code
			})
		});

		const tokenData = await tokenRes.json();

		if (tokenData.error) {
			throw redirect(302, '/?auth_error=' + encodeURIComponent(tokenData.error_description || tokenData.error));
		}

		const accessToken = tokenData.access_token;

		// Get user info
		const userRes = await fetch('https://api.github.com/user', {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Accept': 'application/vnd.github.v3+json'
			}
		});

		if (!userRes.ok) {
			throw redirect(302, '/?auth_error=user_fetch_failed');
		}

		const user = await userRes.json();

		// Create session data
		const session = {
			accessToken,
			user: {
				id: user.id,
				login: user.login,
				name: user.name,
				avatar_url: user.avatar_url
			}
		};

		// Return an HTML page that stores the session in localStorage and redirects
		const html = `
<!DOCTYPE html>
<html>
<head>
	<title>Logging in...</title>
</head>
<body>
	<p>Logging you in...</p>
	<script>
		const session = ${JSON.stringify(session)};
		localStorage.setItem('idealists-github-session', JSON.stringify(session));
		// Redirect back to previous page or home
		const returnTo = sessionStorage.getItem('auth-return-to') || '/';
		sessionStorage.removeItem('auth-return-to');
		window.location.href = returnTo;
	</script>
</body>
</html>
		`;

		return new Response(html, {
			headers: { 'Content-Type': 'text/html' }
		});

	} catch (e) {
		console.error('GitHub OAuth error:', e);
		throw redirect(302, '/?auth_error=oauth_failed');
	}
};
