import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const argument = flag => process.argv[process.argv.indexOf(flag) + 1];
if (!process.argv.includes('--source')) throw new Error('Specify the supplied material folder with --source.');
const moduleRoot = process.argv.includes('--module-root') ? path.resolve(argument('--module-root'), '_loader.cjs') : import.meta.url;
const sharp = createRequire(moduleRoot)('sharp');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.resolve(argument('--source'), 'キャスト画像_オリジナル');
const data = JSON.parse(await readFile(path.join(root, 'content.json'), 'utf8'));
const selected = process.argv.includes('--only') ? argument('--only') : null;
await mkdir(path.join(root, 'assets/cast'), { recursive: true });
for (const cast of data.cast) {
  if (selected && cast.id !== selected) continue;
  const filename = `kawaii-re-cast-${String(cast.imageNumber).padStart(2, '0')}`;
  if (!cast.source) {
    await writeFile(path.join(root, 'assets/cast', `${filename}.svg`), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#cbb7e8"/><stop offset="1" stop-color="#f5d5eb"/></linearGradient></defs><rect width="320" height="320" fill="url(#g)"/><circle cx="160" cy="113" r="52" fill="#faf3fc"/><path d="M60 320v-43a100 100 0 0 1 200 0v43" fill="#faf3fc"/></svg>');
    continue;
  }
  const inset = Math.round(480 * (cast.crop?.inset || 0));
  const position = cast.crop?.position === 'north' ? 'north' : sharp.strategy.attention;
  let picture = sharp(path.join(sourceRoot, cast.source)).autoOrient();
  if (typeof cast.crop?.verticalOffset === 'number') {
    const metadata = await picture.metadata();
    const rotated = [5, 6, 7, 8].includes(metadata.orientation);
    const width = rotated ? metadata.height : metadata.width;
    const height = rotated ? metadata.width : metadata.height;
    if (cast.crop.verticalOffset < 0 || cast.crop.verticalOffset > 1) throw new Error(`Invalid crop offset for ${cast.id}`);
    const side = Math.min(width, height);
    picture = picture.extract({left: Math.round((width-side)/2), top: Math.round((height-side)*cast.crop.verticalOffset), width: side, height: side});
  }
  picture = picture.resize(480 - inset * 2, 480 - inset * 2, { fit: 'cover', position });
  if (inset) picture = picture.extend({ top: inset, bottom: inset, left: inset, right: inset, background: '#fff' });
  await picture.webp({ quality: 86 }).toFile(path.join(root, 'assets/cast', `${filename}.webp`));
}
console.log('Prepared numbered cast images from supplied originals.');
