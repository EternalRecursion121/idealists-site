import type { PageServerLoad } from './$types';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import sizeOf from 'image-size';

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({
		'cache-control': 'public, max-age=60, stale-while-revalidate=3600'
	});

	const vibesDir = join(process.cwd(), 'static', 'vibes');
	const files = readdirSync(vibesDir).filter((f) =>
		/\.(png|jpg|jpeg|webp|gif)$/i.test(f)
	);

	const images = files.map((filename) => {
		const filePath = join(vibesDir, filename);
		const buffer = readFileSync(filePath);
		const dimensions = sizeOf(buffer);

		return {
			src: `/vibes/${encodeURIComponent(filename)}`,
			width: dimensions.width ?? 800,
			height: dimensions.height ?? 600
		};
	});

	return { images };
};
