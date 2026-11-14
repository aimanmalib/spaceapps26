# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Sites (config/sites.json), frozen Horizons tables (data/ephem, data/check) and the fetch parser."""
import datetime as dt
import importlib.util
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent


def load(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def fetch_module():
    spec = importlib.util.spec_from_file_location("fetch_horizons", ROOT / "scripts/fetch_horizons.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class Sites(unittest.TestCase):
    def setUp(self):
        self.sites = load("config/sites.json")["sites"]

    def test_each_site_has_cited_coordinates(self):
        ids = [s["id"] for s in self.sites]
        self.assertEqual(len(ids), len(set(ids)))
        for s in self.sites:
            with self.subTest(site=s["id"]):
                self.assertTrue(-90 <= s["lat"] <= 90)
                self.assertTrue(0 <= s["lon_east"] < 360)
                self.assertTrue(s["source"]["url"].startswith("https://"))
                self.assertTrue(s["source"]["text"].strip())
                self.assertIn(s["group"], ("apollo", "clps", "other_nation", "south_pole"))

    def test_initial_set_covers_apollo_and_south_pole(self):
        self.assertGreaterEqual(sum(s["group"] == "apollo" for s in self.sites), 1)
        self.assertGreaterEqual(sum(s["lat"] <= -80 for s in self.sites), 2)


class FrozenTables(unittest.TestCase):
    def setUp(self):
        self.cfg = load("config/ephemeris.json")

    def check_table(self, table, point, start, stop):
        self.assertEqual((table["lat"], table["lon_east"]), (point["lat"], point["lon_east"]))
        t0 = dt.datetime.strptime(start, "%Y-%m-%d %H:%M")
        t1 = dt.datetime.strptime(stop, "%Y-%m-%d %H:%M")
        rows = int((t1 - t0).total_seconds() // (60 * self.cfg["step_minutes"])) + 1
        self.assertEqual(table["start"], t0.strftime("%Y-%m-%dT%H:%MZ"))
        self.assertEqual(table["step_minutes"], self.cfg["step_minutes"])
        for body in self.cfg["bodies"]:
            for key, lo, hi in (("az", 0, 360), ("el", -90, 90)):
                values = table[body][key]
                self.assertEqual(len(values), rows, f"{body}.{key}")
                self.assertTrue(all(lo <= v <= hi for v in values), f"{body}.{key} range")

    def test_every_site_has_a_full_table(self):
        for s in load("config/sites.json")["sites"]:
            with self.subTest(site=s["id"]):
                self.check_table(load(f"data/ephem/{s['id']}.json"), s, self.cfg["start"], self.cfg["stop"])

    def test_check_points_have_tables(self):
        for c in self.cfg.get("check_points", []):
            with self.subTest(point=c["id"]):
                table = load(f"data/check/{c['id']}.json")
                self.check_table(table, c, c["start"], c["stop"])
                want = c["expect_first_row"]
                self.assertAlmostEqual(table["sun"]["el"][0], want["sun_el"], delta=want["tolerance_deg"])
                self.assertAlmostEqual(table["earth"]["el"][0], want["earth_el"], delta=want["tolerance_deg"])

    def test_sun_moves_through_a_lunar_day(self):
        # Shape check on real data: at a near-equatorial site the Sun is up for part of each
        # synodic month (~29.5 days) and down for the rest.
        table = load("data/ephem/apollo-11.json")
        month = table["sun"]["el"][: 30 * 24]
        up = sum(e > 0 for e in month) / len(month)
        self.assertTrue(0.4 < up < 0.6, up)


class Parser(unittest.TestCase):
    SAMPLE = (
        "header\n$$SOE\n"
        " 2026-Nov-14 00:00,*, , 263.912878,     1.498352,\n"
        " 2026-Nov-14 01:00,*, , 263.405049,     1.493518,\n"
        "$$EOE\nfooter"
    )

    def test_parse_rows_and_grid(self):
        mod = fetch_module()
        rows = mod.parse_rows(self.SAMPLE)
        self.assertEqual([r[1:] for r in rows], [(263.912878, 1.498352), (263.405049, 1.493518)])
        start = dt.datetime(2026, 11, 14, tzinfo=dt.timezone.utc)
        mod.check_grid(rows, start, 60)
        with self.assertRaises(ValueError):
            mod.check_grid(rows, start, 30)

    def test_missing_block_is_an_error(self):
        with self.assertRaises(ValueError):
            fetch_module().parse_rows("No ephemeris for target")


if __name__ == "__main__":
    unittest.main()
