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
        for text in ("Team", "Member", "Challenge: Lunar Landing Site Navigator", "NASA data"):
            self.assertIn(text, self.html)

    def test_project_name_matches_site(self):
        # One project name everywhere: the deck title slide and <title> use the site's name (i18n app.name).
        name = json.loads((ROOT / "i18n" / "en.json").read_text(encoding="utf-8"))["app.name"]
        self.assertIn(f"<h1>{name}</h1>", self.html)
        self.assertIn(f"<title>{name}: demo deck</title>", self.html)

    def test_pdf_pages_and_16_9(self):
        n_pages, boxes = pdf_pages((ROOT / DECK["pdf"]).read_bytes())
        n_slides = len(re.findall(r'<section class="slide[ "]', self.html))
        self.assertEqual(n_pages, n_slides)
        self.assertTrue(boxes)
        for x0, y0, x1, y1 in boxes:
            self.assertAlmostEqual((x1 - x0) / (y1 - y0), 16 / 9, places=2)

    def test_numbers_match_validation_file(self):
        v = json.loads((ROOT / "data" / "validation.json").read_text(encoding="utf-8"))
        for key, label in (("horizons", "random pairs"), ("engine", "pairs")):
            part = v[key]
            same = part["same_answer"]
            self.assertEqual(same["power"], same["of"])
            self.assertEqual(same["comm"], same["of"])
            self.assertIn(f"{part['max_abs_deg']:.4f}°</span> largest difference, same answers {same['of']} of {same['of']}", self.html)
            self.assertIn(f"{same['of']} {label}", self.html)
        # PGDA rows: the same-period block (scripts/pgda_period.py), 18.6 years on both sides.
        pp = v["pgda_period"]
        sites = {s["site"]: s for s in pp["sites"]}
        landing = [sites["im-1"], sites["im-2"]]
        sun_pp = max(abs(s["diff"]["sun"]) for s in landing) * 100
        earth_pp = max(abs(s["diff"]["earth"]) for s in landing) * 100
        self.assertIn(f"same {pp['period']['years']} years</td><td>Sun within <span class=\"num\">{sun_pp:.1f}</span> percentage points, "
                      f"Earth within <span class=\"num\">{earth_pp:.1f}</span>", self.html)
        ridge = sites[pp["ridge"]["site"]]
        self.assertAlmostEqual(abs(ridge["diff"]["sun"]), pp["sun"]["max_abs"])
        low, high = sorted(pp["ridge"]["observer"], key=lambda o: o["height_m"])
        self.assertIn(f"Sun differs by <span class=\"num\">{abs(ridge['diff']['sun']) * 100:.1f}</span> points; the tool gives "
                      f"{low['sun'] * 100:.1f} % with the observer on the ground, {high['sun'] * 100:.1f} % at {high['height_m']} m; "
                      f"NASA {pp['ridge']['pgda']['sun']['value'] * 100:.1f} %", self.html)

    def test_shift_and_range_numbers_match_readme(self):
        readme = ((ROOT / "README.md").read_text(encoding="utf-8") + "\n" + (ROOT / "docs" / "DETAILS.md").read_text(encoding="utf-8"))
        for slide, doc in (("1.3°</span> above", "1.3° above"), ("1.5°</span> below", "1.5° below"), ("2.6°</span> below", "2.6° below"),
                           ("0.033°", "0.033°")):
            self.assertIn(slide, self.html)
            self.assertIn(doc, readme)
        # Slide 2 rounds the README range (−2.30° to +10.79°) to one decimal.
        self.assertIn("between −2.30° and +10.79°", readme)
        self.assertIn("2.3°</span> below and <span class=\"num earth\">10.8°</span> above", self.html)

    def test_owner_check_sentences_are_marked_not_bracketed(self):
        # Sentences [A], [B] and [C] of the pre-submission review (approved by the author): marked for easy removal, no bracket markers shown.
        self.assertEqual(sorted(re.findall(r'data-owner-check="([A-Z])"', self.html)), ["A", "B", "C"])
        self.assertNotRegex(self.html, r"\[[ABC]\]")

    def test_slide_images_exist_and_are_gallery_media(self):
        srcs = re.findall(r'<img src="([^"]+)"', self.html)
        self.assertTrue(srcs)
        photos = re.findall(r'<figure class="photo"><img src="([^"]+)"', self.html)
        # P4r: one real NASA photograph on slide 1 (public/media, credited on the Data sources page); every other image is a screenshot.
        self.assertEqual(photos, ["../public/media/as08-14-2383.jpg"])
        for src in srcs:
            path = (ROOT / DECK["source"]).parent / src
            self.assertTrue(path.is_file(), src)
            if src not in photos:
                self.assertEqual(path.resolve().parent, (ROOT / "docs" / "media").resolve(), src)

    def test_screenshots_are_never_cropped(self):
        # Regression: object-fit: cover cut slide text mid-word (slides 4–6). Every slide image must be shown whole.
        rule = re.search(r"\.shot img\s*\{([^}]*)\}", self.html)
        self.assertIsNotNone(rule)
        self.assertRegex(rule.group(1), r"object-fit:\s*contain")
        # Only the NASA photo on slide 1 may be cropped (P4r); no screenshot is.
        self.assertNotRegex(re.sub(r"\.photo img\s*\{[^}]*\}", "", self.html), r"object-fit:\s*cover")


class Gallery(unittest.TestCase):
    def test_png_and_gif_present_and_small_enough(self):
        names = [f"{n}.png" for n in CFG["png"]] + [f"{CFG['example_gif']['name']}.gif", f"{CFG['gif']['name']}.gif"]
        self.assertEqual(len(names), 10)  # eight PNG (play.png, P4j; overview.png, P4s; map-sunlight.png, P4k) + two GIF (one-km example, P4p)
        ex = CFG["example_gif"]["viewport"]
        self.assertGreater(ex["width"], ex["height"])  # landscape
        names = names[:-1] + [f"{d['name']}.png" for d in CFG["deck_png"]["shots"]] + names[-1:]
        for name in names:
            path = ROOT / "docs" / "media" / name
            self.assertTrue(path.is_file(), name)
            self.assertLessEqual(path.stat().st_size, CFG["max_bytes"], name)
        self.assertEqual((ROOT / "docs" / "media" / names[0]).read_bytes()[:8], b"\x89PNG\r\n\x1a\n")
        self.assertEqual((ROOT / "docs" / "media" / names[-1]).read_bytes()[:6], b"GIF89a")
        self.assertEqual((ROOT / "docs" / "media" / f"{CFG['example_gif']['name']}.gif").read_bytes()[:6], b"GIF89a")


if __name__ == "__main__":
    unittest.main()
