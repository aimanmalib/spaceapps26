# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""H9(a): scripts/validate.py helpers, and README numbers = data/validation.json."""
import importlib.util
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent


def load(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def validate_module():
    sys.path.insert(0, str(ROOT / "scripts"))
    spec = importlib.util.spec_from_file_location("validate", ROOT / "scripts/validate.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class Helpers(unittest.TestCase):
    def setUp(self):
        self.mod = validate_module()

    def test_az_diff_wraps_the_short_way(self):
        self.assertAlmostEqual(self.mod.az_diff(359.9, 0.1), -0.2)
        self.assertAlmostEqual(self.mod.az_diff(0.1, 359.9), 0.2)
        self.assertAlmostEqual(self.mod.az_diff(10.0, 9.5), 0.5)

    def test_pairs_are_off_grid_inside_range_and_repeatable(self):
        eph = {"start": "2026-11-01 00:00", "stop": "2026-11-03 00:00", "step_minutes": 60}
        vcfg = {"seed": 7, "pairs_per_site": 4, "max_pairs_total": 10}
        sites = [{"id": "a"}, {"id": "b"}]
        pairs = self.mod.draw_pairs(sites, eph, vcfg)
        self.assertEqual(pairs, self.mod.draw_pairs(sites, eph, vcfg))
        self.assertEqual(len(pairs), 8)
        for p in pairs:
            self.assertNotEqual(p["time_utc"][-2:], "00")
            self.assertTrue("2026-11-01T00:00" < p["time_utc"] < "2026-11-03T00:00")
        with self.assertRaises(ValueError):
            self.mod.draw_pairs(sites, eph, dict(vcfg, max_pairs_total=7))

    def test_summarize_counts_same_answers(self):
        def row(shown_sun, ref_sun, d):
            body = lambda el: {"az": 0.0, "el": el}  # noqa: E731
            return {"shown": {"sun": body(shown_sun), "earth": body(1.0)}, "horizons": {"sun": body(ref_sun), "earth": body(1.0)},
                    "diff": {"sun": {"az": d, "el": -d}, "earth": {"az": 0.0, "el": 0.0}}}
        s = self.mod.summarize([row(0.01, -0.01, 0.02), row(5.0, 5.0, 0.0)], 4, 0)
        self.assertEqual(s["same_answer"], {"power": 1, "comm": 2, "of": 2})
        self.assertEqual(s["max_abs_deg"], 0.02)
        self.assertEqual(s["by_quantity"]["sun_az"]["mean_abs_deg"], 0.01)


class ReadmeNumbers(unittest.TestCase):
    def test_readme_quotes_the_file(self):
        h = load("data/validation.json")["horizons"]
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn(f"Largest difference over all angles: {h['max_abs_deg']:.4f}°", readme)
        self.assertIn(f"draws {len(h['pairs'])} site-and-time pairs", readme)
        for q in h["by_quantity"].values():
            self.assertIn(f"| {q['max_abs_deg']:.4f}° | {q['mean_abs_deg']:.4f}° |", readme)


if __name__ == "__main__":
    unittest.main()
