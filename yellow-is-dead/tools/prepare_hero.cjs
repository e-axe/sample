// Export the approved master once; no regeneration or compositing.
// Usage: node tools/prepare_hero.cjs /path/to/approved-e-suit.png
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const source = process.argv[2];
if (!source) throw new Error('An approved master image path is required.');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
(async () => {
  const master = fs.readFileSync(source);
  const meta = await sharp(master).metadata();
  if (meta.width !== 1536 || meta.height !== 1024) {
    throw new Error('Expected the approved 1536 x 1024 master.');
  }
  const variants = [
    {name:'yellow-is-dead-hero-e-suit-1536.webp', width:1536},
    {name:'yellow-is-dead-hero-e-suit-1920.webp', width:1920},
    {name:'yellow-is-dead-hero-e-suit-mobile-640.webp', width:640, crop:{left:384, top:0, width:1152, height:1024}},
    {name:'yellow-is-dead-hero-e-suit-mobile-800.webp', width:800, crop:{left:384, top:0, width:1152, height:1024}}
  ];
  for (const item of variants) {
    let pipeline = sharp(master).rotate().toColourspace('srgb');
    if (item.crop) pipeline = pipeline.extract(item.crop);
    const bytes = await pipeline.resize({width:item.width, kernel:'lanczos3'})
      .webp({quality:88, effort:6}).toBuffer();
    fs.writeFileSync(path.join(root, 'assets', item.name), bytes);
    const out = await sharp(bytes).metadata();
    Object.assign(item, {height:out.height, bytes:bytes.length, sha256:digest(bytes)});
  }
  const report = {date:'2026-10-11', approved:'E案・スーツ残骸追加版', source:{width:meta.width,height:meta.height,sha256:digest(master)}, processing:'sRGB, Lanczos3, WebP quality 88 / effort 6, metadata removed; 1920px is a non-generative enlargement', variants};
  fs.writeFileSync(path.join(root, 'docs', 'hero-assets-20261011.json'), JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
})().catch(error => {console.error(error.message);process.exitCode=1;});
