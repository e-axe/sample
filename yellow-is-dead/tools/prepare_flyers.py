"""Create display-sized, lossless WebP copies of the supplied official flyers.

Usage: python3 tools/prepare_flyers.py --front /path/front.jpg --back /path/back.jpg
Requires Pillow with WebP support. Originals are never modified or copied into
the public directory. The 1600px file is opened on demand, never preloaded.
"""
import argparse
import io
import json
from pathlib import Path
from PIL import Image, ImageCms, ImageOps

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--front', required=True, type=Path)
    parser.add_argument('--back', required=True, type=Path)
    args = parser.parse_args()
    results = []
    for side in ('front', 'back'):
        source = getattr(args, side)
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original)
            profile = original.info.get('icc_profile')
            if profile:
                image = ImageCms.profileToProfile(
                    image, ImageCms.ImageCmsProfile(io.BytesIO(profile)),
                    ImageCms.createProfile('sRGB'), outputMode='RGB')
            image = image.convert('RGB')
            if image.width < 1600:
                raise ValueError(f'{side}: source width must be at least 1600px')
            for width in (480, 960, 1600):
                resized = image.resize(
                    (width, round(image.height * width / image.width)),
                    Image.Resampling.LANCZOS)
                output = ROOT / 'assets' / f'yellow-is-dead-flyer-{side}-{width}.webp'
                resized.save(output, 'WEBP', lossless=True, method=6)
                with Image.open(output) as decoded:
                    if decoded.convert('RGB').tobytes() != resized.tobytes():
                        raise ValueError(f'{output.name}: lossless verification failed')
                results.append({'file': output.name, 'dimensions': resized.size,
                                'bytes': output.stat().st_size,
                                'sourceBytes': source.stat().st_size,
                                'losslessPixels': True})
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    main()
