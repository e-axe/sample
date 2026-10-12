"""Regression coverage for partial batches and small replacement portraits."""
from pathlib import Path
import hashlib
import importlib.util
import tempfile
from PIL import Image

spec = importlib.util.spec_from_file_location('portraits', Path(__file__).with_name('optimize-portraits.py'))
portraits = importlib.util.module_from_spec(spec)
spec.loader.exec_module(portraits)

with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent) as temp:
    base = Path(temp)
    source, site = base / 'source', base / 'site'
    source.mkdir()
    output = site / 'assets/images/talents'
    output.mkdir(parents=True)
    stale = output / 'nakayama-yui-960.webp'
    stale.write_bytes(b'previous portrait sentinel')
    for name in portraits.TALENTS:
        Image.new('RGB', (1000, 1500), '#d4e8f5').save(source / (name + '.jpg'))
    # The second source is too small: earlier valid sources must not be written.
    Image.new('RGB', (500, 750), '#f0e8e8').save(source / 'yui.jpg')
    before = {p.relative_to(site): hashlib.sha256(p.read_bytes()).hexdigest() for p in site.rglob('*') if p.is_file()}
    try:
        portraits.optimize(source, site)
        raise AssertionError('Undersized input must fail')
    except ValueError as exc:
        assert 'below 960px' in str(exc)
    after = {p.relative_to(site): hashlib.sha256(p.read_bytes()).hexdigest() for p in site.rglob('*') if p.is_file()}
    assert before == after
    clean = base / 'clean'
    try:
        portraits.optimize(source, clean)
        raise AssertionError('Clean output must also reject undersized input')
    except ValueError:
        assert not clean.exists()
    # Valid replacements regenerate every HTML candidate, including the stale size.
    Image.new('RGB', (1000, 1500), '#f0e8e8').save(source / 'yui.jpg')
    originals = {p.name: p.read_bytes() for p in source.glob('*.jpg')}
    rows = portraits.optimize(source, site)
    assert len(rows) == 4 and all(len(row['variants']) == 6 for row in rows)
    for row in rows:
        for variant in row['variants']:
            with Image.open(site / variant['file']) as im:
                assert im.width == variant['width'] and im.width <= 1000
                assert not im.getexif()
    assert stale.read_bytes() != b'previous portrait sentinel'
    assert all(p.read_bytes() == originals[p.name] for p in source.glob('*.jpg'))
print('Portrait regression checks passed: partial batch, clean checkout, full replacements, no upscaling, preserved originals.')
