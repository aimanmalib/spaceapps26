# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Small shifts (item l): great-circle step of scripts/shifts.py + shape of data/shift/*.json."""
import json
import math
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import shifts as S  # noqa: E402

R = 1737400.0


def arc_m(a, b):
    (la1, lo1), (la2, lo2) = [(math.radians(x), math.radians(y)) for x, y in (a, b)]
    c = math.sin(la1) * math.sin(la2) + math.cos(la1) * math.cos(la2) * math.cos(lo2 - lo1)
    return math.acos(max(-1.0, min(1.0, c))) * R


class Moved(unittest.TestCase):
    def test_distance_and_direction(self):
        for lat, lon in ((0.0, 0.0), (-84.79, 29.2), (-89.45, 222.69)):
            n = S.moved(lat, lon, 0, 1000, R)
            e = S.moved(lat, lon, 90, 1000, R)
            self.assertAlmostEqual(arc_m((lat, lon), n), 1000, delta=0.5)
            self.assertAlmostEqual(arc_m((lat, lon), e), 1000, delta=0.5)
            self.assertGreater(n[0], lat)  # north = latitude up
            self.assertAlmostEqual(n[1], lon % 360, places=6)

    def test_east_at_equator(self):
        lat, lon = S.moved(0.0, 0.0, 90, 1000, R)
        self.assertAlmostEqual(lat, 0.0, places=9)
        self.assertAlmostEqual(lon, math.degrees(1000 / R), places=9)


class ShiftFiles(unittest.TestCase):
    def test_one_file_per_terrain_site_with_sources(self):
        cfg = json.loads((ROOT / "config/shifts.json").read_text(encoding="utf-8"))
        horizon_ids = {p.stem for p in (ROOT / "data/horizon").glob("*.json")}
        site_ids = {s["id"] for s in json.loads((ROOT / "config/sites.json").read_text(encoding="utf-8"))["sites"]}
        files = sorted((ROOT / "data/shift").glob("*.json"))
        self.assertEqual({p.stem for p in files}, horizon_ids & site_ids)
        sources = {e["file"] for e in json.loads((ROOT / "data/SOURCES.json").read_text(encoding="utf-8"))["files"]}
        for path in files:
            d = json.loads(path.read_text(encoding="utf-8"))
            self.assertIn(f"shift/{path.name}", sources)
            self.assertEqual(d["offset_km"], cfg["location_offset_km"])
            self.assertEqual([p["dir"] for p in d["points"]], [x["id"] for x in cfg["directions"]])
            n = round(360 / d["azimuth_step_deg"])
            for p in d["points"]:
                self.assertEqual(len(p["elev"]), n)
                self.assertTrue(all(-90 <= v <= 90 for v in p["elev"]))
            self.assertLess(path.stat().st_size, 1_000_000)


if __name__ == "__main__":
    unittest.main()
