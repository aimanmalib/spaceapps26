# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""K9 / H6: every SI-generated source file says so in its first lines, every page carries the SI meta tag and footer
link, and no media files outside docs/media/. Walks the folder (works in a clean
export without .git)."""
import json
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", "node_modules", "dist", "dalaman", ".cache", "__pycache__", "test-results", "playwright-report", ".pagar"}
SKIP_PATHS = {os.path.join("docs", "hantar"), os.path.join("deploy", "live")}
CODE_EXT = (".js", ".mjs", ".py", ".sh", ".css", ".html", ".yaml", ".conf")
MEDIA_EXT = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".mp4", ".webm", ".mov", ".mp3", ".wav", ".ogg", ".ico")
MARK = "SI-generated: Claude Code (Anthropic)"


def walk():
    for d, dirs, files in os.walk(ROOT):
        rel = os.path.relpath(d, ROOT)
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS and os.path.normpath(os.path.join(rel, x)) not in SKIP_PATHS]
        for f in files:
            yield os.path.normpath(os.path.join(rel, f))


class Disclosure(unittest.TestCase):
    def test_source_files_have_si_header(self):
        missing = []
        for rel in walk():
            if not rel.endswith(CODE_EXT):
                continue
            with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
                head = "".join(fh.readline() for _ in range(3))
            if MARK not in head:
                missing.append(rel)
        self.assertEqual(missing, [])

    def test_pages_have_meta_and_footer_link(self):
        # Served name -> source file; the game page and the page for teachers are built from src/ to the site root
        # (vite.config.js SRC_PAGES, P4j + P4o).
        files = {f: f for f in os.listdir(ROOT) if f.endswith(".html")}
        for page in ("play.html", "teach.html"):
            files[page] = os.path.join("src", page)
        pages = list(files)
        self.assertGreaterEqual(len(pages), 5)
        for f in pages:
            with open(os.path.join(ROOT, files[f]), encoding="utf-8") as fh:
                html = fh.read()
            self.assertRegex(html, r'<meta name="si-disclosure" content="[^"]+"', f)
            self.assertIn('id="si-link"', html, f)
            for href in re.findall(r'<a href="\./([a-z]*\.html)?"', html):
                if href:
                    self.assertIn(href, pages, f"{f} links to missing page {href}")

    def test_media_only_in_docs_media(self):
        stray = [r for r in walk() if r.lower().endswith(MEDIA_EXT) and not r.startswith(os.path.join("docs", "media") + os.sep)]
        # P4r: the one exception is NASA's Apollo 8 photograph, stored unchanged under public/media and credited to NASA
        # on the Data sources page and in REFERENCES.md.
        photo = os.path.join("public", "media", "as08-14-2383.jpg")
        self.assertEqual(stray, [photo])
        with open(os.path.join(ROOT, "i18n", "en.json"), encoding="utf-8") as f:
            self.assertIn("Credit: NASA", json.load(f)["sources.photo.text"])
        for rel in ("sources.html", "REFERENCES.md"):
            with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
                self.assertIn("images.nasa.gov/details/as08-14-2383", f.read(), rel)

    def test_retracted_origin_claims_do_not_return(self):
        # ADR 0024: the author did not write Malay notes, and the twelve items were listed by SI from two parts of the
        # challenge text, not taken from one NASA list. The form kit (docs/hantar/, not tracked) is checked when present.
        banned = ("Malay notes", "challenge's 'Your solution may include' list")
        targets = ["README.md", "SI-DISCLOSURE.md", "si-disclosure.json", os.path.join("demo", "slides.html")]
        targets += [os.path.join("i18n", f) for f in os.listdir(os.path.join(ROOT, "i18n")) if f.endswith(".json")]
        kit = os.path.join(ROOT, "docs", "hantar")
        if os.path.isdir(kit):
            targets += [os.path.join("docs", "hantar", f) for f in os.listdir(kit) if f.endswith(".md") and "hantar1" not in f]
        hits = []
        for rel in targets:
            with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
                text = fh.read()
            hits += [(rel, b) for b in banned if b in text]
        self.assertEqual(hits, [])


if __name__ == "__main__":
    unittest.main()
