# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Later dates (ADR 0104): scripts/validate_years.py helpers, and data/validation-years.json matches its own rule."""
import importlib.util
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent


def load(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def module():
    sys.path.insert(0, str(ROOT / "scripts"))
    spec = importlib.util.spec_from_file_location("validate_years", ROOT / "scripts/validate_years.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class Pairs(unittest.TestCase):
    def setUp(self):
        self.mod = module()

    def test_pairs_are_off_grid_inside_the_years_and_repeatable(self):
        sites = [{"id": "a", "lat": 1, "lon_east": 2}, {"id": "b", "lat": -89, "lon_east": 200}]
        check = {"seed": 3, "pairs": 20, "from": "2028-01-01 00:00", "to": "2031-01-01 00:00"}
        pairs = self.mod.draw_pairs(sites, {"step_minutes": 60}, check)
        self.assertEqual(pairs, self.mod.draw_pairs(sites, {"step_minutes": 60}, check))
        self.assertEqual(len(pairs), 20)
        for p in pairs:
            self.assertNotEqual(p["time_utc"][-2:], "00")
            self.assertTrue("2028-01-01T00:00" < p["time_utc"] < "2031-01-01T00:00")
            self.assertIn(p["site"], ("a", "b"))

    def test_passed_needs_small_differences_and_same_answers(self):
        ok = {"max_abs_deg": 0.01, "same_answer": {"power": 3, "comm": 3, "of": 3}}
        self.assertTrue(self.mod.passed(ok, 0.05))
        self.assertFalse(self.mod.passed(dict(ok, max_abs_deg=0.051), 0.05))
        self.assertFalse(self.mod.passed(dict(ok, same_answer={"power": 3, "comm": 2, "of": 3}), 0.05))


class Result(unittest.TestCase):
    """The recorded run: at least 20 pairs in 2028-2030 at listed sites; summary and verdict follow from the rows."""

    def test_recorded_run(self):
        out = load("data/validation-years.json")
        check = load("config/years.json")["check"]
        sites = {s["id"]: s for s in load("config/sites.json")["sites"]}
        self.assertGreaterEqual(len(out["pairs"]), 20)
        self.assertEqual(len(out["pairs"]), check["pairs"])
        for r in out["pairs"]:
            self.assertIn(r["site"], sites)
            self.assertTrue("2028-01-01" <= r["time_utc"] < "2031-01-01")
        biggest = max(abs(r["diff"][b][k]) for r in out["pairs"] for b in ("sun", "earth") for k in ("az", "el"))
        self.assertAlmostEqual(out["summary"]["max_abs_deg"], biggest, places=4)
        same = all((r["shown"][b]["el"] > 0) == (r["horizons"][b]["el"] > 0) for r in out["pairs"] for b in ("sun", "earth"))
        self.assertEqual(out["passed"], biggest <= check["max_diff_deg"] and same)
        self.assertEqual(out["max_diff_deg"], check["max_diff_deg"])

    def test_readme_quotes_the_later_years_check(self):
        y = json.loads((ROOT / "data/validation-years.json").read_text(encoding="utf-8"))
        s = y["summary"]
        flat = " ".join(((ROOT / "README.md").read_text(encoding="utf-8") + "\n" + (ROOT / "docs" / "DETAILS.md").read_text(encoding="utf-8")).split())
        self.assertIn(f"at {len(y['pairs'])} random site-and-minute pairs at the listed sites in {y['from'][:4]} to 2030", flat)
        self.assertIn(f"largest difference {s['max_abs_deg']:.4f}°, average {s['mean_abs_deg']:.4f}°, same solar power answer "
                      f"{s['same_answer']['power']} of {s['same_answer']['of']}", flat)


if __name__ == "__main__":
    unittest.main()
