# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""P4q: scripts/pgda_sample.py helpers and the "pgda_sample" block of data/validation.json (no network, no DEM)."""
import json
import math
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import pgda  # noqa: E402
import pgda_sample as S  # noqa: E402


def load(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


class Helpers(unittest.TestCase):
    def test_points_are_repeatable_and_inside_the_cap(self):
        sample = {"seed": 3, "count": 200, "lat_max": -80, "decimals_coords": 4}
        pts = S.draw_points(sample)
        self.assertEqual(pts, S.draw_points(sample))
        self.assertEqual(len(pts), 200)
        self.assertEqual(len({p["id"] for p in pts}), 200)
        for p in pts:
            self.assertTrue(-90 <= p["lat"] <= -80 and 0 <= p["lon_east"] <= 360, p)
        # Even over the area: the band 80-85 S holds about 3/4 of the cap area (sin difference), not half.
        outer = sum(1 for p in pts if p["lat"] > -85) / len(pts)
        share = (math.sin(math.radians(-80)) - math.sin(math.radians(-85))) / (math.sin(math.radians(-80)) + 1)
        self.assertAlmostEqual(outer, share, delta=0.1)

    def test_percentile_matches_linear_interpolation(self):
        self.assertEqual(S.percentile([3, 1, 2], 0.5), 2)
        self.assertAlmostEqual(S.percentile([0, 10], 0.9), 9.0)
        self.assertEqual(S.percentile([5], 0.9), 5)

    def test_summarize_counts_points_inside_the_window(self):
        def row(tool, value, lo, hi):
            ref = {"value": value, "window_min": lo, "window_max": hi}
            return {"tool": {"sun": tool, "earth": tool}, "pgda": {"sun": ref, "earth": ref},
                    "diff": {"sun": tool - value, "earth": tool - value}}
        s = S.summarize([row(0.5, 0.4, 0.3, 0.6), row(0.9, 0.5, 0.4, 0.6)], 3)
        self.assertEqual(s["sun"]["within_window"], 1)
        self.assertEqual(s["sun"]["max_abs"], 0.4)
        self.assertEqual(s["sun"]["median_abs"], 0.25)
        self.assertEqual(s["sun"]["mean_signed"], 0.25)


class Block(unittest.TestCase):
    def setUp(self):
        self.data = load("data/validation.json")
        self.s = self.data["pgda_sample"]
        self.cfg = load("config/pgda.json")

    def test_points_are_the_configured_draw_at_the_right_pixels(self):
        drawn = S.draw_points(self.cfg["sample"])
        rows = self.s["points"]
        self.assertGreaterEqual(len(rows), 60)
        self.assertEqual(self.s["count"], len(rows))
        self.assertEqual(self.s["seed"], self.cfg["sample"]["seed"])
        by_id = {p["id"]: p for p in drawn}
        for r in rows:
            p = by_id[r["point"]]
            self.assertEqual((r["lat"], r["lon_east"]), (p["lat"], p["lon_east"]))
            row, col = pgda.pixel(self.cfg["grid"], r["lat"], r["lon_east"])
            self.assertEqual((r["pixel"]["row"], r["pixel"]["col"]), (row, col))

    def test_summary_numbers_come_from_the_rows(self):
        rows, nd = self.s["points"], self.cfg["decimals"]
        for r in rows:
            for b in pgda.BODIES:
                self.assertAlmostEqual(r["diff"][b], round(r["tool"][b] - r["pgda"][b]["value"], nd), places=6)
                self.assertTrue(0 <= r["tool"][b] <= 1 and r["pgda"][b]["window_min"] <= r["pgda"][b]["value"] <= r["pgda"][b]["window_max"])
        again = S.summarize(rows, nd)
        for b in pgda.BODIES:
            self.assertEqual(self.s[b], again[b])

    def test_the_older_pgda_block_is_still_there(self):
        self.assertTrue(self.data["pgda"]["sites"])
        self.assertIn("horizons", self.data)
        self.assertIn("engine", self.data)


class Readme(unittest.TestCase):
    def test_readme_row_per_body_quotes_the_file(self):
        s = load("data/validation.json")["pgda_sample"]
        readme = ((ROOT / "README.md").read_text(encoding="utf-8") + "\n" + (ROOT / "docs" / "DETAILS.md").read_text(encoding="utf-8"))
        for b, label in (("sun", "Sun visible"), ("earth", "Earth visible")):
            v = s[b]
            row = (f"| {label} | {v['median_abs'] * 100:.1f} | {v['p90_abs'] * 100:.1f} | {v['max_abs'] * 100:.1f} | "
                   f"{v['within_window']} of {s['count']} |")
            self.assertIn(row, readme)
        self.assertIn(f"At {s['count']} random points", readme.replace("The same check at", "At"))


if __name__ == "__main__":
    unittest.main()
