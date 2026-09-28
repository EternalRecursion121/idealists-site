// Gives every PNG/JPG under static/writings a WebP sibling (max 1200px) and writes
// src/lib/writings/images.json, which the writing page uses to serve the WebP in
// place of the original and to set width/height on the <img>.
//
//   node scripts/optimize-writings.js            always (this is `npm run writing-images`)
//   node scripts/optimize-writings.js --if-ci    only on Vercel/CI; locally it just reports
//
// Unlike the vibes optimizer this one KEEPS the originals and never touches
// content.md. Both on purpose: a writing's git history is its revision timeline, so
// editing the markdown would add a "revision" that changed nothing a reader can see,
// and older revisions still point at the original filenames.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname, parse, relative, sep } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir = join(__dirname, '..', 'static');
const writingsDir = join(staticDir, 'writings');
const manifestPath = join(__dirname, '..', 'src', 'lib', 'writings', 'images.json');

const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 80;

const originals = readdirSync(writingsDir, { recursive: true })
	.map(String)
	.filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
	.sort();

const toUrl = (file) => '/' + relative(staticDir, file).split(sep).join('/');
const webpFor = (file) => join(dirname(file), `${parse(file).name}.webp`);

const known = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const missing = originals.filter((f) => !(toUrl(join(writingsDir, f)) in known));

const onCI = Boolean(process.env.VERCEL || process.env.CI);
if (process.argv.includes('--if-ci') && !onCI) {
	if (missing.length > 0) {
		console.log(
			`${missing.length} writing image(s) aren't in images.json yet (${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ', …' : ''}).\n` +
				'They will be served as they are. Run `npm run writing-images` to optimize them.'
		);
	}
	process.exit(0);
}

const manifest = {};

for (const relPath of originals) {
	const inputPath = join(writingsDir, relPath);
	const outputPath = webpFor(inputPath);
	const originalSize = statSync(inputPath).size;

	if (!existsSync(outputPath)) {
		const result = await sharp(inputPath)
			.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
			.webp({ quality: WEBP_QUALITY })
			.toBuffer();

		// Small, already-compressed JPEGs can come out bigger. Keep the original then.
		if (result.length < originalSize) {
			await sharp(result).toFile(outputPath);
			const savings = ((1 - result.length / originalSize) * 100).toFixed(0);
			console.log(
				`  ${relPath} → .webp (${formatSize(originalSize)} → ${formatSize(result.length)}, -${savings}%)`
			);
		} else {
			console.log(`  ${relPath} kept as is (WebP would be larger)`);
		}
	}

	const served = existsSync(outputPath) ? outputPath : inputPath;
	const { width, height } = await sharp(served).metadata();
	manifest[toUrl(inputPath)] = { src: toUrl(served), width, height };
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t') + '\n');
console.log(`Wrote ${relative(join(__dirname, '..'), manifestPath)} (${originals.length} images)`);

function formatSize(bytes) {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
