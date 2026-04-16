import { readdirSync, unlinkSync } from 'fs';
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
const BACKGROUND_FINE_GRAINEDNESS = 1.0; // adjust this value to change the fine/coarse grainedness

if (files.length === 0) {
	console.log('No images to optimize (all already WebP)');
	process.exit(0);
}

console.log(`Optimizing ${files.length} images...`);

let totalOriginal = 0;
let totalOptimized = 0;

for (const filename of files) {
	const inputPath = join(vibesDir, filename);
	const { name } = parse(filename);
	const outputPath = join(vibesDir, `${name}.webp`);

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

	const originalSize = (await import('fs')).statSync(inputPath).size;
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
const webpFiles = readdirSync(vibesDir).filter(
	(f) => /\.webp$/i.test(f) && f !== 'images.json'
);

for (const filename of webpFiles) {
	const filePath = join(vibesDir, filename);
	const metadata = await sharp(filePath).metadata();

	if (
		(metadata.width && metadata.width > MAX_DIMENSION) ||
		(metadata.height && metadata.height > MAX_DIMENSION)
	) {
		const originalSize = (await import('fs')).statSync(filePath).size;
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

console.log(
	`\nTotal: ${formatSize(totalOriginal)} → ${formatSize(totalOptimized)} (${((1 - totalOptimized / totalOriginal) * 100).toFixed(0)}% smaller)`
);

function formatSize(bytes) {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
