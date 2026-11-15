# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""2D map (item h): grid geometry + shape of data/map/*.json against the terrain profiles it sits beside."""
import json
import math
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import horizon as H  # noqa: E402
import map2d as M  # noqa: E402
import map_sunlight as S  # noqa: E402

R = 1737400.0


def angle_km(a, b):
    dot = max(-1.0, min(1.0, sum(x * y for x, y in zip(a, b))))
    return math.acos(dot) * R / 1000.0


class Grid(unittest.TestCase):
    def test_centre_corners_and_orientation(self):
        lat, lon, half, n = -84.79, 29.2, 40, 5
        pts = M.grid_points(lat, lon, half, n, R)
        site = H.unit(lat, lon)
        self.assertAlmostEqual(angle_km(pts[(n * n - 1) // 2], site), 0.0, places=3)  # acos noise near 0
        for i in (0, n - 1, n * (n - 1), n * n - 1):  # corners: sqrt(2) x half along the surface
            self.assertAlmostEqual(angle_km(pts[i], site), half * math.sqrt(2), places=6)
        # North edge middle is closer to the pole (south polar site: north = away from the pole, so z grows).
        top, bottom = pts[n // 2], pts[n * (n - 1) + n // 2]
        self.assertGreater(top[2], site[2])
        self.assertLess(bottom[2], site[2])
        # East (last column) = longitude grows at a southern site seen with north up.
        east = pts[(n // 2) * n + n - 1]
        lon_east = math.degrees(math.atan2(east[1], east[0]))
        self.assertGreater(lon_east, lon)


class Data(unittest.TestCase):
    def test_one_map_per_terrain_site_matching_the_profile(self):
        cfg = json.loads((ROOT / "config/map2d.json").read_text(encoding="utf-8"))
        sources = {e["file"] for e in json.loads((ROOT / "data/SOURCES.json").read_text(encoding="utf-8"))["files"]}
        sites = json.loads((ROOT / "config/sites.json").read_text(encoding="utf-8"))["sites"]
        terrain = [s for s in sites if (ROOT / "data/horizon" / f"{s['id']}.json").exists()]
        self.assertTrue(terrain)
        for s in terrain:
            path = ROOT / "data/map" / f"{s['id']}.json"
            self.assertTrue(path.exists(), path.name)
            self.assertLess(path.stat().st_size, 200_000)
            self.assertIn(f"map/{s['id']}.json", sources)
            m = json.loads(path.read_text(encoding="utf-8"))
            prof = json.loads((ROOT / "data/horizon" / f"{s['id']}.json").read_text(encoding="utf-8"))
            n = m["cells"]
            self.assertEqual((n, m["half_width_km"]), (cfg["cells"], cfg["half_width_km"]))
            self.assertEqual(len(m["height_m"]), n * n)
            self.assertEqual((m["lat"], m["lon_east"]), (s["lat"], s["lon_east"]))
            known = [h for h in m["height_m"] if h is not None]
            self.assertEqual((min(known), max(known)), (m["min_m"], m["max_m"]))
            # Same DEM reading as the horizon profile: centre cell = site height.
            self.assertLessEqual(abs(m["height_m"][(n * n - 1) // 2] - prof["site_height_m"]), 1)


class Sunlight(unittest.TestCase):
    """P4k: NASA PGDA average Sun visibility read on the map cells (data/map-sunlight/)."""

    def test_percent_reads_nearest_pixel_of_the_fetched_rows(self):
        grid = {"size": 4, "scaling_factor": 0.5}
        rows = {}

        def fetch(r0, r1):
            rows["asked"] = (r0, r1)
            return [v for r in range(r0, r1 + 1) for v in (r * 10, r * 10 + 1, r * 10 + 2, r * 10 + 3)]

        self.assertEqual(S.percent(grid, [(1, 0), (2, 3)], fetch), [500, 1150])
        self.assertEqual(rows["asked"], (1, 2))
        with self.assertRaises(ValueError):
            S.percent(grid, [(1, 4)], fetch)

    def test_one_file_per_map_matching_the_published_check(self):
        sources = {e["file"]: e for e in json.loads((ROOT / "data/SOURCES.json").read_text(encoding="utf-8"))["files"]}
        pgda = {s["site"]: s for s in json.loads((ROOT / "data/validation.json").read_text(encoding="utf-8"))["pgda"]["sites"]}
        maps = sorted((ROOT / "data/map").glob("*.json"))
        self.assertTrue(maps)
        for mp in maps:
            m = json.loads(mp.read_text(encoding="utf-8"))
            path = ROOT / "data/map-sunlight" / mp.name
            self.assertTrue(path.exists(), path.name)
            d = json.loads(path.read_text(encoding="utf-8"))
            n = d["cells"]
            self.assertEqual((n, d["half_width_km"], d["lat"], d["lon_east"]), (m["cells"], m["half_width_km"], m["lat"], m["lon_east"]))
            self.assertEqual(len(d["sunlight_pct"]), n * n)
            self.assertTrue(all(isinstance(v, int) and 0 <= v <= 100 for v in d["sunlight_pct"]))
            self.assertEqual((min(d["sunlight_pct"]), max(d["sunlight_pct"])), (d["min_pct"], d["max_pct"]))
            e = sources[f"map-sunlight/{mp.name}"]
            self.assertIn("pgda.gsfc.nasa.gov", e["page"])
            self.assertEqual(e["script"], "scripts/map_sunlight.py")
            # Centre cell = the PGDA pixel nearest the site, the value already in the published H9(b) check.
            if m["site"] in pgda:
                self.assertLessEqual(abs(d["sunlight_pct"][(n * n - 1) // 2] - pgda[m["site"]]["pgda"]["sun"]["value"] * 100), 0.5)


if __name__ == "__main__":
    unittest.main()
