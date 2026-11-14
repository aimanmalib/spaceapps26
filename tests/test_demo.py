# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""H4 / §8: demo deck demo/demo.pdf (≤ max_slides pages, 16:9) rendered from demo/slides.html, its numbers = data/validation.json,
and the gallery media in docs/media/ (the PNG and GIF names in config/media.json, each ≤ max_bytes). Standard library only."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config" / "media.json").read_text(encoding="utf-8"))
DECK = CFG["deck"]


def pdf_pages(raw):
    """Page objects and their MediaBox sizes, read from the uncompressed PDF object headers."""
    pages = re.findall(rb"/Type\s*/Page(?![s\w])", raw)
    boxes = [tuple(float(x) for x in m) for m in re.findall(rb"/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]", raw)]
    return len(pages), boxes


class Deck(unittest.TestCase):
    def setUp(self):
        self.html = (ROOT / DECK["source"]).read_text(encoding="utf-8")

    def test_slide_count_and_no_placeholders(self):
        n = len(re.findall(r'<section class="slide[ "]', self.html))
        self.assertGreaterEqual(n, 2)
        self.assertLessEqual(n, DECK["max_slides"])
        self.assertNotIn("(TBD-", self.html)

    def test_slides_name_team_member_and_challenge(self):
        for text in ("Team", "Member", "Challenge", "Lunar Landing Site Navigator", "NASA data"):
            self.assertIn(text, self.html)

    def test_pdf_pages_and_16_9(self):
        n_pages, boxes = pdf_pages((ROOT / DECK["pdf"]).read_bytes())
        n_slides = len(re.findall(r'<section class="slide[ "]', self.html))
        self.assertEqual(n_pages, n_slides)
        self.assertTrue(boxes)
        for x0, y0, x1, y1 in boxes:
            self.assertAlmostEqual((x1 - x0) / (y1 - y0), 16 / 9, places=2)

    def test_numbers_match_validation_file(self):
        v = json.loads((ROOT / "data" / "validation.json").read_text(encoding="utf-8"))
        self.assertIn(f"{v['horizons']['max_abs_deg']:.4f}°", self.html)
        self.assertIn(f"{v['engine']['max_abs_deg']:.4f}°", self.html)
        self.assertIn(f"{v['pgda']['sun']['max_abs'] * 100:.1f} percentage points", self.html)
        self.assertIn(f"{v['pgda']['earth']['max_abs'] * 100:.1f} percentage points", self.html)

    def test_slide_images_exist_and_are_gallery_media(self):
        srcs = re.findall(r'<img src="([^"]+)"', self.html)
        self.assertTrue(srcs)
        for src in srcs:
            path = (ROOT / DECK["source"]).parent / src
            self.assertTrue(path.is_file(), src)
            self.assertEqual(path.resolve().parent, (ROOT / "docs" / "media").resolve(), src)

    def test_screenshots_are_never_cropped(self):
        # Regression: object-fit: cover cut slide text mid-word (slides 4–6). Every slide image must be shown whole.
        rule = re.search(r"\.shot img\s*\{([^}]*)\}", self.html)
        self.assertIsNotNone(rule)
        self.assertRegex(rule.group(1), r"object-fit:\s*contain")
        self.assertNotRegex(self.html, r"object-fit:\s*cover")


class Gallery(unittest.TestCase):
    def test_png_and_gif_present_and_small_enough(self):
        names = [f"{n}.png" for n in CFG["png"]] + [f"{CFG['gif']['name']}.gif"]
        self.assertEqual(len(names), 6)
        for name in names:
            path = ROOT / "docs" / "media" / name
            self.assertTrue(path.is_file(), name)
            self.assertLessEqual(path.stat().st_size, CFG["max_bytes"], name)
        self.assertEqual((ROOT / "docs" / "media" / names[0]).read_bytes()[:8], b"\x89PNG\r\n\x1a\n")
        self.assertEqual((ROOT / "docs" / "media" / names[-1]).read_bytes()[:6], b"GIF89a")


if __name__ == "__main__":
    unittest.main()
