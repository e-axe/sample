"""Create delivery portraits from local originals without enlargement or cropping."""
import argparse
import hashlib
import io
import json
from pathlib import Path
from PIL import Image, ImageCms, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SIZES = '(max-width:359px) calc((100vw - 48px) / 2), (max-width:767px) calc((100vw - 56px) / 2), (max-width:1079px) calc((100vw - 104px) / 3), (max-width:1239px) calc((100vw - 152px) / 4), 272px'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    args = parser.parse_args()
    data_path = ROOT / 'performance.json'
    data = json.loads(data_path.read_text(encoding='utf-8'))
    people = [p for g in data['castGroups'] for p in g['members']]
    paired_ids = {p['id'] for g in data['castGroups'] if g.get('paired') for p in g['members']}
    expected = {f'yellow-is-dead-{p["id"]}.jpg' for p in people}
    actual = {p.name for p in args.source.iterdir() if p.is_file()}
    if expected != actual:
        raise ValueError(f'File mismatch: missing={expected-actual}, unexpected={actual-expected}')
    records = []
    for person in people:
        source = args.source / f'yellow-is-dead-{person["id"]}.jpg'
        before = hashlib.sha256(source.read_bytes()).hexdigest()
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original)
            icc = original.info.get('icc_profile')
            if icc:
                image = ImageCms.profileToProfile(image, ImageCms.ImageCmsProfile(io.BytesIO(icc)), ImageCms.createProfile('sRGB'), outputMode='RGB')
            else:
                image = image.convert('RGB')
            image = image.copy()
        width, height = image.size
        widths = sorted({min(w, width) for w in (320, 640, 960)})
        outputs = []
        for w in widths:
            h = round(height * w / width)
            resized = image.resize((w, h), Image.Resampling.LANCZOS) if w != width else image
            relative = f'assets/yellow-is-dead-{person["id"]}-{w}.webp'
            dest = ROOT / relative
            resized.save(dest, 'WEBP', quality=90, method=6)
            with Image.open(dest) as check:
                assert check.size == (w, h) and not check.getexif()
            outputs.append({'path': relative, 'width': w, 'height': h, 'bytes': dest.stat().st_size})
        fallback_w = min(640, width)
        fallback_h = round(height * fallback_w / width)
        fallback = image.resize((fallback_w, fallback_h), Image.Resampling.LANCZOS) if fallback_w != width else image
        jpeg = f'assets/yellow-is-dead-{person["id"]}-{fallback_w}.jpg'
        fallback.save(ROOT / jpeg, 'JPEG', quality=90, optimize=True, progressive=True)
        default = next(o for o in outputs if o['width'] == fallback_w)
        sizes = SIZES if person['id'] not in paired_ids else SIZES.split(', (max-width:1079px)')[0] + ', 272px'
        person.update(image=default['path'], imageSources=outputs, imageFallback=jpeg,
                      imageWidth=fallback_w, imageHeight=fallback_h, imageSizes=sizes, focus='50% 50%')
        assert hashlib.sha256(source.read_bytes()).hexdigest() == before
        records.append({'id': person['id'], 'name': person['name'], 'order': person['order'],
                        'source': source.name, 'sourceWidth': width, 'sourceHeight': height,
                        'sourceBytes': source.stat().st_size, 'sourceSHA256': before,
                        'outputs': outputs, 'fallback': {'path': jpeg, 'bytes': (ROOT / jpeg).stat().st_size},
                        'focus': person['focus'], 'alt': '', 'permission': 'User-provided portraits; LP implementation requested 2026-10-10'})
    data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    report = {'date': '2026-10-10', 'quality': 90, 'processing': 'EXIF orientation, sRGB, metadata removal, proportional downsize only, no crop or enlargement', 'images': records,
              'sourceBytes': sum(r['sourceBytes'] for r in records),
              'defaultWebpBytes': sum(next(o['bytes'] for o in r['outputs'] if o['width'] == min(640, r['sourceWidth'])) for r in records)}
    (ROOT / 'docs/cast-assets-20261010.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in report.items() if k != 'images'}, ensure_ascii=False))

if __name__ == '__main__':
    main()
