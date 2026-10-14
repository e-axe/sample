"""Package only the static preview and client placement instructions."""
import pathlib,zipfile,hashlib,json
ROOT=pathlib.Path(__file__).resolve().parents[1]
OLD_HERO={'yellow-is-dead-ogp.jpg','yellow-is-dead-hero-1536.webp','yellow-is-dead-hero-1920.webp','yellow-is-dead-hero-mobile-640.webp','yellow-is-dead-hero-mobile-800.webp'}
files=[ROOT/name for name in ('index.html','style.css','app.js')]
for folder in ('assets','fonts'):
    files.extend(p for p in sorted((ROOT/folder).rglob('*')) if p.is_file() and p.name not in OLD_HERO)
output=ROOT/'yellow-is-dead-client-preview.zip'
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
    for file in files: archive.write(file,file.relative_to(ROOT).as_posix())
    archive.writestr('README.txt',(ROOT/'docs/client-readme.txt').read_bytes())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for file in files: assert archive.read(file.relative_to(ROOT).as_posix())==file.read_bytes()
    assert archive.read('README.txt')==(ROOT/'docs/client-readme.txt').read_bytes()
    assert all(n in ('index.html','style.css','app.js','README.txt') or n.startswith(('assets/','fonts/')) for n in archive.namelist())
    report={'files':len(archive.namelist()),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'allEntriesMatch':True}
(ROOT/'docs/sale-automation-20261011-zip.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
