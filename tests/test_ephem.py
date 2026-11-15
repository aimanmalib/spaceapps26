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
                self.assertIn(s["group"], ("apollo", "clps", "other_nation", "south_pole", "future"))

    def test_future_targets_are_south_polar_points_quoted_from_nasa_or_lroc(self):
        # ADR 0042: group "future" = candidate or target areas for later landings; one sourced point each, with a LOLA skyline.
        future = [s for s in self.sites if s["group"] == "future"]
        self.assertGreaterEqual(len(future), 3)
        for s in future:
            with self.subTest(site=s["id"]):
                self.assertLessEqual(s["lat"], -80)
                # ADR 0105: also an LROC data product, an LPSC abstract and a journal paper (its arXiv copy).
                self.assertRegex(s["source"]["url"], r"^https://(lroc\.im-ldi\.com|data\.lroc\.im-ldi\.com|ntrs\.nasa\.gov|www\.hou\.usra\.edu|arxiv\.org)/")
                lat = f"{abs(s['lat']):.10g}"  # the latitude as printed on the cited page, for example 86, 85.363 or 89.684
                self.assertIn(lat, s["source"]["text"].replace("85.3630", "85.363"))
                self.assertTrue((ROOT / "data/horizon" / f"{s['id']}.json").exists())
        landed = next(s for s in self.sites if s["id"] == "im-1-landed")
        self.assertEqual((landed["lat"], landed["lon_east"]), (-80.13, 1.44))
        self.assertIn("80.13°S, 1.44°E", landed["source"]["text"])

    def test_artemis_regions_quoted_in_degrees_minutes_seconds_convert_to_the_stored_point(self):
        # ADR 0105: the paper prints de Gerlache Rim 2 as 88°30'56.38"S 61°10'2.35"O (O = oeste, west) and Nobile Rim 2 as
        # 84°12'5.61"S 60°41'59.61"E; the stored decimal degrees must be those numbers, west stored as 360 - lon.
        dms = lambda d, m, s: d + m / 60 + s / 3600
        by = {s["id"]: s for s in self.sites}
        self.assertAlmostEqual(by["de-gerlache-rim-2"]["lat"], -dms(88, 30, 56.38), places=6)
        self.assertAlmostEqual(by["de-gerlache-rim-2"]["lon_east"], 360 - dms(61, 10, 2.35), places=6)
        self.assertIn("88°30’56.38”S 61°10’2.35”O", by["de-gerlache-rim-2"]["source"]["text"])
        self.assertAlmostEqual(by["nobile-rim-2"]["lat"], -dms(84, 12, 5.61), places=5)
        self.assertAlmostEqual(by["nobile-rim-2"]["lon_east"], dms(60, 41, 59.61), places=5)
        for i in ("haworth", "mons-mouton-plateau", "nobile-rim-2", "de-gerlache-rim-2"):
            self.assertIn("(Artemis III candidate region, representative point)", by[i]["name"])

    def test_readme_numbers_for_the_future_targets_come_from_the_data(self):
        ov = {s["site"]: s for s in load("data/overview.json")["sites"]}
        sy = {s["site"]: s for s in load("data/shift-year/shift-year.json")["sites"]}
        mm = sy["malapert-massif"]
        pt = {p["dir"]: p for p in mm["points"]}
        flat = " ".join(((ROOT / "README.md").read_text(encoding="utf-8") + "\n" + (ROOT / "docs" / "DETAILS.md").read_text(encoding="utf-8")).split())
        self.assertIn(f"Shackleton ridge point the Sun is at least partly in view {ov['shackleton-ridge']['sun'] * 100:.1f} % of the hours", flat)
        self.assertIn(f"above the skyline {mm['centre']['earth'] * 100:.1f} % of the hours, {pt['n']['centre']['earth'] * 100:.1f} % one kilometre north and "
                      f"{pt['s']['centre']['earth'] * 100:.1f} % one kilometre south", flat)
        self.assertIn("Eighteen listed sites", flat)
        self.assertEqual(len(self.sites), 18)

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
