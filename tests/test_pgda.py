# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""H9(b) script: pixel lookup on the PGDA polar stereographic grid and byte-range window parsing (no network)."""
import array
import io
import json
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


if __name__ == "__main__":
    unittest.main()
