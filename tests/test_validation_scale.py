# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
"""Check at scale (ADR 0108): the polite batched Horizons client (rate limit, retries, cache), the recorded Horizons values
re-derived from the cached raw answers, and the README quoting data/validation.json "scale"."""
import io
import json
import pathlib
import sys
import tempfile
import unittest
import urllib.error
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import horizons_batch as hb  # noqa: E402

RESULT = "header\n$$SOE\n 2026-Dec-17 15:47:00.000,*,i,  92.142525,    36.250672,\n 2028-Jan-10 15:34:00.000,*,i, 262.000856,    82.432377,\n$$EOE\n"


def load(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


class Answer(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


class Client(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.eph = load("config/ephemeris.json")
        self.cfg = dict(load("config/validation.json")["scale"], cache_file=str(pathlib.Path(self.tmp.name) / "c.json"))
        self.point = {"id": "apollo-11", "lat": 0.67416, "lon_east": 23.47314}
        self.waits, self.urls = [], []

    def tearDown(self):
        self.tmp.cleanup()

    def client(self, answers):
        def opener(url):
            self.urls.append(url)
            a = answers.pop(0)
            if isinstance(a, Exception):
                raise a
            return Answer(json.dumps({"result": a}).encode())
        return hb.Client(self.eph, self.cfg, sleep=self.waits.append, opener=opener, clock=lambda: 0.0)

    def test_parse_and_request_shape(self):
        self.assertEqual(hb.parse_tlist(RESULT)["2028-01-10T15:34"], (262.000856, 82.432377))
        p = hb.tlist_params(self.eph, self.point, "10", ["2026-12-17 15:47"])
        self.assertEqual((p["TLIST"], p["TLIST_TYPE"], p["TIME_TYPE"]), ("'2026-12-17 15:47'", "'CAL'", "'UT'"))
        self.assertNotIn("START_TIME", p)
        self.assertEqual(p["CENTER"], "'coord@301'")
        with self.assertRaises(ValueError):
            hb.parse_tlist("API error: no table")

    def test_rate_limit_retry_and_cache(self):
        times = ["2026-12-17 15:47", "2028-01-10 15:34"]
        c = self.client([urllib.error.URLError("down"), RESULT, RESULT])
        got = c.angles(self.point, "10", times)
        self.assertEqual(got["2026-12-17T15:47"], (92.142525, 36.250672))
        self.assertEqual(c.sent, 2)  # one failure, one retry
        self.assertIn(self.cfg["retry_wait_seconds"], self.waits)
        self.assertIn(self.cfg["min_interval_seconds"], self.waits)  # never two requests closer than the interval
        self.assertLessEqual(1 / self.cfg["min_interval_seconds"], 2)  # at most 2 requests per second
        again = self.client([])  # same request again: read from the cache file, nothing sent
        self.assertEqual(again.angles(self.point, "10", times), got)
        self.assertEqual(again.sent, 0)

    def test_gives_up_after_the_retries(self):
        c = self.client([urllib.error.URLError("down")] * (self.cfg["retries"] + 1))
        with self.assertRaises(urllib.error.URLError):
            c.angles(self.point, "10", ["2026-12-17 15:47"])
        self.assertEqual(c.sent, self.cfg["retries"] + 1)


class Recorded(unittest.TestCase):
    def test_every_horizons_value_comes_from_a_cached_raw_answer(self):
        cache = load("data/horizons-cache.json")
        eph = load("config/ephemeris.json")
        found = {}
        for entry in cache.values():
            q = urllib.parse.parse_qs(urllib.parse.urlparse(entry["url"]).query)
            body = {f"'{v}'": k for k, v in eph["bodies"].items()}[q["COMMAND"][0]]
            for when, (az, el) in hb.parse_tlist(entry["result"]).items():
                found[(q["SITE_COORD"][0], body, when)] = {"az": az, "el": el}
        pairs = load("data/validation-scale.json")["pairs"]
        for p in pairs:
            coord = f"'{p['lon_east']},{p['lat']},{eph['site_altitude_km']}'"
            for body in ("sun", "earth"):
                self.assertEqual(found[(coord, body, p["time_utc"])], p["horizons"][body], f"{p['site']} {p['time_utc']} {body}")
        self.assertEqual(len(cache), load("data/validation.json")["scale"]["horizons_requests"])

    def test_readme_quotes_the_file(self):
        s = load("data/validation.json")["scale"]
        a = s["all_checks"]
        readme = " ".join((ROOT / "README.md").read_text(encoding="utf-8").split())
        rows = load("data/validation-scale.json")["pairs"]
        top = max(rows, key=lambda r: abs(r["diff"]["sun"]["az"]))
        self.assertIn(f"Sun azimuth with the Sun {top['horizons']['sun']['el']:.1f}° high", readme)
        names = {"sun_az": "Sun azimuth", "sun_el": "Sun elevation", "earth_az": "Earth azimuth", "earth_el": "Earth elevation"}
        for k, q in s["by_quantity"].items():
            self.assertIn(f"{names[k]} {q['max_abs_deg']:.4f}° / {q['mean_abs_deg']:.4f}°", readme)
        for src, word in (("table", "Frozen-table dates"), ("engine", "engine dates")):
            self.assertIn(f"{word}: largest {s['by_source'][src]['max_abs_deg']:.4f}°", readme)
        self.assertIn(f"{s['by_source']['table']['same_answer']['of']} on the dates of the frozen tables, which the page reads, and "
                      f"{s['by_source']['engine']['same_answer']['of']} on the later dates", readme)
        self.assertIn(f"(the {a['parts']['table']} pairs below, the {a['parts']['engine_points']} engine pairs at unnamed points, the "
                      f"{a['parts']['later_years']} later-year pairs and these {a['parts']['scale']})", readme)
        self.assertIn(f"{s['same_answer']['of']} random site-and-minute pairs ({s['pairs_per_site']} at each of the {s['sites']} listed sites", readme)
        self.assertIn(f"same solar power answer {s['same_answer']['power']} of {s['same_answer']['of']}, same Earth answer "
                      f"{s['same_answer']['comm']} of {s['same_answer']['of']}", readme)
        self.assertIn(f"largest difference {s['max_abs_deg']:.4f}°", readme)
        self.assertIn(f"{s['sky_separation']['sun']['max_deg']:.4f}° for the Sun and {s['sky_separation']['earth']['max_deg']:.4f}° for Earth", readme)
        self.assertIn(f"{a['pairs']} different site-and-minute pairs ({a['angles']} reference angles)", readme)
        self.assertIn(f"{a['same_answer']['power']} of {a['same_answer']['of']}", readme)
        self.assertIn(f"{s['horizons_requests']} batched requests", readme)


if __name__ == "__main__":
    unittest.main()
