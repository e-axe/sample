"""Create responsive portraits from the four supplied originals without upscaling.

Usage: python tools/optimize-portraits.py <original-portrait-directory>
Requires Pillow. Original files are read-only; generated assets contain no EXIF.
"""
from pathlib import Path
from io import BytesIO
import argparse
import hashlib
import json
from PIL import Image, ImageCms, ImageOps

TALENTS = {
    "yueto": ("ishihara-yueto", "石原 月斗"),
    "yui": ("nakayama-yui", "中山 結心"),
    "hina": ("tsukigata-hina", "月形 陽南"),
    "hiroki": ("takashima-hiroki", "髙島 大幹"),
}


def optimize(source_dir, site):
    output = site / "assets/images/talents"
    output.mkdir(parents=True, exist_ok=True)
    manifest = []
    for basename, (slug, name) in TALENTS.items():
        source = source_dir / (basename + ".jpg")
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        with Image.open(source) as original:
            im = ImageOps.exif_transpose(original)
            icc = original.info.get("icc_profile")
            if icc:
                im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(BytesIO(icc)), ImageCms.createProfile("sRGB"), outputMode="RGB")
            else:
                im = im.convert("RGB")
            row = {"name": name, "slug": slug, "original": source.name, "original_size": list(im.size), "original_bytes": source.stat().st_size, "original_sha256": digest, "variants": []}
            for width in (320, 640, 960):
                if width > im.width:
                    continue
                height = round(im.height * width / im.width)
                resized = im.resize((width, height), Image.Resampling.LANCZOS)
                # Clear inherited EXIF/GPS, comments, and color profiles after sRGB conversion.
                resized.info.clear()
                for extension in ("webp", "jpg"):
                    path = output / f"{slug}-{width}.{extension}"
                    if extension == "webp":
                        resized.save(path, "WEBP", quality=90, method=6)
                    else:
                        resized.save(path, "JPEG", quality=90, optimize=True, progressive=True, subsampling=0)
                    row["variants"].append({"file": str(path.relative_to(site)).replace("\\", "/"), "width": width, "height": height, "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
        assert hashlib.sha256(source.read_bytes()).hexdigest() == digest
        manifest.append(row)
    (site / "docs/portrait-assets.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    manifest = optimize(args.source, Path(__file__).resolve().parents[1])
    for row in manifest:
        print(row["slug"], row["original_size"], "=>", len(row["variants"]), "assets")
