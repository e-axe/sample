#!/usr/bin/env python3
"""Prepare the approved static LP for deployment to the production domain.

The GitHub Pages preview remains noindex. This tool only creates a separate
production package after the cast photos have been integrated.
Requires Python 3.9+ and no third-party modules.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "release"
ARCHIVE = ROOT / "glass-star-children-release.zip"
PRODUCTION_URL = "https://garasunohoshi.otonapro.com/"
PREVIEW_ROBOTS = '<meta name="robots" content="noindex,nofollow">'
PRODUCTION_ROBOTS = '<meta name="robots" content="index,follow,max-image-preview:large">'
SAMPLE_NOTE = '<p class="sample-note">出演者を選ぶと出演回を確認できます。</p>'


def fail(message: str) -> None:
    print("ERROR: " + message, file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    source = (ROOT / "index.html").read_text(encoding="utf-8")
    if source.count(PREVIEW_ROBOTS) != 1:
        fail("The preview noindex meta tag was changed. Verify index.html before release.")
    if "photo:'image/glass-star-avatar-placeholder.svg'" in source:
        fail("Cast photos are still configured as placeholders in index.html.")
    missing = [
        f"glass-star-cast-{i:02d}.jpg" for i in range(1, 33)
        if not (ROOT / "image" / f"glass-star-cast-{i:02d}.jpg").is_file()
        or (ROOT / "image" / f"glass-star-cast-{i:02d}.jpg").stat().st_size == 0
    ]
    if missing:
        fail("Missing cast photos: " + ", ".join(missing))
    canonical = f'<link rel="canonical" href="{PRODUCTION_URL}">'
    if source.count(canonical) != 1:
        fail("Canonical URL does not match the approved production URL.")
    if f'<meta property="og:url" content="{PRODUCTION_URL}">' not in source:
        fail("OGP URL does not match the approved production URL.")

    production = source.replace(PREVIEW_ROBOTS, PRODUCTION_ROBOTS)
    if SAMPLE_NOTE not in production:
        fail("The preview cast-photo note has changed. Review before release.")
    production = production.replace(SAMPLE_NOTE, "", 1)

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    shutil.copytree(ROOT / "image", OUT / "image")
    shutil.copytree(ROOT / "fonts", OUT / "fonts")
    (OUT / "index.html").write_text(production, encoding="utf-8")
    (OUT / "robots.txt").write_text(
        "User-agent: *\nAllow: /\n\nSitemap: " + PRODUCTION_URL + "sitemap.xml\n",
        encoding="utf-8",
    )
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        '  <url><loc>' + escape(PRODUCTION_URL) + '</loc></url>\n'
        '</urlset>\n',
        encoding="utf-8",
    )
    if ARCHIVE.exists():
        ARCHIVE.unlink()
    shutil.make_archive(str(ARCHIVE.with_suffix("")), "zip", root_dir=OUT)
    print("Production package created:", ARCHIVE)
    print("Preview noindex remains unchanged. Production has index,follow.")
    print("After server upload, verify HTTPS, OGP URL, robots.txt, sitemap.xml, and robots headers.")


if __name__ == "__main__":
    main()
