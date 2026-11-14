# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Terrain horizon (item j): ray-march geometry on synthetic grids + shape of data/horizon/*.json."""
import array
import json
import math
import pathlib
import re
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import horizon as H  # noqa: E402

R = 1737400.0


def synthetic(size, scale, height_at):
    """Polar grid of `size` px; height_at(distance from pole in m) gives the height."""
    off = (size - 1) / 2.0
    h = array.array("h", [0] * (size * size))
    for row in range(size):
        for col in range(size):
            h[row * size + col] = int(round(height_at(math.hypot(row - off, col - off) * scale) / 0.5))
    spec = {"name": "synthetic", "size": size, "scale_m": scale, "offset_px": off, "max_lat": -80, "dn_scale_m": 0.5}
    return H.Dem(spec, R, h)


def cfg(**over):
    c = {"moon_radius_m": R, "azimuth_step_deg": 45, "observer_height_m": 2, "max_distance_km": 40,
         "first_step_m": 40, "step_fraction": 0.004}
    c.update(over)
    return c


class Geometry(unittest.TestCase):
    def test_projection_orientation(self):
        # Convention checked against LROC's printed IM-2 elevation (5321 m): lon 0 is up (row decreases), lon 90E is right.
        dem = synthetic(11, 1000.0, lambda d: 0)
        row, col = dem.pixel(*H.unit(-90, 0))
        self.assertAlmostEqual(row, 5.0, places=6)
        self.assertAlmostEqual(col, 5.0, places=6)
        row, col = dem.pixel(*H.unit(-89.9, 0))
        self.assertLess(row, 5.0)
        self.assertAlmostEqual(col, 5.0, places=6)
        row, col = dem.pixel(*H.unit(-89.9, 90))
        self.assertAlmostEqual(row, 5.0, places=6)
        self.assertGreater(col, 5.0)

    def test_flat_sphere_gives_the_sphere_dip(self):
        dem = synthetic(101, 1000.0, lambda d: 0)
        p = H.profile(cfg(), [dem], -90, 0)
        dip = -math.degrees(math.acos(R / (R + 2)))
        for e in p["elev"]:
            self.assertAlmostEqual(e, dip, delta=0.001)

    def test_ring_wall_height_over_distance(self):
        # Terrain raised 1000 m beyond 10 km from the pole: skyline about atan(1000 / 10000) everywhere
        # (the 1 km pixels and bilinear sampling move the edge by up to ~2 km on diagonals).
        dem = synthetic(101, 1000.0, lambda d: 1000 if d >= 10000 else 0)
        p = H.profile(cfg(), [dem], -90, 0)
        self.assertEqual(len(p["elev"]), 8)
        for e in p["elev"]:
            self.assertGreater(e, math.degrees(math.atan(1000 / 12500)))
            self.assertLess(e, math.degrees(math.atan(1000 / 9000)))
        self.assertLess(max(p["elev"]) - min(p["elev"]), 1.0)

    def test_ray_stops_at_grid_edge(self):
        dem = synthetic(21, 1000.0, lambda d: 0)
        p = H.profile(cfg(), [dem], -90, 0)
        for reach in p["reach_km"]:
            self.assertLess(reach, 15.0)

    def test_outside_every_grid_raises(self):
        dem = synthetic(21, 1000.0, lambda d: 0)
        with self.assertRaises(ValueError):
            H.profile(cfg(), [dem], -60, 0)


class Data(unittest.TestCase):
    def setUp(self):
        self.cfg = json.loads((ROOT / "config/horizon.json").read_text(encoding="utf-8"))
        self.sites = [s for s in json.loads((ROOT / "config/sites.json").read_text(encoding="utf-8"))["sites"]
                      if H.covered(self.cfg, s)]

    def test_every_covered_site_has_a_small_profile(self):
        n = int(round(360 / self.cfg["azimuth_step_deg"]))
        for site in self.sites:
            with self.subTest(site=site["id"]):
                path = ROOT / "data/horizon" / f"{site['id']}.json"
                self.assertLess(path.stat().st_size, 1_000_000)
                d = json.loads(path.read_text(encoding="utf-8"))
                self.assertEqual((d["site"], d["lat"], d["lon_east"]), (site["id"], site["lat"], site["lon_east"]))
                for key in ("elev", "at_km", "reach_km"):
                    self.assertEqual(len(d[key]), n, key)
                self.assertTrue(all(-90 <= e <= 90 for e in d["elev"]))
                self.assertTrue(all(0 <= a <= r <= self.cfg["max_distance_km"] for a, r in zip(d["at_km"], d["reach_km"])))

    def test_site_height_matches_printed_elevation(self):
        # Where the cited page prints an elevation, the DEM height at that point agrees (checks projection + scaling).
        checked = 0
        for site in self.sites:
            m = re.search(r"(\d+) m(?:eters)? elevation", site["source"]["text"])
            if not m:
                continue
            d = json.loads((ROOT / "data/horizon" / f"{site['id']}.json").read_text(encoding="utf-8"))
            self.assertAlmostEqual(d["site_height_m"], float(m.group(1)), delta=25, msg=site["id"])
            checked += 1
        if not checked:
            self.skipTest("no covered site prints an elevation")


if __name__ == "__main__":
    unittest.main()
