"""Offline safety tests for the FTPS deployer (no network or credentials)."""
import importlib.util
import json
from pathlib import Path
import posixpath
import tempfile
import unittest
from ftplib import error_perm

SCRIPT = Path(__file__).resolve().parents[1] / "tools" / "deploy-ftps.py"
spec = importlib.util.spec_from_file_location("saimer_ftps", SCRIPT)
ftps = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ftps)


class FakeFTP:
    def __init__(self):
        self.directories = {"/"}
        self.cwd_path = "/"
        self.files = {}
        self.uploads = 0

    def full(self, name):
        return posixpath.normpath(posixpath.join(self.cwd_path, name))

    def pwd(self):
        return self.cwd_path

    def cwd(self, name):
        new = self.full(name)
        if new not in self.directories:
            raise error_perm("550 not a directory")
        self.cwd_path = new

    def mkd(self, name):
        new = self.full(name)
        if new in self.directories:
            raise error_perm("550 exists")
        if posixpath.dirname(new) not in self.directories:
            raise error_perm("550 no parent")
        self.directories.add(new)

    def nlst(self):
        prefix = self.cwd_path.rstrip("/") + "/"
        return [name for name in self.files
                if name.startswith(prefix) and "/" not in name[len(prefix):]]

    def retrbinary(self, cmd, receiver):
        key = self.full(cmd.removeprefix("RETR "))
        if key not in self.files:
            raise error_perm("550 not found")
        receiver(self.files[key])

    def storbinary(self, cmd, source, blocksize):
        key = self.full(cmd.removeprefix("STOR "))
        if posixpath.dirname(key) not in self.directories:
            raise error_perm("550 missing directory")
        self.files[key] = source.read()
        self.uploads += 1

    def rename(self, source, destination):
        source = self.full(source)
        destination = self.full(destination)
        if source not in self.files:
            raise error_perm("550 missing source")
        self.files[destination] = self.files.pop(source)

    def size(self, filename):
        key = self.full(filename)
        if key not in self.files:
            raise error_perm("550 missing")
        return len(self.files[key])

    def delete(self, filename):
        self.files.pop(self.full(filename), None)


class DeploymentTests(unittest.TestCase):
    def test_remote_path_rules(self):
        for path in ("", " ", "/public_html", "../public_html", "site/../public_html",
                     "site//public_html", "site\\public_html", "site\nname"):
            with self.subTest(path=path), self.assertRaises(ValueError):
                ftps.clean_remote_directory(path)
        for path in (".", "public_html", "saimer-pro.com/public_html"):
            self.assertEqual(ftps.clean_remote_directory(path), path)

    def test_requires_explicit_authorization(self):
        ftp = FakeFTP()
        with self.assertRaisesRegex(ValueError, "confirmation"):
            ftps.initialize(ftp, "")
        self.assertNotIn("/" + ftps.MARKER, ftp.files)
        ftps.initialize(ftp, "saimer-pro.com")
        self.assertEqual(ftps.read_remote(ftp, ftps.MARKER), ftps.MARKER_VALUE)
        ftps.initialize(ftp, "saimer-pro.com")

    def test_foreign_site_cannot_be_claimed(self):
        ftp = FakeFTP()
        ftp.files["/index.html"] = b"<html>another company's site</html>"
        with self.assertRaisesRegex(ValueError, "unrelated"):
            ftps.initialize(ftp, "saimer-pro.com")
        self.assertNotIn("/" + ftps.MARKER, ftp.files)

    def test_deploy_needs_marker_and_only_uploads_build(self):
        ftp = FakeFTP()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ("index.html", ".htaccess", "robots.txt", "sitemap.xml",
                         "contact/index.html", "assets/css/site.css"):
                file = root / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text("safe:" + name, encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "not initialized"):
                ftps.deploy(ftp, root)
            ftps.initialize(ftp, "saimer-pro.com")
            ftps.deploy(ftp, root)
            self.assertIn("/assets/css/site.css", ftp.files)
            self.assertNotIn("/dist", ftp.files)
            manifest = json.loads(ftp.files["/" + ftps.MANIFEST])
            self.assertEqual(manifest["site"], "saimer-pro.com")
            self.assertEqual(len(manifest["files"]), 6)
            count = ftp.uploads
            ftps.deploy(ftp, root)
            self.assertEqual(ftp.uploads, count + 1)  # only the manifest is refreshed
            (root / "assets/css/site.css").write_text("changed", encoding="utf-8")
            ftps.deploy(ftp, root)
            self.assertEqual(ftp.files["/assets/css/site.css"], b"changed")

    def test_symlink_and_reserved_files_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ("index.html", ".htaccess", "robots.txt", "sitemap.xml",
                         "contact/index.html"):
                file = root / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text(name, encoding="utf-8")
            (root / ftps.MARKER).write_text("unauthorized", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "reserved"):
                ftps.deployed_files(root)
            (root / ftps.MARKER).unlink()
            (root / "linked.css").symlink_to(root / "index.html")
            with self.assertRaisesRegex(ValueError, "Symlinks"):
                ftps.deployed_files(root)


if __name__ == "__main__":
    unittest.main()
