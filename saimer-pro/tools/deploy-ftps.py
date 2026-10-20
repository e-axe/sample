#!/usr/bin/env python3
"""Deploy only the built S'aimer website over certificate-verified explicit FTPS.

Never give this script a source directory. Initialize a target manually before deploying.
FTP credentials come exclusively from GitHub Actions secrets / process environment.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import ssl
import zipfile
from urllib.request import urlopen
from urllib.parse import quote
from ftplib import FTP_TLS, error_perm

DOMAIN = "saimer-pro.com"
MARKER = ".saimer-deploy-root"
MANIFEST = ".saimer-deploy-manifest.json"
MARKER_VALUE = b"saimer-pro.com:production:v1\n"
MAX_METADATA = 1024 * 1024


def clean_remote_directory(value):
    if not value or not value.strip():
        raise ValueError("Set repository variable SAIMER_FTPS_REMOTE_DIR after inspecting the FTPS root.")
    value = value.strip()
    if (value.startswith("/") or "\\" in value or
            any(part in ("", "..") for part in value.split("/")) or
            any(ord(c) < 32 for c in value)):
        raise ValueError("Remote directory must be a relative directory such as '.' or 'public_html'.")
    return value


def remote_names(ftp):
    try:
        return {PurePosixPath(name.rstrip("/")).name for name in ftp.nlst()}
    except error_perm as exc:
        if str(exc).startswith("550"):
            return set()
        raise


def read_remote(ftp, filename, limit=MAX_METADATA):
    data = bytearray()

    def collect(chunk):
        data.extend(chunk)
        if len(data) > limit:
            raise ValueError("Remote metadata is unexpectedly large.")

    try:
        ftp.retrbinary("RETR " + filename, collect)
        return bytes(data)
    except error_perm as exc:
        if str(exc).startswith("550"):
            return None
        raise


def ensure_directory(ftp, directory):
    """Create parents relative to the deployment root; never change directories."""
    if directory in ("", "."):
        return
    built = []
    for part in PurePosixPath(directory).parts:
        built.append(part)
        target = "/".join(built)
        try:
            ftp.mkd(target)
        except error_perm:
            # 550 also means already exists: verify rather than ignoring it.
            initial = ftp.pwd()
            ftp.cwd(target)
            ftp.cwd(initial)


def write_file(ftp, filename, data):
    parent = str(PurePosixPath(filename).parent)
    ensure_directory(ftp, parent)
    temp = str(PurePosixPath(filename).with_name(
        "." + PurePosixPath(filename).name + ".saimer-upload-" + os.urandom(5).hex()))
    try:
        ftp.storbinary("STOR " + temp, io.BytesIO(data), blocksize=65536)
        ftp.rename(temp, filename)
    except Exception:
        try:
            ftp.delete(temp)
        except Exception:
            pass
        raise


def probe(ftp):
    start = ftp.pwd()
    for candidate in (".", "public_html", "saimer-pro.com/public_html"):
        try:
            ftp.cwd(start)
            ftp.cwd(candidate)
            names = remote_names(ftp)
            print(json.dumps({
                "relative_directory": candidate,
                "exists": True,
                "contains_index_html": "index.html" in names,
                "contains_index_php": "index.php" in names,
                "contains_htaccess": ".htaccess" in names,
                "initialized_for_saimer": read_remote(ftp, MARKER) == MARKER_VALUE,
            }, ensure_ascii=False))
        except error_perm:
            print(json.dumps({"relative_directory": candidate, "exists": False}))
        finally:
            ftp.cwd(start)
    print("Read-only probe completed. Inspect the results before choosing SAIMER_FTPS_REMOTE_DIR.")


def initialize(ftp, confirmation):
    if confirmation != DOMAIN:
        raise ValueError("Initialization requires exact confirmation: saimer-pro.com")
    existing = read_remote(ftp, MARKER)
    if existing is not None:
        if existing != MARKER_VALUE:
            raise ValueError("Target has a different deployment marker. Refusing to overwrite.")
        print("Already initialized; nothing changed.")
        return
    names = remote_names(ftp)
    if "index.php" in names:
        raise ValueError("An existing index.php was found. Refusing to overwrite an unknown site.")
    if "index.html" in names:
        page = read_remote(ftp, "index.html", 256 * 1024) or b""
        recognizable = any(value in page.lower() for value in (
            b"saimer", b"xserver", b"xsrv", b"\xe3\x82\xbb\xe3\x83\xa1\xe3\x83\x97\xe3\x83\xad"))
        if not recognizable:
            raise ValueError("An unrelated index.html is present. Resolve manually before initializing.")
    write_file(ftp, MARKER, MARKER_VALUE)
    print("Initialized the selected directory for S'aimer production deployments.")


def deployed_files(local_dir):
    local_dir = Path(local_dir).resolve(strict=True)
    if not local_dir.is_dir():
        raise ValueError("Built site directory is missing.")
    if not all((local_dir / name).is_file() for name in
               ("index.html", ".htaccess", "robots.txt", "sitemap.xml", "contact/index.html")):
        raise ValueError("Production build is incomplete.")
    files = {}
    for file in local_dir.rglob("*"):
        if file.is_symlink():
            raise ValueError("Symlinks are not permitted in the deployment bundle.")
        if not file.is_file():
            continue
        name = file.relative_to(local_dir).as_posix()
        if name in (MARKER, MANIFEST) or name.startswith(".github/"):
            raise ValueError("Production bundle contains a reserved path.")
        files[name] = file.read_bytes()
    return files


def deploy(ftp, local_dir):
    if read_remote(ftp, MARKER) != MARKER_VALUE:
        raise ValueError("Target is not initialized for saimer-pro.com. Deployment stopped.")
    files = deployed_files(local_dir)
    existing = read_remote(ftp, MANIFEST)
    old = {}
    if existing:
        manifest = json.loads(existing)
        if manifest.get("site") != DOMAIN or not isinstance(manifest.get("files"), dict):
            raise ValueError("Remote deployment manifest belongs to a different site.")
        old = manifest["files"]
    hashes = {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}
    # Upload assets before HTML, root index.html after nested HTML, and redirects last.
    order = sorted(files, key=lambda name: (
        name == ".htaccess", name == "index.html",
        not name.startswith("assets/"),
        Path(name).suffix.lower() in (".css", ".js"), name))
    changed = 0
    for name in order:
        if old.get(name) == hashes[name]:
            try:
                if ftp.size(name) == len(files[name]):
                    continue
            except (error_perm, OSError):
                pass
        write_file(ftp, name, files[name])
        changed += 1
    new_manifest = {"site": DOMAIN, "version": 1, "files": hashes}
    write_file(ftp, MANIFEST, (json.dumps(new_manifest, ensure_ascii=False, sort_keys=True)
                               + "\n").encode("utf-8"))
    print(json.dumps({
        "status": "uploaded", "files_in_build": len(files),
        "uploaded": changed, "unchanged": len(files) - changed,
        "previously_managed_files_no_longer_used": len(set(old) - set(hashes)),
        "pruning": "disabled",
    }))


def backup(ftp):
    """Read the complete selected static site before any production write."""
    page = read_remote(ftp, "index.html", 1024 * 1024)
    if page is None:
        raise ValueError("Cannot verify target without index.html.")
    with urlopen("https://saimer-pro.com/index.html", timeout=35) as response:
        public_page = response.read(1024 * 1024 + 1)
    if page != public_page:
        raise ValueError("FTPS index.html does not match HTTPS production. No writes allowed.")
    output = Path("saimer-backup")
    output.mkdir(exist_ok=True)
    hashes = {}
    total = 0
    with zipfile.ZipFile(output / "site.zip", "w", zipfile.ZIP_DEFLATED) as archive:
        def walk(directory):
            nonlocal total
            for name, facts in list(ftp.mlsd(directory)):
                if name in (".", "..") or facts.get("type") in ("cdir", "pdir"):
                    continue
                if "/" in name or "\\" in name or any(ord(ch) < 32 for ch in name):
                    raise ValueError("Unsafe backup path.")
                path = name if directory == "." else directory + "/" + name
                kind = facts.get("type")
                if kind == "dir":
                    walk(path)
                elif kind == "file":
                    data = read_remote(ftp, path, 100 * 1024 * 1024)
                    if data is None:
                        raise ValueError("File disappeared during backup.")
                    total += len(data)
                    if total > 1024 * 1024 * 1024:
                        raise ValueError("Backup size exceeds static site safety limit.")
                    archive.writestr(path, data)
                    hashes[path] = hashlib.sha256(data).hexdigest()
                else:
                    raise ValueError("Unsupported remote entry type; backup stopped.")
        walk(".")
    with zipfile.ZipFile(output / "site.zip") as archive:
        if archive.testzip() is not None or set(archive.namelist()) != set(hashes):
            raise ValueError("Backup verification failed.")
    (output / "sha256.json").write_text(json.dumps(hashes, sort_keys=True), encoding="utf-8")
    print(json.dumps({"backup": "verified", "files": len(hashes), "bytes": total,
                      "target_matches_https": True}))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("probe", "backup", "initialize", "deploy", "verify"), required=True)
    parser.add_argument("--confirmation", default="")
    parser.add_argument("--local", default="saimer-pro/dist/production")
    args = parser.parse_args()
    if args.mode == "verify":
        checked = 0
        for name, data in deployed_files(args.local).items():
            if any(part.startswith(".") for part in PurePosixPath(name).parts):
                continue
            with urlopen("https://saimer-pro.com/" + quote(name) + "?deploy=" +
                         hashlib.sha256(data).hexdigest()[:12], timeout=35) as response:
                actual = response.read(len(data) + 1)
            if actual != data:
                raise ValueError("HTTPS content differs from build: " + name)
            checked += 1
        print(json.dumps({"https_verification": "passed", "files": checked}))
        return
    host = os.environ.get("SAIMER_FTPS_HOST")
    user = os.environ.get("SAIMER_FTPS_USER")
    password = os.environ.get("SAIMER_FTPS_PASSWORD")
    if not all((host, user, password)):
        raise ValueError("FTPS connection Secrets are missing. Set the three SAIMER_FTPS_* Secrets.")
    remote_dir = (clean_remote_directory(os.environ.get("SAIMER_FTPS_REMOTE_DIR", ""))
                  if args.mode != "probe" else ".")
    with FTP_TLS(context=ssl.create_default_context(), timeout=35) as ftp:
        ftp.connect(host=host, port=21)
        ftp.login(user=user, passwd=password)
        ftp.prot_p()
        ftp.set_pasv(True)
        if args.mode == "probe":
            probe(ftp)
            return
        ftp.cwd(remote_dir)
        if args.mode == "backup":
            backup(ftp)
        elif args.mode == "initialize":
            initialize(ftp, args.confirmation)
        else:
            deploy(ftp, args.local)


if __name__ == "__main__":
    main()
