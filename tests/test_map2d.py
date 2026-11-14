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


if __name__ == "__main__":
    unittest.main()
