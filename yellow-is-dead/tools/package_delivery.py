"""Create verified static production packages without changing the preview."""
import argparse, datetime, hashlib, json, os, pathlib, shutil, subprocess, sys, zipfile
from html.parser import HTMLParser

OLD_HERO = {
    "yellow-is-dead-hero-1536.webp", "yellow-is-dead-hero-1920.webp",
    "yellow-is-dead-hero-mobile-640.webp", "yellow-is-dead-hero-mobile-800.webp",
}
PUBLIC_TOP = {"index.html", "style.css", "app.js"}
class References(HTMLParser):
    def __init__(self):
        super().__init__(); self.local = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for key in ("src", "href"):
            if key in a: self.local.append(a[key])
        if "srcset" in a:
            self.local.extend(x.strip().split()[0] for x in a["srcset"].split(","))
        if "imagesrcset" in a:
            self.local.extend(x.strip().split()[0] for x in a["imagesrcset"].split(","))
def digest(data):
    return hashlib.sha256(data).hexdigest()
def files(root):
    return sorted(x for x in root.rglob("*") if x.is_file())
def public_files(root):
    return [x for x in files(root) if (
        x.relative_to(root).as_posix() in PUBLIC_TOP or
        (x.relative_to(root).parts[0] in {"assets", "fonts"} and x.name not in OLD_HERO))]
def archive(path, root, selected):
    with zipfile.ZipFile(path, "x", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in selected: z.write(f, f.relative_to(root).as_posix())
    manifest=[]
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None
        assert len(z.namelist()) == len(selected)
        for f in selected:
            name=f.relative_to(root).as_posix(); data=f.read_bytes()
            assert z.read(name) == data
            manifest.append({"path":name,"bytes":len(data),"sha256":digest(data)})
    return {"file":path.name,"bytes":path.stat().st_size,"sha256":digest(path.read_bytes()),
            "files":len(manifest),"manifest":manifest}
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--source",required=True)
    parser.add_argument("--output",required=True)
    parser.add_argument("--commit",required=True)
    args=parser.parse_args()
    source=pathlib.Path(args.source).resolve(); output=pathlib.Path(args.output).resolve()
    assert source != output and source.is_dir()
    assert source not in output.parents, 'Output must be outside the source folder'
    output.mkdir(parents=True,exist_ok=False)
    report={"createdAt":datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).isoformat(),
            "repository":"e-axe/sample","sourceCommit":args.commit,
            "sourceData":json.loads((source/"performance.json").read_text(encoding="utf-8"))["source"],
            "sale":json.loads((source/"performance.json").read_text(encoding="utf-8"))["sale"],
            "builds":[]}
    for protocol in ("https","http"):
        build=output.parent/("build-"+protocol)
        assert not build.exists()
        shutil.copytree(source,build)
        env=os.environ.copy()
        env.update(YELLOW_IS_DEAD_ENV="production",
                   YELLOW_IS_DEAD_PUBLIC_URL=protocol+"://yellow-is-dead.softboiled.net/")
        subprocess.run([sys.executable,str(build/"tools/build.py")],env=env,check=True,cwd=build)
        html=(build/"index.html").read_text(encoding="utf-8")
        assert "noindex" not in html and "e-axe.github.io" not in html
        url=env["YELLOW_IS_DEAD_PUBLIC_URL"]
        for token in ('<link rel="canonical" href="'+url+'">',
                      '<meta property="og:url" content="'+url+'">',
                      '<meta property="og:image" content="'+url+'assets/yellow-is-dead-ogp.jpg">',
                      '<meta name="twitter:image" content="'+url+'assets/yellow-is-dead-ogp.jpg">',
                      '<meta name="robots" content="index,follow,max-image-preview:large">'):
            assert token in html, token
        for name in ("style.css","app.js"):
            assert name+"?v="+digest((build/name).read_bytes())[:12] in html
        refs=References();refs.feed(html)
        missing=[]
        for ref in refs.local:
            if ref.startswith(("#","http:","https:","data:","mailto:","tel:")):continue
            clean=ref.split("?")[0].split("#")[0]
            if clean and not (build/clean).is_file():missing.append(clean)
        assert not missing, missing
        selected=public_files(build)
        assert len(selected)==90
        for f in selected:
            rel=f.relative_to(build)
            if rel.as_posix()!="index.html":assert f.read_bytes()==(source/rel).read_bytes()
        archive_path=output/("yellow-is-dead_本番配置用_"+protocol.upper()+".zip")
        record=archive(archive_path,build,selected)
        review=output.parent/("extracted-"+protocol);review.mkdir()
        with zipfile.ZipFile(archive_path) as z:
            assert all(not n.startswith("/") and ".." not in pathlib.PurePosixPath(n).parts for n in z.namelist())
            z.extractall(review)
        assert len(files(review))==90
        for f in selected:assert f.read_bytes()==(review/f.relative_to(build)).read_bytes()
        report["builds"].append({"protocol":protocol,"publicURL":url,"metadata":"passed",
            "localReferences":"passed","crcAndByteEquality":"passed","extractVerification":"passed",**record})
    source_top = PUBLIC_TOP | {"performance.json", "README_更新手順.txt", "README.md", "素材対応.csv"}
    source_selected = [x for x in files(source) if (
        x.relative_to(source).as_posix() in source_top or
        (x.relative_to(source).parts[0] in {"assets", "fonts", "tools"} and
         x.name not in OLD_HERO and x.suffix.lower() in {".py", ".cjs", ".webp", ".jpg", ".svg", ".woff2", ".txt"} and
         x.name != "package_preview.py"))]
    source_zip=archive(output/"yellow-is-dead_更新用ソース.zip",source,source_selected)
    report["sourceArchive"]=source_zip
    (output/"03_ファイル一覧・ハッシュ.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"output":str(output),"builds":[{k:v for k,v in x.items() if k!="manifest"} for x in report["builds"]],
          "sourceArchive":{k:v for k,v in source_zip.items() if k!="manifest"}},ensure_ascii=False))
if __name__ == "__main__": main()
