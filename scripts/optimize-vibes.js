// Converts static/vibes PNG/JPG/GIF to WebP (max 1200px) and deletes the originals.
//
//   node scripts/optimize-vibes.js            always optimizes (this is `npm run vibes`)
//   node scripts/optimize-vibes.js --if-ci    only on Vercel/CI; locally it just reports
//
// `npm run build` uses --if-ci, so a local build never deletes or rewrites files in
// your working tree, while a deploy still ships optimized images if someone pushed a PNG.
import { existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname, parse } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vibesDir = join(__dirname, '..', 'static', 'vibes');

const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 80;

const files = readdirSync(vibesDir).filter((f) =>
	/\.(png|jpg|jpeg|gif)$/i.test(f)
);

const onCI = Boolean(process.env.VERCEL || process.env.CI);
if (process.argv.includes('--if-ci') && !onCI) {
	if (files.length > 0) {
		console.log(
			`${files.length} image(s) in static/vibes aren't WebP yet (${files.slice(0, 3).join(', ')}${files.length > 3 ? ', …' : ''}).\n` +
				'Leaving them alone in a local build. Run `npm run vibes` to convert them.'
		);
	}
	process.exit(0);
}

if (files.length === 0) {
	console.log('No images to convert (all already WebP)');
} else {
	console.log(`Optimizing ${files.length} images...`);
}

let totalOriginal = 0;
let totalOptimized = 0;

for (const filename of files) {
	const inputPath = join(vibesDir, filename);
	const { name } = parse(filename);
	const outputPath = join(vibesDir, `${name}.webp`);

	// foo.png next to an existing foo.webp: converting would silently replace the
	// webp, so leave both and let a human pick.
	if (existsSync(outputPath)) {
		console.warn(`  ${filename} skipped: ${name}.webp already exists (rename one of them)`);
		continue;
	}

	const image = sharp(inputPath);
	const metadata = await image.metadata();

	const needsResize =
		(metadata.width && metadata.width > MAX_DIMENSION) ||
		(metadata.height && metadata.height > MAX_DIMENSION);

	let pipeline = image;
	if (needsResize) {
		pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
			fit: 'inside',
			withoutEnlargement: true
		});
	}

	const result = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();

	const originalSize = statSync(inputPath).size;
	totalOriginal += originalSize;
	totalOptimized += result.length;

	await sharp(result).toFile(outputPath);
	unlinkSync(inputPath);

	const savings = ((1 - result.length / originalSize) * 100).toFixed(0);
	console.log(
		`  ${filename} → ${name}.webp (${formatSize(originalSize)} → ${formatSize(result.length)}, -${savings}%)`
	);
}

// Also optimize existing webp files that are oversized
const webpFiles = readdirSync(vibesDir).filter((f) => /\.webp$/i.test(f));

for (const filename of webpFiles) {
	const filePath = join(vibesDir, filename);
	const metadata = await sharp(filePath).metadata();

	if (
		(metadata.width && metadata.width > MAX_DIMENSION) ||
		(metadata.height && metadata.height > MAX_DIMENSION)
	) {
		const originalSize = statSync(filePath).size;
		const result = await sharp(filePath)
			.resize(MAX_DIMENSION, MAX_DIMENSION, {
				fit: 'inside',
				withoutEnlargement: true
			})
			.webp({ quality: WEBP_QUALITY })
			.toBuffer();

		if (result.length < originalSize) {
			await sharp(result).toFile(filePath);
			totalOriginal += originalSize;
			totalOptimized += result.length;

			const savings = ((1 - result.length / originalSize) * 100).toFixed(0);
			console.log(
				`  ${filename} resized (${formatSize(originalSize)} → ${formatSize(result.length)}, -${savings}%)`
			);
		}
	}
}

if (totalOriginal > 0) {
	console.log(
		`\nTotal: ${formatSize(totalOriginal)} → ${formatSize(totalOptimized)} (${((1 - totalOptimized / totalOriginal) * 100).toFixed(0)}% smaller)`
	);
}

function formatSize(bytes) {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
