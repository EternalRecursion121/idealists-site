import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	setHeaders({
		'cache-control': 'public, max-age=60, stale-while-revalidate=3600'
	});

	const response = await fetch('/vibes/images.json');
	const imageMetadata: Record<string, [number, number]> = await response.json();

	const images = Object.entries(imageMetadata).map(([filename, [width, height]]) => ({
		src: `/vibes/${encodeURIComponent(filename)}`,
		width,
		height
	}));

	return { images };
};
