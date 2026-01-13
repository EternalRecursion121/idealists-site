import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sizeOf from 'image-size';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vibesDir = join(__dirname, '..', 'static', 'vibes');

const files = readdirSync(vibesDir).filter((f) =>
	/\.(png|jpg|jpeg|webp|gif)$/i.test(f)
);

const manifest = {};

for (const filename of files) {
	const filePath = join(vibesDir, filename);
	const buffer = readFileSync(filePath);
	const dimensions = sizeOf(buffer);
	manifest[filename] = [dimensions.width, dimensions.height];
}

const outputPath = join(vibesDir, 'images.json');
writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

console.log(`Generated ${outputPath} with ${files.length} images`);
