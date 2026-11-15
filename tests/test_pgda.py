# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""H9(b) script: pixel lookup on the PGDA polar stereographic grid and byte-range window parsing (no network)."""
import array
import io
import json
import math
import pathlib
import sys
import unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import pgda  # noqa: E402

GRID = {"size": 9, "scale_m": 120, "offset_px": 4.0, "scaling_factor": 0.00004, "moon_radius_m": 1737400}


class FakeResponse(io.BytesIO):
    status = 206

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


class PgdaTest(unittest.TestCase):
    def test_pole_is_grid_centre_and_longitude_zero_is_up(self):
        self.assertEqual(pgda.pixel(GRID, -90.0, 0.0), (4, 4))
        # 240 m from the pole = 2 pixels: lon 0 → up (row smaller), lon 90°E → right (col larger).
        dlat = 240 / 1737400 * 180 / 3.141592653589793
        self.assertEqual(pgda.pixel(GRID, -90 + dlat, 0.0), (2, 4))
        self.assertEqual(pgda.pixel(GRID, -90 + dlat, 90.0), (4, 6))

    def test_window_reads_one_byte_range_and_scales(self):
        n = GRID["size"]
        full = array.array("h", range(n * n))
        seen = {}

        def fake_open(req, timeout):
            first, last = (int(v) for v in req.get_header("Range").split("=")[1].split("-"))
            seen["range"] = (first, last)
            return FakeResponse(full.tobytes()[first:last + 1])

        with mock.patch.object(pgda.urllib.request, "urlopen", fake_open):
            win = pgda.read_window("http://example.invalid/x.img", GRID, 4, 4, 1, 5)
        s = GRID["scaling_factor"]
        self.assertEqual(seen["range"], ((3 * n + 3) * 2, (5 * n + 5) * 2 + 1))
        self.assertAlmostEqual(win[1][1], (4 * n + 4) * s)
        self.assertAlmostEqual(win[0][0], (3 * n + 3) * s)
        self.assertAlmostEqual(win[2][2], (5 * n + 5) * s)

    def test_window_outside_map_is_an_error(self):
        with self.assertRaises(ValueError):
            pgda.read_window("http://example.invalid/x.img", GRID, 0, 4, 1, 5)

    def test_sources_entry_names_the_pgda_maps(self):
        sources = json.loads((ROOT / "data/SOURCES.json").read_text(encoding="utf-8"))
        entry = next(e for e in sources["files"] if e["file"] == "validation.json")
        cfg = json.loads((ROOT / "config/pgda.json").read_text(encoding="utf-8"))
        self.assertEqual(entry["pgda"]["urls"], [cfg["maps"]["sun"]["url"], cfg["maps"]["earth"]["url"]])
        self.assertEqual(entry["pgda"]["script"], "scripts/pgda.py")

    def test_readme_quotes_the_file(self):
        d = json.loads((ROOT / "data/validation.json").read_text(encoding="utf-8"))["pgda"]
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn(f"Largest difference: Sun {d['sun']['max_abs'] * 100:.1f} percentage points, "
                      f"Earth {d['earth']['max_abs'] * 100:.1f} percentage points.", readme)
        self.assertIn(f"at {len(d['sites'])} points.", readme)
        for r in d["sites"]:
            self.assertIn(f" | {r['tool']['sun'] * 100:.1f} % | {r['pgda']['sun']['value'] * 100:.1f} % | "
                          f"{r['tool']['earth'] * 100:.1f} % | {r['pgda']['earth']['value'] * 100:.1f} % |", readme)

    def test_readme_quotes_the_same_period_block(self):
        pp = json.loads((ROOT / "data/validation.json").read_text(encoding="utf-8"))["pgda_period"]
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        flat = " ".join(readme.split())
        self.assertIn(f"over {pp['period']['hours']} hourly steps from {pp['period']['start'][:10]}", flat)
        for r in pp["sites"]:
            y = r["one_year"]["sun"]
            self.assertIn(f" | {r['tool']['sun'] * 100:.1f} % | {r['pgda']['sun'] * 100:.1f} % | {r['tool']['earth'] * 100:.1f} % | "
                          f"{r['pgda']['earth'] * 100:.1f} % | {y['min'] * 100:.1f} % to {y['max'] * 100:.1f} % |", readme)
        ridge = next(r for r in pp["sites"] if r["site"] == pp["ridge"]["site"])
        low, high = sorted(pp["ridge"]["observer"], key=lambda o: o["height_m"])
        b = pp["ridge"]["block"]
        for text in (
            f"At IM-1 (nominal landing area) and IM-2 the largest difference is {pp['landing_sites']['max_abs'] * 100:.1f} percentage points.",
            f"At the other {len(pp['other_sites']['ids'])} listed terrain sites the Sun differs by {pp['other_sites']['sun']['min_abs'] * 100:.1f} to "
            f"{pp['other_sites']['sun']['max_abs'] * 100:.1f} points and Earth by {pp['other_sites']['earth']['min_abs'] * 100:.1f} to {pp['other_sites']['earth']['max_abs'] * 100:.1f}",
            f"the Sun still differs by {abs(ridge['diff']['sun']) * 100:.1f} points and Earth by {abs(ridge['diff']['earth']) * 100:.1f}",
            f"each of the {ridge['calendar_years']} full calendar years gives {ridge['one_year']['sun']['min'] * 100:.1f} % to {ridge['one_year']['sun']['max'] * 100:.1f} %",
            f"with the observer on the ground ({low['height_m']} m) the tool gives {low['sun'] * 100:.1f} % for the Sun, and at {high['height_m']} m "
            f"(the height the tool uses everywhere) {high['sun'] * 100:.1f} %",
            f"the PGDA value of {pp['ridge']['pgda']['sun']['value'] * 100:.1f} % lies between the two",
            f"At the nine points {b['offset_m']} m apart around it (one PGDA pixel) the tool gives {b['sun']['min'] * 100:.1f} % to {b['sun']['max'] * 100:.1f} %",
            f"closer than {pp['ridge']['near_km']} km in {high['near']} of {pp['ridge']['azimuths']} directions",
            # "Validation in short" (top of the README) repeats four of these numbers.
            f"the Sun differs by {abs(ridge['diff']['sun']) * 100:.1f} points; there the tool's own value runs from {low['sun'] * 100:.1f} % "
            f"(observer on the ground) to {high['sun'] * 100:.1f} % ({high['height_m']} m up), and NASA's {pp['ridge']['pgda']['sun']['value'] * 100:.1f} % lies between",
        ):
            self.assertIn(text, flat)
        self.assertTrue(low["sun"] < pp["ridge"]["pgda"]["sun"]["value"] < high["sun"])
        # The opening lines of the README and slide 1 repeat the landing-site number.
        head = f"within {pp['landing_sites']['max_abs'] * 100:.1f} percentage points at IM-1 and IM-2 over the same {pp['period']['years']} years"
        self.assertIn(head, flat)
        slides = (ROOT / "demo/slides.html").read_text(encoding="utf-8")
        self.assertIn(f"within <span class=\"num\">{pp['landing_sites']['max_abs'] * 100:.1f}</span> percentage points at IM-1 and IM-2", slides)
        self.assertNotIn("periods differ", readme)

    def test_block_points_are_a_3_by_3_block_one_offset_apart(self):
        import pgda_period
        pts = pgda_period.block_points(-89.45, 222.69, 120, 1737400)
        self.assertEqual(len(pts), 9)
        self.assertEqual([(p[0], p[1]) for p in pts][4], (0, 0))
        self.assertEqual((pts[4][2], pts[4][3]), (-89.45, 222.69))
        ux, uy, uz = pgda.H.unit(-89.45, 222.69)
        for dx, dy, la, lo in pts:
            x, y, z = pgda.H.unit(la, lo)
            dist = 1737400 * math.acos(min(1.0, ux * x + uy * y + uz * z))
            self.assertAlmostEqual(dist, math.hypot(dx, dy), delta=0.01)


if __name__ == "__main__":
    unittest.main()
