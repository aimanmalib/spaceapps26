# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""K9 / H6: every SI-generated source file says so in its first lines, every page carries the SI meta tag and footer
link, no media files outside docs/media/, and no company names in public files. Walks the folder (works in a clean
export without .git)."""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", "node_modules", "dist", "dalaman", ".cache", "__pycache__", "test-results", "playwright-report", ".pagar"}
SKIP_PATHS = {os.path.join("docs", "hantar"), os.path.join("deploy", "live")}
CODE_EXT = (".js", ".mjs", ".py", ".sh", ".css", ".html", ".yaml", ".conf")
MEDIA_EXT = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".mp4", ".webm", ".mov", ".mp3", ".wav", ".ogg", ".ico")
MARK = "SI-generated: Claude Code (Anthropic)"
# Company / client names that must not appear in public files (PRD R12, H6). Lowercase, matched as substrings.
BRANDS = ("sasa teguh", "sasateguh", "tunwan")


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
        pages = [f for f in os.listdir(ROOT) if f.endswith(".html")]
        self.assertGreaterEqual(len(pages), 4)
        for f in pages:
            with open(os.path.join(ROOT, f), encoding="utf-8") as fh:
                html = fh.read()
            self.assertRegex(html, r'<meta name="si-disclosure" content="[^"]+"', f)
            self.assertIn('id="si-link"', html, f)
            for href in re.findall(r'<a href="\./([a-z]*\.html)?"', html):
                if href:
                    self.assertIn(href, pages, f"{f} links to missing page {href}")

    def test_media_only_in_docs_media(self):
        stray = [r for r in walk() if r.lower().endswith(MEDIA_EXT) and not r.startswith(os.path.join("docs", "media") + os.sep)]
        self.assertEqual(stray, [])

    def test_no_company_names(self):
        hits = []
        for rel in walk():
            if rel.lower().endswith(MEDIA_EXT) or rel.startswith("data" + os.sep) or rel == os.path.join("tests", "test_disclosure.py"):
                continue
            with open(os.path.join(ROOT, rel), encoding="utf-8", errors="ignore") as fh:
                text = fh.read().lower()
            hits += [f"{rel}: {b}" for b in BRANDS if b in text]
        self.assertEqual(hits, [])


if __name__ == "__main__":
    unittest.main()
